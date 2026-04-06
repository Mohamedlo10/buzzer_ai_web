import { getWebSocketBaseUrl } from '~/lib/api/client';
import { tokenStorage } from '~/lib/utils/storage';
import type { WSEvent } from '~/types/websocket';

type Listener = (event: WSEvent) => void;

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000];

// ──────────────────────────────────────────────
// STOMP frame helpers (no external dependency)
// ──────────────────────────────────────────────

const NULL_CHAR = '\0';

/** Encode a STOMP frame into the SockJS array-wrapped format */
function encodeStompFrame(
  command: string,
  headers: Record<string, string> = {},
  body = '',
): string {
  let frame = command + '\n';
  for (const [k, v] of Object.entries(headers)) {
    frame += `${k}:${v}\n`;
  }
  frame += '\n' + body + NULL_CHAR;
  return JSON.stringify([frame]);
}

interface StompFrame {
  command: string;
  headers: Record<string, string>;
  body: string;
}

/** Decode a raw STOMP frame string into structured data */
function decodeStompFrame(raw: string): StompFrame | null {
  // Remove trailing NULL
  const cleaned = raw.replace(/\0$/, '');
  const firstNewline = cleaned.indexOf('\n');
  if (firstNewline < 0) return null;

  const command = cleaned.substring(0, firstNewline);
  const rest = cleaned.substring(firstNewline + 1);

  // Split headers from body at the blank line
  const blankLineIdx = rest.indexOf('\n\n');
  let headersStr = '';
  let body = '';
  if (blankLineIdx >= 0) {
    headersStr = rest.substring(0, blankLineIdx);
    body = rest.substring(blankLineIdx + 2);
  } else {
    headersStr = rest;
  }

  const headers: Record<string, string> = {};
  if (headersStr) {
    for (const line of headersStr.split('\n')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        headers[line.substring(0, colonIdx)] = line.substring(colonIdx + 1);
      }
    }
  }

  return { command, headers, body };
}

// ──────────────────────────────────────────────
// STOMP topic → WSEvent mapping
// ──────────────────────────────────────────────

/**
 * Maps a STOMP MESSAGE arriving on a topic to the WSEvent format
 * that the existing handlers.ts expects.
 */
function mapTopicMessageToWSEvent(
  topic: string,
  payload: any,
  sessionId: string,
): WSEvent | WSEvent[] | null {
  // Extract the topic suffix: e.g. "/topic/session/{id}/buzz" → "buzz"
  const parts = topic.split('/');
  const topicType = parts[parts.length - 1]; // last segment

  switch (topicType) {
    // ─── Status changes ───────────────────
    case 'status': {
      const status = payload.status;
      if (!status) return null;

      switch (status) {
        case 'GENERATING':
          return { type: 'game_starting', sessionId } as WSEvent;
        case 'PLAYING':
          return { type: 'generation_complete', sessionId, totalQuestions: payload.totalQuestions ?? 0 } as WSEvent;
        case 'PAUSED':
          return { type: 'game_paused', sessionId } as WSEvent;
        case 'RESULTS':
          // Status RESULTS is sent before game-over topic with rankings
          return { type: 'game_over', sessionId, finalScores: {} } as WSEvent;
        case 'LOBBY':
          // Could be error during generation or cancellation
          if (payload.error) {
            return { type: 'generation_failed', sessionId, error: payload.error, usingFallback: false } as WSEvent;
          }
          return null;
        default:
          if (process.env.NODE_ENV === 'development') console.log('[STOMP] Unhandled status:', status);
          return null;
      }
    }

    // ─── Teams ────────────────────────────
    case 'teams': {
      // Backend sends { event: "TEAM_UPDATED", teams: [...] }
      const teams = payload.teams ?? [];
      return {
        type: 'team_updated',
        sessionId,
        teams,
      } as any;
    }

    // ─── Team scores ──────────────────────
    case 'team-scores': {
      return {
        type: 'team_scores',
        sessionId,
        teams: payload.teams ?? [],
      } as any;
    }

    // ─── User notifications queue ─────────
    case 'notifications': {
      if (payload.type === 'ROOM_INVITE') {
        return {
          type: 'room_invite_received',
          sessionId,
          invitationId: payload.invitationId,
          roomId: payload.roomId,
          roomName: payload.roomName,
          roomCode: payload.roomCode,
          from: payload.from,
        } as any;
      }
      return null;
    }

    // ─── Players ──────────────────────────
    case 'players': {
      if (payload.event === 'JOINED' && payload.player) {
        return {
          type: 'player_joined',
          sessionId,
          player: {
            userId: payload.player.id || payload.player.userId,
            username: payload.player.name || payload.player.username,
            categories: payload.player.categories ?? [],
            isSpectator: payload.player.isSpectator ?? false,
          },
        } as WSEvent;
      }
      if (payload.event === 'LEFT') {
        return {
          type: 'player_left',
          sessionId,
          userId: payload.player?.id || payload.playerId || payload.player?.userId,
        } as WSEvent;
      }
      return null;
    }

    // ─── Question ─────────────────────────
    case 'question': {
      const q = payload.question || payload;
      return {
        type: 'question_start',
        sessionId,
        question: q,
      } as WSEvent;
    }

    // ─── Buzz queue ───────────────────────
    case 'buzz': {
      // Backend sends full buzz queue: { buzzQueue: [{playerId, playerName, timeDiffMs}] }
      const queue: Array<{
        playerId: string;
        playerName: string;
        timeDiffMs: number;
      }> = payload.buzzQueue ?? [];

      if (queue.length === 0) {
        // Empty queue = buzzer reset
        return { type: 'buzzer_reset', sessionId } as WSEvent;
      }

      // Emit buzzer_pressed for the LAST entry (newest buzz)
      const lastBuzz = queue[queue.length - 1];
      return {
        type: 'buzzer_pressed',
        sessionId,
        userId: lastBuzz.playerId,
        username: lastBuzz.playerName,
        timestamp: lastBuzz.timeDiffMs,
        queuePosition: queue.length,
        // Attach full queue so handler can sync
        _fullQueue: queue,
      } as any;
    }

    // ─── Score updates ────────────────────
    case 'score': {
      // { playerId, newScore, event: "CORRECT"|"WRONG"|"CORRECTION" }
      const scoreEvent = payload.event;
      if (scoreEvent === 'CORRECT' || scoreEvent === 'WRONG') {
        return {
          type: 'answer_validated',
          sessionId,
          playerId: payload.playerId,
          isCorrect: scoreEvent === 'CORRECT',
          updatedScores: { [payload.playerId]: payload.newScore },
        } as WSEvent;
      }
      // CORRECTION or generic score update
      return {
        type: 'score_updated',
        sessionId,
        scores: { [payload.playerId]: payload.newScore },
        reason: scoreEvent === 'CORRECTION' ? 'correction' : 'validation',
      } as WSEvent;
    }

    // ─── Buzz countdown ───────────────────
    case 'buzz-countdown':
      return {
        type: 'buzz_countdown',
        sessionId,
        playerId: payload.playerId,
        playerName: payload.playerName,
        durationSeconds: payload.durationSeconds ?? 10,
      } as any;

    // ─── Buzzer reset ─────────────────────
    case 'buzzer-reset':
      return { type: 'buzzer_reset', sessionId } as WSEvent;

    // ─── Game over ────────────────────────
    case 'game-over':
      return {
        type: 'game_over',
        sessionId,
        finalScores: {},
        rankings: payload.rankings,
      } as any;

    // ─── AI Generation progress ───────────
    case 'generating':
      return {
        type: 'generation_progress',
        sessionId,
        current: Math.round((payload.progress ?? 0) * 100),
        total: 100,
        percentage: Math.round((payload.progress ?? 0) * 100),
        message: payload.message,
      } as any;

    // ─── Countdown ────────────────────────
    case 'countdown':
      // Not in original WSEvent types, emit as a generic event
      return {
        type: 'countdown',
        sessionId,
        count: payload.count,
        event: payload.event, // "START" when count=0
      } as any;

    // ─── Full state sync (server-push snapshot) ───
    case 'sync':
      return {
        type: 'game_state_sync',
        sessionId,
        session: payload.session ?? {},
        currentQuestion: payload.currentQuestion ?? null,
        players: payload.players ?? [],
        buzzQueue: payload.buzzQueue ?? [],
      } as WSEvent;

    default:
      if (process.env.NODE_ENV === 'development') console.log('[STOMP] Unknown topic type:', topicType, payload);
      return null;
  }
}

// ──────────────────────────────────────────────
// WebSocketManager — SockJS + STOMP
// ──────────────────────────────────────────────

/**
 * Manages a single SockJS+STOMP WebSocket connection with auto-reconnect,
 * JWT auth, topic subscriptions, and pub/sub event dispatching.
 *
 * Protocol: SockJS transport → STOMP framing → JSON payloads.
 */
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionallyClosed = false;
  private sessionId: string | null = null;
  private roomId: string | null = null;
  private connectionMode: 'global' | 'session' | 'room' = 'global';
  private userId: string | null = null;
  private wasConnectedBefore = false;
  private stompConnected = false;
  private subscriptionId = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private negotiatedHeartbeatMs = 0; // 0 = disabled
  private presenceHeartbeatTimer: ReturnType<typeof setInterval> | null = null;

  // ─── STOMP session topics ───────────────
  private static readonly SESSION_TOPICS = [
    'status',
    'players',
    'teams',
    'team-scores',
    'question',
    'buzz',
    'buzz-countdown',
    'score',
    'buzzer-reset',
    'game-over',
    'generating',
    'countdown',
    'sync',
  ] as const;

  /**
   * Open a heartbeat-only connection — no session/room subscription.
   * Use this from the global layout so the user is marked online
   * as soon as they enter the app.
   */
  async connectGlobal(userId?: string): Promise<void> {
    if (this.connectionMode === 'global' && !this.intentionallyClosed && this.stompConnected) {
      return; // already globally connected
    }
    // Let room/session connections take priority — don't downgrade them
    if (
      (this.connectionMode === 'session' || this.connectionMode === 'room') &&
      !this.intentionallyClosed
    ) {
      return;
    }

    if (this.ws) {
      const oldWs = this.ws;
      this.ws = null;
      oldWs.onopen = null;
      oldWs.onmessage = null;
      oldWs.onerror = null;
      oldWs.onclose = null;
      try { oldWs.close(); } catch { /* ignore */ }
      this.clearHeartbeat();
      this.clearPresenceHeartbeat();
      this.clearReconnect();
    }

    this.connectionMode = 'global';
    this.sessionId = null;
    this.roomId = null;
    this.userId = userId ?? null;
    this.intentionallyClosed = false;
    this.reconnectAttempt = 0;
    this.stompConnected = false;
    this.subscriptionId = 0;
    await this.openConnection();
  }

  /** Connect to the game WebSocket for a given session */
  async connect(sessionId: string, userId?: string): Promise<void> {
    // Idempotent: if already managing this session (not intentionally closed), skip.
    // This prevents creating a duplicate WebSocket when multiple components (e.g. lobby
    // and game during navigation transition) call connect() for the same session.
    if (this.sessionId === sessionId && this.connectionMode === 'session' && !this.intentionallyClosed) {
      if (userId && this.userId !== userId) {
        this.userId = userId;
      }
      return;
    }

    // Tear down any existing connection silently before opening a new one.
    // Null out handlers first so the old WS's onclose won't trigger a spurious reconnect.
    if (this.ws) {
      const oldWs = this.ws;
      this.ws = null;
      oldWs.onopen = null;
      oldWs.onmessage = null;
      oldWs.onerror = null;
      oldWs.onclose = null;
      try { oldWs.close(); } catch { /* ignore */ }
      this.clearHeartbeat();
      this.clearPresenceHeartbeat();
      this.clearReconnect();
    }

    this.sessionId = sessionId;
    this.roomId = null;
    this.connectionMode = 'session';
    this.userId = userId ?? null;
    this.intentionallyClosed = false;
    this.reconnectAttempt = 0;
    this.stompConnected = false;
    this.subscriptionId = 0;
    await this.openConnection();
  }

  /** Connect to the WebSocket for a room's presence channel */
  async connectForRoom(roomId: string, userId?: string): Promise<void> {
    if (this.roomId === roomId && this.connectionMode === 'room' && !this.intentionallyClosed && this.stompConnected) {
      if (userId && this.userId !== userId) {
        this.userId = userId;
      }
      return;
    }
    // Always upgrade from global → room mode

    if (this.ws) {
      const oldWs = this.ws;
      this.ws = null;
      oldWs.onopen = null;
      oldWs.onmessage = null;
      oldWs.onerror = null;
      oldWs.onclose = null;
      try { oldWs.close(); } catch { /* ignore */ }
      this.clearHeartbeat();
      this.clearPresenceHeartbeat();
      this.clearReconnect();
    }

    this.roomId = roomId;
    this.sessionId = null;
    this.connectionMode = 'room';
    this.userId = userId ?? null;
    this.intentionallyClosed = false;
    this.reconnectAttempt = 0;
    this.stompConnected = false;
    this.subscriptionId = 0;
    await this.openConnection();
  }

  /** Disconnect and stop reconnecting */
  disconnect(): void {
    // Reference-counted: if other components are still subscribed, keep the connection alive.
    // This prevents lobby.tsx's cleanup from killing game.tsx's connection during navigation.
    if (this.listeners.size > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[STOMP] disconnect() skipped — still has', this.listeners.size, 'active listener(s)');
      }
      return;
    }

    this._doDisconnect();
  }

  /** Force-disconnect regardless of active listeners (e.g. on logout) */
  forceDisconnect(): void {
    this._doDisconnect();
  }

  private _doDisconnect(): void {
    this.intentionallyClosed = true;
    this.stompConnected = false;
    this.clearReconnect();
    this.clearHeartbeat();
    this.clearPresenceHeartbeat();

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(encodeStompFrame('DISCONNECT'));
      } catch {
        // Ignore send errors during disconnect
      }
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.sessionId = null;
    this.roomId = null;
    this.connectionMode = 'global';
    this.userId = null;
    this.wasConnectedBefore = false;
  }

  /** Subscribe to all incoming WS events */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Send a STOMP message to a destination */
  send(data: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.stompConnected) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[STOMP] Cannot send — not connected', {
          wsReady: this.ws?.readyState,
          stompConnected: this.stompConnected,
        });
      }
      return;
    }

    // Determine destination based on data
    const destination =
      (data.destination as string) ||
      `/app/session/${this.sessionId}`;

    const body = JSON.stringify(data);
    const frame = encodeStompFrame('SEND', {
      destination,
      'content-type': 'application/json',
    }, body);

    this.ws.send(frame);

    if (process.env.NODE_ENV === 'development') {
      console.log('[STOMP] Sent:', destination, data);
    }
  }

  get isConnected(): boolean {
    return this.stompConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  // ─── Private ───────────────────────────────

  private async openConnection(): Promise<void> {
    const token = await tokenStorage.getAccessToken();
    if (!token) {
      console.warn('[STOMP] Cannot connect — missing token');
      return;
    }
    if (this.connectionMode === 'session' && !this.sessionId) {
      console.warn('[STOMP] Cannot connect — missing sessionId');
      return;
    }
    if (this.connectionMode === 'room' && !this.roomId) {
      console.warn('[STOMP] Cannot connect — missing roomId');
      return;
    }

    // Build SockJS transport URL:
    // Format: ws://host/ws/{serverId}/{sessionId}/websocket
    const baseUrl = getWebSocketBaseUrl();
    const serverId = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    const transportId = this.generateTransportId();
    const url = `${baseUrl}/${serverId}/${transportId}/websocket`;

    console.log('[STOMP] Connecting to:', url);

    try {
      this.ws = new WebSocket(url);
    } catch (err) {
      console.error('[STOMP] Failed to create WebSocket:', err);
      this.scheduleReconnect();
      return;
    }

    // Store token for STOMP CONNECT
    const savedToken = token;

    this.ws.onopen = () => {
      console.log('[STOMP] Transport open — waiting for SockJS "o" frame');
    };

    this.ws.onmessage = (e: MessageEvent) => {
      const rawData = e.data as string;
      this.handleSockJSFrame(rawData, savedToken);
    };

    this.ws.onerror = (err: Event) => {
      console.error('[STOMP] Transport error:', {
        message: (err as any)?.message || 'unknown',
        type: (err as any)?.type,
      });
    };

    this.ws.onclose = (event: CloseEvent) => {
      console.warn('[STOMP] Transport closed:', {
        code: event.code,
        reason: event.reason || '(no reason)',
        wasClean: event.wasClean,
        intentional: this.intentionallyClosed,
        stompWasConnected: this.stompConnected,
      });

      const wasStompConnected = this.stompConnected;
      this.ws = null;
      this.stompConnected = false;
      this.clearHeartbeat();
      this.clearPresenceHeartbeat();

      // Notify listeners of disconnection
      if (wasStompConnected) {
        this.emit({ type: '_connection_change', connected: false } as any);
      }

      if (!this.intentionallyClosed) {
        this.scheduleReconnect();
      }
    };
  }

  // ─── SockJS Frame Handling ─────────────────

  private handleSockJSFrame(raw: string, token: string): void {
    if (!raw || raw.length === 0) return;

    const frameType = raw[0];

    switch (frameType) {
      // SockJS open frame — send STOMP CONNECT
      case 'o':
        console.log('[STOMP] SockJS open frame received -> sending STOMP CONNECT');
        this.sendStompConnect(token);
        break;

      // SockJS heartbeat frame
      case 'h':
        // Heartbeat — no action needed
        break;

      // SockJS message array frame
      case 'a':
        this.handleSockJSMessageArray(raw);
        break;

      // SockJS close frame
      case 'c':
        try {
          const closeData = JSON.parse(raw.substring(1));
          console.warn('[STOMP] SockJS close frame:', closeData);
        } catch {
          console.warn('[STOMP] SockJS close frame (unparseable):', raw);
        }
        break;

      default:
        if (process.env.NODE_ENV === 'development') {
          console.log('[STOMP] Unknown SockJS frame type:', frameType, raw.substring(0, 100));
        }
    }
  }

  private handleSockJSMessageArray(raw: string): void {
    // SockJS wraps STOMP frames in a JSON array: a["STOMP_FRAME"]
    let messages: string[];
    try {
      messages = JSON.parse(raw.substring(1));
    } catch {
      console.warn('[STOMP] Failed to parse SockJS message array:', raw.substring(0, 200));
      return;
    }

    for (const msg of messages) {
      const frame = decodeStompFrame(msg);
      if (!frame) continue;
      this.handleStompFrame(frame);
    }
  }

  // ─── STOMP Frame Handling ──────────────────

  private sendStompConnect(token: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const frame = encodeStompFrame('CONNECT', {
      'accept-version': '1.1,1.2',
      'heart-beat': '10000,10000',
      Authorization: `Bearer ${token}`,
    });

    this.ws.send(frame);
  }

  private handleStompFrame(frame: StompFrame): void {
    switch (frame.command) {
      case 'CONNECTED':
        this.onStompConnected(frame);
        break;

      case 'MESSAGE':
        this.onStompMessage(frame);
        break;

      case 'ERROR':
        this.onStompError(frame);
        break;

      case 'RECEIPT':
        if (process.env.NODE_ENV === 'development') console.log('[STOMP] Receipt:', frame.headers['receipt-id']);
        break;

      default:
        if (process.env.NODE_ENV === 'development') console.log('[STOMP] Unknown command:', frame.command);
    }
  }

  private onStompConnected(frame: StompFrame): void {
    // Negotiate heartbeat interval
    // Client sent: heart-beat:10000,10000 (cx=10000, cy=10000)
    // Server responds: heart-beat:sx,sy
    // Client→Server interval = max(cx, sy). If either is 0, disabled.
    // Server→Client interval = max(sx, cy). If either is 0, disabled.
    const serverHeartbeat = frame.headers['heart-beat'] || '0,0';
    const [sx, sy] = serverHeartbeat.split(',').map(Number);
    const cx = 10000; // what we offered to send
    // Client→Server: only send if both cx > 0 AND sy > 0
    this.negotiatedHeartbeatMs = (cx > 0 && sy > 0) ? Math.max(cx, sy) : 0;

    console.log('[STOMP] STOMP CONNECTED!', {
      version: frame.headers.version,
      serverHeartbeat: serverHeartbeat,
      negotiatedSendMs: this.negotiatedHeartbeatMs,
    });

    this.stompConnected = true;
    this.reconnectAttempt = 0;

    // Subscribe to the appropriate topics based on connection mode
    if (this.connectionMode === 'room') {
      this.subscribeToRoomTopics();
    } else if (this.connectionMode === 'session') {
      this.subscribeToSessionTopics();
    }
    // global mode: no topic subscription — heartbeat only

    // Subscribe to user-specific queues if userId available
    if (this.userId) {
      this.subscribeToUserQueues();
    }

    // Start STOMP protocol heartbeat only if negotiated
    if (this.negotiatedHeartbeatMs > 0) {
      this.startHeartbeat(this.negotiatedHeartbeatMs);
    } else {
      console.log('[STOMP] Heartbeat disabled (server negotiated 0,0)');
    }

    // Always start the 60s presence heartbeat after STOMP is confirmed
    this.startPresenceHeartbeat();

    // Notify listeners of connection
    const isReconnect = this.wasConnectedBefore;
    this.wasConnectedBefore = true;

    this.emit({ type: '_connection_change', connected: true } as any);

    if (isReconnect) {
      console.log('[STOMP] Reconnected — triggering state sync');
      this.emit({ type: '_reconnected' } as any);
    }
  }

  private onStompMessage(frame: StompFrame): void {
    const destination = frame.headers.destination || '';
    let payload: any;

    try {
      payload = frame.body ? JSON.parse(frame.body) : {};
    } catch {
      console.warn('[STOMP] Failed to parse MESSAGE body:', frame.body?.substring(0, 200));
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[STOMP] MESSAGE:', destination, payload);
    }

    // Handle room presence topic: /topic/room/{roomId}/presence
    const presenceMatch = destination.match(/^\/topic\/room\/([^/]+)\/presence$/);
    if (presenceMatch) {
      this.emit({
        type: 'room_member_presence',
        roomId: presenceMatch[1],
        userId: payload.userId,
        username: payload.username,
        isOnline: payload.isOnline,
      } as any);
      return;
    }

    // Map topic message to WSEvent(s)
    const events = mapTopicMessageToWSEvent(destination, payload, this.sessionId!);

    if (events) {
      if (Array.isArray(events)) {
        for (const evt of events) {
          this.emit(evt);
        }
      } else {
        this.emit(events);
      }
    }
  }

  private onStompError(frame: StompFrame): void {
    const errorMsg = frame.headers.message || '';
    const errorBody = frame.body || '';

    console.error('[STOMP] STOMP ERROR:', {
      message: errorMsg,
      body: errorBody.substring(0, 300),
    });

    // Auth errors — don't reconnect
    if (
      errorMsg.includes('401') ||
      errorMsg.includes('Unauthorized') ||
      errorBody.includes('401')
    ) {
      console.error('[STOMP] Auth error — stopping reconnection');
      this.intentionallyClosed = true;
      return;
    }

    // Session closed on backend — don't endlessly reconnect to a dead session
    if (
      errorMsg.includes('Session closed') ||
      errorMsg.includes('session closed') ||
      errorBody.includes('Session closed')
    ) {
      console.warn('[STOMP] Backend session closed — stopping reconnection');
      this.intentionallyClosed = true;
      // Notify listeners so the UI can react (e.g. redirect to results)
      this.emit({ type: '_session_closed' } as any);
      return;
    }
  }

  // ─── Topic Subscriptions ───────────────────

  private subscribeToSessionTopics(): void {
    if (!this.sessionId) return;

    for (const topic of WebSocketManager.SESSION_TOPICS) {
      this.subscriptionId++;
      const destination = `/topic/session/${this.sessionId}/${topic}`;
      const frame = encodeStompFrame('SUBSCRIBE', {
        id: `sub-${this.subscriptionId}`,
        destination,
      });

      this.ws?.send(frame);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[STOMP] Subscribed: ${destination} (sub-${this.subscriptionId})`);
      }
    }
  }

  private subscribeToUserQueues(): void {
    if (!this.userId) return;

    const queues = [
      `/queue/user/${this.userId}/notifications`,
      `/queue/user/${this.userId}/invitations`,
    ];

    for (const queue of queues) {
      this.subscriptionId++;
      const frame = encodeStompFrame('SUBSCRIBE', {
        id: `sub-${this.subscriptionId}`,
        destination: queue,
      });
      this.ws?.send(frame);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[STOMP] Subscribed: ${queue} (sub-${this.subscriptionId})`);
      }
    }
  }

  private subscribeToRoomTopics(): void {
    if (!this.roomId) return;

    this.subscriptionId++;
    const destination = `/topic/room/${this.roomId}/presence`;
    const frame = encodeStompFrame('SUBSCRIBE', {
      id: `sub-${this.subscriptionId}`,
      destination,
    });
    this.ws?.send(frame);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[STOMP] Subscribed: ${destination} (sub-${this.subscriptionId})`);
    }
  }

  // ─── Heartbeat ─────────────────────────────

  private startHeartbeat(intervalMs: number): void {
    this.clearHeartbeat();
    console.log(`[STOMP] Starting heartbeat every ${intervalMs}ms`);
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // STOMP heartbeat is a single newline
        this.ws.send('\n');
      }
    }, intervalMs);
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private startPresenceHeartbeat(): void {
    this.clearPresenceHeartbeat();
    console.log('[STOMP] Starting presence heartbeat every 60s');

    // Send immediately so the server marks the user online right away
    this.sendPresenceHeartbeat();

    this.presenceHeartbeatTimer = setInterval(() => {
      this.sendPresenceHeartbeat();
    }, 60_000);
  }

  private sendPresenceHeartbeat(): void {
    if (this.ws?.readyState === WebSocket.OPEN && this.stompConnected) {
      const frame = encodeStompFrame('SEND', { destination: '/app/heartbeat' }, '');
      this.ws.send(frame);
      if (process.env.NODE_ENV === 'development') {
        console.log('[STOMP] Presence heartbeat sent → /app/heartbeat');
      }
    }
  }

  private clearPresenceHeartbeat(): void {
    if (this.presenceHeartbeatTimer) {
      clearInterval(this.presenceHeartbeatTimer);
      this.presenceHeartbeatTimer = null;
    }
  }

  // ─── Reconnection ─────────────────────────

  private scheduleReconnect(): void {
    this.clearReconnect();
    const delay =
      RECONNECT_DELAYS[Math.min(this.reconnectAttempt, RECONNECT_DELAYS.length - 1)];
    console.log(`[STOMP] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt + 1})`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempt++;
      this.openConnection();
    }, delay);
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // ─── Event Dispatch ────────────────────────

  private emit(event: WSEvent): void {
    this.listeners.forEach((fn) => fn(event));
  }

  // ─── Helpers ───────────────────────────────

  private generateTransportId(): string {
    // Generate a random string for SockJS transport session ID
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }
}

/** Singleton instance shared across the app */
export const wsManager = new WebSocketManager();

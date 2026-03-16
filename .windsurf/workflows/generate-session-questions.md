---
description: How to generate AI questions for a trivia session
---

# Generate Session Questions Flow

This workflow handles AI-powered question generation for BuzzMaster trivia sessions.

## Overview

When a manager starts a session, the system generates trivia questions using AI based on selected categories and difficulty levels.

## Steps

1. **Manager clicks "Start"**
   - Frontend sends WebSocket event to backend
   - Backend validates all players have selected categories

2. **AI Generation Begins**
   - Backend calls AI service to generate questions
   - Frontend shows loading screen with progress indicator

3. **Progress Updates**
   - WebSocket sends `generation_progress` events every 500ms
   - Progress bar advances 0% → 100%
   - Running character animation moves with progress

4. **Generation Complete**
   - WebSocket sends `generation_complete` event
   - Character celebrates (jump animation)
   - Brief pause (1-2 seconds) for celebration
   - Auto-navigate to countdown screen

## Progress Screen UI

```
┌─────────────────────────────────────┐
│                                     │
│    🤖  (running character)          │
│    ════════════░░░░░░░░  65%        │
│                                     │
│    Generating questions... 13/20    │
│    ~15 seconds remaining            │
│                                     │
└─────────────────────────────────────┘
```

## WebSocket Events

### Client → Server
```typescript
type StartSessionEvent = {
  type: 'START_SESSION';
  sessionId: string;
}
```

### Server → Client
```typescript
type GenerationProgressEvent = {
  type: 'generation_progress';
  payload: {
    generated: number;
    total: number;
    percentage: number;
  }
}

type GenerationCompleteEvent = {
  type: 'generation_complete';
  payload: {
    sessionId: string;
  }
}
```

## Error Handling

- If generation fails: character stops, shows sad face
- Display error message with retry button
- Manager can retry or cancel and return to lobby

## File Locations

- Loading screen: `app/session/[code]/loading.tsx`
- WebSocket hook: `lib/game/useGameSocket.ts`
- Store: `stores/useBuzzStore.ts`

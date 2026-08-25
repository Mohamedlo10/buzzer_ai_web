import assert from 'node:assert/strict';
import { applyPacket, initialGameStateSlice, canAnswer } from './packet.ts';

let checks = 0;
const ok = (fn) => {
  fn();
  checks++;
};

console.log('⚡ Starting Frontend GameState Packet Performance & Fuzzing Tests...');

// ─── 1. Out-of-Order Packets Rejection Fuzzing ────────────────────────────────
ok(() => {
  let currentState = { ...initialGameStateSlice, stateVersion: 0 };
  const totalPackets = 5000;
  
  // Generate sequence of packets
  const packets = Array.from({ length: totalPackets }, (_, i) => ({
    version: i + 1,
    phase: (i % 2 === 0 ? 'QUESTION' : 'REVEAL'),
    sessionMode: 'WITHOUT_MODERATOR',
    questionId: `q-${i}`,
    serverNowEpochMs: Date.now() + i * 100,
    queue: [],
    answeringPlayerId: null,
    phaseEndsAtEpochMs: Date.now() + 10000,
    revealedWordCount: 5,
    totalWordCount: 10,
    wordRevealStartedAtEpochMs: null,
    wordRevealIntervalMs: 500,
    reveal: null,
    choices: ['A', 'B', 'C', 'D'],
    answeredCount: (i % 10),
    expectedAnswerCount: 10,
  }));

  // Shuffle packets to simulate out-of-order delivery
  const shuffled = [...packets].sort(() => Math.random() - 0.5);

  let acceptedCount = 0;
  let rejectedCount = 0;

  for (const p of shuffled) {
    const next = applyPacket(currentState, p);
    if (next) {
      assert.ok(next.stateVersion > currentState.stateVersion, 'Version must strictly increase');
      currentState = next;
      acceptedCount++;
    } else {
      rejectedCount++;
    }
  }

  // After processing all shuffled packets, final state MUST be the highest version (5000)
  assert.equal(currentState.stateVersion, totalPackets);
  assert.equal(acceptedCount + rejectedCount, totalPackets);
  console.log(`  ✓ Fuzzing 5,000 shuffled packets: ${acceptedCount} accepted, ${rejectedCount} stale rejected. Final version: ${currentState.stateVersion}`);
});

// ─── 2. High-Throughput Micro-Benchmark ───────────────────────────────────────
ok(() => {
  let state = { ...initialGameStateSlice, stateVersion: 0 };
  const iterations = 50_000;

  const start = performance.now();
  for (let i = 1; i <= iterations; i++) {
    const next = applyPacket(state, {
      version: i,
      phase: 'QUESTION',
      sessionMode: 'WITHOUT_MODERATOR',
      questionId: 'q-bench',
      serverNowEpochMs: 1700000000000 + i,
      queue: [{ position: 0, deltaMs: 0, playerId: 'p1', playerName: 'P1' }],
      answeringPlayerId: null,
      phaseEndsAtEpochMs: 1700000010000,
      revealedWordCount: 3,
      totalWordCount: 6,
      wordRevealStartedAtEpochMs: null,
      wordRevealIntervalMs: 500,
      reveal: null,
      choices: ['1', '2', '3', '4'],
      answeredCount: 1,
      expectedAnswerCount: 4,
    });
    if (next) state = next;
  }
  const durationMs = performance.now() - start;
  const opsPerSec = (iterations / durationMs) * 1000;

  assert.equal(state.stateVersion, iterations);
  console.log(`  🚀 [JS Packet Projection Throughput] ${iterations.toLocaleString()} packets in ${durationMs.toFixed(2)} ms (~${Math.round(opsPerSec).toLocaleString()} ops/sec)`);
  assert.ok(opsPerSec > 100_000, 'Throughput must exceed 100,000 packets/sec');
});

// ─── 3. Corrupt & Null Payload Resilience ─────────────────────────────────────
ok(() => {
  const state = { ...initialGameStateSlice, stateVersion: 10 };

  // Null, undefined, negative or non-numeric versions
  assert.equal(applyPacket(state, null), null);
  assert.equal(applyPacket(state, undefined), null);
  assert.equal(applyPacket(state, {}), null);
  assert.equal(applyPacket(state, { version: '15' }), null);
  assert.equal(applyPacket(state, { version: NaN }), null);
  assert.equal(applyPacket(state, { version: 10 }), null); // Equal version rejected
  assert.equal(applyPacket(state, { version: 9 }), null);  // Lower version rejected

  // Corrupt queue payload
  const validWithCorruptQueue = applyPacket(state, {
    version: 11,
    phase: 'READING',
    sessionMode: 'WITH_MODERATOR',
    queue: [
      { position: 2, deltaMs: 100, playerId: 'p2', playerName: 'P2' },
      { position: 0, deltaMs: 0, playerId: 'p0', playerName: 'P0' },
      { position: 1, deltaMs: 50, playerId: 'p1', playerName: 'P1' },
    ],
    serverNowEpochMs: Date.now(),
  });

  assert.ok(validWithCorruptQueue);
  assert.equal(validWithCorruptQueue.buzzQueue[0].position, 0);
  assert.equal(validWithCorruptQueue.buzzQueue[1].position, 1);
  assert.equal(validWithCorruptQueue.buzzQueue[2].position, 2);
  console.log('  ✓ Resilient against null, corrupt and inverted queue payloads');
});

// ─── 4. canAnswer Sprint Rule Check ──────────────────────────────────────────
ok(() => {
  const questionState = { ...initialGameStateSlice, phase: 'QUESTION' };
  const revealState = { ...initialGameStateSlice, phase: 'REVEAL' };
  const readingState = { ...initialGameStateSlice, phase: 'READING' };

  assert.equal(canAnswer(questionState, null), true);
  assert.equal(canAnswer(questionState, 'Choice A'), false); // Already answered
  assert.equal(canAnswer(revealState, null), false);          // Question ended
  assert.equal(canAnswer(readingState, null), false);         // Not in question
  console.log('  ✓ canAnswer business rules verified');
});

console.log(`\n🎉 ALL ${checks} PERFORMANCE & RESILIENCE TESTS PASSED!`);

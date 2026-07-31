import {
  calculateClockOffset,
  computeExpectedPosition,
  computeSyncAction,
  formatTime,
  clampVolume,
  clampPosition,
  NUDGE_RATE_FAST,
  NUDGE_RATE_SLOW,
} from '../sync-engine';
import { PlayerSyncEvent } from '@/types/player';

// Simple lightweight test runner assertions (runnable in node / vitest / jest)
export function runSyncEngineTests() {
  const testResults: Array<{ name: string; passed: boolean; error?: string }> = [];

  function assertEqual<T>(actual: T, expected: T, name: string) {
    const passed = actual === expected;
    testResults.push({
      name,
      passed,
      error: passed ? undefined : `Expected ${expected}, but got ${actual}`,
    });
  }

  // 1. Clock Offset Calculation
  {
    const sentAt = 1000;
    const receivedAt = 1100;
    const { latencyMs } = calculateClockOffset(sentAt, receivedAt);
    assertEqual(latencyMs, 50, 'Latency calculation: (1100-1000)/2 = 50ms');
  }

  // 2. Expected Position with Transit Time
  {
    const event: PlayerSyncEvent = {
      type: 'PLAYER_PLAY',
      position: 10.0,
      sentAt: 1000,
      senderId: 'user-1',
    };
    const receivedAt = 1200; // 200ms RTT → 100ms one-way latency
    const expected = computeExpectedPosition(event, receivedAt);
    assertEqual(expected, 10.1, 'Expected position with play event adding transit latency');
  }

  // 3. Sync Action Decision Matrix
  {
    // Case A: Within soft threshold → No action
    const actionNone = computeSyncAction(10.1, 10.0, true);
    assertEqual(actionNone.type, 'none', 'Drift <= 0.3s returns no action');

    // Case B: Soft drift forward while playing → Rate nudge fast
    const actionNudgeFast = computeSyncAction(10.5, 10.0, true);
    assertEqual(actionNudgeFast.type, 'rate', 'Soft forward drift returns rate nudge');
    if (actionNudgeFast.type === 'rate') {
      assertEqual(actionNudgeFast.playbackRate, NUDGE_RATE_FAST, 'Fast nudge rate is 1.06');
    }

    // Case C: Soft drift backward while playing → Rate nudge slow
    const actionNudgeSlow = computeSyncAction(9.5, 10.0, true);
    assertEqual(actionNudgeSlow.type, 'rate', 'Soft backward drift returns rate nudge');
    if (actionNudgeSlow.type === 'rate') {
      assertEqual(actionNudgeSlow.playbackRate, NUDGE_RATE_SLOW, 'Slow nudge rate is 0.94');
    }

    // Case D: Large drift > 2.0s → Hard seek
    const actionHardSeek = computeSyncAction(15.0, 10.0, true);
    assertEqual(actionHardSeek.type, 'seek', 'Drift > 2.0s triggers hard seek');
    if (actionHardSeek.type === 'seek') {
      assertEqual(actionHardSeek.targetPosition, 15.0, 'Hard seek target is 15.0s');
    }

    // Case E: Paused player with soft drift → Hard seek (cannot rate-nudge when paused)
    const actionPausedSeek = computeSyncAction(10.5, 10.0, false);
    assertEqual(actionPausedSeek.type, 'seek', 'Paused player soft drift triggers seek instead of rate');
  }

  // 4. Format Time Helper
  {
    assertEqual(formatTime(0), '0:00', 'formatTime 0');
    assertEqual(formatTime(65), '1:05', 'formatTime 65s');
    assertEqual(formatTime(3665), '1:01:05', 'formatTime 3665s');
    assertEqual(formatTime(-10), '0:00', 'formatTime negative input clamp');
  }

  // 5. Clamp Helpers
  {
    assertEqual(clampVolume(1.5), 1.0, 'clampVolume upper bound');
    assertEqual(clampVolume(-0.5), 0.0, 'clampVolume lower bound');
    assertEqual(clampPosition(120, 100), 100, 'clampPosition upper bound');
    assertEqual(clampPosition(-10, 100), 0, 'clampPosition lower bound');
  }

  return testResults;
}

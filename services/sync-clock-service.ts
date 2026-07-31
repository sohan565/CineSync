// ─── NTP Clock Synchronization Service ─────────────────────────────────────────
// Calculates network latency (RTT) and wall-clock offset between client and server.
// Uses a rolling window median filter to eliminate network jitter and spike outliers.

export interface NTPHandshakeSample {
  t0: number; // Client send time
  t1: number; // Server receive time (or simulated server response timestamp)
  t2: number; // Server respond time
  t3: number; // Client receive time
  rtt: number; // Round trip time
  offset: number; // Clock offset (server - client)
}

export interface ClockStats {
  offsetMs: number;
  rttMs: number;
  jitterMs: number;
  sampleCount: number;
  status: 'synced' | 'syncing' | 'degraded' | 'offline';
}

const MAX_SAMPLES = 10;

export class SyncClockService {
  private static samples: NTPHandshakeSample[] = [];
  private static currentOffsetMs = 0;
  private static currentRttMs = 0;
  private static currentJitterMs = 0;

  /**
   * Process a single 4-way NTP timestamp sample.
   * t0: client send
   * t1: server receive
   * t2: server transmit
   * t3: client receive
   */
  static addSample(t0: number, t1: number, t2: number, t3: number): NTPHandshakeSample {
    const rtt = Math.max(0, (t3 - t0) - (t2 - t1));
    const offset = ((t1 - t0) + (t2 - t3)) / 2;

    const sample: NTPHandshakeSample = { t0, t1, t2, t3, rtt, offset };
    
    this.samples.push(sample);
    if (this.samples.length > MAX_SAMPLES) {
      this.samples.shift();
    }

    this.recalculate();
    return sample;
  }

  /**
   * Recalculates stats using a median filter to reject network spikes.
   */
  private static recalculate() {
    if (this.samples.length === 0) return;

    // Sort by RTT to pick lowest-latency samples (NTP standard practice)
    const sortedByRtt = [...this.samples].sort((a, b) => a.rtt - b.rtt);
    // Keep best 50% of samples (lowest RTT)
    const bestSamples = sortedByRtt.slice(0, Math.max(1, Math.floor(sortedByRtt.length / 2)));

    // Median offset among best samples
    const offsets = bestSamples.map((s) => s.offset).sort((a, b) => a - b);
    const mid = Math.floor(offsets.length / 2);
    this.currentOffsetMs = offsets.length % 2 !== 0 ? offsets[mid] : (offsets[mid - 1] + offsets[mid]) / 2;

    // Median RTT
    const rtts = bestSamples.map((s) => s.rtt).sort((a, b) => a - b);
    this.currentRttMs = rtts[Math.floor(rtts.length / 2)];

    // Jitter (standard deviation of offsets)
    if (bestSamples.length > 1) {
      const meanOffset = bestSamples.reduce((acc, s) => acc + s.offset, 0) / bestSamples.length;
      const variance = bestSamples.reduce((acc, s) => acc + Math.pow(s.offset - meanOffset, 2), 0) / bestSamples.length;
      this.currentJitterMs = Math.sqrt(variance);
    } else {
      this.currentJitterMs = 0;
    }
  }

  /**
   * Returns current synchronized wall-clock timestamp in milliseconds.
   */
  static getSyncedNow(): number {
    return Date.now() + this.currentOffsetMs;
  }

  /**
   * Returns calculated clock statistics.
   */
  static getStats(): ClockStats {
    let status: ClockStats['status'] = 'synced';
    if (this.samples.length < 3) status = 'syncing';
    else if (this.currentRttMs > 300 || this.currentJitterMs > 100) status = 'degraded';

    return {
      offsetMs: Math.round(this.currentOffsetMs),
      rttMs: Math.round(this.currentRttMs),
      jitterMs: Math.round(this.currentJitterMs),
      sampleCount: this.samples.length,
      status,
    };
  }

  /**
   * Resets all samples and statistics.
   */
  static reset() {
    this.samples = [];
    this.currentOffsetMs = 0;
    this.currentRttMs = 0;
    this.currentJitterMs = 0;
  }
}

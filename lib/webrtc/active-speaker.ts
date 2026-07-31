// ─── Active Speaker Detector ──────────────────────────────────────────────────
// Uses Web Audio API AnalyserNode to measure audio RMS volume and detect speech.

export class ActiveSpeakerDetector {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private animFrameId: number | null = null;
  private isDestroyed = false;

  constructor(
    stream: MediaStream,
    onSpeakingChange: (isSpeaking: boolean) => void,
    threshold = 15 // Audio volume threshold (0-255)
  ) {
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtx();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.4;

      this.source = this.audioCtx.createMediaStreamSource(stream);
      this.source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      let isSpeaking = false;

      const checkAudio = () => {
        if (this.isDestroyed || !this.analyser) return;

        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const nowSpeaking = average > threshold;

        if (nowSpeaking !== isSpeaking) {
          isSpeaking = nowSpeaking;
          onSpeakingChange(isSpeaking);
        }

        this.animFrameId = requestAnimationFrame(checkAudio);
      };

      checkAudio();
    } catch {
      // AudioContext not supported or permission denied
    }
  }

  destroy() {
    this.isDestroyed = true;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.source?.disconnect();
    this.audioCtx?.close().catch(() => null);
  }
}

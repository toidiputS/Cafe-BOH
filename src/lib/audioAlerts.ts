/**
 * High-Fidelity Kitchen Auditory Alert Pipeline
 * Synthesizes clear restaurant alert sounds using Web Audio API
 */

class AudioAlertPipeline {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Lazy initialize to bypass browser autoplay blocks until user interaction
  }

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    // Resume context if suspended (e.g., due to autoplay policies)
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('bridge_boh_audio_muted', muted ? 'true' : 'false');
  }

  getMuted(): boolean {
    const stored = localStorage.getItem('bridge_boh_audio_muted');
    if (stored !== null) {
      this.isMuted = stored === 'true';
    }
    return this.isMuted;
  }

  /**
   * Dual-Tone Clean Order Alert Chime
   */
  playNewOrderChime() {
    this.init();
    if (this.isMuted || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      
      // Tone 1
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.15); // A5
      
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);

      // Tone 2 (delayed slightly for harmonic echo)
      setTimeout(() => {
        if (!this.ctx) return;
        const delayedNow = this.ctx.currentTime;
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, delayedNow); // E5
        osc2.frequency.exponentialRampToValueAtTime(1174.66, delayedNow + 0.15); // D6
        
        gain2.gain.setValueAtTime(0.08, delayedNow);
        gain2.gain.exponentialRampToValueAtTime(0.001, delayedNow + 0.4);
        
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(delayedNow);
        osc2.stop(delayedNow + 0.4);
      }, 80);

    } catch (e) {
      console.warn('Audio alert failed', e);
    }
  }

  /**
   * Sizzling "Fired" Transition Alert
   */
  playFireItemSizzle() {
    this.init();
    if (this.isMuted || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.3; // 0.3 seconds
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Generate white noise for sizzle
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      // Bandpass filter to make noise sound more like a sizzle/whoosh
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2500;
      filter.Q.value = 1.2;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noiseNode.start(now);
      noiseNode.stop(now + 0.3);
      
      // Harmonic synth undertone
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220.00, now); // A3
      osc.frequency.exponentialRampToValueAtTime(440.00, now + 0.2); // A4
      
      oscGain.gain.setValueAtTime(0.05, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      
      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);

    } catch (e) {
      console.warn('Audio alert failed', e);
    }
  }

  /**
   * High-End Kitchen Pass Bell (Chimes clear & rich)
   */
  playKitchenBellChime() {
    this.init();
    if (this.isMuted || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      
      // Harmonic bell tone 1
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, now); // B5 (Bright bell)
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.8);

      // Harmonic tone 2
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1244.51, now); // D#6
      gain2.gain.setValueAtTime(0.08, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.6);

      // Metallic high frequency click (clapper hit)
      const clapper = this.ctx.createOscillator();
      const clapperGain = this.ctx.createGain();
      clapper.type = 'triangle';
      clapper.frequency.setValueAtTime(2000, now);
      clapperGain.gain.setValueAtTime(0.18, now);
      clapperGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      
      clapper.connect(clapperGain);
      clapperGain.connect(this.ctx.destination);
      clapper.start(now);
      clapper.stop(now + 0.05);

    } catch (e) {
      console.warn('Audio alert failed', e);
    }
  }

  /**
   * Action warning buzzer for 86 alerts or errors
   */
  playWarningBuzz() {
    this.init();
    if (this.isMuted || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150.00, now);
      osc.frequency.linearRampToValueAtTime(120.00, now + 0.35);
      
      gain.gain.setValueAtTime(0.10, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.35);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio alert failed', e);
    }
  }
}

export const audioAlerts = new AudioAlertPipeline();
export default audioAlerts;

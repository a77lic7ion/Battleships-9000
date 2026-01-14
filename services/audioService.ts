
class AudioService {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private createGain(start: number, end: number, duration: number) {
    const gain = this.ctx!.createGain();
    gain.gain.setValueAtTime(start, this.ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(end, this.ctx!.currentTime + duration);
    return gain;
  }

  playHit() {
    this.init();
    const osc = this.ctx!.createOscillator();
    const gain = this.createGain(0.5, 0.01, 0.5);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, this.ctx!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx!.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    
    osc.start();
    osc.stop(this.ctx!.currentTime + 0.5);

    // Add some noise
    const bufferSize = this.ctx!.sampleRate * 0.2;
    const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    
    const noise = this.ctx!.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.createGain(0.2, 0.01, 0.2);
    noise.connect(noiseGain);
    noiseGain.connect(this.ctx!.destination);
    noise.start();
  }

  playMiss() {
    this.init();
    const osc = this.ctx!.createOscillator();
    const gain = this.createGain(0.1, 0.01, 0.4);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, this.ctx!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx!.currentTime + 0.4);
    
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    osc.start();
    osc.stop(this.ctx!.currentTime + 0.4);
  }

  playSunk() {
    this.init();
    this.playExplosion();
  }

  playExplosion() {
    this.init();
    // Low frequency thump
    const osc = this.ctx!.createOscillator();
    const gain = this.createGain(0.8, 0.001, 1.5);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, this.ctx!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, this.ctx!.currentTime + 1.0);
    
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    
    osc.start();
    osc.stop(this.ctx!.currentTime + 1.5);

    // Crackle/Noise for explosion
    const bufferSize = this.ctx!.sampleRate * 1.0;
    const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    
    const noise = this.ctx!.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.createGain(0.4, 0.001, 1.0);
    noise.connect(noiseGain);
    noiseGain.connect(this.ctx!.destination);
    noise.start();
  }

  playUI() {
    this.init();
    const osc = this.ctx!.createOscillator();
    const gain = this.createGain(0.05, 0.001, 0.1);
    osc.frequency.setValueAtTime(1200, this.ctx!.currentTime);
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    osc.start();
    osc.stop(this.ctx!.currentTime + 0.1);
  }
}

export const sound = new AudioService();

export class CyberSynth {
  ctx: AudioContext | null = null;
  isPlaying = false;
  timerId: number | null = null;
  step = 0;

  // A phrygian dominant or synthwave minor scale
  notes = [
    130.81, // C3
    155.56, // Eb3
    174.61, // F3
    196.00, // G3
    233.08, // Bb3
    261.63, // C4
    311.13, // Eb4
  ];
  
  sequence = [0, -1, 3, 5, 2, -1, 4, 3, 0, 7, 5, 2, 0, 3, -1, -1];

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playNote(noteIdx: number, time: number) {
    if (!this.ctx) return;
    if (noteIdx === -1) {
      // Kick drum
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
      
      gain.gain.setValueAtTime(1, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
      
      osc.start(time);
      osc.stop(time + 0.1);
      return;
    }

    if (noteIdx === 7) {
      // Snare/hi-hat noise
      const bufferSize = this.ctx.sampleRate * 0.1; 
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 5000;
      
      const gain = this.ctx.createGain();
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
      
      noise.start(time);
      return;
    }
    
    // Synth bass/arp
    const freq = this.notes[noteIdx % this.notes.length];
    
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, time);
    filter.frequency.exponentialRampToValueAtTime(2000, time + 0.1);
    
    const gain = this.ctx.createGain();
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.frequency.setValueAtTime(freq, time);
    
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.2, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    
    osc.start(time);
    osc.stop(time + 0.2);
  }

  scheduleNotes() {
    if (!this.isPlaying || !this.ctx) return;
    
    // schedule ahead
    let time = this.ctx.currentTime + 0.1;
    this.playNote(this.sequence[this.step], time);
    
    this.step = (this.step + 1) % this.sequence.length;
    
    this.timerId = window.setTimeout(() => this.scheduleNotes(), 150); // ~100 BPM 16th notes
  }

  toggle() {
    if (this.isPlaying) {
      this.isPlaying = false;
      if (this.timerId !== null) {
        clearTimeout(this.timerId);
      }
      if (this.ctx) {
         this.ctx.suspend();
      }
    } else {
      this.init();
      this.isPlaying = true;
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.scheduleNotes();
    }
  }
}

export const synth = new CyberSynth();

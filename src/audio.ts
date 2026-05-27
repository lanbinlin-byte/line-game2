export class CyberSynth {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  bgmOn = false;
  sfxOn = true;
  volume = 0.5;
  timerId: number | null = null;
  step = 0;
  scale: number[] = [];

  // Extended 64-step sequences
  kickSeq = "x---x---x---x--xx---x---x---x---x---x---x---x--xx---x---x-x-x---";
  snareSeq = "----x-------x-------x-------x-------x-------x-------x-------x-xx";
  hatSeq = "x-xxx-xxx-xxx-xxx-xxx-xxx-xxx-xxx-xxx-xxx-xxx-xxx-xxx-xxx-xxxxxx";
  bassSeq = "eeeeeeeeeeeeeeeejjjjjjjjjjjjjjjjeeeeeeeeeeeeeeeehhhhhhhhgggggggg";
  melodySeq = "s--s-v-s----x-w-s--s-v-s--------s--s-v-s----x-w-z--y-w-x-w-s----";

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
      this.generateScale();
    }
  }

  setVolume(vol: number) {
    this.volume = vol;
    if (this.masterGain) {
      this.masterGain.gain.value = vol;
    }
  }

  generateScale() {
    // Generate Minor scale over 7 octaves starting from C0 (16.35 Hz)
    const minorIntervals = [2, 1, 2, 2, 1, 2, 2];
    let freq = 16.35;
    this.scale = [];
    for (let oct = 0; oct < 8; oct++) {
      for (const interval of minorIntervals) {
        this.scale.push(freq);
        freq *= Math.pow(2, interval / 12);
      }
    }
  }

  playKick(time: number) {
    if (!this.ctx || !this.bgmOn) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
    
    gain.gain.setValueAtTime(1.5, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    
    osc.start(time);
    osc.stop(time + 0.1);
  }

  playSnare(time: number) {
    if (!this.ctx || !this.bgmOn) return;
    
    const noise = this.ctx.createBufferSource();
    const bufferSize = this.ctx.sampleRate * 0.1; 
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    
    noise.start(time);
  }

  playHat(time: number) {
    if (!this.ctx || !this.bgmOn) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(8000, time);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.start(time);
    osc.stop(time + 0.05);
  }

  playBass(char: string, time: number) {
    if (!this.ctx || char === '-' || !this.bgmOn) return;
    const idx = parseInt(char, 36);
    if (isNaN(idx) || !this.scale[idx]) return;
    const freq = this.scale[idx];

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc2.type = 'square';
    osc.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 1.01, time); // slight detune
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 8, time);
    filter.frequency.exponentialRampToValueAtTime(freq, time + 0.1);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.4, time + 0.01);
    gain.gain.setTargetAtTime(0, time + 0.05, 0.05);
    
    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.start(time);
    osc2.start(time);
    osc.stop(time + 0.15);
    osc2.stop(time + 0.15);
  }

  playMelody(char: string, time: number) {
    if (!this.ctx || char === '-' || !this.bgmOn) return;
    const idx = parseInt(char, 36);
    if (isNaN(idx) || !this.scale[idx]) return;
    const freq = this.scale[idx];

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc.type = 'square';
    osc2.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 2, time); // octave higher
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 2;
    filter.frequency.setValueAtTime(freq * 4, time);
    filter.frequency.exponentialRampToValueAtTime(freq, time + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.2, time + 0.01);
    gain.gain.setTargetAtTime(0, time + 0.05, 0.05);
    
    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    
    // Slight embedded delay
    const delay = this.ctx.createDelay();
    delay.delayTime.value = 0.2; 
    const delayGain = this.ctx.createGain();
    delayGain.gain.value = 0.25;
    gain.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(delay);
    delayGain.connect(this.masterGain!);
    
    gain.connect(this.masterGain!);
    
    osc.start(time);
    osc2.start(time);
    osc.stop(time + 0.15);
    osc2.stop(time + 0.15);
  }

  playMoveSound() {
    if (!this.ctx || !this.sfxOn) return;
    const time = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.15);
    
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    
    osc.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.start(time);
    osc.stop(time + 0.15);
  }

  scheduleNotes() {
    if (!this.bgmOn || !this.ctx) return;
    
    let time = this.ctx.currentTime + 0.05;
    
    if (this.kickSeq[this.step] === 'x') this.playKick(time);
    if (this.snareSeq[this.step] === 'x') this.playSnare(time);
    if (this.hatSeq[this.step] === 'x') this.playHat(time);
    this.playBass(this.bassSeq[this.step], time);
    this.playMelody(this.melodySeq[this.step], time);
    
    this.step = (this.step + 1) % 64; // 64 steps
    
    // ~140 BPM 16th notes
    this.timerId = window.setTimeout(() => this.scheduleNotes(), 107); 
  }

  toggleBgm() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    this.bgmOn = !this.bgmOn;
    
    if (this.bgmOn) {
      // Don't reset step so it continues musically, or reset if desired.
      this.scheduleNotes();
    } else {
      if (this.timerId !== null) {
        clearTimeout(this.timerId);
      }
    }
  }

  toggleSfx() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.sfxOn = !this.sfxOn;
  }
}

export const synth = new CyberSynth();


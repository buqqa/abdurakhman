export type GameSound = 'zombie' | 'zombieAttack' | 'repair' | 'eat' | 'chop' | 'start' | 'defeat';

let audioContext: AudioContext | undefined;

function getContext() {
  audioContext ??= new AudioContext();
  if (audioContext.state === 'suspended') void audioContext.resume();
  return audioContext;
}

function tone(context: AudioContext, start: number, end: number, duration: number, volume: number, type: OscillatorType) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(start, now);
  oscillator.frequency.exponentialRampToValueAtTime(end, now + duration);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function noise(context: AudioContext, duration: number, volume: number, frequency: number) {
  const size = Math.floor(context.sampleRate * duration);
  const buffer = context.createBuffer(1, size, context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < size; index += 1) channel[index] = Math.random() * 2 - 1;
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = buffer;
  filter.type = 'lowpass';
  filter.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
  source.connect(filter).connect(gain).connect(context.destination);
  source.start();
}

export function playGameSound(sound: GameSound) {
  const context = getContext();
  if (sound === 'zombie') {
    tone(context, 105, 48, .42, .11, 'sawtooth');
    noise(context, .34, .035, 420);
  } else if (sound === 'zombieAttack') {
    tone(context, 145, 58, .2, .15, 'sawtooth');
    noise(context, .13, .08, 520);
  } else if (sound === 'repair') {
    tone(context, 720, 210, .13, .12, 'square');
    noise(context, .09, .05, 1800);
  } else if (sound === 'eat') {
    noise(context, .2, .13, 1350);
    window.setTimeout(() => noise(context, .14, .09, 950), 100);
  } else if (sound === 'chop') {
    tone(context, 190, 72, .16, .13, 'triangle');
    noise(context, .11, .065, 650);
  } else if (sound === 'start') {
    tone(context, 260, 520, .32, .1, 'triangle');
    window.setTimeout(() => tone(context, 390, 780, .28, .075, 'triangle'), 150);
  } else {
    tone(context, 180, 42, .8, .16, 'sawtooth');
    noise(context, .55, .075, 380);
  }
}

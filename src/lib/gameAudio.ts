export type GameSound = 'zombie' | 'zombieAttack' | 'repair' | 'eat' | 'chop' | 'start' | 'victory' | 'defeat';

let audioContext: AudioContext | undefined;
let ambientGain: GainNode | undefined;
let masterVolume = Number(localStorage.getItem('forest-volume') ?? .7);
const EFFECT_VOLUME_BOOST = 1.8;

export function getGameVolume() { return masterVolume; }
export function setGameVolume(volume: number) {
  masterVolume = Math.max(0, Math.min(1, volume));
  localStorage.setItem('forest-volume', String(masterVolume));
  if (ambientGain && audioContext) ambientGain.gain.setTargetAtTime(masterVolume * .075, audioContext.currentTime, .08);
}

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
  gain.gain.setValueAtTime(volume * masterVolume * EFFECT_VOLUME_BOOST, now);
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
  gain.gain.setValueAtTime(volume * masterVolume * EFFECT_VOLUME_BOOST, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
  source.connect(filter).connect(gain).connect(context.destination);
  source.start();
}

function startAmbientMusic(context: AudioContext) {
  if (ambientGain) {
    ambientGain.gain.setTargetAtTime(masterVolume * .075, context.currentTime, .12);
    return;
  }
  ambientGain = context.createGain();
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 520;
  ambientGain.gain.value = masterVolume * .075;
  ambientGain.connect(filter).connect(context.destination);

  [55, 82.4, 110].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const voiceGain = context.createGain();
    oscillator.type = index === 1 ? 'triangle' : 'sine';
    oscillator.frequency.value = frequency;
    oscillator.detune.value = index * 5 - 4;
    voiceGain.gain.value = index === 0 ? .55 : .22;
    oscillator.connect(voiceGain).connect(ambientGain!);
    oscillator.start();
  });

  const pulse = context.createOscillator();
  const pulseDepth = context.createGain();
  pulse.frequency.value = .11;
  pulseDepth.gain.value = .008;
  pulse.connect(pulseDepth).connect(ambientGain.gain);
  pulse.start();
}

export function startBackgroundMusic() {
  startAmbientMusic(getContext());
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
    tone(context, 520, 210, .18, .13, 'triangle');
    noise(context, .22, .18, 1550);
    window.setTimeout(() => noise(context, .16, .13, 1050), 100);
  } else if (sound === 'chop') {
    tone(context, 240, 62, .2, .2, 'triangle');
    noise(context, .14, .11, 780);
  } else if (sound === 'start') {
    startAmbientMusic(context);
    tone(context, 260, 520, .32, .1, 'triangle');
    window.setTimeout(() => tone(context, 390, 780, .28, .075, 'triangle'), 150);
  } else if (sound === 'victory') {
    ambientGain?.gain.setTargetAtTime(masterVolume * .018, context.currentTime, .18);
    [392, 494, 587, 784].forEach((note, index) => window.setTimeout(() => tone(context, note, note * 1.01, .55, .14, 'triangle'), index * 190));
  } else {
    ambientGain?.gain.setTargetAtTime(masterVolume * .012, context.currentTime, .18);
    tone(context, 180, 42, .8, .16, 'sawtooth');
    noise(context, .55, .075, 380);
    window.setTimeout(() => tone(context, 130, 52, .9, .13, 'sawtooth'), 430);
    window.setTimeout(() => tone(context, 92, 38, 1.1, .11, 'triangle'), 820);
  }
}

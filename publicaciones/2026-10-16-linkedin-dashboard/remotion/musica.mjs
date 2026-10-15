// Pista de 40 s para el video del dashboard, sintetizada por código (sin samples externos).
// Supersaw pad filtrado + arpegiador resonante con delay ping-pong + bajo a contratiempo
// + bombo + hats metálicos tipo 808 + reverb. Escribe out/musica.wav (44,1 kHz, estéreo, 16 bits).
import { writeFileSync } from "node:fs";

const SR = 44100;
const DUR = 40;
const N = SR * DUR;
const BPM = 96;
const BEAT = 60 / BPM;          // 0,625 s
const COMPAS = BEAT * 8;        // un acorde cada 2 compases = 5 s

// Momentos del video (s)
const T_DROP = 130 / 30;        // fin del gancho: entra el ritmo
const T_ARP = 130 / 30;
const T_HAT = 435 / 30;         // escena "49 clases": entran los hats
const T_FIN = 1080 / 30;        // cierre: se va la percusión

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
// Am9 · Fmaj7 · C(add9) · G6, voces cercanas
const ACORDES = [
  [57, 60, 64, 71],
  [53, 57, 60, 64],
  [55, 60, 64, 67],
  [55, 59, 62, 64],
];
const RAIZ = [45, 41, 48, 43];
const idxAcorde = (t) => Math.floor(t / COMPAS) % 4;

let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const ruido = () => rnd() * 2 - 1;

// ---------- DSP ----------
const polyblep = (t, dt) => {
  if (t < dt) { t /= dt; return t + t - t * t - 1; }
  if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; }
  return 0;
};
const saw = (ph, dt) => 2 * ph - 1 - polyblep(ph, dt);
const square = (ph, dt) => {
  let v = ph < 0.5 ? 1 : -1;
  v += polyblep(ph, dt);
  v -= polyblep((ph + 0.5) % 1, dt);
  return v;
};

class Biquad {
  constructor() { this.x1 = this.x2 = this.y1 = this.y2 = 0; }
  set(tipo, f, q) {
    f = Math.min(f, SR * 0.45);
    const w = (2 * Math.PI * f) / SR, c = Math.cos(w), s = Math.sin(w), a = s / (2 * q);
    let b0, b1, b2;
    if (tipo === "lp") { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; }
    else if (tipo === "hp") { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; }
    else { b0 = a; b1 = 0; b2 = -a; } // bp
    const a0 = 1 + a;
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0;
    this.a1 = (-2 * c) / a0; this.a2 = (1 - a) / a0;
    return this;
  }
  run(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y;
    return y;
  }
}

const bus = () => [new Float32Array(N), new Float32Array(N)];
const pad = bus(), arp = bus(), bajo = bus(), bombo = bus(), hats = bus(), fx = bus();

// ---------- Pad: supersaw de 7 voces por nota ----------
const DETUNE = [-19, -12, -6, 0, 6, 12, 19]; // cents
for (let c = 0; c * COMPAS < DUR; c++) {
  const t0 = c * COMPAS, t1 = t0 + COMPAS;
  const a = Math.floor(t0 * SR), b = Math.min(N, Math.floor((t1 + 1.2) * SR));
  for (const nota of ACORDES[c % 4]) {
    const osc = DETUNE.map((d) => ({ f: hz(nota) * Math.pow(2, d / 1200), ph: rnd(), pan: d / 19 }));
    for (let i = a; i < b; i++) {
      const t = i / SR;
      const env = Math.min(1, (t - t0) / 0.6) * (t > t1 ? Math.max(0, 1 - (t - t1) / 1.2) : 1);
      let l = 0, r = 0;
      for (const o of osc) {
        const dt = o.f / SR;
        o.ph += dt; if (o.ph >= 1) o.ph -= 1;
        const v = saw(o.ph, dt);
        l += v * (1 - o.pan * 0.8); r += v * (1 + o.pan * 0.8);
      }
      pad[0][i] += l * env * 0.012;
      pad[1][i] += r * env * 0.012;
    }
  }
}
// Filtro del pad: se abre con el video y respira con un LFO lento
{
  const fl = [new Biquad(), new Biquad()], fl2 = [new Biquad(), new Biquad()];
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    if (i % 32 === 0) {
      const apertura = t < T_DROP ? 0.32 + 0.1 * (t / T_DROP)
        : t < T_HAT ? 0.4 + 0.35 * ((t - T_DROP) / (T_HAT - T_DROP))
        : t < T_FIN ? 0.85 : 0.85 - 0.6 * ((t - T_FIN) / (DUR - T_FIN));
      const fc = 350 + 3200 * apertura * apertura + 350 * Math.sin(2 * Math.PI * 0.12 * t);
      for (let ch = 0; ch < 2; ch++) { fl[ch].set("lp", fc, 0.9); fl2[ch].set("lp", fc * 1.1, 0.6); }
    }
    for (let ch = 0; ch < 2; ch++) pad[ch][i] = fl2[ch].run(fl[ch].run(pad[ch][i]));
  }
}

// ---------- Arpegiador: semicorcheas, sube y baja por dos octavas ----------
{
  const PATRON = [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1, 0, 2];
  const paso = BEAT / 4;
  const flt = new Biquad();
  for (let k = 0; k * paso < DUR - 1; k++) {
    const t0 = k * paso;
    if (t0 < T_ARP - 0.001) continue;
    const acorde = ACORDES[idxAcorde(t0)];
    const notas = [...acorde.map((m) => m + 12), ...acorde.map((m) => m + 24)];
    const nota = notas[PATRON[k % PATRON.length]];
    const f = hz(nota);
    const acento = k % 4 === 0 ? 1 : k % 2 === 0 ? 0.75 : 0.55;
    // brillo: se abre hasta la escena de clases y se cierra al final
    const brillo = t0 < T_HAT ? 0.35 + 0.65 * ((t0 - T_ARP) / (T_HAT - T_ARP)) : t0 < T_FIN ? 1 : Math.max(0.15, 1 - (t0 - T_FIN) / 3);
    const vol = t0 < T_FIN ? 1 : Math.max(0, 1 - (t0 - T_FIN) / 3.5);
    const a = Math.floor(t0 * SR), b = Math.min(N, a + Math.floor(0.32 * SR));
    let ph1 = 0, ph2 = 0.3;
    for (let i = a; i < b; i++) {
      const t = (i - a) / SR;
      const dt1 = f / SR, dt2 = (f * 1.006) / SR;
      ph1 += dt1; if (ph1 >= 1) ph1 -= 1;
      ph2 += dt2; if (ph2 >= 1) ph2 -= 1;
      const x = saw(ph1, dt1) * 0.6 + square(ph2, dt2) * 0.4;
      if ((i - a) % 16 === 0) flt.set("lp", 500 + 5200 * brillo * Math.exp(-t * 16), 5);
      const env = Math.min(1, t * 400) * Math.exp(-t * 11);
      const v = flt.run(x) * env * acento * vol * 0.11;
      arp[0][i] += v; arp[1][i] += v;
    }
  }
  // Delay ping-pong a corchea con puntillo
  const d = Math.floor(BEAT * 0.75 * SR);
  const fb = 0.42, mezcla = 0.38;
  const dl = new Float32Array(N), dr = new Float32Array(N);
  const amort = [new Biquad().set("lp", 3500, 0.7), new Biquad().set("lp", 3500, 0.7)];
  for (let i = 0; i < N; i++) {
    const inL = arp[0][i];
    const fbL = i >= d ? dr[i - d] : 0;
    const fbR = i >= d ? dl[i - d] : 0;
    dl[i] = amort[0].run(inL + fbL * fb);
    dr[i] = amort[1].run(fbR * fb);
    arp[0][i] = inL * 0.85 + dl[i] * mezcla * 0.4 + dr[i] * mezcla * 0.15;
    arp[1][i] = inL * 0.85 + dr[i] * mezcla * 1.0 + dl[i] * mezcla * 0.15;
  }
}

// ---------- Bajo: corchea a contratiempo ----------
{
  const flt = new Biquad();
  for (let b = 0; b * BEAT < T_FIN; b++) {
    const t0 = b * BEAT + BEAT / 2;
    if (t0 < T_DROP) continue;
    const f = hz(RAIZ[idxAcorde(t0)] - 12);
    const a = Math.floor(t0 * SR), e = Math.min(N, a + Math.floor(BEAT * 0.48 * SR));
    let ph = 0;
    for (let i = a; i < e; i++) {
      const t = (i - a) / SR;
      const dt = f / SR;
      ph += dt; if (ph >= 1) ph -= 1;
      if ((i - a) % 16 === 0) flt.set("lp", 180 + 900 * Math.exp(-t * 20), 1.4);
      const env = Math.min(1, t * 300) * Math.min(1, (e - i) / (SR * 0.02));
      const v = (flt.run(saw(ph, dt)) + Math.sin(2 * Math.PI * ph) * 0.6) * env * 0.2;
      bajo[0][i] += v; bajo[1][i] += v;
    }
  }
}

// ---------- Bombo ----------
const golpesBombo = [];
for (let b = 0; b * BEAT < T_FIN; b++) {
  const t0 = b * BEAT;
  if (t0 < T_DROP - 0.001) continue;
  golpesBombo.push(t0);
  const a = Math.floor(t0 * SR), e = Math.min(N, a + Math.floor(0.5 * SR));
  let fase = 0;
  for (let i = a; i < e; i++) {
    const t = (i - a) / SR;
    const f = 48 + 110 * Math.exp(-t * 32);
    fase += (2 * Math.PI * f) / SR;
    const click = t < 0.004 ? ruido() * (1 - t / 0.004) * 0.25 : 0;
    const v = (Math.tanh(Math.sin(fase) * 1.6) * Math.exp(-t * 6.5) + click) * 0.42;
    bombo[0][i] += v; bombo[1][i] += v;
  }
}

// ---------- Hats metálicos (estilo 808: seis cuadradas inarmónicas + pasa altos) ----------
{
  const FREQS = [205.3, 304.4, 369.6, 522.7, 540, 800];
  const golpe = (t0, decay, vel, pan) => {
    const a = Math.floor(t0 * SR), e = Math.min(N, a + Math.floor((5 / decay) * SR));
    const ph = FREQS.map(() => rnd());
    for (let i = a; i < e; i++) {
      const t = (i - a) / SR;
      let m = 0;
      for (let k = 0; k < 6; k++) {
        const dt = FREQS[k] / SR;
        ph[k] += dt; if (ph[k] >= 1) ph[k] -= 1;
        m += ph[k] < 0.5 ? 1 : -1;
      }
      const x = (m / 6) * 0.7 + ruido() * 0.3;
      const env = Math.min(1, t * 2000) * Math.exp(-t * decay);
      hats[0][i] += x * env * vel * (1 - pan);
      hats[1][i] += x * env * vel * (1 + pan);
    }
  };
  const paso = BEAT / 4;
  for (let k = 0; k * paso < T_FIN; k++) {
    const t0 = k * paso;
    if (t0 < T_HAT - 0.001) continue;
    const pos = k % 4;
    if (pos === 2) golpe(t0, 11, 0.55, 0.15);                   // abierto a contratiempo
    else golpe(t0 + (pos % 2 ? 0.012 : 0), 55, pos === 0 ? 0.35 : 0.22, -0.15); // cerrados con swing leve
  }
  // Pasa banda + pasa altos para dejar solo el brillo metálico
  for (let ch = 0; ch < 2; ch++) {
    const hp1 = new Biquad().set("hp", 7000, 0.7), hp2 = new Biquad().set("hp", 7000, 0.7), bp = new Biquad().set("bp", 10000, 0.8);
    for (let i = 0; i < N; i++) {
      const x = hats[ch][i];
      hats[ch][i] = hp2.run(hp1.run(x)) * 0.8 + bp.run(x) * 0.5;
    }
  }
}

// ---------- Subidas de ruido antes de cada entrada ----------
for (const [desde, hasta] of [[T_DROP - 1.8, T_DROP], [T_HAT - 1.8, T_HAT]]) {
  const a = Math.floor(desde * SR), e = Math.floor(hasta * SR);
  const f = [new Biquad(), new Biquad()];
  for (let i = a; i < e; i++) {
    const p = (i - a) / (e - a);
    if ((i - a) % 32 === 0) for (const x of f) x.set("bp", 400 + 7000 * p * p, 1.2);
    fx[0][i] += f[0].run(ruido()) * p * p * 0.22;
    fx[1][i] += f[1].run(ruido()) * p * p * 0.22;
  }
}

// ---------- Sidechain: el pad y el bajo "respiran" con el bombo ----------
const duck = new Float32Array(N).fill(1);
for (const t0 of golpesBombo) {
  const a = Math.floor(t0 * SR), e = Math.min(N, a + Math.floor(BEAT * SR));
  for (let i = a; i < e; i++) {
    const t = (i - a) / SR;
    duck[i] = Math.min(duck[i], 1 - 0.55 * Math.exp(-t * 9));
  }
}

// ---------- Reverb (Freeverb simplificado) ----------
const reverb = (inL, inR) => {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491];
  const aps = [556, 441, 341];
  const out = bus();
  for (let ch = 0; ch < 2; ch++) {
    const x = ch ? inR : inL;
    const off = ch ? 23 : 0;
    const y = new Float32Array(N);
    for (const L of combs) {
      const len = L + off, buf = new Float32Array(len);
      let idx = 0, filt = 0;
      for (let i = 0; i < N; i++) {
        const o = buf[idx];
        filt = o * 0.7 + filt * 0.3;
        buf[idx] = x[i] + filt * 0.84;
        idx = (idx + 1) % len;
        y[i] += o;
      }
    }
    for (const L of aps) {
      const len = L + off, buf = new Float32Array(len);
      let idx = 0;
      for (let i = 0; i < N; i++) {
        const b = buf[idx];
        buf[idx] = y[i] + b * 0.5;
        y[i] = b - y[i];
        idx = (idx + 1) % len;
      }
    }
    out[ch] = y;
  }
  return out;
};
const envio = bus();
for (let i = 0; i < N; i++) {
  for (let ch = 0; ch < 2; ch++) {
    envio[ch][i] = pad[ch][i] * 0.35 + arp[ch][i] * 0.45 + hats[ch][i] * 0.08 + fx[ch][i] * 0.5;
  }
}
const rev = reverb(envio[0], envio[1]);

// ---------- Mezcla ----------
const L = new Float32Array(N), R = new Float32Array(N);
let pico = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const g = Math.min(1, t / 1.5, (DUR - t) / 2.5);
  for (let ch = 0; ch < 2; ch++) {
    const v =
      pad[ch][i] * 1.0 * duck[i] +
      arp[ch][i] * 0.9 * (0.75 + 0.25 * duck[i]) +
      bajo[ch][i] * duck[i] * 1.0 +
      bombo[ch][i] +
      hats[ch][i] * 0.55 +
      fx[ch][i] +
      rev[ch][i] * 0.05;
    const s = Math.tanh(v * 1.1) * g;
    (ch ? R : L)[i] = s;
    pico = Math.max(pico, Math.abs(s));
  }
}
const k = 0.89 / pico;

const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8);
buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * k)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * k)) * 32767), 46 + i * 4);
}
writeFileSync("out/musica.wav", buf);
console.log("ok, pico", pico.toFixed(3));

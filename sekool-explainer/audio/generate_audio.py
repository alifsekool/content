#!/usr/bin/env python3
"""Procedurally generates the SEKOOL explainer soundtrack: music bed + sound effects.

    python3 audio/generate_audio.py build/cues.json build/soundtrack.wav

cues.json is exported by the page (src/main.js) at render time, so every sound
effect lands exactly on the frame that triggers it. Everything here is synthesised
from scratch (no samples), so the audio is royalty-free by construction.

Music: 120 BPM. A tense D-minor intro under the "struggling" hook, a riser into the
brand reveal (drop at 14 s), then a bright F-major groove (F-C-Dm-Bb) to the end.
"""
import json
import sys
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
RNG = np.random.default_rng(7)


# --------------------------------------------------------------------------- helpers
def T(d):
    return np.arange(int(d * SR)) / SR


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def noise(d):
    return RNG.uniform(-1, 1, int(d * SR))


def filt(x, kind, f, order=2):
    sos = butter(order, f, btype=kind, fs=SR, output='sos')
    return sosfilt(sos, x)


def fade(x, a=0.002, r=0.01):
    n = len(x)
    ea, er = min(int(a * SR), n), min(int(r * SR), n)
    if ea:
        x[:ea] *= np.linspace(0, 1, ea)
    if er:
        x[-er:] *= np.linspace(1, 0, er)
    return x


class Bus:
    def __init__(self, dur):
        self.n = int(dur * SR) + SR * 3
        self.L = np.zeros(self.n)
        self.R = np.zeros(self.n)

    def add(self, t, sig, gain=1.0, pan=0.0):
        """Mono or (L, R) signal at time t (s). pan -1..1 (equal power)."""
        i = int(round(t * SR))
        if i >= self.n:
            return
        if isinstance(sig, tuple):
            l, r = sig
        else:
            a = (pan + 1) * np.pi / 4
            l, r = sig * np.cos(a) * np.sqrt(2), sig * np.sin(a) * np.sqrt(2)
        m = min(len(l), self.n - i)
        self.L[i:i + m] += l[:m] * gain
        self.R[i:i + m] += r[:m] * gain


# --------------------------------------------------------------------------- instruments
def kick(g=1.0):
    t = T(0.42)
    f = 46 + 115 * np.exp(-t * 32)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
    y += filt(noise(0.42), 'highpass', 1500) * np.exp(-t * 260) * 0.35
    return fade(y * g)


def clap(g=1.0):
    t = T(0.3)
    env = np.zeros_like(t)
    for o in (0.0, 0.011, 0.023):
        env += (t >= o) * np.exp(-np.clip(t - o, 0, None) * 160)
    env += (t >= 0.023) * np.exp(-np.clip(t - 0.023, 0, None) * 16) * 0.55
    y = filt(noise(0.3), 'bandpass', [900, 3200]) * env
    return fade(y * g * 1.3)


def snare(g=1.0):
    t = T(0.18)
    y = filt(noise(0.18), 'bandpass', [1200, 7000]) * np.exp(-t * 28) * 0.8
    y += np.sin(2 * np.pi * 185 * t) * np.exp(-t * 30) * 0.6
    return fade(y * g)


def hat(g=1.0, open_=False):
    d = 0.3 if open_ else 0.06
    t = T(d)
    y = filt(noise(d), 'highpass', 7500, 4) * np.exp(-t * (11 if open_ else 75))
    return fade(y * g * 0.8)


def bass(f, d, g=1.0):
    t = T(d)
    y = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    y = np.tanh(1.6 * y) / np.tanh(1.6)
    env = 0.6 + 0.4 * np.exp(-t * 9)
    return fade(y * env * g, 0.004, 0.03)


def saw(f, t):
    return 2 * ((f * t) % 1.0) - 1


def pad(notes, d, g=1.0, cutoff=1500):
    t = T(d + 0.8)
    L = np.zeros_like(t)
    R = np.zeros_like(t)
    for m in notes:
        f = midi(m)
        L += saw(f * 2 ** (-9 / 1200), t + 0.13) + 0.6 * saw(f, t)
        R += saw(f * 2 ** (9 / 1200), t + 0.31) + 0.6 * saw(f, t)
    env = np.minimum(1, t / 0.35) * np.where(t > d, np.exp(-(t - d) * 6), 1.0)
    L = filt(L, 'lowpass', cutoff, 4) * env
    R = filt(R, 'lowpass', cutoff, 4) * env
    k = g * 0.11 / max(1, len(notes))
    return fade(L * k), fade(R * k)


def pluck(f, d=0.7, g=1.0, bright=0.996):
    n = int(d * SR)
    p = max(2, int(SR / f))
    y = np.zeros(n + p + 1)
    y[:p + 1] = RNG.uniform(-1, 1, p + 1)
    s = p + 1
    while s < len(y):
        e = min(s + p, len(y))
        y[s:e] = bright * 0.5 * (y[s - p:e - p] + y[s - p - 1:e - p - 1])
        s = e
    y = filt(y[:n], 'lowpass', 4200)
    return fade(y * g * 0.55, 0.001, 0.05)


def mallet(f, d=1.0, g=1.0):
    t = T(d)
    y = (np.sin(2 * np.pi * f * t) * np.exp(-t * 4.5)
         + 0.45 * np.sin(2 * np.pi * 4.0 * f * t) * np.exp(-t * 15)
         + 0.15 * np.sin(2 * np.pi * 9.8 * f * t) * np.exp(-t * 40))
    return fade(y * g * 0.5, 0.002, 0.05)


def bell(f, d=1.2, g=1.0, decay=1.0):
    t = T(d)
    y = np.zeros_like(t)
    for r, a, k in ((1, 1, 3), (2.0, 0.35, 5), (2.76, 0.3, 7), (5.4, 0.14, 12), (8.93, 0.06, 18)):
        y += a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * k * decay)
    return fade(y * g * 0.35, 0.001, 0.05)


# --------------------------------------------------------------------------- sound effects
def sweep_noise(d, f0, f1, q_hp=150):
    """Noise through a one-pole low-pass whose cutoff glides f0 -> f1 -> f0*0.6."""
    x = noise(d)
    n = len(x)
    ph = np.linspace(0, 1, n)
    fc = np.where(ph < 0.6, f0 + (f1 - f0) * (ph / 0.6) ** 1.5, f1 + (f0 * 0.6 - f1) * ((ph - 0.6) / 0.4))
    a = 1 - np.exp(-2 * np.pi * fc / SR)
    y = np.empty(n)
    s = 0.0
    for i in range(n):
        s += a[i] * (x[i] - s)
        y[i] = s
    return filt(y, 'highpass', q_hp)


def whoosh(d=0.55, f0=300, f1=4200, g=1.0):
    y = sweep_noise(d, f0, f1)
    ph = np.linspace(0, 1, len(y))
    env = np.sin(np.pi * np.clip(ph / 0.62, 0, 1) * 0.5) ** 2 * np.where(ph > 0.62, np.cos((ph - 0.62) / 0.38 * np.pi / 2) ** 2, 1)
    y = y * env * g * 1.6
    pan = np.linspace(-0.7, 0.7, len(y))
    a = (pan + 1) * np.pi / 4
    return fade(y * np.cos(a) * 1.4), fade(y * np.sin(a) * 1.4)


def SFX_whoosh(): return whoosh(0.55, 350, 4200, 0.9)
def SFX_swipe(): return whoosh(0.32, 900, 6500, 0.7)


def SFX_whooshBig():
    l, r = whoosh(1.0, 200, 3600, 1.1)
    t = T(1.4)
    boom = np.sin(2 * np.pi * np.cumsum(38 + 40 * np.exp(-t * 6)) / SR) * np.exp(-t * 3.5) * (t > 0) * 0.9
    boom = np.roll(np.pad(boom, (0, 0)), 0)
    out_l = np.zeros(len(t)); out_r = np.zeros(len(t))
    out_l[:len(l)] += l; out_r[:len(r)] += r
    i = int(0.85 * SR)
    out_l[i:] += boom[:len(t) - i]; out_r[i:] += boom[:len(t) - i]
    return out_l, out_r


def SFX_pop():
    t = T(0.12)
    f = 350 + 800 * np.exp(-t * 55)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 38)
    return fade(y * 0.8)


def SFX_tick():
    t = T(0.08)
    y = np.sin(2 * np.pi * 2100 * t) * np.exp(-t * 110) + 0.5 * np.sin(2 * np.pi * 1180 * t) * np.exp(-t * 70)
    return fade(y * 0.55)


def SFX_wrong():
    out = np.zeros(int(0.42 * SR))
    for o, f, d in ((0.0, 330, 0.13), (0.13, 247, 0.26)):
        t = T(d)
        y = sum(np.sin(2 * np.pi * f * k * t) / k for k in (1, 3, 5, 7))
        y = filt(y, 'lowpass', 1600) * np.exp(-t * 7) * np.minimum(1, t / 0.005)
        i = int(o * SR)
        out[i:i + len(y)] += fade(y)
    return out * 0.45


def SFX_thud():
    t = T(0.35)
    y = np.sin(2 * np.pi * np.cumsum(45 + 70 * np.exp(-t * 40)) / SR) * np.exp(-t * 12)
    y += filt(noise(0.35), 'lowpass', 900) * np.exp(-t * 30) * 0.8
    y += filt(noise(0.35), 'highpass', 3000) * np.exp(-t * 200) * 0.3
    return fade(y * 0.95)


def SFX_ding(): return bell(midi(84), 1.3, 1.0)
def SFX_ping(): return bell(midi(88), 0.9, 0.8, 1.4)


def SFX_bubble():
    out = np.zeros(int(0.2 * SR))
    for o, f0 in ((0, 500), (0.06, 800)):
        t = T(0.1)
        f = f0 + 700 * (1 - np.exp(-t * 60))
        y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45)
        i = int(o * SR)
        out[i:i + len(y)] += fade(y)
    return out * 0.6


def SFX_scribble(d=0.8):
    d = max(0.3, d)
    t = T(d)
    am = (0.5 + 0.5 * np.sin(2 * np.pi * 9 * t + 3 * np.sin(2 * np.pi * 2.3 * t))) ** 2
    y = filt(noise(d), 'bandpass', [2500, 7000]) * am
    return fade(y * 0.22, 0.03, 0.05)


def SFX_flip():
    t = T(0.22)
    env = np.exp(-t * 45) + (t > 0.045) * np.exp(-np.clip(t - 0.045, 0, None) * 30) * 0.8
    y = filt(noise(0.22), 'bandpass', [1400, 6500]) * env
    y += np.sin(2 * np.pi * 110 * t) * np.exp(-t * 25) * 0.25
    return fade(y * 0.7)


def SFX_notif():
    out = np.zeros(int(1.2 * SR))
    for o, m in ((0.0, 79), (0.13, 84)):
        y = mallet(midi(m), 1.0, 1.2)
        i = int(o * SR)
        out[i:i + len(y)] += y
    return out


def SFX_click():
    t = T(0.04)
    y = filt(noise(0.04), 'highpass', 2500) * np.exp(-t * 350) + np.sin(2 * np.pi * 3200 * t) * np.exp(-t * 300) * 0.5
    return fade(y * 0.8)


def SFX_rise():
    t = T(1.3)
    f = 280 * (4.2 ** (t / 1.3))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 14 * t))
    env = np.minimum(1, t / 0.9) * np.where(t > 1.1, np.exp(-(t - 1.1) * 25), 1)
    y = y * env * 0.18 + filt(noise(1.3), 'highpass', 6000) * env * 0.08
    return fade(y)


def arp_bells(notes, gap, d=0.9, g=1.0, decay=1.6):
    out = np.zeros(int((gap * len(notes) + d) * SR))
    for k, m in enumerate(notes):
        y = bell(midi(m), d, g * (0.8 + 0.2 * k / len(notes)), decay)
        i = int(k * gap * SR)
        out[i:i + len(y)] += y
    return out


def SFX_sparkle():
    y = arp_bells([84, 88, 91, 96, 100, 103], 0.045, 0.8, 0.8, 2.0)
    t = T(len(y) / SR)
    y += filt(noise(len(y) / SR), 'highpass', 8000) * np.exp(-t * 5) * 0.06
    return y


def SFX_shimmer():
    y = arp_bells([77, 81, 84, 89, 93, 96], 0.07, 1.2, 0.8, 1.2)
    t = T(len(y) / SR)
    sw = filt(noise(len(y) / SR), 'highpass', 6000) * np.minimum(1, t / 0.4) * np.exp(-t * 2.5) * 0.08
    return y + sw


def SFX_success():
    out = np.zeros(int(1.6 * SR))
    for k, m in enumerate((77, 81, 84, 89)):
        y = mallet(midi(m), 1.2, 1.2)
        i = int(k * 0.085 * SR)
        out[i:i + len(y)] += y
    return out


def SFX_impact():
    t = T(1.6)
    y = np.zeros_like(t)
    k = kick(1.2); y[:len(k)] += k
    c = clap(0.8); y[:len(c)] += c
    y += filt(noise(1.6), 'highpass', 4500) * np.exp(-t * 2.8) * 0.28
    y += np.sin(2 * np.pi * 44 * t) * np.exp(-t * 3) * 0.5
    return fade(y)


SFX = {n[4:]: f for n, f in globals().items() if n.startswith('SFX_')}


# --------------------------------------------------------------------------- music
MINOR = [  # (bass midi, pad notes, arp notes)
    (38, [50, 53, 57, 62], [62, 65, 69, 74]),   # Dm
    (34, [50, 53, 58, 62], [62, 65, 70, 74]),   # Bb
    (43, [50, 55, 58, 62], [62, 67, 70, 74]),   # Gm
    (45, [49, 52, 57, 61], [61, 64, 69, 73]),   # A
]
MAJOR = [
    (41, [53, 57, 60, 65], [65, 69, 72, 77]),   # F
    (36, [52, 55, 60, 64], [64, 67, 72, 76]),   # C
    (38, [53, 57, 62, 65], [62, 65, 69, 74]),   # Dm
    (34, [53, 58, 62, 65], [62, 65, 70, 74]),   # Bb
]
MELODY = [  # per bar: (eighth, midi, length in eighths)
    [(0, 69, 2), (2, 72, 2), (4, 77, 1), (5, 76, 1), (6, 72, 2)],
    [(0, 67, 2), (2, 72, 2), (4, 76, 1), (5, 74, 1), (6, 72, 2)],
    [(0, 65, 2), (2, 69, 2), (4, 74, 1), (5, 72, 1), (6, 69, 2)],
    [(0, 70, 2), (2, 74, 2), (4, 77, 2), (6, 76, 2)],
]
ARP = [0, 1, 2, 3, 1, 2, 3, 2]


def music(dur, drop, end, bpm=120):
    beat = 60 / bpm
    bar = beat * 4
    e8 = beat / 2
    drums, inst, verb, padL, padR = Bus(dur), Bus(dur), Bus(dur), Bus(dur), Bus(dur)
    kicks = []

    # ---- intro: tense minor, clock ticking, building to the drop
    n_intro = int(round(drop / bar))
    for b in range(n_intro):
        t0 = b * bar
        chord = MINOR[[0, 1, 2, 3, 0, 1, 3][b % 7]]
        l, r = pad(chord[1], bar, 0.8 + 0.1 * b, 900 + 150 * b)
        padL.add(t0, l); padR.add(t0, r)
        if b < 4:
            for k in range(4):
                inst.add(t0 + k * beat, SFX_tick(), 0.28 if k % 2 == 0 else 0.2, pan=0.3 if k % 2 else -0.3)
        if b >= 2:
            for k in (0, 2):
                inst.add(t0 + k * beat, bass(midi(chord[0]), beat * 1.8), 0.55)
        if b >= 3 and b < n_intro - 1:
            for k in (0, 2):
                drums.add(t0 + k * beat, kick(0.7)); kicks.append(t0 + k * beat)
            for k in range(8):
                drums.add(t0 + k * e8, hat(0.12 + 0.1 * (k % 2)), pan=0.25)
        if b >= 3:
            for k in range(8):
                m = chord[2][ARP[k]]
                inst.add(t0 + k * e8, pluck(midi(m), 0.5, 0.35 + 0.05 * (b - 3)), pan=-0.3)
                verb.add(t0 + k * e8, pluck(midi(m), 0.5, 0.2))
    # riser + snare roll in the last intro bar
    t0 = (n_intro - 1) * bar
    for k in range(16):
        tt = t0 + k * (bar / 16)
        if tt < drop - e8:
            drums.add(tt, snare(0.25 + 0.5 * k / 16), pan=0.1)
    t = T(bar)
    riser = filt(noise(bar), 'bandpass', [800, 6000]) * (t / bar) ** 2 * 0.25
    riser += np.sin(2 * np.pi * np.cumsum(200 * 4 ** (t / bar)) / SR) * (t / bar) ** 2 * 0.12
    inst.add(t0, fade(riser[: int((bar - e8) * SR)], 0.01, 0.02))

    # ---- main groove (F - C - Dm - Bb)
    n_main = int(round((end - drop) / bar))
    lead_on = lambda tt: (drop <= tt < drop + 4 * bar) or (tt >= 64.0)
    for b in range(n_main):
        t0 = drop + b * bar
        ci = b % 4
        root, pad_notes, arp = MAJOR[ci]
        l, r = pad(pad_notes, bar, 0.75)
        padL.add(t0, l); padR.add(t0, r)
        for pos in (0, 1.5, 2):  # kick: 1, 2&, 3
            drums.add(t0 + pos * beat, kick(0.85 if pos != 1.5 else 0.6)); kicks.append(t0 + pos * beat)
        for pos in (1, 3):
            drums.add(t0 + pos * beat, clap(0.55), pan=-0.05)
        for k in range(8):
            drums.add(t0 + k * e8, hat(0.16 if k % 2 == 0 else 0.3), pan=0.28)
        if b % 2 == 1:
            drums.add(t0 + 3.5 * beat, hat(0.18, open_=True), pan=0.28)
        pattern = [0, 0, 12, 0, 0, 7, 12, 0]
        for k in range(8):
            if k in (3, 6) and b % 2 == 0:
                continue
            inst.add(t0 + k * e8, bass(midi(root + pattern[k]), e8 * 0.9), 0.48)
        for k in range(8):
            m = arp[ARP[k]]
            v = 0.42 if k % 2 == 0 else 0.3
            inst.add(t0 + k * e8, pluck(midi(m), 0.55, v), pan=-0.35)
            verb.add(t0 + k * e8, pluck(midi(m), 0.55, v * 0.5))
        if lead_on(t0):
            for (e, m, ln) in MELODY[ci]:
                y = mallet(midi(m + 12), 0.4 + ln * e8, 0.5)
                inst.add(t0 + e * e8, y, pan=0.15)
                verb.add(t0 + e * e8, y, 0.8)

    # ---- ending: final F chord hit that rings out
    drums.add(end, SFX_impact(), 0.9)
    l, r = pad([53, 57, 60, 65, 69], 1.2, 1.0, 2200)
    padL.add(end, l); padR.add(end, r)
    inst.add(end, bass(midi(41), 1.6), 0.7)
    for k, m in enumerate((77, 81, 84, 89)):
        y = mallet(midi(m), 2.2, 0.55)
        inst.add(end + k * 0.06, y); verb.add(end + k * 0.06, y, 1.2)

    # sidechain duck on pad + bass-ish energy
    n = padL.n
    idx = np.full(n, -10 * SR, dtype=np.int64)
    for k in kicks:
        i = int(k * SR)
        if i < n:
            idx[i] = i
    last = np.maximum.accumulate(idx)
    since = (np.arange(n) - last) / SR
    duck = 1 - 0.55 * np.exp(-since * 9)
    L = drums.L + inst.L + padL.L * duck
    R = drums.R + inst.R + padR.R * duck
    return L, R, verb


def reverb_ir(d=1.8, rt=1.4):
    t = T(d)
    env = np.exp(-6.9 * t / rt)
    l = filt(noise(d), 'lowpass', 5000) * env
    r = filt(noise(d), 'lowpass', 5000) * env
    pre = int(0.012 * SR)
    l = np.concatenate([np.zeros(pre), l]); r = np.concatenate([np.zeros(pre), r])
    return l / np.sqrt(np.sum(l ** 2)), r / np.sqrt(np.sum(r ** 2))


# --------------------------------------------------------------------------- main
def main(cue_path, out_path):
    cfg = json.load(open(cue_path))
    dur = cfg['duration']
    mus = cfg.get('music', {})
    drop, end = mus.get('drop', 14.0), mus.get('end', dur - 2)

    mL, mR, verb = music(dur, drop, end, mus.get('bpm', 120))

    fx = Bus(dur)
    bell_like = {'ding', 'ping', 'sparkle', 'shimmer', 'success', 'notif'}
    for c in cfg['cues']:
        name = c['name']
        if name not in SFX:
            print('unknown sfx', name, file=sys.stderr)
            continue
        g = c.get('gain', 1.0)
        if name == 'scribble':
            sig, g = SFX_scribble(g), 1.0
        else:
            sig = SFX[name]()
        fx.add(c['t'], sig, g)
        if name in bell_like:
            verb.add(c['t'], sig if not isinstance(sig, tuple) else sig[0], g * 0.6)

    irl, irr = reverb_ir()
    wet_src = (verb.L + verb.R) * 0.5
    wetL = fftconvolve(wet_src, irl)[: fx.n]
    wetR = fftconvolve(wet_src, irr)[: fx.n]

    n = int((dur + 0.05) * SR)
    L = (mL * 0.5 + fx.L * 0.9 + wetL * 0.22)[:n]
    R = (mR * 0.5 + fx.R * 0.9 + wetR * 0.22)[:n]
    # gentle high-pass on the master and a final fade
    L = filt(L, 'highpass', 30); R = filt(R, 'highpass', 30)
    fo = int(1.0 * SR)
    L[-fo:] *= np.linspace(1, 0, fo) ** 2; R[-fo:] *= np.linspace(1, 0, fo) ** 2
    peak = max(np.abs(L).max(), np.abs(R).max())
    L = np.tanh(L / peak * 1.2) / np.tanh(1.2) * 0.89
    R = np.tanh(R / peak * 1.2) / np.tanh(1.2) * 0.89

    data = (np.stack([L, R], 1) * 32767).astype('<i2')
    with wave.open(out_path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(f'soundtrack: {out_path} ({dur:.1f}s, {len(cfg["cues"])} sfx cues)')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])

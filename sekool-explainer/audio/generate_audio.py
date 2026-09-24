#!/usr/bin/env python3
"""Procedurally generates the SEKOOL explainer soundtrack: music bed + sound effects.

    python3 audio/generate_audio.py build/cues.json build/soundtrack.wav

cues.json is exported by the page (src/main.js) at render time, so every sound
effect lands exactly on the frame that triggers it. Everything here is synthesised
from scratch (no samples), so the audio is royalty-free by construction.

Music: 120 BPM, premium and understated. A dark Dm9 swell with a sub heartbeat under
the hook, a riser into the brand reveal (drop at 6 s), then a warm electric-piano
house groove (Fmaj7 - Am7 - Dm9 - Bbmaj7) with deep sub bass, a short breakdown for
the call to action, and an Fmaj9 ring-out. Sound effects are cinematic (sub booms,
air whooshes, soft glass tones) rather than cartoon pops.
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


def ep(f, d, g=1.0):
    """FM electric piano (Rhodes-like): bell-ish attack that mellows out."""
    t = T(d + 0.35)
    idx = 1.6 * np.exp(-t * 5)
    y = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t))
    y += 0.08 * np.sin(2 * np.pi * f * 14 * t) * np.exp(-t * 35)
    env = np.exp(-t * 1.6) * np.minimum(1, t / 0.003) * np.where(t > d, np.exp(-(t - d) * 14), 1)
    return fade(y * env * g * 0.3, 0.002, 0.03)


def sub(f, d, g=1.0):
    t = T(d)
    y = np.sin(2 * np.pi * f * t) + 0.18 * np.sin(4 * np.pi * f * t)
    env = np.minimum(1, t / 0.006) * (0.75 + 0.25 * np.exp(-t * 6))
    return fade(y * env * g * 0.8, 0.004, 0.04)


def deep_kick(g=1.0):
    t = T(0.5)
    f = 42 + 80 * np.exp(-t * 28)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.5)
    y += filt(noise(0.5), 'bandpass', [1500, 5000]) * np.exp(-t * 400) * 0.12
    return fade(y * g)


def snap(g=1.0):
    t = T(0.25)
    env = np.exp(-t * 55) + (t > 0.008) * np.exp(-np.clip(t - 0.008, 0, None) * 35) * 0.6
    y = filt(noise(0.25), 'bandpass', [1400, 6000]) * env
    return fade(y * g * 0.9)


def shaker(g=1.0):
    t = T(0.07)
    y = filt(noise(0.07), 'bandpass', [5000, 11000]) * np.minimum(1, t / 0.008) * np.exp(-t * 60)
    return fade(y * g)


def soft_pluck(f, d=0.5, g=1.0):
    t = T(d)
    y = (np.sin(2 * np.pi * f * t) + 0.2 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 7) * np.minimum(1, t / 0.004)
    return fade(y * g * 0.4)


# --------------------------------------------------------------------------- sound effects (cinematic, restrained)
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


def air(d, f0, f1, g):
    y = sweep_noise(d, f0, f1)
    ph = np.linspace(0, 1, len(y))
    env = np.sin(np.pi * np.clip(ph / 0.6, 0, 1) * 0.5) ** 2 * np.where(ph > 0.6, np.cos((ph - 0.6) / 0.4 * np.pi / 2) ** 2, 1)
    y = y * env * g
    pan = np.linspace(-0.6, 0.6, len(y))
    a = (pan + 1) * np.pi / 4
    return fade(y * np.cos(a) * 1.4), fade(y * np.sin(a) * 1.4)


def SFX_whoosh(): return air(0.75, 250, 2400, 1.0)
def SFX_swish(): return air(0.4, 600, 3600, 0.8)


def SFX_boom():
    t = T(1.6)
    y = np.sin(2 * np.pi * np.cumsum(38 + 26 * np.exp(-t * 7)) / SR) * np.exp(-t * 2.4) * np.minimum(1, t / 0.008)
    y += filt(noise(1.6), 'lowpass', 280) * np.exp(-t * 16) * 0.5
    y += filt(noise(1.6), 'highpass', 4000) * np.exp(-t * 7) * 0.04
    return fade(y * 0.9)


def SFX_hit():
    t = T(3.0)
    y = np.sin(2 * np.pi * np.cumsum(34 + 40 * np.exp(-t * 9)) / SR) * np.exp(-t * 1.6) * np.minimum(1, t / 0.006)
    y += filt(noise(3.0), 'lowpass', 350) * np.exp(-t * 12) * 0.6
    l = y + filt(noise(3.0), 'highpass', 3500) * np.exp(-t * 2.6) * 0.16
    r = y + filt(noise(3.0), 'highpass', 3500) * np.exp(-t * 2.6) * 0.16
    return fade(l), fade(r)


def SFX_riser():
    d = 4.4
    t = T(d)
    x = sweep_noise(d, 200, 7000)
    ramp = (t / d) ** 2.2
    y = x * ramp * 0.5
    y += np.sin(2 * np.pi * np.cumsum(110 * 8 ** (t / d)) / SR) * (t / d) ** 3 * 0.08
    y *= 1 + 0.25 * np.sin(2 * np.pi * (2 + 14 * t / d) * t)
    return fade(y, 0.2, 0.015)


def glass(freqs, d=1.4, g=1.0):
    t = T(d)
    y = sum(np.sin(2 * np.pi * f * t) * a for f, a in freqs)
    return fade(y * np.minimum(1, t / 0.01) * np.exp(-t * 3) * g * 0.22, 0.01, 0.05)


def SFX_glint(): return glass([(1568, 1), (2349, 0.5), (3136, 0.2)], 1.4)


def SFX_shimmer():
    t = T(2.2)
    y = filt(noise(2.2), 'highpass', 6000) * np.minimum(1, t / 0.35) * np.exp(-t * 2.2) * 0.12
    for f in (1397, 1760, 2093):
        y += np.sin(2 * np.pi * f * t) * np.minimum(1, t / 0.25) * np.exp(-t * 2) * 0.05 * (1 + 0.3 * np.sin(2 * np.pi * 5 * t))
    return fade(y)


def SFX_tick():
    t = T(0.05)
    y = np.sin(2 * np.pi * 1500 * t) * np.exp(-t * 130) + filt(noise(0.05), 'highpass', 4000) * np.exp(-t * 500) * 0.3
    return fade(y * 0.4)


def SFX_click():
    t = T(0.05)
    y = filt(noise(0.05), 'highpass', 2000) * np.exp(-t * 600) * 0.6 + np.sin(2 * np.pi * 900 * t) * np.exp(-t * 200) * 0.5
    return fade(y * 0.5)


def SFX_notif():
    out = np.zeros(int(1.6 * SR))
    for o, f in ((0.0, 1318.5), (0.14, 1760.0)):
        y = glass([(f, 1), (f * 2, 0.15)], 1.3, 1.1)
        i = int(o * SR)
        out[i:i + len(y)] += y
    return out


SFX = {n[4:]: f for n, f in globals().items() if n.startswith('SFX_')}


# --------------------------------------------------------------------------- music
# 120 BPM. Warm electric-piano house groove: Fmaj7 - Am7 - Dm9 - Bbmaj7.
PROG = [
    (41, [57, 60, 64, 65]),   # Fmaj7
    (45, [55, 57, 60, 64]),   # Am7
    (38, [53, 57, 60, 64]),   # Dm9 (over D)
    (34, [53, 57, 58, 62]),   # Bbmaj7
]
INTRO_PAD = [50, 53, 57, 60, 64]  # Dm9


def echo(bus_add, t, y, g, pan, taps=((0.375, 0.35), (0.75, 0.15))):
    bus_add(t, y, g, pan)
    for k, (dt, a) in enumerate(taps):
        bus_add(t + dt, y, g * a, -pan if k % 2 == 0 else pan)


def music(dur, drop, end, bpm=120, breakdown=(34.0, 36.0), arps_from=30.0):
    beat = 60 / bpm
    bar = beat * 4
    e8, e16 = beat / 2, beat / 4
    drums, inst, verb, padL, padR = Bus(dur), Bus(dur), Bus(dur), Bus(dur), Bus(dur)
    kicks = []

    # ---- intro: dark Dm9 swell with a sub heartbeat
    n_intro = int(round(drop / bar))
    for b in range(n_intro):
        t0 = b * bar
        l, r = pad(INTRO_PAD, bar, 0.7 + 0.2 * b, 500 + 350 * b)
        padL.add(t0, l); padR.add(t0, r)
        for k in range(4):
            tt = t0 + k * beat
            if tt < drop - 0.3:
                inst.add(tt, sub(midi(38), 0.3), 0.25 + 0.08 * b)
        if b >= 2:
            for k in range(16):
                tt = t0 + k * e16
                if tt < drop - 0.3:
                    drums.add(tt, shaker(0.05 + 0.03 * (k % 2)), pan=0.35)

    # ---- main groove
    n_main = int(round((end - drop) / bar))
    for b in range(n_main):
        t0 = drop + b * bar
        root, chord = PROG[b % 4]
        in_break = breakdown[0] <= t0 < breakdown[1]
        arps = t0 >= arps_from
        l, r = pad(chord, bar, 0.55 if not in_break else 0.8, 1300)
        padL.add(t0, l); padR.add(t0, r)
        # electric piano comping: 1 (long), 2& (short), 3& (medium)
        comp = [(0, 1.4, 1.0), (3, 0.35, 0.7), (5, 0.8, 0.85)] if not in_break else [(0, 1.9, 1.0)]
        for e, ln, v in comp:
            for m in chord:
                y = ep(midi(m), ln, v * 0.85)
                inst.add(t0 + e * e8, y, pan=-0.12)
                verb.add(t0 + e * e8, y, 0.35)
        if arps:
            tones = [m + 12 for m in chord]
            order = [0, 1, 2, 3, 2, 1, 2, 3]
            for k in range(8):
                y = soft_pluck(midi(tones[order[k]]), 0.45, 0.5)
                echo(inst.add, t0 + k * e8, y, 0.55, 0.3)
                verb.add(t0 + k * e8, y, 0.4)
        if in_break:
            continue
        for k in range(4):
            drums.add(t0 + k * beat, deep_kick(0.7)); kicks.append(t0 + k * beat)
        for k in (1, 3):
            drums.add(t0 + k * beat, snap(0.3), pan=-0.05)
            verb.add(t0 + k * beat, snap(0.3), 0.5)
        for k in range(16):
            v = 0.11 if k % 4 == 2 else (0.07 if k % 2 else 0.04)
            drums.add(t0 + k * e16, shaker(v), pan=0.3)
        for e, semi, ln in ((0, 0, 2.6), (3, 0, 0.8), (4, 0, 1.6), (6, 7, 0.8), (7, 12, 0.8)):
            inst.add(t0 + e * e8, sub(midi(root + semi), ln * e8), 0.36)

    # ---- ending: Fmaj9 ring-out
    l, r = pad([53, 57, 60, 64, 67], 1.5, 1.0, 2000)
    padL.add(end, l); padR.add(end, r)
    for m in (57, 60, 64, 67, 72):
        y = ep(midi(m), 2.5, 0.6)
        inst.add(end, y); verb.add(end, y, 0.8)
    inst.add(end, sub(midi(41), 2.4), 0.6)

    n = padL.n
    idx = np.full(n, -10 * SR, dtype=np.int64)
    for k in kicks:
        i = int(k * SR)
        if i < n:
            idx[i] = i
    last = np.maximum.accumulate(idx)
    since = (np.arange(n) - last) / SR
    duck = 1 - 0.5 * np.exp(-since * 8)
    L = drums.L + inst.L + padL.L * duck
    R = drums.R + inst.R + padR.R * duck
    return L, R, verb


def reverb_ir(d=2.4, rt=2.0):
    t = T(d)
    env = np.exp(-6.9 * t / rt)
    l = filt(noise(d), 'lowpass', 4500) * env
    r = filt(noise(d), 'lowpass', 4500) * env
    pre = int(0.02 * SR)
    l = np.concatenate([np.zeros(pre), l]); r = np.concatenate([np.zeros(pre), r])
    return l / np.sqrt(np.sum(l ** 2)), r / np.sqrt(np.sum(r ** 2))


# --------------------------------------------------------------------------- main
def main(cue_path, out_path):
    cfg = json.load(open(cue_path))
    dur = cfg['duration']
    mus = cfg.get('music', {})
    drop, end = mus.get('drop', 14.0), mus.get('end', dur - 2)

    mL, mR, verb = music(dur, drop, end, mus.get('bpm', 120), tuple(mus.get('breakdown', (34.0, 36.0))), mus.get('arps', 30.0))

    fx = Bus(dur)
    bell_like = {'glint', 'shimmer', 'notif', 'hit', 'boom'}
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
    L = (mL * 0.55 + fx.L * 0.8 + wetL * 0.25)[:n]
    R = (mR * 0.55 + fx.R * 0.8 + wetR * 0.25)[:n]
    # gentle high-pass on the master and a final fade
    L = filt(L, 'highpass', 30); R = filt(R, 'highpass', 30)
    fo = int(1.5 * SR)
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

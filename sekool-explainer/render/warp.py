#!/usr/bin/env python3
"""Applies the virtual camera to captured frames and encodes them.

    python3 render/warp.py <out.mp4> <fps> <ffmpeg> [width height]

stdin carries one record per frame: little-endian float32 scale, float32 x, float32 y,
uint32 length, then `length` bytes of JPEG. Each frame is scaled about the centre with
sub-pixel bicubic interpolation (so slow push-ins are perfectly smooth, with none of the
pixel snapping the browser does) and piped as raw BGR into ffmpeg / libx264.
"""
import struct
import subprocess
import sys

import cv2
import numpy as np

out, fps, ffmpeg = sys.argv[1], sys.argv[2], sys.argv[3]
W, H = (int(sys.argv[4]), int(sys.argv[5])) if len(sys.argv) > 5 else (1920, 1080)
enc = subprocess.Popen(
    [ffmpeg, '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', fps, '-i', '-',
     '-c:v', 'libx264', '-preset', 'medium', '-tune', 'animation', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', fps, out],
    stdin=subprocess.PIPE)

src = sys.stdin.buffer
while True:
    head = src.read(16)
    if len(head) < 16:
        break
    scale, tx, ty, n = struct.unpack('<fffI', head)
    img = cv2.imdecode(np.frombuffer(src.read(n), np.uint8), cv2.IMREAD_COLOR)
    h, w = img.shape[:2]
    if (w, h) != (W, H):
        img = cv2.resize(img, (W, H), interpolation=cv2.INTER_AREA)
    if abs(scale - 1) > 1e-6 or tx or ty:
        cx, cy = W / 2, H / 2
        m = np.array([[scale, 0, (1 - scale) * cx + tx], [0, scale, (1 - scale) * cy + ty]], np.float64)
        img = cv2.warpAffine(img, m, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    enc.stdin.write(img.tobytes())

enc.stdin.close()
sys.exit(enc.wait())

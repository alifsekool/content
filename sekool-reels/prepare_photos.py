#!/usr/bin/env python3
"""Prepares the customer photos used by the ads.

    python3 prepare_photos.py /path/to/originals

The originals (1.webp ... 7.webp) are real photos of children, so they and every
file made from them stay out of git (see the root .gitignore). This script:

  - blurs identifying text: school names and crests on the results slip (1),
    the child's full name, school name and crest on the plaque (4), and the
    school name and crests on the stage, trophy and uniform (6)
  - saves every photo as photos/N.jpg, plus close-ups used as inserts (photos/1-slip.jpg)
  - saves a heavily blurred, darkened copy (photos/N-bg.jpg) for the landscape
    photos, used as the 9:16 background behind the photo card
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

OUT = Path(__file__).resolve().parent / 'photos'

# (left, top, right, bottom) in original pixels; found by inspecting crops of each photo
REDACT = {
    1: [(666, 916, 966, 968),    # "SEKOLAH KEBANGSAAN TAMAN SERITI"
        (570, 922, 628, 986)],   # school crest on the slip
    4: [(618, 922, 824, 988),    # child's full name
        (606, 996, 838, 1064),   # school name
        (646, 736, 746, 834)],   # school crest
    6: [(122, 426, 476, 490),    # stage banner: school name (the line slants up to the right)
        (446, 410, 524, 454),    # stage banner: end of the school name
        (278, 318, 342, 394),    # stage banner crest
        (784, 240, 844, 470),    # side banner crest and text
        (572, 1072, 744, 1202),  # trophy crest and school name
        (914, 1144, 994, 1256)], # crest on the uniform pocket
}
LANDSCAPE = (2, 3)
# close-ups shown as inserts: name -> (photo, crop box)
CLOSEUPS = {'1-slip': (1, (566, 1064, 1044, 1336))}   # marks table on the results slip


def redact(im, boxes):
    blurred = im.filter(ImageFilter.GaussianBlur(20))
    mask = Image.new('L', im.size, 0)
    d = ImageDraw.Draw(mask)
    for b in boxes:
        d.rounded_rectangle(b, radius=14, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(5))
    return Image.composite(blurred, im, mask)


def main(src):
    src = Path(src)
    OUT.mkdir(exist_ok=True)
    for n in range(1, 8):
        im = Image.open(src / f'{n}.webp').convert('RGB')
        if n in REDACT:
            im = redact(im, REDACT[n])
        im.save(OUT / f'{n}.jpg', quality=94)
        if n in LANDSCAPE:
            # cover 1080x1920, then blur and darken
            k = 1920 / im.height
            bg = im.resize((round(im.width * k), 1920), Image.LANCZOS)
            x = (bg.width - 1080) // 2
            bg = bg.crop((x, 0, x + 1080, 1920)).filter(ImageFilter.GaussianBlur(48))
            ImageEnhance.Brightness(bg).enhance(0.55).save(OUT / f'{n}-bg.jpg', quality=90)
        print('photo', OUT / f'{n}.jpg')
    for name, (n, box) in CLOSEUPS.items():
        im = Image.open(OUT / f'{n}.jpg').crop(box)
        im.resize((im.width * 2, im.height * 2), Image.LANCZOS).save(OUT / f'{name}.jpg', quality=94)
        print('close-up', OUT / f'{name}.jpg')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])

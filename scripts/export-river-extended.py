"""Reveal the existing artwork outside artboard 5; never redraw the original.

uv run --with pypdf --with pymupdf --with pillow python scripts/export-river-extended.py SOURCE.ai
"""
import io
import sys
from pathlib import Path

import pymupdf
from PIL import Image, ImageChops
from pypdf import PdfReader, PdfWriter
from pypdf.generic import ContentStream, FloatObject, NameObject, RectangleObject

source = Path(sys.argv[1])
reader = PdfReader(source)
writer = PdfWriter()
writer.add_page(reader.pages[4])
page = writer.pages[0]
page.mediabox = RectangleObject([-640, 0, 3200, 1440])
page.cropbox = RectangleObject([-640, 0, 3200, 1440])
stream = ContentStream(page.get_contents(), writer)
expanded = 0
for i, (operands, operator) in enumerate(stream.operations):
    if operator == b're' and stream.operations[i + 1][1] in (b'W', b'W*'):
        x, y, width, height = map(float, operands)
        assert abs(x + width - 2560) < .01
        new_x = -640 if x == 0 else x
        stream.operations[i] = ([FloatObject(v) for v in [new_x, y, 3200 - new_x, height]], operator)
        expanded += 1
assert expanded == 4
page[NameObject('/Contents')] = writer._add_object(stream)

# Extend the original uniform darkening overlay to match the exposed original image.
form = page['/Resources']['/XObject']['/Fm0'].get_object()
form[NameObject('/BBox')] = RectangleObject([-640, 0, 3200, 1440])
overlay = ContentStream(form, writer)
for operands, operator in overlay.operations:
    if operator in (b'm', b'l'):
        assert float(operands[0]) in (0, 2560)
        operands[0] = FloatObject(-640 if float(operands[0]) == 0 else 3200)
form.set_data(overlay.get_data())

buffer = io.BytesIO()
writer.write(buffer)
extended = pymupdf.open(stream=buffer.getvalue(), filetype='pdf')
pix = extended[0].get_pixmap(alpha=False)
image = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
original = pymupdf.open(source)
original_pix = original[4].get_pixmap(alpha=False)
original_image = Image.frombytes('RGB', (2560, 1440), original_pix.samples)
delta = ImageChops.difference(image.crop((640, 0, 3200, 1440)), original_image)
maximum = max(high for low, high in delta.getextrema())
interior_maximum = max(high for low, high in delta.crop((2, 2, 2558, 1438)).getextrema())
# Expanding transparency-group bounds can change renderer antialiasing slightly.
# This is an UNDERLAY only; the unchanged original file remains the opaque foreground.
assert image.size == (3840, 1440)
output = Path(__file__).resolve().parents[1] / 'assets/kv-river-web-native-extended-desktop.webp'
image.save(output, format='WEBP', lossless=True, method=6)
print({'size': image.size, 'source_artboard': 5, 'expanded_clips': expanded, 'center_max_delta': maximum, 'center_interior_max_delta': interior_maximum})

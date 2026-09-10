"""Export existing AI/PDF artwork layers, without redrawing or changing source geometry.

Usage: uv run --with pymupdf --with pypdf --with pillow python scripts/export-river-layers.py SOURCE.ai
Add --full to export the complete desktop artboard 5 losslessly, without layer separation.
Otherwise only desktop artboard 5 is separated. Display scale belongs to CSS, not these assets.
"""
import io
import sys
from pathlib import Path

import pymupdf
from PIL import Image, ImageChops
from pypdf import PdfReader, PdfWriter
from pypdf.generic import ContentStream, NameObject

source = Path(sys.argv[1])
assets = Path(__file__).resolve().parents[1] / 'assets'
reader = PdfReader(source)
if '--mobile-no-date' in sys.argv[2:]:
    original = pymupdf.open(source)
    white_paths = [p for p in original[3].get_drawings() if p.get('fill') == (1, 1, 1)]
    date_paths = {i for i, p in enumerate(white_paths) if p['rect'].y0 > 1500}
    assert len(white_paths) == 380 and len(date_paths) == 21
    writer = PdfWriter()
    writer.add_page(reader.pages[3])
    target = writer.pages[0]
    stream = ContentStream(target.get_contents(), writer)
    rgb, stack, white_index = (0, 0, 0), [], 0
    for i, (operands, operator) in enumerate(stream.operations):
        if operator == b'q':
            stack.append(rgb)
        elif operator == b'Q':
            rgb = stack.pop()
        elif operator == b'rg':
            rgb = tuple(float(x) for x in operands)
        if operator in (b'f', b'f*') and rgb == (1, 1, 1):
            if white_index in date_paths:
                stream.operations[i] = ([], b'n')
            white_index += 1
    assert white_index == len(white_paths)
    target[NameObject('/Contents')] = writer._add_object(stream)
    buffer = io.BytesIO()
    writer.write(buffer)
    edited = pymupdf.open(stream=buffer.getvalue(), filetype='pdf')
    pix = edited[0].get_pixmap(alpha=False)
    base = original[3].get_pixmap(alpha=False)
    image = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    before = Image.frombytes('RGB', (base.width, base.height), base.samples)
    delta = ImageChops.difference(image, before)
    bbox = delta.getbbox()
    assert bbox and bbox[1] >= 1687 and bbox[3] <= 1715, bbox
    image.save(assets / 'kv-river-web-mobile-no-date.webp', format='WEBP', lossless=True, method=6)
    print({'removed_date_paths': len(date_paths), 'changed_bounds': bbox, 'rest_unchanged': True})
    sys.exit(0)

page = reader.pages[4]
assert tuple(float(x) for x in page.mediabox)[2:] == (2560, 1440)

if '--full' in sys.argv[2:]:
    original = pymupdf.open(source)
    pix = original[4].get_pixmap(alpha=False)
    output = assets / 'kv-river-web-desktop.webp'
    pix.pil_save(str(output), format='WEBP', lossless=True, method=6)
    exported = Image.open(output).convert('RGB')
    rendered = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    assert ImageChops.difference(exported, rendered).getbbox() is None
    print({'artboard': 5, 'size': [pix.width, pix.height], 'lossless_pixel_match': True})
    sys.exit(0)


def extract(white_layer):
    writer = PdfWriter()
    writer.add_page(page)
    target = writer.pages[0]
    stream = ContentStream(target.get_contents(), writer)
    rgb = (0, 0, 0)
    stack = []
    operations = []
    white_count = 0
    for operands, operator in stream.operations:
        if operator == b'q':
            stack.append(rgb)
        elif operator == b'Q':
            rgb = stack.pop()
        elif operator == b'rg':
            rgb = tuple(float(x) for x in operands)
        if operator in (b'f', b'f*'):
            is_white = rgb == (1, 1, 1)
            white_count += is_white
            if is_white != white_layer:
                operations.append(([], b'n'))
                continue
        if white_layer and operator == b'Do':
            continue
        operations.append((operands, operator))
    assert white_count == 359, 'Artboard changed: review layer selection before exporting'
    stream.operations = operations
    target[NameObject('/Contents')] = writer._add_object(stream)
    buffer = io.BytesIO()
    writer.write(buffer)
    return pymupdf.open(stream=buffer.getvalue(), filetype='pdf')


background = extract(False)
lettering = extract(True)
background[0].get_pixmap(alpha=False).pil_save(
    str(assets / 'kv-river-web-background-desktop.webp'), format='WEBP', quality=90, method=6
)
(assets / 'kv-river-web-lettering-desktop.svg').write_text(lettering[0].get_svg_image(), encoding='utf-8')

# At 100% scale, recombining the exported layers must match the original artboard.
original = pymupdf.open(source)
def rgb(p):
    pix = p.get_pixmap(alpha=False)
    return Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
combined = pymupdf.open()
combined_page = combined.new_page(width=2560, height=1440)
combined_page.show_pdf_page(combined_page.rect, background, 0)
combined_page.show_pdf_page(combined_page.rect, lettering, 0)
delta = ImageChops.difference(rgb(combined_page), rgb(original[4]))
max_delta = max(high for low, high in delta.getextrema())
assert max_delta <= 2, f'Unexpected artwork difference: {max_delta}'
print({'white_paths': 359, 'artboard': [2560, 1440], 'recombined_max_channel_delta': max_delta})

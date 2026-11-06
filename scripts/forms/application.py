"""Ross Towing's printable driver employment application.

The source is the example Driver Employment Application that Jennifer Gatt sent on Nov 5, 2026
(scripts/forms/driver-employment-application-template.pdf, the FMCSA example form). This covers the
example form's note to carriers at the top of page 1 and fills its "[COMPANY NAME, ADDRESS, PHONE
NUMBER, AND EMAIL]" line with Ross Towing's details. Nothing else on the form changes.

    python3 scripts/forms/application.py   # needs: pip install reportlab pypdf
writes public/forms/ross-towing-driver-employment-application.pdf
"""
import io
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "scripts/forms/driver-employment-application-template.pdf"
OUT = ROOT / "public/forms/ross-towing-driver-employment-application.pdf"
PAGE_H = letter[1]
COMPANY = "ROSS TOWING (LARRY ROSS GARAGE, INC.), 21360 TELEGRAPH RD, SOUTHFIELD, MI 48033, 248-356-6011, ROSSTOWING1@GMAIL.COM"


def top_rect(c, x0, top, x1, bottom):
    """White box given in top-down page coordinates, as pdftotext -bbox reports them."""
    c.rect(x0, PAGE_H - bottom, x1 - x0, bottom - top, stroke=0, fill=1)


def overlay():
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    c.setFillColorRGB(1, 1, 1)
    top_rect(c, 30, 30, 590, 62)      # "This is an example driver employment application..." (2 lines)
    top_rect(c, 205, 79.2, 413, 88.6)  # [COMPANY NAME, ADDRESS, PHONE NUMBER, AND EMAIL]
    c.setFillColorRGB(0, 0, 0)
    c.setFont("Helvetica", 7.4)
    c.drawCentredString(letter[0] / 2, PAGE_H - 87, COMPANY)
    c.save()
    buf.seek(0)
    return PdfReader(buf).pages[0]


def main():
    reader = PdfReader(SRC)
    writer = PdfWriter()
    for i, page in enumerate(reader.pages):
        if i == 0:
            page.merge_page(overlay())
            if "/Annots" in page:  # the covered note's "49 CFR 391.21" link
                del page["/Annots"]
        writer.add_page(page)
    writer.metadata = None
    writer.add_metadata({"/Title": "Ross Towing Driver Employment Application", "/Author": "Ross Towing"})
    if "/Metadata" in writer._root_object:  # drop the template's XMP (author, document ids)
        del writer._root_object["/Metadata"]
    writer.compress_identical_objects()
    with open(OUT, "wb") as f:
        writer.write(f)
    print(f"wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

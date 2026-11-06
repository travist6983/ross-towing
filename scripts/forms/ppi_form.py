"""Ross Towing property owner authorization form (private property impounds), as a printable PDF
with fillable text boxes. The wording is Jennifer Gatt's "PPI AUTHORIZATION FORM 2026" (Nov 5, 2026),
kept word for word, including the 21340 Telegraph Rd header from her original. Don't edit the wording
here without Ross's OK.

    python3 scripts/forms/ppi_form.py   # needs: pip install reportlab
writes public/forms/ross-towing-ppi-authorization-form.pdf
"""
from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public/forms/ross-towing-ppi-authorization-form.pdf"
LOGO = ROOT / "public/img/logo-360.png"

W, H = letter
M = 0.85 * inch  # side margin
BODY = ParagraphStyle("body", fontName="Helvetica", fontSize=11.5, leading=16.5)


def field(c, name, tooltip, x, y, w):
    """A line to write on, plus a borderless text box over it for typing."""
    c.setLineWidth(0.8)
    c.line(x, y, x + w, y)
    c.acroForm.textfield(name=name, tooltip=tooltip, x=x + 2, y=y + 1, width=w - 4, height=17,
                         borderWidth=0, fillColor=None, borderColor=None, forceBorder=False,
                         fontName="Helvetica", fontSize=11)


def para(c, text, y):
    p = Paragraph(text, BODY)
    _, h = p.wrap(W - 2 * M, H)
    p.drawOn(c, M, y - h)
    return y - h


def main():
    c = canvas.Canvas(str(OUT), pagesize=letter, pageCompression=1)
    c.setTitle("Ross Towing: Unauthorized Vehicle Removal Form")
    c.setAuthor("Ross Towing")
    c.setSubject("Property owner authorization for private property impounds")
    c.setCreator("Ross Towing")

    logo = ImageReader(str(LOGO))
    lw, lh = logo.getSize()
    dw = 2.6 * inch
    dh = dw * lh / lw
    y = H - 0.6 * inch - dh
    c.drawImage(logo, (W - dw) / 2, y, dw, dh, mask="auto")

    y -= 26
    c.setFont("Helvetica-Bold", 11.5)
    c.drawCentredString(W / 2, y, "21340 TELEGRAPH RD., SOUTHFIELD, MICHIGAN 48033, 248-356-6011")
    y -= 12
    c.setLineWidth(1.6)
    c.line(M, y, W - M, y)

    y -= 40
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(W / 2, y, "UNAUTHORIZED VEHICLE REMOVAL FORM")

    c.setFont("Helvetica", 11.5)
    # I, ________, Owner / Property
    y -= 50
    c.drawString(M, y, "I,")
    tail = "Owner / Property"
    tw = c.stringWidth(tail, "Helvetica", 11.5)
    x0 = M + 14
    x1 = W - M - tw - 8
    field(c, "printed_name", "Printed name", x0, y - 2, x1 - x0)
    c.drawString(x1 + 2, y, ",")
    c.drawString(W - M - tw, y, tail)
    c.setFont("Helvetica-Oblique", 9)
    c.drawCentredString((x0 + x1) / 2, y - 14, "(Printed Name)")
    c.setFont("Helvetica", 11.5)

    # Manager of ________
    y -= 40
    c.drawString(M, y, "Manager of")
    x0 = M + c.stringWidth("Manager of ", "Helvetica", 11.5)
    field(c, "property", "Property or business name", x0, y - 2, W - M - x0)

    # Located at ________
    y -= 36
    c.drawString(M, y, "Located at")
    x0 = M + c.stringWidth("Located at ", "Helvetica", 11.5)
    field(c, "location", "Property address", x0, y - 2, W - M - x0)

    y -= 30
    y = para(c, "Hereby authorize Ross Towing to remove the following unauthorized / abandoned / illegally parked "
                "vehicle from the above described premises at the vehicle owner’s expense.", y)
    y -= 12
    y = para(c, "I hereby hold Ross Towing harmless and release Ross Towing, associates and / or affiliates from any "
                "dispute arising from and / or associated with the wrongful removal of the vehicle described below "
                "from the above described property.", y)
    y -= 12
    y = para(c, "I am duly authorized to make such decisions and sign this form ordering the removal of said vehicle "
                "from the premises.", y)

    # Phone # ______      X ____________ (Authorized signature)
    y -= 80
    c.drawString(M, y, "Phone #")
    x0 = M + c.stringWidth("Phone # ", "Helvetica", 11.5)
    field(c, "phone", "Phone number", x0, y - 2, 2.1 * inch)
    sx = W - M - 3.2 * inch
    c.drawString(sx - 14, y, "X")
    c.setLineWidth(0.8)
    c.line(sx, y - 2, W - M, y - 2)  # signed by hand, so no text box
    c.setFont("Helvetica-Oblique", 9)
    c.drawCentredString(sx + 1.6 * inch, y - 16, "(Authorized signature)")

    c.setFont("Helvetica", 9.5)
    c.setFillGray(0.35)
    c.drawCentredString(W / 2, 0.75 * inch,
                        "Complete this form, sign it and email it to rosstowing1@gmail.com. Questions? Call 248-356-6011.")
    c.showPage()
    c.save()
    print(f"wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

import sys
from typing import List

from pydantic import BaseModel

from app.schema import Invoice

# Rounding ki chhoti galtiyon ke liye thoda margin
TOLERANCE = 0.02


class CheckResult(BaseModel):
    check: str    # kaunsa check tha
    status: str   # "pass", "fail", "warn" ya "skip"
    details: str  # kya hua


def _close(a: float, b: float) -> bool:
    """Do numbers lagbhag barabar hain ya nahi."""
    return abs(a - b) <= TOLERANCE


def check_required_fields(inv: Invoice) -> List[CheckResult]:
    """Zaroori fields maujood hain ya nahi."""
    results = []
    required = {
        "vendor_name": inv.vendor_name,
        "date": inv.date,
        "total": inv.total,
    }
    for name, value in required.items():
        if value is None:
            results.append(CheckResult(check=f"Field: {name}", status="fail", details=f"{name} missing hai"))
        else:
            results.append(CheckResult(check=f"Field: {name}", status="pass", details=f"{name} mil gaya"))
    return results


def check_line_items(inv: Invoice) -> List[CheckResult]:
    """Har line: quantity x rate = amount."""
    results = []
    for i, item in enumerate(inv.line_items, start=1):
        label = f"Line {i}: qty x rate"
        if item.quantity is None or item.unit_price is None or item.amount is None:
            results.append(CheckResult(check=label, status="skip", details="Kuch value missing hai, check nahi ho sakta"))
            continue
        expected = round(item.quantity * item.unit_price, 2)
        if _close(expected, item.amount):
            results.append(CheckResult(check=label, status="pass", details=f"{item.quantity} x {item.unit_price} = {expected}"))
        else:
            results.append(CheckResult(check=label, status="fail", details=f"Hona chahiye {expected}, bill mein {item.amount}"))
    return results


def check_subtotal(inv: Invoice) -> CheckResult:
    """Saari lines ka jod = subtotal."""
    label = "Subtotal = items ka jod"
    amounts = [item.amount for item in inv.line_items if item.amount is not None]
    if inv.subtotal is None or not amounts:
        return CheckResult(check=label, status="skip", details="Subtotal ya items missing hain")
    expected = round(sum(amounts), 2)
    if _close(expected, inv.subtotal):
        return CheckResult(check=label, status="pass", details=f"Jod = {expected}")
    return CheckResult(check=label, status="fail", details=f"Jod {expected} hai, bill mein subtotal {inv.subtotal}")


def check_total(inv: Invoice) -> CheckResult:
    """Subtotal - discount + tax = total."""
    label = "Total = subtotal - discount + tax"
    if inv.subtotal is None or inv.total is None:
        return CheckResult(check=label, status="skip", details="Subtotal ya total missing hai")
    discount = inv.discount or 0
    tax = inv.tax or 0
    expected = round(inv.subtotal - discount + tax, 2)
    if _close(expected, inv.total):
        return CheckResult(check=label, status="pass", details=f"{inv.subtotal} - {discount} + {tax} = {expected}")
    return CheckResult(check=label, status="fail", details=f"Hona chahiye {expected}, bill mein {inv.total}")


def check_signature(inv: Invoice) -> CheckResult:
    """Signature ya stamp hai ya nahi. Missing ho to sirf warning, fail nahi."""
    label = "Signature / stamp"
    if inv.has_signature is None:
        return CheckResult(check=label, status="skip", details="AI signature ke baare mein sure nahi tha")
    if inv.has_signature:
        return CheckResult(check=label, status="pass", details="Signature ya stamp mil gaya")
    return CheckResult(
        check=label,
        status="warn",
        details="Signature ya stamp nahi mila. Agar ye bill signed hona chahiye tha, to dhyan do.",
    )


def run_all_checks(inv: Invoice) -> List[CheckResult]:
    """Saare checks ek saath chalao."""
    results = []
    results += check_required_fields(inv)
    results += check_line_items(inv)
    results.append(check_subtotal(inv))
    results.append(check_total(inv))
    results.append(check_signature(inv))
    return results


if __name__ == "__main__":
    from app.config import SAMPLES_DIR
    from app.vlm import extract_invoice

    # Command line se file do, ya samples folder ki pehli file lo
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    else:
        exts = {".jpg", ".jpeg", ".png", ".pdf", ".webp"}
        files = sorted(f for f in SAMPLES_DIR.iterdir() if f.suffix.lower() in exts)
        file_path = str(files[0])

    print(f"Processing: {file_path}\n")
    invoice = extract_invoice(file_path)

    icons = {"pass": "✅", "fail": "❌", "warn": "🟡", "skip": "⚪"}
    for r in run_all_checks(invoice):
        print(f"{icons[r.status]} {r.check}: {r.details}")
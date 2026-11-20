import sys
from typing import List

from pydantic import BaseModel

from app.schema import Invoice

# Small margin for rounding differences
TOLERANCE = 0.02


class CheckResult(BaseModel):
    check: str    # Name of the check
    status: str   # "pass", "fail", "warn", or "skip"
    details: str  # Human-readable explanation


def _close(a: float, b: float) -> bool:
    """Check if two numbers are approximately equal."""
    return abs(a - b) <= TOLERANCE


def check_required_fields(inv: Invoice) -> List[CheckResult]:
    """Check whether required fields are present."""
    results = []
    required = {
        "vendor_name": inv.vendor_name,
        "date": inv.date,
        "total": inv.total,
    }
    for name, value in required.items():
        if value is None:
            results.append(CheckResult(check=f"Field: {name}", status="fail", details=f"{name} is missing"))
        else:
            results.append(CheckResult(check=f"Field: {name}", status="pass", details=f"{name} found"))
    return results


def check_line_items(inv: Invoice) -> List[CheckResult]:
    """Each line: quantity x rate = amount."""
    results = []
    for i, item in enumerate(inv.line_items, start=1):
        label = f"Line {i}: qty x rate"
        if item.quantity is None or item.unit_price is None or item.amount is None:
            results.append(CheckResult(check=label, status="skip", details="Some values are missing, cannot verify"))
            continue
        expected = round(item.quantity * item.unit_price, 2)
        if _close(expected, item.amount):
            results.append(CheckResult(check=label, status="pass", details=f"{item.quantity} x {item.unit_price} = {expected}"))
        else:
            results.append(CheckResult(check=label, status="fail", details=f"Expected {expected}, bill shows {item.amount}"))
    return results


def check_subtotal(inv: Invoice) -> CheckResult:
    """Sum of all line items = subtotal."""
    label = "Subtotal = sum of items"
    amounts = [item.amount for item in inv.line_items if item.amount is not None]
    if inv.subtotal is None or not amounts:
        return CheckResult(check=label, status="skip", details="Subtotal or item amounts are missing")
    expected = round(sum(amounts), 2)
    if _close(expected, inv.subtotal):
        return CheckResult(check=label, status="pass", details=f"Sum = {expected}")
    return CheckResult(check=label, status="fail", details=f"Sum is {expected}, bill shows subtotal {inv.subtotal}")


def check_total(inv: Invoice) -> CheckResult:
    """Subtotal - discount + tax = total."""
    label = "Total = subtotal - discount + tax"
    if inv.subtotal is None or inv.total is None:
        return CheckResult(check=label, status="skip", details="Subtotal or total is missing")
    discount = inv.discount or 0
    tax = inv.tax or 0
    expected = round(inv.subtotal - discount + tax, 2)
    if _close(expected, inv.total):
        return CheckResult(check=label, status="pass", details=f"{inv.subtotal} - {discount} + {tax} = {expected}")
    return CheckResult(check=label, status="fail", details=f"Expected {expected}, bill shows {inv.total}")


def check_signature(inv: Invoice) -> CheckResult:
    """Check for signature or stamp. Missing triggers a warning, not a failure."""
    label = "Signature / stamp"
    if inv.has_signature is None:
        return CheckResult(check=label, status="skip", details="AI could not determine if a signature is present")
    if inv.has_signature:
        return CheckResult(check=label, status="pass", details="Signature or stamp detected")
    return CheckResult(
        check=label,
        status="warn",
        details="No signature or stamp found. Please verify if this document requires one.",
    )


def run_all_checks(inv: Invoice) -> List[CheckResult]:
    """Run all validation checks together."""
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
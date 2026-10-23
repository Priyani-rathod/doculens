"""
Validators ke automatic tests.
Chalane ke liye (project root se):  python -m pytest -v
"""
from app.schema import Invoice, LineItem
from app.validators import (
    check_line_items,
    check_required_fields,
    check_signature,
    check_subtotal,
    check_total,
    run_all_checks,
)


def make_invoice(**overrides) -> Invoice:
    """Ek sahi invoice banao. Test mein sirf wahi cheez badlo jo test karni hai."""
    data = dict(
        vendor_name="Test Store",
        invoice_number="INV-1",
        date="2026-09-17",
        line_items=[
            LineItem(description="Item A", quantity=2, unit_price=100.0, amount=200.0),
            LineItem(description="Item B", quantity=1, unit_price=50.0, amount=50.0),
        ],
        subtotal=250.0,
        discount=None,
        tax_rate=18.0,
        tax=45.0,
        total=295.0,
        currency="INR",
        has_signature=True,
    )
    data.update(overrides)
    return Invoice(**data)


def by_name(results, name):
    return next(r for r in results if r.check == name)


# ---------- Sab sahi ----------
def test_clean_invoice_passes_everything():
    results = run_all_checks(make_invoice())
    assert all(r.status == "pass" for r in results)


# ---------- Line items ----------
def test_line_item_mismatch_fails():
    inv = make_invoice(
        line_items=[LineItem(description="A4 Paper", quantity=10, unit_price=285.0, amount=2580.0)],
        subtotal=2580.0,
        tax=0.0,
        total=2580.0,
    )
    results = check_line_items(inv)
    assert results[0].status == "fail"
    assert "2850" in results[0].details  # hona chahiye 2850


def test_line_item_with_missing_value_is_skipped():
    inv = make_invoice(line_items=[LineItem(description="X", quantity=None, unit_price=10.0, amount=10.0)])
    assert check_line_items(inv)[0].status == "skip"


# ---------- Subtotal ----------
def test_subtotal_mismatch_fails():
    assert check_subtotal(make_invoice(subtotal=300.0)).status == "fail"


def test_subtotal_missing_is_skipped():
    assert check_subtotal(make_invoice(subtotal=None)).status == "skip"


# ---------- Total ----------
def test_total_mismatch_fails():
    result = check_total(make_invoice(total=395.0))  # tamper kiya hua total
    assert result.status == "fail"
    assert "295" in result.details


def test_total_missing_is_skipped():
    assert check_total(make_invoice(total=None)).status == "skip"


def test_small_rounding_difference_is_allowed():
    assert check_total(make_invoice(total=295.01)).status == "pass"


def test_bigger_difference_is_not_allowed():
    assert check_total(make_invoice(total=295.50)).status == "fail"


def real_discount_invoice(**overrides) -> Invoice:
    """Hamara pehla asli bill: 10% discount ke saath."""
    data = dict(
        line_items=[
            LineItem(description="Services", quantity=10, unit_price=55.0, amount=550.0),
            LineItem(description="Consulting", quantity=15, unit_price=75.0, amount=1125.0),
            LineItem(description="Materials", quantity=1, unit_price=123.39, amount=123.39),
        ],
        subtotal=1798.39,
        discount=179.84,
        tax=80.93,
        total=1699.48,
    )
    data.update(overrides)
    return make_invoice(**data)


def test_discount_is_included_in_total_check():
    assert check_total(real_discount_invoice()).status == "pass"


def test_ignoring_discount_would_flag_a_correct_bill():
    # Ye wahi galti hai jo schema mein discount na hone par hui thi
    assert check_total(real_discount_invoice(discount=None)).status == "fail"


# ---------- Zaroori fields ----------
def test_missing_date_fails():
    results = check_required_fields(make_invoice(date=None))
    assert by_name(results, "Field: date").status == "fail"
    assert by_name(results, "Field: vendor_name").status == "pass"


def test_missing_vendor_fails():
    results = check_required_fields(make_invoice(vendor_name=None))
    assert by_name(results, "Field: vendor_name").status == "fail"


# ---------- Signature ----------
def test_signature_present_passes():
    assert check_signature(make_invoice(has_signature=True)).status == "pass"


def test_missing_signature_is_only_a_warning():
    assert check_signature(make_invoice(has_signature=False)).status == "warn"
    # Sahi hisaab wala bill unsigned ho to bhi koi "fail" nahi aana chahiye
    results = run_all_checks(make_invoice(has_signature=False))
    assert not any(r.status == "fail" for r in results)


def test_unknown_signature_is_skipped():
    assert check_signature(make_invoice(has_signature=None)).status == "skip"
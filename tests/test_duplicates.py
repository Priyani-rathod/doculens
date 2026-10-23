from app.duplicates import find_duplicates
from app.schema import Invoice


def result(key, name, **fields):
    base = dict(vendor_name="Sharma Electronics & Co.", invoice_number="SE/2026/0417", total=15153.56)
    base.update(fields)
    return {"key": key, "name": name, "invoice": Invoice(**base)}


def test_same_invoice_uploaded_twice_is_found():
    a = result("a", "scan.png")
    b = result("b", "photo.jpg")
    assert find_duplicates([a, b]) == {"b": "scan.png"}  # pehla original, doosra duplicate


def test_capital_letters_and_extra_spaces_are_ignored():
    a = result("a", "scan.png")
    b = result("b", "photo.jpg", vendor_name="  sharma   ELECTRONICS & co. ")
    assert find_duplicates([a, b]) == {"b": "scan.png"}


def test_different_total_is_not_duplicate():
    a = result("a", "one.png")
    b = result("b", "two.png", total=999.0)
    assert find_duplicates([a, b]) == {}


def test_different_invoice_number_is_not_duplicate():
    a = result("a", "one.png")
    b = result("b", "two.png", invoice_number="SE/2026/0418")
    assert find_duplicates([a, b]) == {}


def test_bills_without_invoice_number_are_never_marked_duplicate():
    a = result("a", "one.png", invoice_number=None)
    b = result("b", "two.png", invoice_number=None)
    assert find_duplicates([a, b]) == {}
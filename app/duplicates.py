"""
duplicates.py
-------------
Ek hi invoice do baar upload ho gaya ho to usse pakadta hai.
Duplicate = vendor ka naam + invoice number + total teeno same.
"""
from typing import Dict, List, Optional, Tuple


def _norm(text) -> str:
    """Capital/small aur extra spaces ka farak hatao."""
    return " ".join(str(text).lower().split()) if text else ""


def _signature(inv) -> Optional[Tuple]:
    vendor = _norm(inv.vendor_name)
    number = _norm(inv.invoice_number)
    if not vendor or not number or inv.total is None:
        return None  # invoice number nahi hai to pakka nahi keh sakte
    return (vendor, number, round(inv.total, 2))


def find_duplicates(results: List[dict]) -> Dict[str, str]:
    """
    results: analyze hue bills (jinme 'key', 'name', 'invoice' hai).
    Return: {duplicate bill ki key: original bill ka naam}
    List mein jo bill pehle aata hai use original maana jata hai.
    """
    seen: Dict[Tuple, dict] = {}
    dups: Dict[str, str] = {}
    for r in results:
        sig = _signature(r["invoice"])
        if sig is None:
            continue
        if sig in seen:
            dups[r["key"]] = seen[sig]["name"]
        else:
            seen[sig] = r
    return dups
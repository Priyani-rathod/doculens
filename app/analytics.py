"""
analytics.py
------------
Pure-Python calculations for single-bill insights and multi-bill portfolio analytics.
No Streamlit or Plotly dependencies — returns JSON-ready dicts for FastAPI & React.
"""
from typing import Any, Dict, List

import pandas as pd

from app.schema import Invoice

SYMBOLS = {"USD": "$", "INR": "₹", "EUR": "€", "GBP": "£", "JPY": "¥"}


def _money(x, currency=None) -> str:
    if x is None:
        return "-"
    cur = (currency or "").upper()
    symbol = SYMBOLS.get(cur, f"{cur} " if cur else "")
    return f"{symbol}{x:,.2f}"


def bill_insights(inv: Invoice) -> List[Dict[str, str]]:
    """Rule-based insights for a single bill. Returns [{'icon': ..., 'text': ...}]."""
    cur = inv.currency
    out: List[Dict[str, str]] = []

    items = [i for i in inv.line_items if i.amount is not None]
    base = inv.subtotal if inv.subtotal else (sum(i.amount for i in items) if items else None)

    if items:
        avg = sum(i.amount for i in items) / len(items)
        out.append({
            "icon": "🧾",
            "text": f"This bill has {len(items)} item(s) with an average amount of {_money(avg, cur)} per item.",
        })

        top = max(items, key=lambda i: i.amount)
        name = (top.description or "item").split("\n")[0].strip()
        if base:
            share = top.amount / base * 100
            msg = f"Largest item: {name} ({_money(top.amount, cur)}), making up {share:.0f}% of the subtotal."
            if share >= 50 and len(items) > 1:
                msg += " Over half of the bill comes from a single item."
            out.append({"icon": "🏆", "text": msg})

    if inv.discount and base:
        out.append({
            "icon": "🏷️",
            "text": f"Discount of {_money(inv.discount, cur)} applied ({inv.discount / base * 100:.1f}% of subtotal).",
        })

    if inv.tax is not None and base:
        taxable = base - (inv.discount or 0)
        if taxable > 0:
            eff = inv.tax / taxable * 100
            msg = f"Tax is {_money(inv.tax, cur)}, an effective rate of ~{eff:.1f}% after discount."
            if inv.tax_rate is not None and abs(inv.tax_rate - eff) > 0.5:
                msg += (
                    f" The bill states {inv.tax_rate:g}%. If tax is split into multiple parts "
                    "(e.g. CGST + SGST), this difference is normal."
                )
            out.append({"icon": "🧮", "text": msg})

    if inv.total is not None and base:
        diff = (inv.total - base) / base * 100
        word = "higher" if diff >= 0 else "lower"
        out.append({
            "icon": "💰",
            "text": f"Final payable amount is {_money(inv.total, cur)}, which is {abs(diff):.1f}% {word} than the subtotal (after tax & discount).",
        })

    return out


def portfolio_analytics(results: List[dict]) -> Dict[str, Any]:
    """
    results: list of dicts containing 'name' and 'invoice' (Invoice object).
    Returns currency-grouped metrics, vendor breakdown, and monthly spend for Recharts.
    """
    if len(results) < 2:
        return {"currencies": {}, "message": "Analyze at least 2 bills to view vendor and monthly charts."}

    rows = []
    for r in results:
        inv: Invoice = r["invoice"]
        rows.append({
            "file": r["name"],
            "vendor": inv.vendor_name or "Unknown",
            "date": pd.to_datetime(inv.date, errors="coerce"),
            "currency": (inv.currency or "NA").upper(),
            "total": inv.total,
            "tax": inv.tax or 0.0,
            "discount": inv.discount or 0.0,
        })

    df = pd.DataFrame(rows).dropna(subset=["total"])
    if df.empty:
        return {"currencies": {}, "message": "No bill totals found to generate charts."}

    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["month"] = df["date"].dt.strftime("%Y-%m")

    currencies_data: Dict[str, Any] = {}
    for cur in sorted(df["currency"].unique()):
        sub = df[df["currency"] == cur]
        total_spend = float(sub["total"].sum())
        count = int(len(sub))

        by_vendor_df = (
            sub.groupby("vendor", as_index=False)["total"]
            .sum()
            .sort_values("total", ascending=False)
        )
        by_vendor = [
            {"vendor": row["vendor"], "total": round(float(row["total"]), 2)}
            for _, row in by_vendor_df.iterrows()
        ]

        top_vendor = None
        if by_vendor and total_spend > 0:
            top = by_vendor[0]
            top_vendor = {
                "vendor": top["vendor"],
                "total": top["total"],
                "share_pct": round(top["total"] / total_spend * 100, 1),
            }

        dated = sub.dropna(subset=["month"])
        by_month = []
        if not dated.empty:
            by_month_df = (
                dated.groupby("month", as_index=False)["total"]
                .sum()
                .sort_values("month")
            )
            by_month = [
                {"month": row["month"], "total": round(float(row["total"]), 2)}
                for _, row in by_month_df.iterrows()
            ]

        currencies_data[cur] = {
            "currency": cur,
            "count": count,
            "total_spend": round(total_spend, 2),
            "avg_bill": round(total_spend / count, 2) if count else 0.0,
            "total_tax": round(float(sub["tax"].sum()), 2),
            "total_discount": round(float(sub["discount"].sum()), 2),
            "top_vendor": top_vendor,
            "by_vendor": by_vendor,
            "by_month": by_month,
            "missing_dates": int(len(sub) - len(dated)),
        }

    return {"currencies": currencies_data, "message": None}
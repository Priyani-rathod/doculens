"""
insights.py
-----------
1) bill_insights()     : ek bill ke numbers se samajh-aane-layak baatein (rule-based)
2) render_portfolio()  : kai bills ka vendor-wise aur month-wise analysis (charts)
"""
import html
from typing import List, Tuple

import pandas as pd
import plotly.express as px
import streamlit as st

from app.schema import Invoice

SYMBOLS = {"USD": "$", "INR": "₹", "EUR": "€", "GBP": "£", "JPY": "¥"}
ACCENT = "#7C5CFF"


def _money(x, currency=None) -> str:
    if x is None:
        return "-"
    cur = (currency or "").upper()
    symbol = SYMBOLS.get(cur, f"{cur} " if cur else "")
    return f"{symbol}{x:,.2f}"


def _md(text: str) -> str:
    """st.markdown mein '$' ko math samajh leta hai, isliye escape karo."""
    return text.replace("$", "\\$")


# ------------------------------------------------------------------
# 1) Ek bill ke insights
# ------------------------------------------------------------------
def bill_insights(inv: Invoice) -> List[Tuple[str, str]]:
    """(icon, text) ki list. Sab kuch bill ke numbers se calculate hota hai."""
    cur = inv.currency
    out: List[Tuple[str, str]] = []

    items = [i for i in inv.line_items if i.amount is not None]
    base = inv.subtotal if inv.subtotal else (sum(i.amount for i in items) if items else None)

    if items:
        avg = sum(i.amount for i in items) / len(items)
        out.append(("🧾", f"Bill mein {len(items)} item(s) hain. Ek item ka average amount {_money(avg, cur)} hai."))

        top = max(items, key=lambda i: i.amount)
        name = (top.description or "item").split("\n")[0].strip()
        if base:
            share = top.amount / base * 100
            msg = f"Sabse bada item: {name} ({_money(top.amount, cur)}), jo subtotal ka {share:.0f}% hai."
            if share >= 50 and len(items) > 1:
                msg += " Bill ka aadhe se zyada hissa ek hi item ka hai."
            out.append(("🏆", msg))

    if inv.discount and base:
        out.append(("🏷️", f"Discount {_money(inv.discount, cur)} mila, jo subtotal ka {inv.discount / base * 100:.1f}% hai."))

    if inv.tax is not None and base:
        taxable = base - (inv.discount or 0)
        if taxable > 0:
            eff = inv.tax / taxable * 100
            msg = f"Tax {_money(inv.tax, cur)} laga hai, yaani discount ke baad ki raashi par lagbhag {eff:.1f}%."
            if inv.tax_rate is not None and abs(inv.tax_rate - eff) > 0.5:
                msg += (
                    f" Bill par {inv.tax_rate:g}% likha hai. Agar tax do hisson mein hai "
                    "(jaise CGST + SGST), to ye farak normal hai."
                )
            out.append(("🧮", msg))

    if inv.total is not None and base:
        diff = (inv.total - base) / base * 100
        word = "zyada" if diff >= 0 else "kam"
        out.append(
            ("💰", f"Aakhir mein {_money(inv.total, cur)} dena hai. Ye subtotal se {abs(diff):.1f}% {word} hai (tax aur discount ke baad).")
        )
    return out


def render_bill_insights(inv: Invoice):
    ins = bill_insights(inv)
    if not ins:
        st.info("Is bill se insights nikalne layak data nahi mila.")
        return
    for icon, text in ins:
        st.markdown(
            f'<div class="card" style="padding:12px 16px; margin-bottom:10px;">{icon}&nbsp; {html.escape(text)}</div>',
            unsafe_allow_html=True,
        )
    st.caption("Ye insights bill ke numbers se calculate hote hain (AI se nahi), isliye hamesha same aate hain.")


# ------------------------------------------------------------------
# 2) Saare bills ke insights
# ------------------------------------------------------------------
def to_frame(results: list) -> pd.DataFrame:
    rows = []
    for r in results:
        inv = r["invoice"]
        rows.append(
            {
                "file": r["name"],
                "vendor": inv.vendor_name or "Unknown",
                "date": pd.to_datetime(inv.date, errors="coerce"),
                "currency": (inv.currency or "NA").upper(),
                "total": inv.total,
                "tax": inv.tax or 0.0,
                "discount": inv.discount or 0.0,
            }
        )
    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["month"] = df["date"].dt.strftime("%Y-%m")
    return df


def _style(fig, height=320):
    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        height=height,
        margin=dict(l=10, r=10, t=50, b=10),
        showlegend=False,
    )
    return fig


def _currency_block(df: pd.DataFrame, currency: str):
    total = df["total"].sum()
    n = len(df)

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Bills", n)
    m2.metric("Kul kharcha", _money(total, currency))
    m3.metric("Average bill", _money(total / n, currency))
    m4.metric("Kul tax", _money(df["tax"].sum(), currency))
    if df["discount"].sum() > 0:
        st.caption(_md(f"Kul discount mila: {_money(df['discount'].sum(), currency)}"))

    by_vendor = df.groupby("vendor", as_index=False)["total"].sum().sort_values("total", ascending=False)
    top = by_vendor.iloc[0]
    share = top["total"] / total * 100 if total else 0
    st.markdown(_md(f"💡 Sabse zyada kharcha **{top['vendor']}** par hua: {_money(top['total'], currency)} ({share:.0f}%)."))

    fig = px.bar(
        by_vendor,
        x="total",
        y="vendor",
        orientation="h",
        text_auto=",.0f",
        color_discrete_sequence=[ACCENT],
        title="Vendor-wise kharcha",
    )
    fig.update_yaxes(categoryorder="total ascending", title=None)
    fig.update_xaxes(title=None)
    st.plotly_chart(_style(fig, max(260, 60 * len(by_vendor) + 90)), key=f"vendor_{currency}")

    dated = df.dropna(subset=["month"])
    if dated.empty:
        st.caption("Kisi bill ki date nahi mili, isliye month-wise chart nahi bana.")
        return
    by_month = dated.groupby("month", as_index=False)["total"].sum().sort_values("month")
    fig = px.bar(
        by_month,
        x="month",
        y="total",
        text_auto=",.0f",
        color_discrete_sequence=[ACCENT],
        title="Month-wise kharcha",
    )
    fig.update_xaxes(type="category", title=None)
    fig.update_yaxes(title=None)
    st.plotly_chart(_style(fig), key=f"month_{currency}")
    missing = len(df) - len(dated)
    if missing:
        st.caption(f"{missing} bill(s) ki date nahi mili, wo month-wise chart mein shaamil nahi hain.")


def render_portfolio(results: list):
    """results: sirf wo analyze hue bills jinme error nahi hai."""
    st.markdown("#### 📈 Insights (saare bills)")
    if len(results) < 2:
        st.info("Vendor-wise aur month-wise charts ke liye kam se kam 2 bills analyze karo.")
        return

    df = to_frame(results).dropna(subset=["total"])
    if df.empty:
        st.info("Kisi bill ka total nahi mila, isliye charts nahi ban sakte.")
        return

    currencies = sorted(df["currency"].unique())
    if len(currencies) == 1:
        _currency_block(df, currencies[0])
    else:
        st.caption("Alag alag currency ke bills ko jodna galat hota hai, isliye har currency ka alag tab hai.")
        tabs = st.tabs([f"💱 {c}" for c in currencies])
        for tab, cur in zip(tabs, currencies):
            with tab:
                _currency_block(df[df["currency"] == cur], cur)
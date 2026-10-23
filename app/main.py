import html
import sys
import tempfile
import time
from pathlib import Path

# Add the project root folder to the path so that "from app...." works
sys.path.append(str(Path(__file__).resolve().parent.parent))

import pandas as pd
import streamlit as st

from app.config import GEMINI_MODEL
from app.duplicates import find_duplicates
from app.insights import render_bill_insights, render_portfolio
from app.validators import run_all_checks
from app.vlm import extract_invoice

st.set_page_config(
    page_title="DocuLens | Financial Document Analyzer",
    page_icon="🧾",
    layout="wide",
)

# ------------------------------------------------------------------
# Styling (CSS)
# ------------------------------------------------------------------
CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
html, body, [class*="css"] { font-family: 'Inter', sans-serif; }
#MainMenu, footer { visibility: hidden; }
.block-container { padding-top: 1.6rem; padding-bottom: 3rem; max-width: 1280px; }

.hero {
  background: linear-gradient(135deg, #5B3DF5 0%, #8E54E9 50%, #2AA7FF 100%);
  border-radius: 22px; padding: 30px 34px; margin-bottom: 22px; color: #fff;
  box-shadow: 0 12px 40px rgba(91,61,245,0.35);
}
.hero h1 { margin: 0; font-size: 2.1rem; font-weight: 800; letter-spacing: -0.5px; }
.hero p { margin: 8px 0 14px 0; font-size: 1.02rem; opacity: 0.92; }
.badge {
  display: inline-block; padding: 5px 12px; margin-right: 8px; border-radius: 999px;
  background: rgba(255,255,255,0.18); font-size: 0.78rem; font-weight: 600;
}

.card {
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09);
  border-radius: 16px; padding: 16px 20px; margin-bottom: 14px;
}
.stat-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6; font-weight: 600; }
.stat-value { font-size: 1.25rem; font-weight: 700; margin-top: 4px; word-break: break-word; }
.stat-value.big { font-size: 1.55rem; color: #A99BFF; }

.verdict { border-radius: 16px; padding: 16px 20px; margin: 6px 0 14px 0; }
.verdict.ok   { background: rgba(34,197,94,0.12);  border: 1px solid rgba(34,197,94,0.45); }
.verdict.bad  { background: rgba(239,68,68,0.12);  border: 1px solid rgba(239,68,68,0.5); }
.verdict.warn { background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.5); }
.verdict h3 { margin: 0 0 4px 0; font-size: 1.1rem; }
.verdict p { margin: 0; opacity: 0.85; font-size: 0.92rem; }

.bar { height: 8px; border-radius: 99px; background: rgba(255,255,255,0.12); margin-top: 12px; overflow: hidden; }
.bar > div { height: 100%; border-radius: 99px; }

.check {
  display: flex; gap: 12px; align-items: flex-start; padding: 12px 14px; margin-bottom: 8px;
  border-radius: 12px; background: rgba(255,255,255,0.035); border-left: 4px solid #888;
}
.check.ok { border-left-color: #22C55E; }
.check.bad { border-left-color: #EF4444; background: rgba(239,68,68,0.08); }
.check.warn { border-left-color: #F59E0B; background: rgba(245,158,11,0.07); }
.check.skip { border-left-color: #888; }
.check .icon { font-size: 1.1rem; line-height: 1.4; }
.check .ctitle { font-weight: 600; font-size: 0.93rem; }
.check .cdetail { opacity: 0.75; font-size: 0.85rem; margin-top: 2px; }

table.receipt { width: 100%; border-collapse: collapse; }
table.receipt td { padding: 10px 4px; border-bottom: 1px dashed rgba(255,255,255,0.12); font-size: 0.97rem; }
table.receipt td:last-child { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }
table.receipt tr.neg td:last-child { color: #4ADE80; }
table.receipt tr.pos td:last-child { color: #FBBF24; }
table.receipt tr.total td { font-size: 1.15rem; font-weight: 800; border-bottom: none; padding-top: 14px; }
table.receipt tr.calc td { font-size: 0.85rem; opacity: 0.8; border-bottom: none; }
table.receipt tr.calc.good td:last-child { color: #4ADE80; }
table.receipt tr.calc.badc td:last-child { color: #F87171; }

.chip {
  display: inline-block; padding: 5px 12px; margin: 0 8px 6px 0; border-radius: 999px;
  background: rgba(124,92,255,0.18); border: 1px solid rgba(124,92,255,0.4);
  font-size: 0.8rem; font-weight: 600;
}
.step { display: flex; gap: 12px; margin-bottom: 14px; }
.step .num {
  min-width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg,#7C5CFF,#2AA7FF);
  display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem;
}
.step .txt b { display: block; } .step .txt span { opacity: 0.7; font-size: 0.86rem; }

.feature { text-align: center; padding: 26px 16px; }
.feature .emoji { font-size: 2.2rem; }
.feature h4 { margin: 10px 0 4px 0; } .feature p { opacity: 0.7; font-size: 0.9rem; margin: 0; }

button[kind="primary"], button[data-testid="stBaseButton-primary"] {
  background: linear-gradient(135deg, #7C5CFF, #2AA7FF) !important; border: none !important;
  font-weight: 700 !important; border-radius: 12px !important; padding: 0.55rem 1.4rem !important;
}
.stDownloadButton button { width: 100%; border-radius: 12px; font-weight: 600; }
.stTabs [data-baseweb="tab"] { font-weight: 600; }
</style>
"""
st.markdown(CSS, unsafe_allow_html=True)

# ------------------------------------------------------------------
# Session state: the result of each file is stored here
# ------------------------------------------------------------------
if "results" not in st.session_state:
    st.session_state["results"] = {}


# ------------------------------------------------------------------
# Helper functions
# ------------------------------------------------------------------
SYMBOLS = {"USD": "$", "INR": "₹", "EUR": "€", "GBP": "£", "JPY": "¥"}


def esc(x) -> str:
    """Make AI-generated text safe before putting it into HTML."""
    return html.escape(str(x)) if x is not None else "-"


def money(x, currency=None) -> str:
    """Show a number with 2 decimals and a currency symbol."""
    if x is None:
        return "-"
    cur = (currency or "").upper()
    symbol = SYMBOLS.get(cur, f"{cur} " if cur else "")
    return f"{symbol}{x:,.2f}"


def file_key(f) -> str:
    """Unique identifier for each uploaded file."""
    return f"{f.name}-{f.size}"


def stat_card(label, value, big=False) -> str:
    cls = "stat-value big" if big else "stat-value"
    return f'<div class="card"><div class="stat-label">{label}</div><div class="{cls}">{value}</div></div>'


def check_row(c) -> str:
    cls = {"pass": "ok", "fail": "bad", "warn": "warn", "skip": "skip"}[c.status]
    icon = {"pass": "✅", "fail": "❌", "warn": "🟡", "skip": "⚪"}[c.status]
    return (
        f'<div class="check {cls}"><div class="icon">{icon}</div>'
        f'<div><div class="ctitle">{esc(c.check)}</div><div class="cdetail">{esc(c.details)}</div></div></div>'
    )


def receipt_html(inv) -> str:
    cur = inv.currency
    rows = f'<tr><td>Subtotal</td><td>{money(inv.subtotal, cur)}</td></tr>'
    if inv.discount:
        rows += f'<tr class="neg"><td>Discount</td><td>− {money(inv.discount, cur)}</td></tr>'
    if inv.tax is not None:
        rate = f" ({inv.tax_rate:g}%)" if inv.tax_rate is not None else ""
        rows += f'<tr class="pos"><td>Tax{rate}</td><td>+ {money(inv.tax, cur)}</td></tr>'
    rows += f'<tr class="total"><td>Total (on bill)</td><td>{money(inv.total, cur)}</td></tr>'

    if inv.subtotal is not None and inv.total is not None:
        calc = round(inv.subtotal - (inv.discount or 0) + (inv.tax or 0), 2)
        good = abs(calc - inv.total) <= 0.02
        cls = "good" if good else "badc"
        rows += f'<tr class="calc {cls}"><td>Our calculated total</td><td>{money(calc, cur)}</td></tr>'
    return f'<div class="card"><table class="receipt">{rows}</table></div>'


def analyze_one(uploaded):
    """Analyze one file with AI. Even if something goes wrong, it won't crash; the error is saved."""
    key = file_key(uploaded)
    suffix = Path(uploaded.name).suffix.lower()
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    start = time.time()
    try:
        tmp.write(uploaded.getvalue())
        tmp.close()
        invoice = extract_invoice(tmp.name)
        if invoice is None:
            raise ValueError("Could not get valid data from the AI. Please try again with a clearer image.")
        st.session_state["results"][key] = {
            "key": key,
            "name": uploaded.name,
            "invoice": invoice,
            "checks": run_all_checks(invoice),
            "elapsed": time.time() - start,
            "error": None,
        }
    except Exception as e:
        st.session_state["results"][key] = {
            "key": key,
            "name": uploaded.name,
            "invoice": None,
            "checks": [],
            "elapsed": time.time() - start,
            "error": str(e)[:300],
        }
    finally:
        # privacy: delete the temp file after the work is done
        Path(tmp.name).unlink(missing_ok=True)


def analyze_pending(files):
    """Analyze only the files that haven't been analyzed yet (or that previously had an error)."""
    results = st.session_state["results"]
    pending = [f for f in files if file_key(f) not in results or results[file_key(f)]["error"]]
    if not pending:
        st.toast("All files have already been analyzed.")
        return
    bar = st.progress(0.0, text="Starting...")
    for i, f in enumerate(pending, 1):
        bar.progress((i - 1) / len(pending), text=f"({i}/{len(pending)}) Reading {f.name}...")
        analyze_one(f)
        if i < len(pending):
            time.sleep(1)  # small gap to respect the free API rate limit
    bar.progress(1.0, text="Done!")


def status_of(res):
    if res is None:
        return "⏳ Pending"
    if res["error"]:
        return "⚠️ Error"
    if any(c.status == "fail" for c in res["checks"]):
        return "❌ Issues found"
    if any(c.status == "warn" for c in res["checks"]):
        return "🟡 Warning"
    return "✅ Valid"


def summary_df(files, dups) -> pd.DataFrame:
    rows = []
    for f in files:
        key = file_key(f)
        res = st.session_state["results"].get(key)
        row = {
            "File": f.name,
            "Vendor": "-",
            "Date": "-",
            "Currency": "-",
            "Total": None,
            "Status": status_of(res),
            "Duplicate of": dups.get(key, "-"),
            "Failed checks": "-",
            "Warnings": "-",
        }
        if res is not None and not res["error"]:
            inv = res["invoice"]
            failed = [c.check for c in res["checks"] if c.status == "fail"]
            warned = [c.check for c in res["checks"] if c.status == "warn"]
            row.update(
                {
                    "Vendor": inv.vendor_name or "-",
                    "Date": inv.date or "-",
                    "Currency": inv.currency or "-",
                    "Total": inv.total,
                    "Failed checks": "; ".join(failed) if failed else "-",
                    "Warnings": "; ".join(warned) if warned else "-",
                }
            )
        elif res is not None:
            row["Failed checks"] = res["error"]
        rows.append(row)
    return pd.DataFrame(rows)


def render_preview(uploaded):
    suffix = Path(uploaded.name).suffix.lower()
    if suffix == ".pdf":
        try:
            import fitz  # PyMuPDF

            doc = fitz.open(stream=uploaded.getvalue(), filetype="pdf")
            st.image(doc[0].get_pixmap(dpi=110).tobytes("png"), caption=f"Page 1 / {len(doc)}")
        except Exception:
            st.info(f"PDF uploaded: {uploaded.name}")
    else:
        st.image(uploaded)


def render_results(res):
    invoice, checks = res["invoice"], res["checks"]
    cur = invoice.currency

    passed = sum(c.status == "pass" for c in checks)
    failed = [c for c in checks if c.status == "fail"]
    warned = [c for c in checks if c.status == "warn"]
    skipped = sum(c.status == "skip" for c in checks)
    evaluable = passed + len(failed)
    score = int(100 * passed / evaluable) if evaluable else 0

    # ---------- Verdict banner ----------
    if failed:
        cls, color = "bad", "#EF4444"
        title = f"⚠️ {len(failed)} check(s) failed"
        msg = "The numbers on the bill do not match each other. Please review the document carefully."
    elif warned:
        cls, color = "warn", "#F59E0B"
        title = f"🟡 The math is correct, but there are {len(warned)} warning(s)"
        msg = "The numbers match, but a few things deserve your attention. See the Checks tab."
    else:
        cls, color = "ok", "#22C55E"
        title = "✅ All checks passed"
        msg = "The bill's calculations look correct."
    st.markdown(
        f'<div class="verdict {cls}"><h3>{title}</h3><p>{msg}</p>'
        f'<div class="bar"><div style="width:{score}%; background:{color};"></div></div>'
        f'<p style="margin-top:8px; font-size:0.8rem;">{passed} pass · {len(failed)} fail · {len(warned)} warning · {skipped} skip &nbsp;|&nbsp; '
        f'Health score: {score}% &nbsp;|&nbsp; {res["elapsed"]:.1f} sec</p></div>',
        unsafe_allow_html=True,
    )

    # ---------- Top stat cards ----------
    s1, s2 = st.columns(2)
    s1.markdown(stat_card("Vendor", esc(invoice.vendor_name)), unsafe_allow_html=True)
    s2.markdown(stat_card("Invoice No.", esc(invoice.invoice_number)), unsafe_allow_html=True)
    s3, s4 = st.columns(2)
    s3.markdown(stat_card("Date", esc(invoice.date)), unsafe_allow_html=True)
    s4.markdown(stat_card("Total", money(invoice.total, cur), big=True), unsafe_allow_html=True)

    sig = {True: "✍️ Signature found", False: "🚫 Signature not found", None: "❔ Signature unknown"}[invoice.has_signature]
    st.markdown(
        f'<span class="chip">{sig}</span><span class="chip">💱 {esc(invoice.currency)}</span>'
        f'<span class="chip">🧾 {len(invoice.line_items)} items</span>',
        unsafe_allow_html=True,
    )

    # ---------- Tabs ----------
    tab_sum, tab_items, tab_checks, tab_ins, tab_json = st.tabs(
        ["📊 Summary", "🛒 Items", "🔍 Checks", "💡 Insights", "{ } JSON"]
    )

    with tab_sum:
        st.markdown(receipt_html(invoice), unsafe_allow_html=True)

    df = pd.DataFrame([i.model_dump() for i in invoice.line_items])
    if not df.empty:
        df["description"] = df["description"].astype(str).str.replace("\n", " · ", regex=False)
        df = df.rename(
            columns={"description": "Description", "quantity": "Qty", "unit_price": "Rate", "amount": "Amount"}
        )

    with tab_items:
        if df.empty:
            st.info("No item lines found.")
        else:
            st.dataframe(
                df,
                hide_index=True,
                column_config={
                    "Qty": st.column_config.NumberColumn(format="%.2f"),
                    "Rate": st.column_config.NumberColumn(format="%.2f"),
                    "Amount": st.column_config.NumberColumn(format="%.2f"),
                },
            )

    with tab_checks:
        for c in checks:
            st.markdown(check_row(c), unsafe_allow_html=True)

    with tab_ins:
        render_bill_insights(invoice)

    with tab_json:
        st.json(invoice.model_dump())

    # ---------- Downloads ----------
    d1, d2 = st.columns(2)
    d1.download_button(
        "⬇️ Download JSON",
        data=invoice.model_dump_json(indent=2),
        file_name=f"{Path(res['name']).stem}.json",
        mime="application/json",
        key=f"json_{res['key']}",
    )
    d2.download_button(
        "⬇️ Download CSV (items)",
        data=df.to_csv(index=False),
        file_name=f"{Path(res['name']).stem}_items.csv",
        mime="text/csv",
        key=f"csv_{res['key']}",
    )


# ------------------------------------------------------------------
# Sidebar
# ------------------------------------------------------------------
with st.sidebar:
    st.markdown("### 🧾 DocuLens")
    st.caption("Multimodal Financial Document Analyzer")
    st.markdown(
        """
<div class="step"><div class="num">1</div><div class="txt"><b>Upload</b><span>One or more invoices / receipts (image or PDF)</span></div></div>
<div class="step"><div class="num">2</div><div class="txt"><b>Extract</b><span>Vision AI reads each bill and pulls out the data</span></div></div>
<div class="step"><div class="num">3</div><div class="txt"><b>Verify</b><span>Calculations, missing fields, signature and duplicate checks are run</span></div></div>
<div class="step"><div class="num">4</div><div class="txt"><b>Insights</b><span>Bill-wise and vendor / month-wise spending</span></div></div>
""",
        unsafe_allow_html=True,
    )
    st.markdown("---")
    st.markdown(
        f'<span class="chip">Python</span><span class="chip">Streamlit</span>'
        f'<span class="chip">Pydantic</span><span class="chip">{esc(GEMINI_MODEL)}</span>',
        unsafe_allow_html=True,
    )
    st.markdown("---")
    if st.button("🗑️ Clear all results"):
        st.session_state["results"] = {}
        st.rerun()
    st.caption(
        "Note: This tool checks the internal consistency of the numbers on a bill. "
        "It is not a fraud detector. Always verify important documents yourself as well."
    )

# ------------------------------------------------------------------
# Main page
# ------------------------------------------------------------------
st.markdown(
    '<div class="hero"><h1>🧾 DocuLens</h1>'
    "<p>Upload one or more invoices. The AI will extract the data and catch calculation errors.</p>"
    '<span class="badge">👁️ Vision AI</span><span class="badge">🧮 Auto Validation</span>'
    '<span class="badge">📚 Multi Upload</span><span class="badge">💡 Insights</span>'
    '<span class="badge">🔁 Duplicate Check</span><span class="badge">⚡ JSON / CSV Export</span></div>',
    unsafe_allow_html=True,
)

files = st.file_uploader(
    "Upload bills (JPG, PNG, WEBP or PDF). You can select multiple files at once.",
    type=["jpg", "jpeg", "png", "webp", "pdf"],
    accept_multiple_files=True,
)

if not files:
    f1, f2, f3 = st.columns(3)
    f1.markdown(
        '<div class="card feature"><div class="emoji">📤</div><h4>Upload</h4>'
        "<p>One or more bills, scanned or photographed, both work</p></div>",
        unsafe_allow_html=True,
    )
    f2.markdown(
        '<div class="card feature"><div class="emoji">🤖</div><h4>Extract</h4>'
        "<p>Vendor, date, items, tax and total automatically</p></div>",
        unsafe_allow_html=True,
    )
    f3.markdown(
        '<div class="card feature"><div class="emoji">🛡️</div><h4>Verify</h4>'
        "<p>Math mismatches, missing fields, signatures and duplicates flagged instantly</p></div>",
        unsafe_allow_html=True,
    )
else:
    # ---------- Analyze button ----------
    if st.button("✨ Analyze all", type="primary"):
        analyze_pending(files)

    results = st.session_state["results"]
    statuses = [status_of(results.get(file_key(f))) for f in files]
    n_done = sum(not s.startswith(("⏳", "⚠️")) for s in statuses)
    n_ok = sum(s.startswith("✅") for s in statuses)
    n_warn = sum(s.startswith("🟡") for s in statuses)
    n_bad = sum(s.startswith("❌") for s in statuses)
    n_err = sum(s.startswith("⚠️") for s in statuses)

    # Bills that have been analyzed (excluding errors), and duplicates among them
    ok_results = [
        results[file_key(f)]
        for f in files
        if file_key(f) in results and not results[file_key(f)]["error"]
    ]
    dups = find_duplicates(ok_results)

    m1, m2, m3, m4, m5 = st.columns(5)
    m1.markdown(stat_card("Files", len(files)), unsafe_allow_html=True)
    m2.markdown(stat_card("Analyzed", f"{n_done} / {len(files)}"), unsafe_allow_html=True)
    m3.markdown(stat_card("✅ Valid", n_ok), unsafe_allow_html=True)
    m4.markdown(stat_card("🟡 Warning", n_warn), unsafe_allow_html=True)
    m5.markdown(stat_card("❌ Issues / Error", n_bad + n_err), unsafe_allow_html=True)

    # ---------- Duplicate warning ----------
    if dups:
        pairs = ", ".join(f"`{results[k]['name']}` (same as: `{orig}`)" for k, orig in dups.items())
        st.warning(
            f"🔁 {len(dups)} duplicate bill(s) found: {pairs}. "
            "The same invoice seems to have been uploaded twice (vendor, invoice number and total are the same)."
        )

    # ---------- Summary table ----------
    st.markdown("#### 📋 Summary")
    sdf = summary_df(files, dups)
    st.dataframe(
        sdf,
        hide_index=True,
        column_config={"Total": st.column_config.NumberColumn(format="%.2f")},
    )

    if n_done:
        st.download_button(
            "⬇️ Download Summary CSV (all bills)",
            data=sdf.to_csv(index=False),
            file_name="summary.csv",
            mime="text/csv",
            key="summary_csv",
        )

    # ---------- Insights (all bills) ----------
    chart_results = ok_results
    if dups:
        hide_dups = st.toggle("Exclude duplicate bills from charts and spending", value=True)
        if hide_dups:
            chart_results = [r for r in ok_results if r["key"] not in dups]
    render_portfolio(chart_results)

    # ---------- Detail view ----------
    st.markdown("#### 🔎 Single bill detail")
    names = {file_key(f): f for f in files}
    chosen_key = st.selectbox(
        "Select a bill",
        options=list(names.keys()),
        format_func=lambda k: f"{status_of(results.get(k))}  {names[k].name}",
    )
    chosen = names[chosen_key]
    res = results.get(chosen_key)

    left, right = st.columns([1, 1.15], gap="large")
    with left:
        with st.container(border=True):
            st.markdown("#### 📄 Document")
            render_preview(chosen)

    with right:
        with st.container(border=True):
            st.markdown("#### 📊 Analysis")
            if res is None:
                st.info("This bill has not been analyzed yet.")
                if st.button("Analyze only this bill", key=f"one_{chosen_key}"):
                    with st.spinner("AI is reading the bill..."):
                        analyze_one(chosen)
                    st.rerun()
            elif res["error"]:
                st.error(f"Something went wrong: {res['error']}")
                if st.button("Try again", key=f"retry_{chosen_key}"):
                    with st.spinner("AI is reading the bill..."):
                        analyze_one(chosen)
                    st.rerun()
            else:
                render_results(res)
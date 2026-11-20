"""
api.py
------
FastAPI backend for DocuLens.
Run from project root: uvicorn app.api:app --reload --port 8000
"""
import tempfile
import time
from pathlib import Path
from typing import List

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.analytics import bill_insights, portfolio_analytics
from app.config import GEMINI_MODEL
from app.duplicates import find_duplicates
from app.schema import Invoice
from app.validators import run_all_checks
from app.vlm import MIME_TYPES, extract_invoice

app = FastAPI(title="DocuLens API", version="1.0.0")

# Allow local React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class BillRecord(BaseModel):
    key: str
    name: str
    invoice: Invoice


class BillsPayload(BaseModel):
    bills: List[BillRecord]


@app.get("/api/health")
def health():
    return {"status": "ok", "model": GEMINI_MODEL}


@app.post("/api/analyze")
async def analyze_bill(file: UploadFile = File(...)):
    filename = file.filename or "document"
    suffix = Path(filename).suffix.lower()
    if suffix not in MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {suffix}. Allowed: {', '.join(MIME_TYPES.keys())}",
        )

    content = await file.read()
    key = f"{filename}-{len(content)}"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    start = time.time()

    try:
        tmp.write(content)
        tmp.close()

        invoice = extract_invoice(tmp.name)
        if invoice is None:
            raise ValueError("Could not extract valid data from AI. Please try a clearer image.")

        checks = run_all_checks(invoice)
        insights = bill_insights(invoice)

        return {
            "key": key,
            "name": filename,
            "invoice": invoice.model_dump(),
            "checks": [c.model_dump() for c in checks],
            "insights": insights,
            "elapsed": round(time.time() - start, 2),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)[:300])
    finally:
        Path(tmp.name).unlink(missing_ok=True)


@app.post("/api/duplicates")
def check_duplicates(payload: BillsPayload):
    records = [
        {"key": b.key, "name": b.name, "invoice": b.invoice}
        for b in payload.bills
    ]
    dups = find_duplicates(records)
    return {"duplicates": dups}


@app.post("/api/portfolio")
def get_portfolio(payload: BillsPayload):
    records = [
        {"key": b.key, "name": b.name, "invoice": b.invoice}
        for b in payload.bills
    ]
    return portfolio_analytics(records)
import time
from typing import Any, List, Optional
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import MODEL_NAME
from app.vlm import extract_invoice
from app.validators import validate_invoice, generate_insights
from app.duplicates import find_duplicates
from app.analytics import compute_portfolio

app = FastAPI(title="DocuLens API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class BillItem(BaseModel):
    key: str
    name: str
    invoice: dict[str, Any]


class BillsPayload(BaseModel):
    bills: List[BillItem]


@app.get("/api/health")
def health():
    return {"status": "ok", "model": MODEL_NAME}


@app.post("/api/analyze")
async def analyze(file: UploadFile = File(...)):
    start = time.time()
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    try:
        invoice = extract_invoice(content, file.filename or "bill", file.content_type or "")
        checks = validate_invoice(invoice)
        insights = generate_insights(invoice)
        elapsed = round(time.time() - start, 2)

        return {
            "key": f"{file.filename}_{len(content)}",
            "name": file.filename,
            "invoice": invoice.model_dump() if hasattr(invoice, "model_dump") else invoice,
            "checks": checks,
            "insights": insights,
            "elapsed": elapsed,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/duplicates")
def duplicates(payload: BillsPayload):
    bills_data = [b.model_dump() for b in payload.bills]
    return {"duplicates": find_duplicates(bills_data)}


@app.post("/api/portfolio")
def portfolio(payload: BillsPayload):
    bills_data = [b.model_dump() for b in payload.bills]
    return compute_portfolio(bills_data)
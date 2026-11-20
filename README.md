# DocuLens

**Multimodal Financial Document Analyzer** — Extract structured data from invoices and receipts (JPG, PNG, WEBP, PDF), verify every calculation with deterministic code, flag duplicates, and track spending across vendors and months.

> **Core Principle:** *AI reads. Code verifies.* Vision AI extracts fields from messy bills, while plain Python rules independently re-check every line item, subtotal, tax, and total so the same bill always produces the same auditable verdict.

---

## Key Features

- **Structured Extraction:** Reads tilted phone photos, scans, and PDFs (English & Hindi) into a strict Pydantic schema (`vendor_name`, `invoice_number`, `date`, `currency`, `line_items`, `subtotal`, `discount`, `tax`, `total`, `has_signature`).
- **5-Point Deterministic Math Audit:**
  - Required fields presence (`vendor_name`, `date`, `total`)
  - Line-item math (`quantity × unit_price = amount`)
  - Subtotal check (`sum of line items = subtotal`)
  - Grand total check (`subtotal − discount + tax = total`)
  - Signature / stamp verification
- **Duplicate Detection:** Flags duplicate invoices across batches by matching normalized vendor names, invoice numbers, and totals.
- **Interactive Bill Inspector:** Side-by-side document viewer (zoom, rotate, PDF preview) with inline field editing and instant live check recalculation.
- **Multi-Currency Spend Analytics:** Separates currencies cleanly to visualize vendor-wise and month-wise spending, tax totals, and top vendor share, with a toggle to exclude duplicates.
- **One-Click Exports:** Download individual invoice JSONs, itemized CSVs, or a full batch summary CSV.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Python, FastAPI, Uvicorn, Pydantic |
| **AI / Extraction** | Multimodal Vision LLM (configured via `.env`) |
| **Frontend** | React, Vite, Recharts, Lucide React |
| **Design System** | Custom **Ledger** UI (Paper `#FBF7F0`, Ink `#0E1B3D`, Cobalt `#2F4BFF`, Marigold `#FFB400`, Fraunces + Inter + JetBrains Mono) |

---

## Project Structure

```text
doculens/
├── app/
│   ├── api.py            # FastAPI endpoints (/api/health, /api/analyze, /api/duplicates, /api/portfolio)
│   ├── config.py         # Environment & model configuration
│   ├── schema.py         # Pydantic invoice data models
│   ├── vlm.py            # Vision LLM extraction logic with retry handling
│   ├── validators.py     # Deterministic math & field validation rules
│   ├── duplicates.py     # Cross-bill duplicate detection
│   └── analytics.py      # Currency-grouped vendor & monthly spend aggregation
├── frontend/
│   ├── src/
│   │   ├── components/   # LandingPage, Sidebar, Uploader, SummaryTable, BillDetail, Portfolio
│   │   ├── api.js        # Backend API client
│   │   ├── utils.js      # Formatting, CSV/JSON export, live check recalculation
│   │   ├── App.jsx       # Application state & workspace routing
│   │   └── styles.css    # Ledger design system styles
│   └── vite.config.js    # Dev server & FastAPI proxy config
├── data/samples/         # Sample test invoices
├── tests/                # Validation & unit tests
├── .env.example          # Sample environment variables
└── requirements.txt      # Python dependencies
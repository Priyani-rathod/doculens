import sys
import time
from pathlib import Path

from google import genai
from google.genai import errors, types

from app.config import GEMINI_API_KEY, GEMINI_MODEL, SAMPLES_DIR, check_config
from app.schema import Invoice

# File type ke hisaab se mime type
MIME_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
}

# Inn errors par dobara try karna sahi hai (limit ya server busy)
RETRY_CODES = {429, 500, 502, 503, 504}

PROMPT = """
You are an expert financial document reader.
Look at this invoice/receipt carefully and extract the data.

Rules:
- Extract ONLY what is actually visible in the document.
- If a field is not present, leave it null. Never guess or invent values.
- Numbers must be plain numbers (no currency symbols, no commas).
- Date must be in YYYY-MM-DD format.
- For has_signature: true only if a handwritten signature or stamp is visible.
- For discount: the total discount amount as a positive number. Null if the document has no discount.
- For tax: the total tax amount. If the bill lists taxes separately (for example CGST and SGST), add them together.
- For tax_rate: only if a tax percentage is printed on the bill. Otherwise null.
"""


def extract_invoice(file_path: str) -> Invoice:
    """Bill ki image/PDF Gemini ko bhejo aur Invoice object wapas lo."""
    check_config()

    path = Path(file_path)
    mime_type = MIME_TYPES.get(path.suffix.lower())
    if mime_type is None:
        raise ValueError(f"Ye file type supported nahi hai: {path.suffix}")

    file_bytes = path.read_bytes()

    client = genai.Client(api_key=GEMINI_API_KEY)

    max_tries = 4
    for attempt in range(1, max_tries + 1):
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=[
                    types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
                    PROMPT,
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=Invoice,
                    temperature=0,
                ),
            )
            return response.parsed
        except errors.APIError as e:
            code = getattr(e, "code", None)
            # Galat key jaise errors par retry ka fayda nahi, turant dikha do
            if code not in RETRY_CODES or attempt == max_tries:
                raise
            wait = 20 * attempt if code == 429 else 5 * attempt
            reason = "API ki limit lag gayi" if code == 429 else "Server busy hai"
            print(f"{reason} (error {code}, try {attempt}/{max_tries}). {wait} second baad dobara try karunga...")
            time.sleep(wait)


if __name__ == "__main__":
    # Command line se file path do, ya samples folder ki pehli file lo
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    else:
        files = [f for f in SAMPLES_DIR.iterdir() if f.suffix.lower() in MIME_TYPES]
        if not files:
            raise SystemExit("data/samples/ mein koi bill nahi mila. Pehle ek image daalo.")
        file_path = str(files[0])

    print(f"Processing: {file_path}\n")
    invoice = extract_invoice(file_path)
    print(invoice.model_dump_json(indent=2))
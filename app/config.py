import os
from pathlib import Path

from dotenv import load_dotenv

# .env file se secrets load karo (local machine par)
load_dotenv()

# Project ke important folders
BASE_DIR = Path(__file__).resolve().parent.parent
SAMPLES_DIR = BASE_DIR / "data" / "samples"
TEST_BILLS_DIR = BASE_DIR / "data" / "test_bills"
OUTPUTS_DIR = BASE_DIR / "data" / "outputs"


def _get_secret(name: str):
    """Pehle environment/.env dekho, phir Streamlit Secrets (deploy ke liye)."""
    value = os.getenv(name)
    if value:
        return value
    try:
        import streamlit as st

        return st.secrets.get(name)
    except Exception:
        return None


# API key
GEMINI_API_KEY = _get_secret("GEMINI_API_KEY")

# Model ka naam (.env mein GEMINI_MODEL likh ke bhi badal sakti ho)
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")


def check_config():
    """Check karo ki API key set hai ya nahi."""
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY nahi mili. .env file ya Streamlit Secrets check karo.")
    return True
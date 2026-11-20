const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export async function fetchHealth() {
  const res = await fetch(`${BASE}/api/health`);
  if (!res.ok) throw new Error('API offline');
  return res.json();
}

export async function analyzeBill(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/api/analyze`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Analysis failed');
  }
  return res.json();
}

export async function fetchDuplicates(bills) {
  const res = await fetch(`${BASE}/api/duplicates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bills }),
  });
  if (!res.ok) throw new Error('Duplicate check failed');
  return res.json();
}

export async function fetchPortfolio(bills) {
  const res = await fetch(`${BASE}/api/portfolio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bills }),
  });
  if (!res.ok) throw new Error('Portfolio failed');
  return res.json();
}
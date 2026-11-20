async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `Request failed (${res.status})`);
  }
  return data;
}

export async function fetchHealth() {
  const res = await fetch('/api/health');
  return handleResponse(res);
}

export async function analyzeBill(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/analyze', {
    method: 'POST',
    body: form,
  });
  return handleResponse(res);
}

export async function fetchDuplicates(bills) {
  const res = await fetch('/api/duplicates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bills }),
  });
  return handleResponse(res);
}

export async function fetchPortfolio(bills) {
  const res = await fetch('/api/portfolio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bills }),
  });
  return handleResponse(res);
}
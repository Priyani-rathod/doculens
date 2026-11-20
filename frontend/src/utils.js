export const SYMBOLS = { USD: '$', INR: '₹', EUR: '€', GBP: '£', JPY: '¥' };

export function money(x, currency) {
  if (x === null || x === undefined || x === '' || Number.isNaN(Number(x))) return '-';
  const cur = (currency || '').toUpperCase();
  const symbol = SYMBOLS[cur] || (cur ? `${cur} ` : '');
  return `${symbol}${Number(x).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function fileKey(file) {
  return `${file.name}-${file.size}`;
}

export function statusOf(res) {
  if (!res) return { label: 'Pending', emoji: '⏳', type: 'pending' };
  if (res.error) return { label: 'Error', emoji: '⚠️', type: 'error' };
  if (res.checks.some((c) => c.status === 'fail')) return { label: 'Issues', emoji: '❌', type: 'fail' };
  if (res.checks.some((c) => c.status === 'warn')) return { label: 'Warning', emoji: '🟡', type: 'warn' };
  return { label: 'Valid', emoji: '✅', type: 'ok' };
}

export function downloadText(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function toCSV(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    const str = val === null || val === undefined ? '' : String(val);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  return [
    headers.map(escape).join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');
}

/** Re-run validation checks instantly after inline editing */
export function recomputeChecks(inv) {
  const TOL = 0.02;
  const close = (a, b) => Math.abs(a - b) <= TOL;
  const checks = [];

  // 1. Required fields
  for (const [name, val] of [
    ['vendor_name', inv.vendor_name],
    ['date', inv.date],
    ['total', inv.total],
  ]) {
    if (val === null || val === undefined || val === '') {
      checks.push({ check: `Field: ${name}`, status: 'fail', details: `${name} is missing` });
    } else {
      checks.push({ check: `Field: ${name}`, status: 'pass', details: `${name} found` });
    }
  }

  // 2. Line items
  (inv.line_items || []).forEach((item, idx) => {
    const label = `Line ${idx + 1}: qty x rate`;
    if (item.quantity == null || item.unit_price == null || item.amount == null) {
      checks.push({ check: label, status: 'skip', details: 'Some values are missing, cannot verify' });
    } else {
      const exp = Number((item.quantity * item.unit_price).toFixed(2));
      if (close(exp, item.amount)) {
        checks.push({ check: label, status: 'pass', details: `${item.quantity} x ${item.unit_price} = ${exp}` });
      } else {
        checks.push({ check: label, status: 'fail', details: `Expected ${exp}, bill shows ${item.amount}` });
      }
    }
  });

  // 3. Subtotal
  const amounts = (inv.line_items || []).map((i) => i.amount).filter((a) => a != null);
  if (inv.subtotal == null || !amounts.length) {
    checks.push({ check: 'Subtotal = sum of items', status: 'skip', details: 'Subtotal or item amounts are missing' });
  } else {
    const exp = Number(amounts.reduce((s, a) => s + a, 0).toFixed(2));
    checks.push(
      close(exp, inv.subtotal)
        ? { check: 'Subtotal = sum of items', status: 'pass', details: `Sum = ${exp}` }
        : { check: 'Subtotal = sum of items', status: 'fail', details: `Sum is ${exp}, bill shows subtotal ${inv.subtotal}` }
    );
  }

  // 4. Total
  if (inv.subtotal == null || inv.total == null) {
    checks.push({ check: 'Total = subtotal - discount + tax', status: 'skip', details: 'Subtotal or total is missing' });
  } else {
    const disc = inv.discount || 0;
    const tax = inv.tax || 0;
    const exp = Number((inv.subtotal - disc + tax).toFixed(2));
    checks.push(
      close(exp, inv.total)
        ? { check: 'Total = subtotal - discount + tax', status: 'pass', details: `${inv.subtotal} - ${disc} + ${tax} = ${exp}` }
        : { check: 'Total = subtotal - discount + tax', status: 'fail', details: `Expected ${exp}, bill shows ${inv.total}` }
    );
  }

  // 5. Signature
  if (inv.has_signature === null || inv.has_signature === undefined) {
    checks.push({ check: 'Signature / stamp', status: 'skip', details: 'AI could not determine if a signature is present' });
  } else if (inv.has_signature) {
    checks.push({ check: 'Signature / stamp', status: 'pass', details: 'Signature or stamp detected' });
  } else {
    checks.push({
      check: 'Signature / stamp',
      status: 'warn',
      details: 'No signature or stamp found. Please verify if this document requires one.',
    });
  }

  return checks;
}
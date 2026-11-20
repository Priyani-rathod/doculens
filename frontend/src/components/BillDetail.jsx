import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Code2,
  Download,
  FileText,
  Lightbulb,
  List,
  MinusCircle,
  Pencil,
  Receipt,
  RefreshCw,
  RotateCw,
  ShieldCheck,
  Sparkles,
  X,
  XCircle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { downloadText, money, toCSV } from '../utils';

export default function BillDetail({
  files,
  currentIndex,
  onSelectIndex,
  result,
  busy,
  onAnalyzeOne,
  onUpdateInvoice,
}) {
  const file = files[currentIndex] || null;
  const [tab, setTab] = useState('checks');
  const [previewUrl, setPreviewUrl] = useState('');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setZoom(1);
    setRotation(0);
    setEditing(false);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!file) {
    return <div className="card">No bill selected. Upload a bill in Upload & Queue first.</div>;
  }

  const isPdf = file.name.toLowerCase().endsWith('.pdf');

  const startEdit = () => {
    const inv = result.invoice;
    setDraft({
      vendor_name: inv.vendor_name ?? '',
      invoice_number: inv.invoice_number ?? '',
      date: inv.date ?? '',
      currency: inv.currency ?? '',
      subtotal: inv.subtotal ?? '',
      discount: inv.discount ?? '',
      tax: inv.tax ?? '',
      total: inv.total ?? '',
    });
    setEditing(true);
  };

  const saveEdit = () => {
    const toNum = (v) => (v === '' || v === null ? null : Number(v));
    const updated = {
      ...result.invoice,
      vendor_name: draft.vendor_name.trim() || null,
      invoice_number: draft.invoice_number.trim() || null,
      date: draft.date.trim() || null,
      currency: draft.currency.trim().toUpperCase() || null,
      subtotal: toNum(draft.subtotal),
      discount: toNum(draft.discount),
      tax: toNum(draft.tax),
      total: toNum(draft.total),
    };
    onUpdateInvoice(result.key, updated);
    setEditing(false);
  };

  const renderCheckIcon = (status) => {
    if (status === 'pass') return <CheckCircle2 size={16} color="var(--ok)" strokeWidth={1.75} />;
    if (status === 'fail') return <XCircle size={16} color="var(--bad)" strokeWidth={1.75} />;
    if (status === 'warn') return <AlertTriangle size={16} color="var(--warn)" strokeWidth={1.75} />;
    return <MinusCircle size={16} color="var(--muted)" strokeWidth={1.75} />;
  };

  const renderAnalysis = () => {
    if (!result) {
      return (
        <div style={{ textAlign: 'center', padding: '44px 12px' }}>
          <p style={{ color: 'var(--muted)', marginBottom: 16 }}>This bill has not been analyzed yet.</p>
          <button className="btn-cobalt" disabled={busy} onClick={() => onAnalyzeOne(file)}>
            <Sparkles size={15} /> Analyze this bill
          </button>
        </div>
      );
    }

    if (result.error) {
      return (
        <div>
          <div className="verdict bad">
            <h3>Analysis failed</h3>
            <p className="mono">{result.error}</p>
          </div>
          <button className="btn" disabled={busy} onClick={() => onAnalyzeOne(file)}>
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      );
    }

    const { invoice: inv, checks, insights, elapsed } = result;
    const cur = inv.currency;
    const passed = checks.filter((c) => c.status === 'pass').length;
    const failed = checks.filter((c) => c.status === 'fail');
    const warned = checks.filter((c) => c.status === 'warn');
    const evaluable = passed + failed.length;
    const score = evaluable ? Math.round((100 * passed) / evaluable) : 0;

    let vCls = 'ok', vColor = 'var(--ok)', vTitle = 'All checks passed', stampText = 'VERIFIED', stampCls = 'verified';
    let vMsg = 'Every line item, subtotal, and total agrees.';
    if (failed.length) {
      vCls = 'bad'; vColor = 'var(--bad)';
      vTitle = `${failed.length} check(s) failed`;
      vMsg = failed[0].details;
      stampText = 'FLAGGED';
      stampCls = 'flagged';
    } else if (warned.length) {
      vCls = 'warn'; vColor = 'var(--warn)';
      vTitle = `Math verified, ${warned.length} warning(s)`;
      vMsg = warned[0].details;
      stampText = 'REVIEW';
      stampCls = 'flagged';
    }

    const calcTotal =
      inv.subtotal != null && inv.total != null
        ? Number((inv.subtotal - (inv.discount || 0) + (inv.tax || 0)).toFixed(2))
        : null;
    const calcGood = calcTotal !== null && Math.abs(calcTotal - inv.total) <= 0.02;

    const stem = file.name.replace(/\.[^.]+$/, '');
    const handleJson = () => downloadText(JSON.stringify(inv, null, 2), `${stem}.json`, 'application/json');
    const handleCsv = () => {
      const rows = (inv.line_items || []).map((i) => ({
        Description: (i.description || '').replace(/\n/g, ' · '),
        Qty: i.quantity ?? '',
        Rate: i.unit_price ?? '',
        Amount: i.amount ?? '',
      }));
      downloadText(toCSV(rows), `${stem}_items.csv`, 'text/csv;charset=utf-8;');
    };

    const tabs = [
      { id: 'summary', label: 'Summary', Icon: Receipt },
      { id: 'items', label: 'Items', Icon: List },
      { id: 'checks', label: 'Checks', Icon: ShieldCheck },
      { id: 'insights', label: 'Insights', Icon: Lightbulb },
      { id: 'json', label: 'JSON', Icon: Code2 },
    ];

    return (
      <>
        <div className={`verdict ${vCls}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <h3>{vTitle}</h3>
              <p className="mono" style={{ fontSize: 12 }}>{vMsg}</p>
            </div>
            <span className={`stamp ${stampCls}`}>{stampText}</span>
          </div>
          <div className="bar">
            <div style={{ width: `${score}%`, background: vColor }} />
          </div>
          <p className="mono" style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
            {passed} of {checks.length} checks passed · {elapsed}s
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <span className="chip">{inv.has_signature === true ? 'Signed' : inv.has_signature === false ? 'No signature' : 'Signature unknown'}</span>
            <span className="chip mono">{inv.currency || 'NA'}</span>
            <span className="chip mono">{(inv.line_items || []).length} items</span>
          </div>
          {!editing ? (
            <button className="btn btn-sm" onClick={startEdit}>
              <Pencil size={13} /> Edit values
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn-cobalt btn-sm" onClick={saveEdit}>
                <Check size={13} /> Save
              </button>
              <button className="btn btn-sm" onClick={() => setEditing(false)}>
                <X size={13} /> Cancel
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="card" style={{ background: 'var(--paper)', marginBottom: 12 }}>
            <div className="grid-2">
              {[
                ['vendor_name', 'Vendor Name', 'text'],
                ['invoice_number', 'Invoice No.', 'text'],
                ['date', 'Date (YYYY-MM-DD)', 'text'],
                ['currency', 'Currency', 'text'],
                ['subtotal', 'Subtotal', 'number'],
                ['discount', 'Discount', 'number'],
                ['tax', 'Tax', 'number'],
                ['total', 'Total', 'number'],
              ].map(([field, label, type]) => (
                <div className="edit-field" key={field}>
                  <label>{label}</label>
                  <input
                    className="input"
                    type={type}
                    step="any"
                    value={draft[field]}
                    onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid-4" style={{ marginBottom: 8 }}>
            <div className="card" style={{ padding: '12px 14px', marginBottom: 0 }}>
              <div className="stat-label">Vendor</div>
              <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>{inv.vendor_name || '-'}</div>
            </div>
            <div className="card" style={{ padding: '12px 14px', marginBottom: 0 }}>
              <div className="stat-label">Invoice</div>
              <div className="mono" style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>{inv.invoice_number || '-'}</div>
            </div>
            <div className="card" style={{ padding: '12px 14px', marginBottom: 0 }}>
              <div className="stat-label">Date</div>
              <div className="mono" style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>{inv.date || '-'}</div>
            </div>
            <div className="card" style={{ padding: '12px 14px', marginBottom: 0 }}>
              <div className="stat-label">Total</div>
              <div className="mono" style={{ fontWeight: 700, fontSize: 14, marginTop: 4, color: 'var(--cobalt)' }}>
                {money(inv.total, cur)}
              </div>
            </div>
          </div>
        )}

        <div className="tabs">
          {tabs.map(({ id, label, Icon }) => (
            <button key={id} className={`tab-btn ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
              <Icon size={14} strokeWidth={1.75} /> {label}
            </button>
          ))}
        </div>

        {tab === 'summary' && (
          <table className="receipt" style={{ marginBottom: 14 }}>
            <tbody>
              <tr><td>Subtotal</td><td>{money(inv.subtotal, cur)}</td></tr>
              {inv.discount ? <tr><td>Discount</td><td style={{ color: 'var(--ok)' }}>− {money(inv.discount, cur)}</td></tr> : null}
              {inv.tax != null ? (
                <tr>
                  <td>Tax{inv.tax_rate != null ? ` (${inv.tax_rate}%)` : ''}</td>
                  <td>+ {money(inv.tax, cur)}</td>
                </tr>
              ) : null}
              <tr className="total"><td>Total (on bill)</td><td>{money(inv.total, cur)}</td></tr>
              {calcTotal !== null && (
                <tr className={`calc ${calcGood ? 'good' : 'bad'}`}>
                  <td>Calculated total</td>
                  <td>{money(calcTotal, cur)}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {tab === 'items' && (
          <div className="table-wrap" style={{ marginBottom: 14 }}>
            {(inv.line_items || []).length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>No item lines found.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
                </thead>
                <tbody>
                  {inv.line_items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{(item.description || '').replace(/\n/g, ' · ')}</td>
                      <td className="mono">{item.quantity ?? '-'}</td>
                      <td className="mono">{item.unit_price ?? '-'}</td>
                      <td className="mono">{item.amount ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'checks' && (
          <div style={{ marginBottom: 14 }}>
            {checks.map((c, idx) => (
              <div key={idx} className={`check ${c.status}`}>
                <div style={{ marginTop: 2 }}>{renderCheckIcon(c.status)}</div>
                <div>
                  <div className="check-title">{c.check}</div>
                  <div className="check-detail">{c.details}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'insights' && (
          <div style={{ marginBottom: 14 }}>
            {(insights || []).length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>Not enough numeric data for insights.</p>
            ) : (
              insights.map((ins, idx) => (
                <div key={idx} className="check" style={{ fontSize: 13 }}>
                  {ins.text}
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'json' && <pre className="json-box">{JSON.stringify(inv, null, 2)}</pre>}

        <div className="grid-2" style={{ marginTop: 12 }}>
          <button className="btn btn-full" onClick={handleJson}>
            <Download size={14} /> Export JSON
          </button>
          <button className="btn btn-full" onClick={handleCsv}>
            <Download size={14} /> Export Items CSV
          </button>
        </div>
      </>
    );
  };

  return (
    <div>
      <div className="toolbar" style={{ marginBottom: 14 }}>
        <div className="mono" style={{ fontSize: 13, color: 'var(--muted)' }}>
          Bill Inspector / <strong style={{ color: 'var(--ink)' }}>{file.name}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-sm" disabled={currentIndex <= 0} onClick={() => onSelectIndex(currentIndex - 1)}>
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
            {currentIndex + 1} / {files.length}
          </span>
          <button
            className="btn btn-sm"
            disabled={currentIndex >= files.length - 1}
            onClick={() => onSelectIndex(currentIndex + 1)}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card">
          <div className="viewer-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <FileText size={16} color="var(--cobalt)" />
              <strong style={{ fontSize: 14 }}>Document</strong>
            </div>
            {!isPdf && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-sm" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>
                  <ZoomOut size={14} />
                </button>
                <button className="btn btn-sm mono" onClick={() => setZoom(1)}>
                  {Math.round(zoom * 100)}%
                </button>
                <button className="btn btn-sm" onClick={() => setZoom((z) => Math.min(3, z + 0.25))}>
                  <ZoomIn size={14} />
                </button>
                <button className="btn btn-sm" onClick={() => setRotation((r) => (r + 90) % 360)}>
                  <RotateCw size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="viewer-stage">
            {previewUrl ? (
              isPdf ? (
                <iframe src={previewUrl} title={file.name} className="viewer-pdf" />
              ) : (
                <img
                  src={previewUrl}
                  alt={file.name}
                  className="viewer-img"
                  style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                />
              )
            ) : (
              <span style={{ color: 'var(--muted)' }}>Loading preview...</span>
            )}
          </div>
        </div>

        <div className="card">{renderAnalysis()}</div>
      </div>
    </div>
  );
}
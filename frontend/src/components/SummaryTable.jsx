import { useMemo, useState } from 'react';
import { ArrowUpDown, Download, Eye, RefreshCw, Search, X } from 'lucide-react';
import { downloadText, fileKey, money, statusOf, toCSV } from '../utils';

export default function SummaryTable({
  files,
  results,
  duplicates,
  busy,
  onInspect,
  onReanalyze,
  onRemove,
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState({ field: null, dir: 'desc' });

  const rows = useMemo(() => {
    return files.map((f) => {
      const key = fileKey(f);
      const res = results[key];
      const st = statusOf(res);
      const inv = res && !res.error ? res.invoice : null;
      const failed = inv ? res.checks.filter((c) => c.status === 'fail').map((c) => c.check) : [];

      return {
        file: f,
        key,
        name: f.name,
        vendor: inv?.vendor_name || '-',
        date: inv?.date || '-',
        currency: inv?.currency || '-',
        total: inv?.total ?? null,
        status: st,
        duplicateOf: duplicates[key] || '-',
        failedText: res?.error ? res.error : failed.length ? failed.join('; ') : '-',
      };
    });
  }, [files, results, duplicates]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows.filter((r) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'fail' ? r.status.type === 'fail' || r.status.type === 'error' : r.status.type === filter);
      const matchesSearch =
        !q || r.name.toLowerCase().includes(q) || r.vendor.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });

    if (sortBy.field) {
      list = [...list].sort((a, b) => {
        const av = a[sortBy.field] ?? '';
        const bv = b[sortBy.field] ?? '';
        const cmp =
          typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av).localeCompare(String(bv));
        return sortBy.dir === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  }, [rows, search, filter, sortBy]);

  const toggleSort = (field) => {
    setSortBy((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { field, dir: 'desc' }
    );
  };

  const handleExport = () => {
    const data = filtered.map((r) => ({
      File: r.name,
      Vendor: r.vendor,
      Date: r.date,
      Currency: r.currency,
      Total: r.total ?? '',
      Status: r.status.label,
      'Duplicate of': r.duplicateOf,
      'Failed checks': r.failedText,
    }));
    downloadText(toCSV(data), 'summary.csv', 'text/csv;charset=utf-8;');
  };

  return (
    <div className="card fade-up">
      <div className="toolbar">
        <div className="pills">
          {[
            ['all', `All (${rows.length})`],
            ['ok', 'Valid'],
            ['warn', 'Warning'],
            ['fail', 'Issues'],
            ['pending', 'Pending'],
          ].map(([id, label]) => (
            <button
              key={id}
              className={`pill ${filter === id ? 'active' : ''}`}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--muted)' }} />
            <input
              className="input"
              style={{ paddingLeft: 30, width: 220 }}
              placeholder="Search vendor or file..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn" onClick={handleExport} disabled={filtered.length === 0}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>File</th>
              <th>Vendor</th>
              <th className="sortable" onClick={() => toggleSort('date')}>
                Date <ArrowUpDown size={12} />
              </th>
              <th className="sortable" onClick={() => toggleSort('total')}>
                Total <ArrowUpDown size={12} />
              </th>
              <th>Status</th>
              <th>Duplicate</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 28 }}>
                  No matching bills found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.key} style={{ cursor: 'pointer' }} onClick={() => onInspect(r.key)}>
                  <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.name}</td>
                  <td>{r.vendor}</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{r.date}</td>
                  <td style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {r.total !== null ? money(r.total, r.currency) : '-'}
                  </td>
                  <td>
                    <span className={`status-pill ${r.status.type}`}>
                      <span className="status-dot" />
                      {r.status.label}
                    </span>
                  </td>
                  <td>{r.duplicateOf}</td>
                  <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button className="btn btn-sm" onClick={() => onInspect(r.key)}>
                        <Eye size={13} /> Inspect
                      </button>
                      <button
                        className="btn btn-sm"
                        title="Re-analyze"
                        disabled={busy}
                        onClick={() => onReanalyze(r.file)}
                      >
                        <RefreshCw size={13} />
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        title="Remove file"
                        disabled={busy}
                        onClick={() => onRemove(r.key)}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
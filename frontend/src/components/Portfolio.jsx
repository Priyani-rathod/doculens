import { useEffect, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { money } from '../utils';

export default function Portfolio({ data, hasDuplicates, hideDuplicates, onToggleDuplicates }) {
  const currencies = Object.keys(data?.currencies || {});
  const [activeCur, setActiveCur] = useState(currencies[0] || '');

  useEffect(() => {
    if (currencies.length && !currencies.includes(activeCur)) {
      setActiveCur(currencies[0]);
    }
  }, [currencies, activeCur]);

  const block = data?.currencies?.[activeCur];

  return (
    <div>
      {/* Controls Bar */}
      <div className="toolbar" style={{ marginBottom: 18 }}>
        <div className="pills">
          {currencies.map((cur) => (
            <button
              key={cur}
              className={`pill ${activeCur === cur ? 'active' : ''}`}
              onClick={() => setActiveCur(cur)}
            >
              {cur}
            </button>
          ))}
        </div>

        {hasDuplicates && (
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: 'var(--ink)',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={hideDuplicates}
              onChange={(e) => onToggleDuplicates(e.target.checked)}
            />
            Exclude duplicates
          </label>
        )}
      </div>

      {!block ? (
        <div className="card">
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            {data?.message || 'Analyze at least 2 bills to view vendor and monthly charts.'}
          </p>
        </div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="grid-4" style={{ marginBottom: 16 }}>
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="stat-label">Bills</div>
              <div className="stat-value">{block.count}</div>
            </div>
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="stat-label">Total spend</div>
              <div className="stat-value">{money(block.total_spend, activeCur)}</div>
            </div>
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="stat-label">Average bill</div>
              <div className="stat-value">{money(block.avg_bill, activeCur)}</div>
            </div>
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="stat-label">Total tax</div>
              <div className="stat-value">{money(block.total_tax, activeCur)}</div>
            </div>
          </div>

          {/* Marigold Insight Callout */}
          {block.top_vendor && (
            <div className="marigold-callout">
              <Lightbulb size={17} color="#b45309" strokeWidth={1.75} />
              <span>
                <strong>{block.top_vendor.vendor}</strong> is your biggest vendor:{' '}
                <strong className="mono">{money(block.top_vendor.total, activeCur)}</strong>,{' '}
                {block.top_vendor.share_pct}% of spend.
              </span>
            </div>
          )}

          {/* Side-by-side Charts (7:5 ratio) */}
          <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 16 }}>
            <div className="card" style={{ marginBottom: 0 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Spend by vendor</h3>
              <div style={{ width: '100%', height: Math.max(250, block.by_vendor.length * 46) }}>
                <ResponsiveContainer>
                  <BarChart data={block.by_vendor} layout="vertical" margin={{ left: 10, right: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7dfd0" horizontal={false} />
                    <XAxis type="number" stroke="#5b6478" fontSize={12} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="vendor"
                      stroke="#0e1b3d"
                      fontSize={12}
                      width={130}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#ffffff',
                        border: '1px solid #e7dfd0',
                        borderRadius: 8,
                        color: '#0e1b3d',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 12,
                      }}
                      formatter={(v) => money(v, activeCur)}
                    />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                      {block.by_vendor.map((_, index) => (
                        <Cell key={index} fill={index === 0 ? '#FFB400' : '#2F4BFF'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 0 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Spend by month</h3>
              {block.by_month.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                  No valid dates found to build the monthly chart.
                </p>
              ) : (
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <BarChart data={block.by_month} margin={{ left: 4, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7dfd0" vertical={false} />
                      <XAxis dataKey="month" stroke="#5b6478" fontSize={12} tickLine={false} />
                      <YAxis stroke="#5b6478" fontSize={12} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: '#ffffff',
                          border: '1px solid #e7dfd0',
                          borderRadius: 8,
                          color: '#0e1b3d',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 12,
                        }}
                        formatter={(v) => money(v, activeCur)}
                      />
                      <Bar dataKey="total" fill="#2F4BFF" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {block.missing_dates > 0 && (
                <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 10, marginBottom: 0 }}>
                  {block.missing_dates} bill(s) have no date and are not shown.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
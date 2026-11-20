import { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { analyzeBill, fetchDuplicates, fetchHealth, fetchPortfolio } from './api';
import { fileKey, recomputeChecks, statusOf } from './utils';
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import Uploader from './components/Uploader';
import SummaryTable from './components/SummaryTable';
import Portfolio from './components/Portfolio';
import BillDetail from './components/BillDetail';

export default function App() {
  const [page, setPage] = useState('landing'); // 'landing' | 'app'
  const [activeView, setActiveView] = useState('queue'); // 'queue' | 'inspector' | 'analytics'
  const [model, setModel] = useState('');
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState({});
  const [duplicates, setDuplicates] = useState({});
  const [portfolio, setPortfolio] = useState(null);
  const [hideDups, setHideDups] = useState(true);
  const [selectedKey, setSelectedKey] = useState('');
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    fetchHealth()
      .then((d) => setModel(d.model))
      .catch(() => setModel('API offline'));
  }, []);

  const okBills = useMemo(() => {
    return files
      .map((f) => results[fileKey(f)])
      .filter((r) => r && !r.error)
      .map((r) => ({ key: r.key, name: r.name, invoice: r.invoice }));
  }, [files, results]);

  useEffect(() => {
    if (okBills.length < 2) {
      setDuplicates({});
      return;
    }
    fetchDuplicates(okBills)
      .then((d) => setDuplicates(d.duplicates || {}))
      .catch(() => setDuplicates({}));
  }, [okBills]);

  useEffect(() => {
    const chartBills = hideDups ? okBills.filter((b) => !duplicates[b.key]) : okBills;
    if (chartBills.length < 2) {
      setPortfolio({ currencies: {}, message: 'Analyze at least 2 bills to view vendor and monthly charts.' });
      return;
    }
    fetchPortfolio(chartBills)
      .then(setPortfolio)
      .catch(() => setPortfolio(null));
  }, [okBills, duplicates, hideDups]);

  const handleFilesSelected = (incoming) => {
    setFiles((prev) => {
      const existing = new Set(prev.map(fileKey));
      const merged = [...prev, ...incoming.filter((f) => !existing.has(fileKey(f)))];
      if (!selectedKey && merged.length) setSelectedKey(fileKey(merged[0]));
      return merged;
    });
  };

  const analyzeOne = async (file) => {
    const key = fileKey(file);
    setProgress({ done: 0, total: 1, current: file.name });
    try {
      const data = await analyzeBill(file);
      setResults((prev) => ({ ...prev, [key]: { ...data, error: null } }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [key]: { key, name: file.name, invoice: null, checks: [], insights: [], error: err.message },
      }));
    } finally {
      setProgress(null);
    }
  };

  const analyzeAll = async () => {
    const pending = files.filter((f) => {
      const r = results[fileKey(f)];
      return !r || r.error;
    });
    if (!pending.length) return;

    for (let i = 0; i < pending.length; i++) {
      const f = pending[i];
      const key = fileKey(f);
      setProgress({ done: i, total: pending.length, current: f.name });
      try {
        const data = await analyzeBill(f);
        setResults((prev) => ({ ...prev, [key]: { ...data, error: null } }));
      } catch (err) {
        setResults((prev) => ({
          ...prev,
          [key]: { key, name: f.name, invoice: null, checks: [], insights: [], error: err.message },
        }));
      }
      if (i < pending.length - 1) await new Promise((r) => setTimeout(r, 1000));
    }
    setProgress(null);
  };

  const handleRemoveFile = (key) => {
    setFiles((prev) => prev.filter((f) => fileKey(f) !== key));
    setResults((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (selectedKey === key) setSelectedKey('');
  };

  const handleUpdateInvoice = (key, updatedInvoice) => {
    setResults((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      return {
        ...prev,
        [key]: {
          ...existing,
          invoice: updatedInvoice,
          checks: recomputeChecks(updatedInvoice),
        },
      };
    });
  };

  const handleClear = () => {
    setFiles([]);
    setResults({});
    setDuplicates({});
    setPortfolio(null);
    setSelectedKey('');
    setActiveView('queue');
  };

  if (page === 'landing') {
    return (
      <LandingPage
        onOpenApp={(view = 'queue') => {
          setActiveView(view);
          setPage('app');
        }}
      />
    );
  }

  const statuses = files.map((f) => statusOf(results[fileKey(f)]));
  const nDone = statuses.filter((s) => s.type !== 'pending' && s.type !== 'error').length;
  const nOk = statuses.filter((s) => s.type === 'ok').length;
  const nWarn = statuses.filter((s) => s.type === 'warn').length;
  const nBad = statuses.filter((s) => s.type === 'fail' || s.type === 'error').length;
  const dupEntries = Object.entries(duplicates);
  const currentIndex = Math.max(0, files.findIndex((f) => fileKey(f) === selectedKey));

  return (
    <div className="layout">
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        onGoOptions={() => setPage('landing')}
        fileCount={files.length}
        issueCount={nBad}
        model={model}
        onClear={handleClear}
      />

      <main className="main">
        {activeView === 'queue' && (
          <>
            <div className="topbar">
              <div>
                <h1>Upload & Queue</h1>
                <p>Add invoices, verify the math and flag duplicates.</p>
              </div>
              {files.length > 0 && (
                <button className="btn-cobalt" disabled={!!progress} onClick={analyzeAll}>
                  <Sparkles size={15} /> {progress ? 'Analyzing...' : 'Analyze bills'}
                </button>
              )}
            </div>

            <Uploader onFilesSelected={handleFilesSelected} />

            {progress && (
              <div className="card">
                <div className="mono" style={{ fontSize: 13 }}>
                  Processing {progress.done + 1} of {progress.total}: {progress.current}
                </div>
                <div className="bar">
                  <div
                    style={{
                      width: `${Math.round(((progress.done + 0.5) / progress.total) * 100)}%`,
                      background: 'var(--cobalt)',
                    }}
                  />
                </div>
              </div>
            )}

            {files.length > 0 && (
              <>
                <div className="grid-5">
                  <div className="card"><div className="stat-label">Files</div><div className="stat-value">{files.length}</div></div>
                  <div className="card"><div className="stat-label">Analyzed</div><div className="stat-value">{nDone} / {files.length}</div></div>
                  <div className="card"><div className="stat-label">Valid</div><div className="stat-value" style={{ color: 'var(--ok)' }}>{nOk}</div></div>
                  <div className="card"><div className="stat-label">Warning</div><div className="stat-value" style={{ color: 'var(--warn)' }}>{nWarn}</div></div>
                  <div className="card"><div className="stat-label">Issues</div><div className="stat-value" style={{ color: 'var(--bad)' }}>{nBad}</div></div>
                </div>

                {dupEntries.length > 0 && (
                  <div className="marigold-callout">
                    <strong>{dupEntries.length} duplicate bill(s) detected:</strong>{' '}
                    {dupEntries.map(([k, orig]) => `${results[k]?.name || k} (same as ${orig})`).join(', ')}.
                  </div>
                )}

                <SummaryTable
                  files={files}
                  results={results}
                  duplicates={duplicates}
                  busy={!!progress}
                  onInspect={(key) => {
                    setSelectedKey(key);
                    setActiveView('inspector');
                  }}
                  onReanalyze={analyzeOne}
                  onRemove={handleRemoveFile}
                />
              </>
            )}
          </>
        )}

        {activeView === 'inspector' && (
          <>
            <div className="topbar">
              <div>
                <h1>Bill Inspector</h1>
                <p>Compare the document with extracted data and check every calculation.</p>
              </div>
            </div>
            <BillDetail
              files={files}
              currentIndex={currentIndex}
              onSelectIndex={(idx) => setSelectedKey(fileKey(files[idx]))}
              result={files[currentIndex] ? results[fileKey(files[currentIndex])] : null}
              busy={!!progress}
              onAnalyzeOne={analyzeOne}
              onUpdateInvoice={handleUpdateInvoice}
            />
          </>
        )}

        {activeView === 'analytics' && (
          <>
            <div className="topbar">
              <div>
                <h1>Analytics</h1>
                <p>Where the money went, across {okBills.length} analyzed bill(s).</p>
              </div>
            </div>
            <Portfolio
              data={portfolio}
              hasDuplicates={dupEntries.length > 0}
              hideDuplicates={hideDups}
              onToggleDuplicates={setHideDups}
            />
          </>
        )}
      </main>
    </div>
  );
}
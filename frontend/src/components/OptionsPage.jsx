import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  FileCheck2,
  FileSearch,
  Layers,
} from 'lucide-react';

export default function OptionsPage({
  fileCount,
  analyzedCount,
  issueCount,
  model,
  onSelectOption,
  onBackHome,
}) {
  const options = [
    {
      id: 'queue',
      title: 'Upload & Audit Queue',
      description:
        'Upload single or batch invoices (JPG, PNG, WEBP, PDF), run AI extraction, filter results, and export summary CSVs.',
      icon: Layers,
      meta: fileCount > 0 ? `${fileCount} file(s) in queue` : 'Start here',
      disabled: false,
    },
    {
      id: 'inspector',
      title: 'Bill Inspector',
      description:
        'View documents side-by-side with zoom & rotate controls, inspect 5-point math checks, and edit extracted values inline.',
      icon: FileSearch,
      meta:
        fileCount === 0
          ? 'Upload a bill first'
          : issueCount > 0
          ? `${issueCount} issue(s) to review`
          : `${analyzedCount} analyzed`,
      disabled: fileCount === 0,
    },
    {
      id: 'analytics',
      title: 'Spend Analytics',
      description:
        'Explore currency-separated vendor breakdowns, monthly spending trends, tax totals, and duplicate exclusions.',
      icon: BarChart3,
      meta: analyzedCount >= 2 ? 'Charts ready' : 'Needs 2+ analyzed bills',
      disabled: false,
    },
  ];

  return (
    <div className="options-page">
      <header className="landing-nav">
        <div className="landing-container nav-inner">
          <div className="brand-mark" onClick={onBackHome}>
            <div className="brand-square">
              <FileCheck2 size={18} strokeWidth={2} />
            </div>
            <span className="brand-name">DocuLens</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="chip" style={{ margin: 0 }}>
              Engine: {model || 'Connecting...'}
            </span>
            <button className="btn btn-sm" onClick={onBackHome}>
              <ArrowLeft size={14} /> Home
            </button>
          </div>
        </div>
      </header>

      <main className="landing-container options-main">
        <div className="section-head" style={{ marginBottom: 36 }}>
          <span className="section-kicker">Workspace</span>
          <h2>Choose what you want to do</h2>
          <p>Select a module below to open it. Your uploaded bills stay synced across all pages.</p>
        </div>

        <div className="options-grid">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                className="option-card"
                disabled={opt.disabled}
                onClick={() => onSelectOption(opt.id)}
              >
                <div className="option-card-top">
                  <div className="bento-icon" style={{ marginBottom: 0 }}>
                    <Icon size={20} strokeWidth={1.75} />
                  </div>
                  <span className="option-meta">{opt.meta}</span>
                </div>

                <h3>{opt.title}</h3>
                <p>{opt.description}</p>

                <div className="option-action">
                  Open {opt.title.split(' ')[0]} <ArrowRight size={15} />
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
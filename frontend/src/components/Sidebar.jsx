import { ArrowLeft, BarChart3, FileSearch, Layers, Trash2 } from 'lucide-react';

export default function Sidebar({
  activeView,
  onNavigate,
  onGoOptions,
  fileCount,
  issueCount,
  onClear,
}) {
  return (
    <aside className="sidebar">
      <div>
        <div className="brand-mark" onClick={onGoOptions} title="Back to Landing Page">
          <div className="brand-d">D</div>
          <span className="brand-word">DocuLens</span>
        </div>
        <div className="sidebar-sub">Invoice intelligence</div>
      </div>

      <nav className="nav-list">
        <button
          className={`nav-item ${activeView === 'queue' ? 'active' : ''}`}
          onClick={() => onNavigate('queue')}
        >
          <span className="nav-left">
            <Layers size={16} strokeWidth={1.6} /> Upload & Queue
          </span>
          <span className="nav-badge">{fileCount}</span>
        </button>

        <button
          className={`nav-item ${activeView === 'inspector' ? 'active' : ''}`}
          onClick={() => onNavigate('inspector')}
          disabled={fileCount === 0}
        >
          <span className="nav-left">
            <FileSearch size={16} strokeWidth={1.6} /> Bill Inspector
          </span>
          {issueCount > 0 && (
            <span
              className="nav-badge"
              style={{ background: 'rgba(229, 56, 79, 0.22)', color: '#fda4af' }}
            >
              {issueCount}
            </span>
          )}
        </button>

        <button
          className={`nav-item ${activeView === 'analytics' ? 'active' : ''}`}
          onClick={() => onNavigate('analytics')}
        >
          <span className="nav-left">
            <BarChart3 size={16} strokeWidth={1.6} /> Analytics
          </span>
        </button>
      </nav>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          className="nav-item"
          style={{ justifyContent: 'center', border: '1px solid rgba(255,255,255,0.12)' }}
          onClick={onGoOptions}
        >
          <ArrowLeft size={14} /> Landing page
        </button>

        <button
          onClick={onClear}
          disabled={fileCount === 0}
          style={{
            background: 'none',
            border: 'none',
            color: '#fda4af',
            fontSize: 13,
            fontWeight: 500,
            cursor: fileCount === 0 ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '6px 0',
          }}
        >
          <Trash2 size={14} /> Clear all
        </button>
      </div>
    </aside>
  );
}
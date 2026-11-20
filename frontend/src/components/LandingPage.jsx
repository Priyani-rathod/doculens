import { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  Calculator,
  Check,
  CheckCircle2,
  CopyCheck,
  Download,
  FileSearch,
  Languages,
  Minus,
  Plus,
  ScanLine,
  ShieldCheck,
  Store,
} from 'lucide-react';

const FAQS = [
  {
    q: 'Is DocuLens a fraud detector?',
    a: 'No. It checks that the numbers on a bill agree with each other. Always verify critical documents yourself as well.',
  },
  {
    q: 'Where do my files go?',
    a: 'Files are sent to the backend for AI extraction and deleted immediately after processing. Nothing is stored permanently.',
  },
  {
    q: 'Which files can I upload?',
    a: 'You can upload JPG, PNG, WEBP images (phone photos or scans) as well as multi-page PDF invoices.',
  },
  {
    q: 'How accurate is it?',
    a: 'Vision AI extracts the fields, while deterministic Python code runs every math check so results are consistent and auditable.',
  },
];

export default function LandingPage({ onOpenApp }) {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="ledger-bg">
      {/* NAV BAR */}
      <header className="ledger-nav">
        <div className="container ledger-nav-inner">
          <div className="brand-mark" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="brand-d">D</div>
            <span className="brand-word">DocuLens</span>
          </div>

          <nav className="ledger-nav-links">
            <button onClick={() => onOpenApp('queue')}>Upload</button>
            <button onClick={() => onOpenApp('inspector')}>Inspector</button>
            <button onClick={() => onOpenApp('analytics')}>Analytics</button>
            <a href="#how-it-works">How it works</a>
            <a href="#faq">FAQ</a>
          </nav>

          <button className="btn-cobalt" onClick={() => onOpenApp('queue')}>
            Open app <ArrowRight size={15} />
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="ledger-hero">
        <div className="container hero-12">
          <div>
            <div className="hero-eyebrow">Invoice checking for busy desks</div>
            <h1 className="hero-h1">
              Catch <span className="highlight-marigold">bill errors</span> before you pay them.
            </h1>
            <p className="hero-sub">
              DocuLens reads invoices and receipts, re-checks every number with code, and flags mistakes and duplicates.
            </p>
            <div className="hero-btns">
              <button className="btn-cobalt" onClick={() => onOpenApp('queue')}>
                Open app <ArrowRight size={15} />
              </button>
              <a href="#how-it-works" className="btn-ink-outline">
                See how it works
              </a>
            </div>
            <div className="hero-ticks">
              <span><Check size={14} color="var(--cobalt)" /> Scans, phone photos and PDFs</span>
              <span><Check size={14} color="var(--cobalt)" /> Hindi and English</span>
              <span><Check size={14} color="var(--cobalt)" /> JSON and CSV export</span>
            </div>
          </div>

          {/* RIGHT: Realistic Paper Invoice + Overlapping Result Card */}
          <div className="invoice-stage">
            <div className="paper-invoice">
              <div className="inv-top">
                <div>
                  <div className="inv-vendor">Gupta Stationers</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Tax Invoice · GSTIN 23AABCG1234F1Z5</div>
                </div>
                <div className="inv-meta">
                  <div>INV #GS-2291</div>
                  <div>23 Aug 2026</div>
                </div>
              </div>

              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="num">Qty</th>
                    <th className="num">Rate</th>
                    <th className="num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="inv-row-error">
                    <td>A4 Paper Ream</td>
                    <td className="num">10</td>
                    <td className="num">285.00</td>
                    <td className="num"><span className="red-circle">2,580.00</span></td>
                  </tr>
                  <tr>
                    <td>Gel Pens Box</td>
                    <td className="num">5</td>
                    <td className="num">120.00</td>
                    <td className="num">600.00</td>
                  </tr>
                  <tr>
                    <td>Spiral Notebooks</td>
                    <td className="num">12</td>
                    <td className="num">65.00</td>
                    <td className="num">780.00</td>
                  </tr>
                </tbody>
              </table>

              <div className="inv-totals mono">
                <div><span>Subtotal</span><span>₹3,960.00</span></div>
                <div><span>GST @ 12%</span><span>₹475.20</span></div>
                <div className="grand"><span>Total</span><span>₹4,435.20</span></div>
              </div>
            </div>

            <div className="overlap-result">
              <div className="overlap-head">
                <span className="overlap-title">Line 1: qty × rate</span>
                <span className="stamp flagged">FLAGGED</span>
              </div>
              <div className="overlap-mono">Expected 2,850.00 · bill shows 2,580.00</div>
              <div className="overlap-row">
                <span>Subtotal</span>
                <span className="overlap-ok"><CheckCircle2 size={14} /> Verified</span>
              </div>
              <div className="overlap-row">
                <span>Total</span>
                <span className="overlap-ok"><CheckCircle2 size={14} /> Verified</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION A: HOW IT WORKS */}
      <section id="how-it-works" className="section-pad">
        <div className="container">
          <h2 className="section-h2">How it works</h2>
          <div className="steps-row">
            <div className="steps-line" />
            {[
              ['01', 'Upload', 'Drop in one bill or many.'],
              ['02', 'Read', 'AI turns the page into structured data.'],
              ['03', 'Verify', 'Code re-checks every line, subtotal and total.'],
              ['04', 'Review', 'See what is wrong, and why.'],
            ].map(([num, title, desc]) => (
              <div className="step-col" key={num}>
                <div className="step-num-wrap">
                  <span className="step-num">{num}</span>
                  <span className="marigold-dot" />
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION B: THREE VIEWS */}
      <section className="section-pad">
        <div className="container">
          <h2 className="section-h2">Three views, one workflow</h2>
          <p className="section-muted">Everything you need, in the order you need it.</p>

          <div className="views-grid">
            <div className="view-card">
              <div className="view-thumb">
                <div className="mini-ui-bar" />
                <div className="mini-ui-card mono">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>t01_gst_invoice.png</span>
                    <span style={{ color: 'var(--ok)', fontWeight: 600 }}>Valid</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span>t02_line_error.png</span>
                    <span style={{ color: 'var(--bad)', fontWeight: 600 }}>Issues</span>
                  </div>
                </div>
              </div>
              <div className="view-body">
                <h3>Upload & Queue</h3>
                <p>Add bills and watch them get checked.</p>
                <button className="cobalt-link" onClick={() => onOpenApp('queue')}>
                  Open <ArrowRight size={14} />
                </button>
              </div>
            </div>

            <div className="view-card">
              <div className="view-thumb">
                <div className="mini-ui-bar" style={{ width: '45%' }} />
                <div className="mini-ui-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: 12 }}>Gupta Stationers</strong>
                    <span className="stamp flagged" style={{ fontSize: 9 }}>FLAGGED</span>
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                    Expected 2,850.00 · shows 2,580.00
                  </div>
                </div>
              </div>
              <div className="view-body">
                <h3>Bill Inspector</h3>
                <p>Compare the document with the extracted data.</p>
                <button className="cobalt-link" onClick={() => onOpenApp('inspector')}>
                  Open <ArrowRight size={14} />
                </button>
              </div>
            </div>

            <div className="view-card">
              <div className="view-thumb">
                <div className="mini-ui-bar" style={{ width: '52%' }} />
                <div className="mini-ui-card">
                  <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 52 }}>
                    <div style={{ width: '28%', height: '100%', background: 'var(--marigold)', borderRadius: 4 }} />
                    <div style={{ width: '28%', height: '72%', background: 'var(--cobalt)', borderRadius: 4 }} />
                    <div style={{ width: '28%', height: '44%', background: 'var(--cobalt)', borderRadius: 4 }} />
                  </div>
                </div>
              </div>
              <div className="view-body">
                <h3>Analytics</h3>
                <p>Spending by vendor and by month.</p>
                <button className="cobalt-link" onClick={() => onOpenApp('analytics')}>
                  Open <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION C: DARK INK BAND */}
      <section className="ink-band">
        <div className="container ink-grid">
          <div>
            <div className="ink-eyebrow">Why it is reliable</div>
            <h2 className="ink-h2">AI reads. Code verifies.</h2>
            <p className="ink-p">
              The AI only reads the page. Plain code does the math, so the same bill always gets the same verdict.
            </p>
            <ul className="ink-list">
              {[
                'Line items: quantity × rate',
                'Subtotal: items add up',
                'Total: subtotal − discount + tax',
                'Required fields are present',
                'Signature or stamp',
                'Duplicate invoices',
              ].map((item) => (
                <li key={item}>
                  <Check size={16} color="var(--marigold)" /> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="ink-result-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <strong style={{ fontSize: 16 }}>Result</strong>
              <span className="stamp flagged">FLAGGED</span>
            </div>
            <div className="ink-res-row">
              <span>Line 1: qty × rate</span>
              <span className="mono" style={{ color: 'var(--bad)' }}>Expected 2,850.00 · shows 2,580.00</span>
            </div>
            <div className="ink-res-row">
              <span>Subtotal</span>
              <span style={{ color: 'var(--ok)', fontWeight: 600 }}>Verified</span>
            </div>
            <div className="ink-res-row">
              <span>Total</span>
              <span style={{ color: 'var(--ok)', fontWeight: 600 }}>Verified</span>
            </div>
            <div className="ink-res-row" style={{ borderBottom: 'none' }}>
              <span>Signature</span>
              <span style={{ color: 'var(--warn)', fontWeight: 600 }}>Warning</span>
            </div>
            <div className="bar">
              <div style={{ width: '88%', background: 'var(--cobalt)' }} />
            </div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
              8 of 9 checks passed
            </div>
          </div>
        </div>
      </section>

      {/* SECTION D: BUILT FOR MESSY REAL BILLS */}
      <section className="section-pad">
        <div className="container">
          <h2 className="section-h2">Built for messy, real bills</h2>
          <div className="feat-grid">
            {[
              [ScanLine, 'Reads messy bills', 'Tilted phone photos, scans and PDFs.'],
              [Calculator, 'Re-checks the math', 'Every line, subtotal and total.'],
              [CopyCheck, 'Catches duplicates', 'Same invoice, scan or photo, counted once.'],
              [BarChart3, 'Spending insights', 'Charts by vendor and by month.'],
              [Languages, 'Hindi and English', 'Mixed-language bills are fine.'],
              [Download, 'Export anywhere', 'JSON and CSV in one click.'],
            ].map(([Icon, title, desc]) => (
              <div className="feat-card" key={title}>
                <div className="sky-circle"><Icon size={18} strokeWidth={1.6} /></div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION E: WHO IT IS FOR */}
      <section className="section-pad">
        <div className="container">
          <h2 className="section-h2">Who it is for</h2>
          <div className="who-grid">
            {[
              [Store, 'Small shops', 'Stop retyping bills into Excel.'],
              [Briefcase, 'CA firms', 'Check client invoices faster.'],
              [Building2, 'Accounts teams', 'Verify before you pay.'],
              [FileSearch, 'Auditors', 'Review only what is flagged.'],
            ].map(([Icon, title, desc]) => (
              <div className="who-col" key={title}>
                <Icon size={20} strokeWidth={1.6} color="var(--cobalt)" />
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION F: FAQ */}
      <section id="faq" className="section-pad">
        <div className="container faq-grid">
          <div>
            <h2 className="section-h2">Questions</h2>
            <p className="section-muted">Short, honest answers.</p>
          </div>
          <div>
            {FAQS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div className="faq-item" key={item.q}>
                  <button className="faq-q" onClick={() => setOpenFaq(isOpen ? -1 : idx)}>
                    <span>{item.q}</span>
                    {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                  </button>
                  {isOpen && <p className="faq-a">{item.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION G: COBALT CTA */}
      <section className="section-pad" style={{ borderTop: 'none', paddingTop: 16 }}>
        <div className="container">
          <div className="cobalt-cta">
            <h2>
              Try it on your <span className="highlight-marigold" style={{ color: 'var(--white)' }}>own bills</span>.
            </h2>
            <div>
              <button className="btn-white" onClick={() => onOpenApp('queue')}>
                Open app <ArrowRight size={15} />
              </button>
              <a href="#how-it-works" className="cta-link-white">
                See how it works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="ledger-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="brand-mark">
                <div className="brand-d">D</div>
                <span className="brand-word">DocuLens</span>
              </div>
            </div>
            <div className="footer-col">
              <h4>Product</h4>
              <button onClick={() => onOpenApp('queue')}>Upload & Queue</button>
              <button onClick={() => onOpenApp('inspector')}>Bill Inspector</button>
              <button onClick={() => onOpenApp('analytics')}>Analytics</button>
            </div>
            <div className="footer-col">
              <h4>Learn</h4>
              <a href="#how-it-works">How it works</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="footer-col">
              <h4>Project</h4>
              <a href="https://github.com/Priyani-rathod" target="_blank" rel="noreferrer">GitHub</a>
              <a href="#faq">Contact</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 DocuLens</span>
            <span>Made in Bhopal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
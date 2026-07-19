import { useNavigate } from 'react-router-dom';
<>
  <img src="/assets/feature-expense.jpg" alt="..." />
  <img src="/assets/feature-ai.jpg" alt="..." />
  <img src="/assets/feature-voting.jpg" alt="..." />
  <img src="/assets/feature-issues.jpg" alt="..." />
  <img src="/assets/hero-building.jpg" alt="..." />
</>
import Icon from '../components/Icon';

const FEATURES = [
  {
    img: '/assets/feature-expense.jpg',
    icon: 'chart',
    title: 'Visual Expense Breakdown',
    description: 'See exactly where your maintenance goes—staff, repairs, electricity, and more—with crystal clear visualization.'
  },
  {
    img: '/assets/feature-ai.jpg',
    icon: 'spark',
    title: 'AI Expense Assistant',
    description: 'Ask our smart assistant any question about the society funds. Get instant answers from the ledger without waiting for the AGM.'
  },
  {
    img: '/assets/feature-voting.jpg',
    icon: 'team',
    title: 'Community Voting',
    description: 'Decide together. Cast your vote on major repairs or new facilities directly from the app with secure, verifiable polls.'
  },
  {
    img: '/assets/feature-issues.jpg',
    icon: 'list',
    title: 'Issue Tracking',
    description: 'Report issues and track them to resolution. Real-time updates ensure you aren’t left wondering when that leak will be fixed.'
  }
];

const STEPS = [
  {
    n: 1,
    title: 'Admin Uploads',
    description:
      'Administrators upload invoices and ledgers. Our system automatically categorizes every expense for easy reading.'
  },
  {
    n: 2,
    title: 'Residents Access',
    description:
      'Instant notifications are sent. Residents log in to see beautiful, live dashboards of the society\u2019s financial health.'
  },
  {
    n: 3,
    title: 'Engage & Vote',
    description:
      'Ask the AI for historical data, participate in democratic voting, or flag concerns\u2014all within seconds.'
  }
];

const STATS = [
  { value: '100%', label: 'Full Transparency' },
  { value: 'AI', label: 'Smart Assistant' },
  { value: '4 Cat.', label: 'Expense Tracking' },
  { value: 'Instant', label: 'Real-Time Updates' }
];

function Landing() {
  const navigate = useNavigate();

  const scrollTo = (id) => () => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="ls-page">
      {/* Top nav */}
      <header className="ls-nav">
        <div className="ls-nav-inner">
          <a className="ls-brand" href="#top">
            <span className="ls-brand-mark">
              <Icon name="brand" />
            </span>
            <span>Manage Estate</span>
          </a>
          <nav className="ls-nav-links">
            <button type="button" onClick={scrollTo('features')}>Features</button>
            <button type="button" onClick={scrollTo('how')}>How It Works</button>
            <button type="button" onClick={scrollTo('residents')}>For Residents</button>
            <button type="button" onClick={scrollTo('admins')}>For Admins</button>
          </nav>
          <div className="ls-nav-cta">
            <button type="button" className="ls-btn ls-btn-outline" onClick={() => navigate('/auth')}>
              Login
            </button>
            <button type="button" className="ls-btn ls-btn-gold" onClick={() => navigate('/auth?mode=signup')}>
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="ls-hero" id="top">
        <img className="ls-hero-img" src="/assets/hero-building.jpg" alt="Modern residential apartment complex at golden hour" />
        <div className="ls-hero-overlay" />
        <div className="ls-hero-content">
          <span className="ls-eyebrow">
            <Icon name="shield" /> Built for Indian Housing Societies
          </span>
          <h1 className="ls-hero-title">
            Transparent maintenance, for every resident.
          </h1>
          <p className="ls-hero-sub">
            Every rupee accounted for. Every month, clearly broken down.
            <br />
            Stop the guesswork and build institutional trust in your community.
          </p>
          <div className="ls-hero-actions">
            <button type="button" className="ls-btn ls-btn-gold ls-btn-lg" onClick={() => navigate('/auth?mode=signup')}>
              Start for free <Icon name="arrow-right" />
            </button>
            <button type="button" className="ls-btn ls-btn-ghost ls-btn-lg" onClick={scrollTo('how')}>
              See How It Works
            </button>
          </div>
        </div>

        {/* Stat strip */}
        <div className="ls-stat-strip">
          {STATS.map((s) => (
            <div className="ls-stat" key={s.label}>
              <div className="ls-stat-value">{s.value}</div>
              <div className="ls-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="ls-section" id="features">
        <div className="ls-section-inner">
          <h2 className="ls-h2">
            Everything residents deserve to know
            <span className="ls-h2-underline" />
          </h2>
          <div className="ls-feature-grid">
            {FEATURES.map((f) => (
              <article className="ls-feature" key={f.title}>
                <div className="ls-feature-img">
                  <img src={f.img} alt={f.title} loading="lazy" />
                </div>
                <div className="ls-feature-body">
                  <h3>
                    <Icon name={f.icon} /> {f.title}
                  </h3>
                  <p>{f.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="ls-section ls-section-soft" id="how">
        <div className="ls-section-inner">
          <h2 className="ls-h2 ls-h2-center">A simple path to clarity</h2>
          <div className="ls-step-grid">
            {STEPS.map((s) => (
              <div className="ls-step" key={s.n}>
                <div className="ls-step-num">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Residents / For Administrators split */}
      <section className="ls-split-section">
        <div className="ls-split">
          <div className="ls-split-card ls-split-light" id="residents">
            <Icon name="team" />
            <h2>For Residents</h2>
            <ul>
              <li>
                <Icon name="check" />
                <div>
                  <strong>Financial Peace of Mind</strong>
                  <span>Know exactly where your hard-earned money is being spent every single month.</span>
                </div>
              </li>
              <li>
                <Icon name="check" />
                <div>
                  <strong>Digital Documentation</strong>
                  <span>Access 10 years of ledger history and audit reports in just two clicks.</span>
                </div>
              </li>
              <li>
                <Icon name="check" />
                <div>
                  <strong>Active Participation</strong>
                  <span>Have a real say in society decisions via secure and transparent voting.</span>
                </div>
              </li>
            </ul>
          </div>
          <div className="ls-split-card ls-split-dark" id="admins">
            <Icon name="shield" />
            <h2>For Administrators</h2>
            <ul>
              <li>
                <Icon name="check" />
                <div>
                  <strong>Zero Trust Gap</strong>
                  <span>Eliminate resident skepticism by providing a verifiable, real-time single source of truth.</span>
                </div>
              </li>
              <li>
                <Icon name="check" />
                <div>
                  <strong>Automated Reporting</strong>
                  <span>Reduce manual work by 70% with automated expense categorization and dashboard generation.</span>
                </div>
              </li>
              <li>
                <Icon name="check" />
                <div>
                  <strong>Conflict Resolution</strong>
                  <span>Let data do the talking. Resolve disputes quickly with clear audit trails and AI-powered data lookup.</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="ls-section">
        <div className="ls-section-inner ls-compare-wrap">
          <div className="ls-compare">
            <div className="ls-compare-side ls-compare-old">
              <span className="ls-compare-kicker">The Status Quo</span>
              <div className="ls-compare-price"><s>₹5,000+ Mystery</s></div>
              <p>"We pay every month, but where does it actually go? Why are the elevators still broken?"</p>
              <ul>
                <li><Icon name="x" /> Opaque PDF receipts</li>
                <li><Icon name="x" /> Annual manual audits</li>
                <li><Icon name="x" /> Heated AGM arguments</li>
              </ul>
            </div>
            <div className="ls-compare-side ls-compare-new">
              <span className="ls-compare-kicker ls-compare-kicker-gold">The Manage Estate Way</span>
              <div className="ls-compare-price">₹5,000 Precision</div>
              <p>"Every rupee is tracked. I see my ₹342 contribution to the generator fuel real-time."</p>
              <ul>
                <li><Icon name="check" /> Categorized Visualizations</li>
                <li><Icon name="check" /> AI Instant Querying</li>
                <li><Icon name="check" /> Verifiable Transparency</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="ls-cta">
        <div className="ls-cta-inner">
          <h2>Stop leaving residents in the dark.</h2>
          <p>Join over 400+ progressive Indian housing societies building a culture of trust and efficiency.</p>
          <button type="button" className="ls-btn ls-btn-gold ls-btn-lg" onClick={() => navigate('/auth?mode=signup')}>
            Create Free Account <Icon name="arrow-right" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="ls-footer">
        <div className="ls-footer-inner">
          <div className="ls-footer-brand">
            <a className="ls-brand ls-brand-dark" href="#top">
              <span className="ls-brand-mark ls-brand-mark-gold">
                <Icon name="brand" />
              </span>
              <span>Manage Estate</span>
            </a>
            <p>Building the modern financial operating system for residential communities across India.</p>
          </div>
          <div className="ls-footer-col">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#how">Pricing</a>
            <a href="#features">AI Assistant</a>
            <a href="#residents">Case Studies</a>
          </div>
          <div className="ls-footer-col">
            <h4>Company</h4>
            <a href="#top">About Us</a>
            <a href="#top">Careers</a>
            <a href="#top">Contact</a>
            <a href="#top">Blog</a>
          </div>
          <div className="ls-footer-col">
            <h4>Legal</h4>
            <a href="#top">Security</a>
            <a href="#top">Privacy Policy</a>
            <a href="#top">Terms of Service</a>
          </div>
        </div>
        <div className="ls-footer-base">© 2026 Manage Estate. All rights reserved.</div>
      </footer>
    </div>
  );
}

export default Landing;

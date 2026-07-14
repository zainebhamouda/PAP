// ═══════════════════════════════════════════════
// pages/landing/LandingPage.jsx
// Page d'accueil LEONI PAP — stats réelles depuis le back
// ═══════════════════════════════════════════════
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaSearch, FaAward, FaExclamationTriangle, FaChartLine, FaRobot, FaFileAlt } from 'react-icons/fa';
import { publicLandingAPI, authAPI } from '../../services/api';
import styles from './LandingPage.module.css';

// Le fetch des stats publiques réelles est toujours tenté.
// En cas d'échec (backend indisponible), on retombe sur des valeurs par défaut (voir plus bas).
const USE_PUBLIC_STATS = true;

// ── Données ──────────────────────────────────────
const FEATURES = [
  {
    icon: <FaSearch />,
    titleKey: 'landing.features.audit.title',
    descKey: 'landing.features.audit.desc',
    tagsKey: 'landing.features.audit.tags',
    color: '#4A90D9',
  },
  {
    icon: <FaAward />,
    titleKey: 'landing.features.certif.title',
    descKey: 'landing.features.certif.desc',
    tagsKey: 'landing.features.certif.tags',
    color: '#5BA4CF',
  },
  {
    icon: <FaExclamationTriangle />,
    titleKey: 'landing.features.pdca.title',
    descKey: 'landing.features.pdca.desc',
    tagsKey: 'landing.features.pdca.tags',
    color: '#7EB8D4',
  },
  {
    icon: <FaChartLine />,
    titleKey: 'landing.features.qk.title',
    descKey: 'landing.features.qk.desc',
    tagsKey: 'landing.features.qk.tags',
    color: '#4A90D9',
  },
  {
    icon: <FaRobot />,
    titleKey: 'landing.features.ia.title',
    descKey: 'landing.features.ia.desc',
    tagsKey: 'landing.features.ia.tags',
    color: '#5BA4CF',
  },
  {
    icon: <FaFileAlt />,
    titleKey: 'landing.features.rapports.title',
    descKey: 'landing.features.rapports.desc',
    tagsKey: 'landing.features.rapports.tags',
    color: '#7EB8D4',
  },
];
const LANGUAGES = [
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'en', label: '🇬🇧 English' },
  { code: 'ar', label: '🇸🇦 العربية' },
  { code: 'it', label: '🇮🇹 Italiano' },
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'de', label: '🇩🇪 Deutsch' },
];
const ACTORS = [
  {
    icon: '🔍',
    roleKey: 'landing.actors.auditeur.role',
    descKey: 'landing.actors.auditeur.desc',
    tasksKey: 'landing.actors.auditeur.tasks',
    color: '#1E3A5F',
  },
  {
    icon: '📋',
    roleKey: 'landing.actors.chefService.role',
    descKey: 'landing.actors.chefService.desc',
    tasksKey: 'landing.actors.chefService.tasks',
    color: '#1A3050',
  },
  {
    icon: '⚙️',
    roleKey: 'landing.actors.admin.role',
    descKey: 'landing.actors.admin.desc',
    tasksKey: 'landing.actors.admin.tasks',
    color: '#162840',
  },
  {
    icon: '🏢',
    roleKey: 'landing.actors.responsable.role',
    descKey: 'landing.actors.responsable.desc',
    tasksKey: 'landing.actors.responsable.tasks',
    color: '#1A3A6E',
  },
  {
    icon: '🔬',
    roleKey: 'landing.actors.expert.role',
    descKey: 'landing.actors.expert.desc',
    tasksKey: 'landing.actors.expert.tasks',
    color: '#1E4080',
  },
];

const STEPS = [
  { num: '01', descKey: 'landing.steps.step1' },
  { num: '02', descKey: 'landing.steps.step2' },
  { num: '03', descKey: 'landing.steps.step3' },
  { num: '04', descKey: 'landing.steps.step4' },
];

// ── Hook intersection observer ──
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// ── Compteur animé ──
function Counter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView();
  useEffect(() => {
    if (!inView) return;
    const num = parseInt(target);
    if (isNaN(num)) { setCount(target); return; }
    let start = 0;
    const step = Math.ceil(num / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= num) { setCount(num); clearInterval(timer); }
      else setCount(start);
    }, 30);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <span ref={ref}>{isNaN(parseInt(target)) ? target : count}{suffix}</span>;
}

// ════════════════════════════════════════════════
export default function LandingPage() {
  const { t: translate, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  const [scrolled,    setScrolled]    = useState(false);
  const [activeActor, setActiveActor] = useState(0);
  const [menuOpen,    setMenuOpen]    = useState(false);
const [langOpen, setLangOpen] = useState(false);
  // ── Stats réelles depuis le backend ─────────────
  const [stats, setStats] = useState({
    nbSites:            null,
    nbPlants:           null,
    nbAuditeursCertifies: null,
    tauxConformite:     null,
  });
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    if (!USE_PUBLIC_STATS) {
      // Running without a compatible public backend: use local fallbacks
      setStatsLoaded(true);
      return;
    }

    publicLandingAPI.getStats()
      .then(res => {
        const data = res.data || {};
        setStats({
          nbSites: data.totalSites ?? null,
          nbPlants: data.totalPlants ?? null,
          nbAuditeursCertifies: data.auditeursCertifies ?? null,
          tauxConformite: data.tauxConformite ?? null,
        });
      })
      .catch(() => {
        setStats({
          nbSites: null,
          nbPlants: null,
          nbAuditeursCertifies: null,
          tauxConformite: null,
        });
      })
      .finally(() => setStatsLoaded(true));
  }, []);

  // Stats affichées — valeur réelle si chargée, fallback sinon
  const STATS_DISPLAY = [
    {
      value: statsLoaded && stats.nbSites  !== null ? String(stats.nbSites)  : '5',
      label: translate('landing.stats.sites'),
      suffix: '',
    },
    {
      value: statsLoaded && stats.nbPlants !== null ? String(stats.nbPlants) : '10',
      label: translate('landing.stats.plants'),
      suffix: '',
    },
    {
      value: statsLoaded && stats.nbAuditeursCertifies !== null ? String(stats.nbAuditeursCertifies) : '100',
      label: translate('landing.stats.auditeurs'),
      suffix: '+',
    },
    {
      value: statsLoaded && stats.tauxConformite !== null ? String(stats.tauxConformite) : '98',
      label: translate('landing.stats.conformite'),
      suffix: '%',
    },
  ];

  const [heroRef,   heroIn]   = useInView(0.1);
  const [statsRef,  statsIn]  = useInView(0.2);
  const [featRef,   featIn]   = useInView(0.1);
  const [actorsRef, actorsIn] = useInView(0.1);
  const [stepsRef,  stepsIn]  = useInView(0.1);
  const [ctaRef,    ctaIn]    = useInView(0.2);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const localConf = setInterval(() => setActiveActor(a => (a + 1) % ACTORS.length), 3500);
    return () => clearInterval(localConf);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <div className={styles.landing} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ══ NAVBAR ══════════════════════════════════════ */}
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
        <div className={styles.navInner}>
<div className={styles.navBrand}>
  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
    <div style={{
      width: 40,
      height: 40,
      background: '#1a56db',
      borderRadius: 14,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{
        fontSize: '1.6rem',
        fontWeight: 900,
        color: '#fff',
        lineHeight: 1,
      }}>L</span>
    </div>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    }}>
      <span style={{
        fontSize: '1.2rem',
        fontWeight: 800,
        color: '#fff',
        letterSpacing: '0.02em',
        lineHeight: 1,
      }}>Leoni PAP</span>
      <span style={{
        fontSize: '0.62rem',
        fontWeight: 300,
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        lineHeight: 1,
      }}>Product Audit Platform</span>
    </div>
  </div>
</div>

          <div className={`${styles.navLinks} ${menuOpen ? styles.navLinksOpen : ''}`}>
            {[{ id: 'fonctionnalites', labelKey: 'landing.fonctionnalites' },
              { id: 'acteurs', labelKey: 'landing.acteurs' },
              { id: 'comment-ca-marche', labelKey: 'landing.commentCaMarche' },
              { id: 'contact', labelKey: 'landing.contact' },
            ].map((item, i) => (
              <button key={item.id} className={styles.navLink} onClick={() => scrollTo(item.id)}
                style={{ animationDelay: `${i * 0.05}s` }}>
                {translate(item.labelKey)}
              </button>
            ))}
          </div>

          <div className={styles.navActions}>
  <div style={{ position: 'relative' }}>
    <button
      className={styles.btnNavLogin}
      onClick={() => setLangOpen(!langOpen)}
    >
       {translate('parametres.langue')}
    </button>

  {langOpen && (
  <div
    style={{
      position: 'absolute',
      top: '120%',
      right: 0,
      background: '#ffffff',
      borderRadius: '14px',
      border: '1px solid #E5E7EB',
      boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
      minWidth: '220px',
      overflow: 'hidden',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column'
    }}
  >
    {LANGUAGES.map(lang => (
      <button
        key={lang.code}
        onClick={() => {
          i18n.changeLanguage(lang.code);
          localStorage.setItem('lang', lang.code);
          setLangOpen(false);
        }}
        style={{
          width: '100%',
          padding: '14px 18px',
          border: 'none',
          background: '#fff',
          textAlign: 'left',
          cursor: 'pointer',
          fontSize: '15px',
          fontWeight: '500',
          transition: '0.2s',
          color: '#1E293B'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = '#F8FAFC';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = '#fff';
        }}
      >
        {lang.label}
      </button>
    ))}
  </div>
)}
  </div>

  <button
    className={styles.btnNavLogin}
    onClick={() => navigate('/login')}
  >
    {translate('auth.connexion')}
  </button>

  <button
    className={styles.btnNavRegister}
    onClick={() => navigate('/register')}
  >
    {translate('landing.sInscrire')}
  </button>

  <button className={styles.burger} onClick={() => setMenuOpen(m => !m)}>
    <span /><span /><span />
  </button>
</div>
        </div>
      </nav>

      {/* ══ HERO ════════════════════════════════════════ */}
      <section className={styles.hero} id="hero">

        {/* Fond sombre bleu-gris */}
        <div className={styles.heroBg}>
          <div className={styles.heroBgBase} />
          <div className={styles.heroBgGrid} />
          <div className={styles.heroBgVignette} />
        </div>

        {/* Image câblage — fond plein */}
        <div className={styles.heroImageWrap}>
          <img
            src="/wiring.jpg"
            alt={translate('landing.hero.imageAlt')}
            className={styles.heroImage}
          />
          <div className={styles.heroImageOverlay} />
          {/* Badge Leoni */}
          
        </div>

        {/* Contenu textuel — côté droit */}
        <div className={`${styles.heroContent} ${heroIn ? styles.heroVisible : ''}`} ref={heroRef}>
          <div className={styles.heroLeft}>
           

            <h1 className={styles.heroTitle}>
              {translate('landing.hero.titleLine1')}<br />
              <span className={styles.heroTitleAccent}>{translate('landing.hero.titleAccent')}</span><br />
              {translate('landing.hero.titleLine3')}
            </h1>

            <p className={styles.heroDesc}>
              {translate('landing.hero.desc')}
            </p>

            <div className={styles.heroCtas}>
              <button className={styles.btnHeroPrimary} onClick={() => navigate('/register')}>
                <span>{translate('landing.commencer')}</span>
                <span className={styles.btnArrow}>→</span>
              </button>
              <button className={styles.btnHeroSecondary} onClick={() => scrollTo('fonctionnalites')}>
                {translate('landing.decouvrirFonctionnalites')}
              </button>
            </div>

            
          </div>
        </div>

        <div className={styles.scrollIndicator} onClick={() => scrollTo('stats')}>
          <div className={styles.scrollDot} />
        </div>
      </section>

      {/* ══ STATS (valeurs réelles backend) ════════════ */}
      <section className={styles.statsSection} id="stats">
        <div className={`${styles.statsInner} ${statsIn ? styles.visible : ''}`} ref={statsRef}>
          {STATS_DISPLAY.map((s, i) => (
            <div key={i} className={styles.statItem} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={styles.statIcon}>{s.icon}</div>
              <div className={styles.statVal}>
                {statsIn
                  ? <><Counter target={s.value} />{s.suffix}</>
                  : <span>—</span>
                }
              </div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FONCTIONNALITÉS ═════════════════════════════ */}
      <section className={styles.featSection} id="fonctionnalites">
        <div className={`${styles.sectionInner} ${featIn ? styles.visible : ''}`} ref={featRef}>
          <div className={styles.sectionTag}>{translate('landing.fonctionnalites')}</div>
          <h2 className={styles.sectionTitle}>
            {translate('landing.featuresTitleLine1')}<br />
            {translate('landing.featuresTitleLine2')} <span className={styles.goldText}>{translate('landing.featuresTitleAccent')}</span>
          </h2>
          <p className={styles.sectionDesc}>
            {translate('landing.featuresDesc')}
          </p>
          <div className={styles.featGrid}>
            {FEATURES.map((f, i) => (
              <div key={i} className={styles.featCard} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className={styles.featCardTop}>
                  <div className={styles.featIcon} style={{ background: f.color + '20', color: f.color }}>
                    {f.icon}
                  </div>
                  <div className={styles.featAccent} style={{ background: f.color }} />
                </div>
                <h3 className={styles.featTitle}>{translate(f.titleKey)}</h3>
                <p className={styles.featDesc}>{translate(f.descKey)}</p>
                <div className={styles.featTags}>
                  {(translate(f.tagsKey, { returnObjects: true }) || []).map((t, j) => (
                    <span key={j} className={styles.featTag}
                      style={{ color: f.color, background: f.color + '15' }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ACTEURS ══════════════════════════════════════ */}
      <section className={styles.actorsSection} id="acteurs">
        <div className={`${styles.sectionInner} ${actorsIn ? styles.visible : ''}`} ref={actorsRef}>
          <div className={styles.sectionTag} style={{ background: 'rgba(74,144,217,0.15)', color: '#7EB8D4' }}>
            {translate('landing.actorsTag')}
          </div>
          <h2 className={styles.sectionTitle} style={{ color: '#fff' }}>
            {translate('landing.actorsTitleLine1')} <span className={styles.goldText}>{translate('landing.actorsTitleAccent')}</span>
          </h2>
          <p className={styles.sectionDesc} style={{ color: 'rgba(255,255,255,0.6)' }}>
            {translate('landing.actorsDesc')}
          </p>
          <div className={styles.actorsLayout}>
            <div className={styles.actorsTabs}>
              {ACTORS.map((a, i) => (
                <button key={i}
                  className={`${styles.actorTab} ${activeActor === i ? styles.actorTabActive : ''}`}
                  onClick={() => setActiveActor(i)}
                  style={activeActor === i ? { borderLeftColor: '#4A90D9' } : {}}>
                  <span className={styles.actorBadge} style={{ background: '#1E3A5F' }}>
                    {translate(a.roleKey).substring(0, 2).toUpperCase()}
                  </span>
                  <span>{translate(a.roleKey)}</span>
                </button>
              ))}
            </div>
            <div className={styles.actorDetail}>
              {ACTORS.map((a, i) => (
                <div key={i}
                  className={`${styles.actorPanel} ${activeActor === i ? styles.actorPanelActive : ''}`}
                  style={{ borderLeftColor: '#4A90D9' }}>
                  <div className={styles.actorPanelHeader}>
                    <div className={styles.actorColorBar} style={{ background: '#4A90D9' }} />
                    <h3 style={{ color: '#7EB8D4' }}>{translate(a.roleKey)}</h3>
                  </div>
                  <p>{translate(a.descKey)}</p>
                  <div className={styles.actorTasks}>
                    {(translate(a.tasksKey, { returnObjects: true }) || []).map((t, j) => (
                      <div key={j} className={styles.actorTask} style={{ borderLeftColor: '#4A90D9' }}>
                        <span className={styles.actorTaskCheck} style={{ background: '#1E3A5F', color: '#7EB8D4' }}>✓</span>
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                  <button className={styles.actorCta} style={{ background: '#1E3A5F', border: '1px solid #4A90D9' }}
                    onClick={() => navigate('/register')}>
                    {translate('landing.createAccountCta')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ COMMENT ÇA MARCHE ════════════════════════════ */}
      <section className={styles.stepsSection} id="comment-ca-marche">
        <div className={`${styles.sectionInner} ${stepsIn ? styles.visible : ''}`} ref={stepsRef}>
          <div className={styles.sectionTag}>{translate('landing.commentCaMarche')}</div>
          <h2 className={styles.sectionTitle}>
            {translate('landing.stepsTitleLine1')} <span className={styles.goldText}>{translate('landing.stepsTitleAccent')}</span>
          </h2>
          <div className={styles.stepsGrid}>
            {STEPS.map((s, i) => (
              <div key={i} className={styles.stepCard} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={styles.stepNum}>{s.num}</div>
                {i < STEPS.length - 1 && <div className={styles.stepConnector} />}
                <p className={styles.stepDesc}>{translate(s.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ════════════════════════════════════ */}
      <section className={styles.ctaSection}>
        <div className={`${styles.ctaInner} ${ctaIn ? styles.visible : ''}`} ref={ctaRef}>
          <div className={styles.ctaBg} />
          <div className={styles.ctaContent}>
            <h2>{translate('landing.ctaTitle')}</h2>
            <p>{translate('landing.ctaDesc')}</p>
            <div className={styles.ctaBtns}>
              <button className={styles.btnCtaPrimary} onClick={() => navigate('/register')}>
                {translate('landing.ctaPrimary')}
              </button>
              <button className={styles.btnCtaSecondary} onClick={() => navigate('/login')}>
                {translate('landing.ctaSecondary')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════ */}
      <footer className={styles.footer} id="contact">
        <div className={styles.footerInner}>
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <div className={styles.footerLogo}>
                <span className={styles.logoL}>L</span>
                <span className={styles.logoRest}>EONI</span>
                <span className={styles.footerPap}>PAP</span>
              </div>
              <p>{translate('landing.footerDesc')}</p>
              <div className={styles.footerSites}>
                {(translate('landing.footerSites', { returnObjects: true }) || []).map(s => (
                  <span key={s} className={styles.footerSite}>{s}</span>
                ))}
              </div>
            </div>
            <div className={styles.footerCol}>
              <h4>{translate('landing.footerPlatform')}</h4>
              <button onClick={() => scrollTo('fonctionnalites')}>{translate('landing.fonctionnalites')}</button>
              <button onClick={() => scrollTo('acteurs')}>{translate('landing.acteurs')}</button>
              <button onClick={() => navigate('/register')}>{translate('landing.sInscrire')}</button>
              <button onClick={() => navigate('/login')}>{translate('landing.seConnecter')}</button>
            </div>
            <div className={styles.footerCol}>
              <h4>{translate('landing.support')}</h4>
              <button>{translate('landing.documentation')}</button>
              <button>{translate('landing.faq')}</button>
              <button>{translate('landing.tutoVideos')}</button>
              <button>{translate('landing.signalerBug')}</button>
            </div>
            <div className={styles.footerCol}>
              <h4>{translate('landing.contact')}</h4>
              <p>{translate('landing.contactEmail')}</p>
              <p>{translate('landing.contactPhone')}</p>
              <p>{translate('landing.contactCompany')}</p>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <span>{translate('landing.footerBottomLeft', { year: new Date().getFullYear() })}</span>
            <span>{translate('landing.footerBottomRight')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
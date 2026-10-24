import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  Sun,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BadgeCheck,
  Banknote,
  Bell,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  FileText,
  Globe,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  MoreHorizontal,
  Scale,
  Search,
  Shield,
  ShieldCheck,
  User,
  Users,
  WalletCards,
  X,
  Languages,
  ScanLine,
  RefreshCw,
  Clock3,
  LockKeyhole,
  Stethoscope,
  Building2,
  ArrowRight,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Lock,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { LoginView } from './LoginView';
import { request } from './lib/api';
import { exportToExcel } from './lib/exportExcel';
import {
  actionLabel,
  cohortLabel,
  formatCount,
  formatDate,
  formatDateTime,
  formatLongDate,
  governorateLabel,
  messageFromError,
  money,
  reasonLabel,
  riskLabel,
  roleLabel,
  specialtyLabel,
  stageLabel,
  statusLabel,
  timeAgo,
} from './lib/labels';
import { DEMO_TIERS, ROLE_PERMISSIONS, type Role } from '@mlrf/shared';
type Page =
  | 'overview'
  | 'subscriber'
  | 'inspector'
  | 'analytics'
  | 'bulk'
  | 'claims'
  | 'audit'
  | 'users'
  | 'guide';
type User = { id: string; name: string; email: string; role: Role; status: string };
const roles: Role[] = [
  'super_admin',
  'finance_admin',
  'practitioner_analyst',
  'facility_analyst',
  'claims_admin',
  'inspector',
  'subscriber',
];
const PROFILE_GOVERNORATES = [
  'Cairo',
  'Alexandria',
  'Giza',
  'Qalyubia',
  'Port Said',
  'Suez',
  'Dakahlia',
  'Asyut',
  'Luxor',
  'Aswan',
] as const;
export default function App() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const [token, setToken] = useState(localStorage.getItem('mlrf-token') ?? '');
  const [role, setRole] = useState<Role>(
    (localStorage.getItem('mlrf-role') as Role) || 'super_admin',
  );
  const [page, setPage] = useState<Page>('overview');
  const [year, setYear] = useState('year2_3');
  const [dark, setDark] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [identifier, setIdentifier] = useState('demo-qr-valid-7f0c1a');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [bulkText, setBulkText] = useState(
    'name,phone,nationalId,specialty,amount\nDr. Sample One,01012345678,29901011234567,General Practitioner,1800\nDr. Sample Two,01112345678,29902021234568,Surgery,4200\nDuplicate Example,01012345678,29901011234567,General Practitioner,1800\nInvalid ID,01212345678,123,Cardiology,3000',
  );
  const [bulkPreview, setBulkPreview] = useState<any>(null);
  const [subscriberTab, setSubscriberTab] = useState<'journey' | 'certificate'>('journey');
  const [inspectorHistory, setInspectorHistory] = useState<
    Array<{ id: string; identifier: string; outcome: string; time: string }>
  >([
    { id: '1', identifier: 'MLRF-2026-000123', outcome: 'compliant', time: '10 mins ago' },
    { id: '2', identifier: 'MLRF-EXPIRED-000001', outcome: 'notice', time: '25 mins ago' },
  ]);

  const isSubscriber = role === 'subscriber';
  const isInspector = role === 'inspector';
  const isAdmin = !isSubscriber && !isInspector;

  const getInitialRoute = () => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      if (pathname === '/login' || hash === '#/login' || hash === '#login') {
        return '/login';
      }
    }
    return '/';
  };
  const [currentPath, setCurrentPath] = useState<string>(getInitialRoute());

  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      if (pathname === '/login' || hash === '#/login' || hash === '#login') {
        setCurrentPath('/login');
      } else {
        setCurrentPath('/');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
    }
  };

  const [loginEmail, setLoginEmail] = useState('super_admin@mlrf.demo');
  const [loginPassword, setLoginPassword] = useState('demo12345');
  const meQuery = useQuery({
    queryKey: ['me', token],
    queryFn: () => request<{ user: User }>('/auth/me').then((r) => r.user),
    enabled: !!token,
    retry: false,
  });
  const currentUser = meQuery.data;
  const analytics = useQuery({
    queryKey: ['analytics', year, role],
    queryFn: () => request<any>('/admin/analytics', 'get', undefined, { scenario: year }),
    enabled: !!token && ['super_admin', 'practitioner_analyst', 'facility_analyst'].includes(role),
  });
  const claimsQuery = useQuery({
    queryKey: ['claims'],
    queryFn: () => request<any>('/admin/claims'),
    enabled: !!token && ['super_admin', 'claims_admin'].includes(role),
  });
  const auditQuery = useQuery({
    queryKey: ['audit'],
    queryFn: () => request<any>('/admin/audit'),
    enabled: !!token && ['super_admin'].includes(role),
    refetchInterval: 5000,
  });
  const userQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => request<User[]>('/admin/users'),
    enabled: !!token && role === 'super_admin',
  });
  useEffect(() => {
    if (isSubscriber && page !== 'subscriber') {
      setPage('subscriber');
    } else if (isInspector && page !== 'inspector') {
      setPage('inspector');
    } else if (isAdmin && (page === 'subscriber' || page === 'inspector')) {
      setPage('overview');
    }
  }, [role, isSubscriber, isInspector, isAdmin, page]);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);
  useEffect(() => {
    if (toast) {
      const id = window.setTimeout(() => setToast(''), 3200);
      return () => window.clearTimeout(id);
    }
  }, [toast]);
  const can = (permission: string) => !!ROLE_PERMISSIONS[role]?.includes(permission);
  const nav = useMemo(
    () => [
      { id: 'overview' as Page, label: t('overview'), icon: LayoutDashboard },
      
      {
        id: 'analytics' as Page,
        label: t('analytics'),
        icon: ChartNoAxesCombined,
        permission: 'analytics:individuals',
      },
      { id: 'bulk' as Page, label: t('bulk'), icon: FileSpreadsheet, permission: 'bulk:upload' },
      { id: 'claims' as Page, label: t('claims'), icon: ClipboardCheck, permission: 'claims:read' },
      { id: 'audit' as Page, label: t('audit'), icon: Shield, permission: 'audit:read' },
      { id: 'users' as Page, label: t('users'), icon: Users, permission: 'users:manage' },
      { id: 'guide' as Page, label: t('guide'), icon: Activity },
    ],
    [t],
  );
  const login = async (email = loginEmail, password = loginPassword) => {
    try {
      const r = await request<{ accessToken: string; user: User }>('/auth/login', 'post', {
        email,
        password,
      });
      localStorage.setItem('mlrf-token', r.accessToken);
      localStorage.setItem('mlrf-role', r.user.role);
      setToken(r.accessToken);
      setRole(r.user.role);
      setToast(t('toasts.signedIn'));
      navigateTo('/');
      await qc.invalidateQueries();
    } catch (e) {
      setToast(messageFromError(e, t('toasts.signInFailed')));
      throw e;
    }
  };
  const switchRole = async (next: Role) => {
    try {
      const r = await request<{ accessToken: string; user: User }>(
        '/auth/demo/switch-role',
        'post',
        { role: next },
      );
      localStorage.setItem('mlrf-token', r.accessToken);
      localStorage.setItem('mlrf-role', next);
      setToken(r.accessToken);
      setRole(next);
      if (next === 'subscriber') {
        setPage('subscriber');
        setSubscriberTab('journey');
      } else if (next === 'inspector') {
        setPage('inspector');
      } else {
        setPage('overview');
      }
      setToast(t('toasts.demoRole', { role: roleLabel(next) }));
      navigateTo('/');
      await qc.invalidateQueries();
    } catch (e) {
      setToast(messageFromError(e, t('toasts.roleFailed')));
      throw e;
    }
  };
  const signOut = () => {
    localStorage.removeItem('mlrf-token');
    localStorage.removeItem('mlrf-role');
    setToken('');
    setPage('overview');
    navigateTo('/');
  };
  const verifyCustom = async (idToVerify?: string) => {
    const target = idToVerify ?? identifier;
    try {
      const res = await request<any>('/inspector/verify', 'post', {
        qrHash: target,
        certificateNumber: target,
      });
      setVerifyResult(res);
    } catch (e) {
      setVerifyResult({
        result: 'ERROR',
        message: messageFromError(e, t('toasts.verifyFailed')),
      });
    }
  };

  const logInspectionAction = async (outcome: 'compliant' | 'notice' | 'violation') => {
    try {
      await request('/inspector/actions', 'post', {
        identifier,
        outcome,
        facilityName: verifyResult?.name || 'Medical Practice',
        notes:
          outcome === 'compliant'
            ? 'Routine validation passed'
            : outcome === 'notice'
              ? 'Expired certificate - 14 day grace notice given'
              : 'Unregistered facility reported',
      });
      setInspectorHistory((prev) => [
        {
          id: String(Date.now()),
          identifier: identifier || 'MLRF-CHECK',
          outcome,
          time: t('now') || 'Just now',
        },
        ...prev.slice(0, 9),
      ]);
      setToast(t('toasts.actionLogged', { outcome }));
    } catch {
      setInspectorHistory((prev) => [
        {
          id: String(Date.now()),
          identifier: identifier || 'MLRF-CHECK',
          outcome,
          time: 'Just now',
        },
        ...prev.slice(0, 9),
      ]);
      setToast(t('inspectorPortal.logAction') + ' ✓');
    }
  };

  const _verify = async () => {
    try {
      setVerifyResult(
        await request<any>('/inspector/verify', 'post', {
          qrHash: identifier,
          certificateNumber: identifier,
        }),
      );
    } catch (e) {
      setVerifyResult({
        result: 'ERROR',
        message: messageFromError(e, t('toasts.verifyFailed')),
      });
    }
  };
  const previewBulk = async (commit = false) => {
    try {
      const rows = bulkText
        .trim()
        .split(/\r?\n/)
        .slice(1)
        .map((line) => {
          const [name, phone, nationalId, specialty, amount] = line.split(',');
          return { name, phone, nationalId, specialty, amount: Number(amount) };
        });
      const data = await request<any>(
        '/admin/bulk-batches',
        'post',
        { filename: 'demo-bank-upload.csv', rows },
        { dryRun: String(!commit) },
      );
      setBulkPreview(data);
      if (commit) {
        setToast(t('toasts.batchCommitted'));
        await qc.invalidateQueries();
      }
    } catch (e) {
      setToast(messageFromError(e, t('toasts.bulkFailed')));
    }
  };
  if (!token || !currentUser) {
    if (currentPath === '/login') {
      return (
        <>
          <LoginView
            onLogin={login}
            onSwitchRole={switchRole}
            onBackToHome={() => navigateTo('/')}
            dark={dark}
            onToggleDark={() => setDark(!dark)}
            roleLabel={roleLabel}
          />
          {toast && <div className="toast">{toast}</div>}
        </>
      );
    }

    return (
      <div className="landing-page-wrapper">
        {/* Top Floating Navbar */}
        <header className="landing-nav">
          <div className="landing-nav-inner">
            <div className="landing-brand">
              <div className="brand-mark">
                <ShieldCheck size={28} />
              </div>
              <div>
                <strong>MLRF</strong>
                <span>{t('brandShort')}</span>
              </div>
            </div>
            <div className="landing-nav-actions">
              <button
                type="button"
                className="nav-login-btn"
                onClick={() => navigateTo('/login')}
              >
                <User size={16} />
                <span>{t('landing.loginAction', { defaultValue: 'تسجيل الدخول' })}</span>
              </button>
              <button
                type="button"
                className="icon-btn"
                title={t('shell.toggleTheme')}
                onClick={() => setDark(!dark)}
              >
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '7px 14px', fontSize: 12 }}
                onClick={() => void i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en')}
              >
                <Globe size={15} /> {i18n.language === 'en' ? 'العربية' : 'English'}
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section with Sky Gradient Band */}
        <section className="sky-hero-band">
          <div className="landing-hero">
            <div className="hero-content-col">
              <div className="hero-badges-row">
                <div className="hero-law-badge">
                  <ShieldCheck size={16} />
                  <span>{t('landing.aboutTitle')}</span>
                </div>
                <div className="hero-deadline-banner">
                  <Clock3 size={16} />
                  <span>{t('landing.mandatoryDeadlineBanner')}</span>
                </div>
              </div>
              <h1 className="hero-headline">{t('landing.heroTitle')}</h1>
              <p className="hero-lead">{t('landing.heroSubtitle')}</p>

              <button
                type="button"
                className="hero-cta-btn"
                onClick={() => navigateTo('/login')}
              >
                <User size={18} />
                <span>{t('landing.loginAction', { defaultValue: 'تسجيل الدخول إلى المنصة' })}</span>
                <ArrowRight size={18} />
              </button>

              <div className="hero-features-list">
                <div className="hero-feature-item">
                  <span className="hero-feature-icon">⚖️</span>
                  <div>
                    <strong>حماية قانونية وتأمينية متكاملة</strong>
                    <p>تغطية شاملة ضد دعاوى ومخاطر المسؤولية الطبية والأخطاء المهنية.</p>
                  </div>
                </div>
                <div className="hero-feature-item">
                  <span className="hero-feature-icon">🏛️</span>
                  <div>
                    <strong>اعتماد رسمي ورقمي موحد</strong>
                    <p>شهادة رقمية موثقة ومعتمدة لدى وزارة الصحة ونقابات المهن الطبية وجهات التفتيش.</p>
                  </div>
                </div>
                <div className="hero-feature-item">
                  <span className="hero-feature-icon">🛡️</span>
                  <div>
                    <strong>مظلة تكافلية تشمل كافة التخصصات</strong>
                    <p>تعويضات مقرة بموجب قانون تنظيم المسئولية الطبية وسلامة المريض رقم (13) لسنة 2025 لحماية الأطباء والمنشآت الصحية.</p>
                  </div>
                </div>
              </div>

              <div className="landing-stats-row">
                <div className="stat-box">
                  <strong>2,500+</strong>
                  <span>{t('login.subscribers')}</span>
                </div>
                <div className="stat-box">
                  <strong>27</strong>
                  <span>{t('login.governorates')}</span>
                </div>
                <div className="stat-box">
                  <strong>100%</strong>
                  <span>{t('login.flows')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: About the Fund & Medical Liability Law 13 of 2025 */}
        <section className="landing-section-wrapper bg-white">
          <div className="landing-section">
            <div className="section-header-centered">
              <span className="eyebrow">{t('landing.aboutTitle')}</span>
              <h2>{t('landing.aboutTitle')}</h2>
              <div className="header-divider" />
            </div>

            <div className="about-fund-grid">
              <div className="panel about-card main-about">
                <div className="about-icon-badge">
                  <Scale size={28} />
                </div>
                <h3>الأساس التشريعي وقوة الإلزام القانوني</h3>
                <p className="lead-text">{t('landing.aboutText')}</p>
                <div className="law-highlights">
                  <div className="highlight-item">
                    <CheckCircle2 size={18} className="highlight-icon" />
                    <span>توفير مظلة تعويضية قانونية فورية للمتضررين من الأخطاء المهنية الطبية.</span>
                  </div>
                  <div className="highlight-item">
                    <CheckCircle2 size={18} className="highlight-icon" />
                    <span>حماية الاستقرار الوظيفي للأطباء وأعضاء المهن الطبية والمنشآت الصحية.</span>
                  </div>
                  <div className="highlight-item">
                    <CheckCircle2 size={18} className="highlight-icon" />
                    <span>إرساء منظومة رقمية متكاملة تضمن سرعة الفصل والتعويض العادل بشفافية تامة.</span>
                  </div>
                </div>
              </div>

              <div className="about-pillars">
                <div className="panel pillar-card">
                  <div className="pillar-header">
                    <HeartPulse size={22} />
                    <h4>الأطباء والممارسون</h4>
                  </div>
                  <p>تغطية تأمينية لكافة الفئات من أطباء بشريين، أسنان، صيادلة، علاج طبيعي، وهيئات التمريض.</p>
                </div>

                <div className="panel pillar-card">
                  <div className="pillar-header">
                    <Building2 size={22} />
                    <h4>المنشآت والمراكز الصحية</h4>
                  </div>
                  <p>حماية المستشفيات، المراكز الطبية، العيادات، معامل التحاليل، ومراكز الأشعة وفق المعايير المعتمدة.</p>
                </div>

                <div className="panel pillar-card">
                  <div className="pillar-header">
                    <ScanLine size={22} />
                    <h4>الرقابة والتفتيش الرقمي</h4>
                  </div>
                  <p>التحقق اللحظي عبر الرمز المشفر (QR) والتفتيش الميداني للتأكد من انتظام التغطية والتراخيص.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Presidential Appreciation */}
        <section className="landing-section-wrapper bg-tint">
          <div className="landing-section">
            <div className="panel president-card">
              <div className="president-card-content">
                <div className="president-badge">
                  <Award size={20} />
                  <span>{t('landing.presidentThanksTitle')}</span>
                </div>
                <h2>تحية تقدير وإعزاز من «جيش مصر الأبيض» للقيادة السياسية</h2>
                <div className="president-quote">
                  <p className="president-text">{t('landing.presidentThanksText')}</p>
                </div>
                <div className="president-card-footer">
                  <div className="republic-seal">
                    <ShieldCheck size={26} />
                    <div>
                      <strong>جمهورية مصر العربية</strong>
                      <span>صندوق التعويض عن مخاطر المهن الطبية</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Landing Page Footer */}
        <footer className="landing-footer">
          <div className="landing-footer-inner">
            <div className="footer-left">
              <strong>MLRF — {t('brandShort')}</strong>
              <p>جمهورية مصر العربية • جميع الحقوق محفوظة © 2026</p>
            </div>
            <div className="footer-right">
              <span>قانون تنظيم المسئولية الطبية وسلامة المريض رقم (13) لسنة 2025</span>
              <span>بوابة الخدمات الحكومية الرقمية</span>
            </div>
          </div>
        </footer>

        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  }
  const kpis = analytics.data?.kpis ?? {
    activeSubscribers: 2481,
    totalRevenue: 6245000,
    yoyRenewalRate: 78.4,
    unrenewed: 342,
  };
  return (
    <>
      {/* PORTAL 1: Subscriber Portal (Doctor / Medical Facility) */}
      {isSubscriber && (
        <div className="standalone-portal">
          <header className="standalone-header">
            <div className="standalone-brand">
              <div className="brand-logo">
                <HeartPulse size={24} />
              </div>
              <div>
                <h2>{t('doctorPortal.headerTitle')}</h2>
                <p>{t('doctorPortal.headerSubtitle')}</p>
              </div>
            </div>

            <div className="standalone-tabs">
              <button
                type="button"
                className={`standalone-tab-btn ${subscriberTab === 'journey' ? 'active' : ''}`}
                onClick={() => setSubscriberTab('journey')}
              >
                <FileText size={16} />
                {t('doctorPortal.tabJourney')}
              </button>
              <button
                type="button"
                className={`standalone-tab-btn ${subscriberTab === 'certificate' ? 'active' : ''}`}
                onClick={() => setSubscriberTab('certificate')}
              >
                <BadgeCheck size={16} />
                {t('doctorPortal.tabCertificate')}
              </button>
            </div>

            <div className="portal-actions">
              <div className="subscriber-badge">
                <span className="live-dot" />
                <span>{currentUser.name}</span>
              </div>
              <button
                type="button"
                className="icon-btn"
                title={t('shell.toggleTheme')}
                onClick={() => setDark(!dark)}
              >
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                type="button"
                className="icon-btn"
                title={t('shell.switchLanguage')}
                onClick={() => void i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en')}
              >
                <Globe size={18} />
              </button>
              <button
                type="button"
                className="notification-btn"
                title={t('shell.notifications')}
              >
                <Bell size={18} />
                <i />
              </button>
              <div
                role="button"
                tabIndex={0}
                className="avatar-circle"
                onClick={signOut}
                onKeyDown={(e) => e.key === 'Enter' && signOut()}
                title={t('logout')}
              >
                {currentUser.name
                  .split(' ')
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>
            </div>
          </header>

          <main className="standalone-main">
            <Subscriber
              setToast={setToast}
              forceCertificateView={subscriberTab === 'certificate'}
              onGoToJourney={() => setSubscriberTab('journey')}
            />
          </main>
        </div>
      )}

      {/* PORTAL 2: Inspector / Field Watcher Portal */}
      {isInspector && (
        <div className="standalone-portal">
          <header className="standalone-header">
            <div className="standalone-brand">
              <div className="brand-logo inspector-logo">
                <ScanLine size={24} />
              </div>
              <div>
                <h2>{t('inspectorPortal.title')}</h2>
                <p>{t('inspectorPortal.subtitle')}</p>
              </div>
            </div>

            <div className="portal-actions">
              <div className="inspector-badge">
                <ShieldCheck size={16} />
                <span>
                  {t('inspectorPortal.officerBadge')} ({currentUser.name})
                </span>
              </div>
              <button
                type="button"
                className="icon-btn"
                title={t('shell.toggleTheme')}
                onClick={() => setDark(!dark)}
              >
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                type="button"
                className="icon-btn"
                title={t('shell.switchLanguage')}
                onClick={() => void i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en')}
              >
                <Globe size={18} />
              </button>
              <button
                type="button"
                className="notification-btn"
                title={t('shell.notifications')}
              >
                <Bell size={18} />
                <i />
              </button>
              <div
                role="button"
                tabIndex={0}
                className="avatar-circle"
                onClick={signOut}
                onKeyDown={(e) => e.key === 'Enter' && signOut()}
                title={t('logout')}
              >
                {currentUser.name
                  .split(' ')
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>
            </div>
          </header>

          <main className="standalone-main inspector-container">
            <InspectorStandalone
              identifier={identifier}
              setIdentifier={setIdentifier}
              verifyResult={verifyResult}
              setVerifyResult={setVerifyResult}
              onVerify={verifyCustom}
              onLogAction={logInspectionAction}
              history={inspectorHistory}
            />
          </main>
        </div>
      )}

      {/* PORTAL 3: Fund Management & Admins Portal */}
      {isAdmin && (
    <div className="app-shell">
      <aside className={`sidebar ${sidebar ? 'sidebar-open' : ''}`}>
        <div className="side-brand">
          <div className="brand-mark">
            <ShieldCheck size={23} />
          </div>
          <div>
            <strong>MLRF</strong>
            <span>{t('portal')}</span>
          </div>
          <button className="icon-btn close-side" onClick={() => setSidebar(false)}>
            <X size={18} />
          </button>
        </div>
        <div className="workspace-pill">
          <div className="workspace-avatar">
            <Building2 size={17} />
          </div>
          <div>
            <strong>{t('shell.nationalFund')}</strong>
            <span>{t('shell.egyptDemo')}</span>
          </div>
          <ChevronDown size={15} />
        </div>
        <div className="nav-label">{t('shell.workspace')}</div>
        <nav>
          {nav
            .filter(
              (n) =>
                !n.permission ||
                can(n.permission) ||
                (n.id === 'analytics' && can('analytics:facilities')),
            )
            .map((item) => (
              <button
                key={item.id}
                className={`nav-item ${page === item.id ? 'active' : ''}`}
                onClick={() => {
                  setPage(item.id);
                  setSidebar(false);
                }}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                {item.id === 'audit' && <span className="nav-live" />}
              </button>
            ))}
        </nav>
        <div className="side-bottom">
          <div className="help-card">
            <div className="help-icon">
              <Activity size={17} />
            </div>
            <strong>{t('shell.needHelp')}</strong>
            <p>{t('shell.helpBody')}</p>
            <button onClick={() => setPage('guide')}>
              {t('shell.openGuide')} <ArrowRight size={14} />
            </button>
          </div>
          <div className="side-user">
            <div className="avatar">
              {currentUser.name
                .split(' ')
                .map((s) => s[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div className="user-info">
              <strong>{currentUser.name}</strong>
              <span>{roleLabel(currentUser.role)}</span>
            </div>
            <button className="icon-btn" onClick={signOut} title={t('logout')}>
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="top-left">
            <button className="icon-btn mobile-menu" onClick={() => setSidebar(true)}>
              <Menu />
            </button>
            <div className="breadcrumb">
              <span>{t('workspace')}</span>
              <span className="crumb-slash">/</span>
              <strong>{nav.find((n) => n.id === page)?.label ?? t('overview')}</strong>
            </div>
          </div>
          <div className="top-actions">
            <div className="environment">
              <span className="live-dot" />
              {t('demo')}
            </div>
            <div className="role-switch">
              <span>{t('role')}</span>
              <select
                value={role}
                onChange={(e) => void switchRole(e.target.value as Role)}
                aria-label={t('role')}
              >
                {roles.map((r) => (
                  <option value={r} key={r}>
                    {roleLabel(r)}
                  </option>
                ))}
              </select>
            </div>
            <div className="portal-actions">
              <button
                type="button"
                className="icon-btn"
                title={t('shell.toggleTheme')}
                onClick={() => setDark(!dark)}
              >
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                type="button"
                className="icon-btn"
                title={t('shell.switchLanguage')}
                onClick={() => void i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en')}
              >
                <Globe size={18} />
              </button>
              <button
                type="button"
                className="notification-btn"
                title={t('shell.notifications')}
              >
                <Bell size={18} />
                <i />
              </button>
              <div
                role="button"
                tabIndex={0}
                className="avatar-circle"
                onClick={signOut}
                onKeyDown={(e) => e.key === 'Enter' && signOut()}
                title={t('logout')}
              >
                {currentUser.name
                  .split(' ')
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>
            </div>
          </div>
        </header>
        <div className="page-content">
          {page === 'overview' && (
            <>
              <div className="welcome-row">
                <div>
                  <div className="eyebrow">
                    {formatLongDate('2026-10-19T12:00:00')} <span className="gold-line" />
                  </div>
                  <h1>
                    {t('welcome')}, {currentUser.name.split(' ')[0]} <span className="wave">✦</span>
                  </h1>
                  <p className="muted">{t('overviewPage.todayLead')}</p>
                </div>
                <button className="btn btn-outline" onClick={() => void qc.invalidateQueries()}>
                  <RefreshCw size={16} /> {t('overviewPage.refresh')}
                </button>
              </div>
              <div className="hero-banner">
                <div className="hero-pattern" />
                <div className="hero-content">
                  <div className="hero-badge">
                    <ShieldCheck size={14} /> {t('overviewPage.badge')}
                  </div>
                  <h2>
                    {t('overviewPage.heroTitle')}
                    <br />
                    <em>{t('overviewPage.heroEmphasis')}</em>
                  </h2>
                  <p>{t('overviewPage.heroBody')}</p>
                  <button className="btn btn-light" onClick={() => setPage('analytics')}>
                    {t('overviewPage.explore')} <ArrowRight size={16} />
                  </button>
                </div>
                <div className="hero-illustration">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <div className="hero-shield">
                    <ShieldCheck size={68} />
                  </div>
                  <div className="float-chip chip-one">
                    <CheckCircle2 size={17} />
                    <span>
                      <b>{t('overviewPage.verified')}</b>
                      <small>{t('overviewPage.coverageActive')}</small>
                    </span>
                  </div>
                  <div className="float-chip chip-two">
                    <Activity size={17} />
                    <span>
                      <b>+12.8%</b>
                      <small>{t('overviewPage.renewalGrowth')}</small>
                    </span>
                  </div>
                  <div className="float-chip chip-three">
                    <Building2 size={17} />
                    <span>
                      <b>27</b>
                      <small>{t('login.governorates')}</small>
                    </span>
                  </div>
                </div>
              </div>
              <div className="section-heading">
                <div>
                  <h2>{t('overviewPage.glance')}</h2>
                  <p>{t('overviewPage.glanceBody')}</p>
                </div>
                <div className="select-wrap">
                  <span>{t('overviewPage.fiscalYear')}</span>
                  <select value={year} onChange={(e) => setYear(e.target.value)}>
                    <option value="year1">{t('years.year1')}</option>
                    <option value="year2_3">{t('years.year23')}</option>
                  </select>
                </div>
              </div>
              <div className="kpi-grid">
                <Kpi
                  title={t('active')}
                  value={formatCount(kpis.activeSubscribers)}
                  change="12.8%"
                  trend="up"
                  icon={Users}
                  color="teal"
                  caption={t('overviewPage.vsPrior')}
                />
                <Kpi
                  title={t('revenue')}
                  value={money(kpis.totalRevenue)}
                  change="8.3%"
                  trend="up"
                  icon={Banknote}
                  color="gold"
                  caption={t('overviewPage.vsPrior')}
                />
                <Kpi
                  title={t('renewal')}
                  value={`${kpis.yoyRenewalRate}%`}
                  change="2.4%"
                  trend="up"
                  icon={RefreshCw}
                  color="blue"
                  caption={t('overviewPage.yoyCaption')}
                />
                <Kpi
                  title={t('churn')}
                  value={formatCount(kpis.unrenewed)}
                  change="4.1%"
                  trend="down"
                  icon={ArrowDownRight}
                  color="rose"
                  caption={t('overviewPage.followUp')}
                />
              </div>
              <div className="dashboard-grid">
                <section className="panel growth-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>{t('overviewPage.growth')}</h3>
                      <p>{t('overviewPage.growthBody')}</p>
                    </div>
                    <button
                      className="subtle-select"
                      onClick={() => setYear(year === 'year1' ? 'year2_3' : 'year1')}
                    >
                      {year === 'year1' ? t('years.year1') : t('years.year23')} <ChevronDown size={14} />
                    </button>
                  </div>
                  <div className="chart-legend">
                    <span>
                      <i className="legend-dot teal-bg" /> {t('overviewPage.newSubscribers')}
                    </span>
                    <span>
                      <i className="legend-dot gold-bg" /> {t('overviewPage.renewals')}
                    </span>
                  </div>
                  <div className="bar-chart">
                    {(
                      analytics.data?.cohorts ?? [
                        { name: 'Q1', signups: 440, renewals: 320 },
                        { name: 'Q2', signups: 510, renewals: 370 },
                        { name: 'Q3', signups: 390, renewals: 430 },
                        { name: 'Q4', signups: 620, renewals: 500 },
                      ]
                    ).map((d: any, i: number) => (
                      <div className="bar-group" key={d.name}>
                        <div className="bars">
                          <div
                            className="bar teal-bar"
                            style={{
                              height: `${Math.max(15, Math.min(100, (d.signups ?? d.newSignups ?? 0) / 7))}%`,
                            }}
                            title={t('overviewPage.signupsTitle', {
                              n: d.signups ?? d.newSignups ?? 0,
                            })}
                          />
                          <div
                            className="bar gold-bar"
                            style={{
                              height: `${Math.max(12, Math.min(100, (d.renewals ?? 0) / 7))}%`,
                            }}
                            title={t('overviewPage.renewalsTitle', { n: d.renewals ?? 0 })}
                          />
                        </div>
                        <span>{cohortLabel(['Q1', 'Q2', 'Q3', 'Q4'][i] ?? d.name)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="chart-footer">
                    <span>
                      <span className="status-dot success-dot" /> {t('overviewPage.aboveTarget')}
                    </span>
                    <button onClick={() => setPage('analytics')}>
                      {t('overviewPage.viewReport')} <ArrowRight size={14} />
                    </button>
                  </div>
                </section>
                <section className="panel activity-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>{t('recentActivity')}</h3>
                      <p>{t('overviewPage.latestEvents')}</p>
                    </div>
                    <button
                      className="icon-btn"
                      onClick={() => void qc.invalidateQueries({ queryKey: ['audit'] })}
                    >
                      <MoreHorizontal />
                    </button>
                  </div>
                  <div className="activity-list">
                    {(
                      auditQuery.data?.items ?? [
                        {
                          id: 'a1',
                          action: 'PAYMENT_SUCCESS',
                          user: 'Dr. Mariam Hassan',
                          timestamp: new Date().toISOString(),
                          role: 'subscriber',
                        },
                        {
                          id: 'a2',
                          action: 'PROFILE_UPDATED',
                          user: 'Ahmed Inspector',
                          timestamp: new Date(Date.now() - 3600000).toISOString(),
                          role: 'inspector',
                        },
                        {
                          id: 'a3',
                          action: 'LOGIN',
                          user: 'Finance Admin',
                          timestamp: new Date(Date.now() - 7200000).toISOString(),
                          role: 'finance_admin',
                        },
                        {
                          id: 'a4',
                          action: 'EXPORT_REQUESTED',
                          user: 'Super Admin',
                          timestamp: new Date(Date.now() - 10800000).toISOString(),
                          role: 'super_admin',
                        },
                      ]
                    )
                      .slice(0, 4)
                      .map((a: any, i: number) => (
                        <div className="activity-item" key={a.id}>
                          <div className={`activity-icon activity-${i % 4}`}>
                            {i === 0 ? (
                              <WalletCards size={16} />
                            ) : i === 1 ? (
                              <Users size={16} />
                            ) : i === 2 ? (
                              <LockKeyhole size={16} />
                            ) : (
                              <FileText size={16} />
                            )}
                          </div>
                          <div className="activity-text">
                            <strong>{actionLabel(a.action)}</strong>
                            <span>
                              {a.user} · {roleLabel(a.role ?? '')}
                            </span>
                          </div>
                          <time>{timeAgo(a.timestamp)}</time>
                        </div>
                      ))}
                  </div>
                  <button className="activity-all" onClick={() => setPage('audit')}>
                    {t('overviewPage.viewAll')} <ArrowRight size={14} />
                  </button>
                </section>
              </div>
              <div className="section-heading action-heading">
                <div>
                  <h2>{t('quickActions')}</h2>
                  <p>{t('overviewPage.jump')}</p>
                </div>
              </div>
              <div className="quick-grid">
                <Quick
                  icon={ScanLine}
                  title={t('verify')}
                  detail={t('overviewPage.scanDetail')}
                  onClick={() => void switchRole('inspector')}
                />
                <Quick
                  icon={UploadCloud}
                  title={t('newBatch')}
                  detail={t('overviewPage.batchDetail')}
                  onClick={() => setPage('bulk')}
                />
                <Quick
                  icon={ChartNoAxesCombined}
                  title={t('viewAnalytics')}
                  detail={t('overviewPage.analyticsDetail')}
                  onClick={() => setPage('analytics')}
                />
              </div>
            </>
          )}
          {page === 'analytics' && (
            <>
              <PageTitle
                eyebrow={t('analyticsPage.eyebrow')}
                title={t('analyticsPage.title')}
                description={t('analyticsPage.body')}
                action={
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      const rows = (
                        analytics.data?.distribution ??
                        DEMO_TIERS.slice(0, 6).map((tier, i) => ({
                          name: tier.name,
                          subscribers: 160 - i * 12,
                          revenue: (160 - i * 12) * tier.fee,
                        }))
                      ).map((d: any) => ({
                        [t('analyticsPage.specialty') || 'التخصص / الفئة']: specialtyLabel(d.name),
                        [t('analyticsPage.subscribers') || 'عدد المشتركين']: d.subscribers,
                        [t('analyticsPage.revenue') || 'إجمالي الرسوم (جنيه)']: d.revenue,
                      }));
                      exportToExcel(rows, `mlrf_analytics_${year}.xlsx`, 'Analytics');
                      setToast(
                        i18n.language === 'ar'
                          ? 'تم استخراج وتحميل تقرير التحليلات بنجاح'
                          : 'Analytics report exported successfully',
                      );
                    }}
                  >
                    <Download size={16} /> {t('analyticsPage.export')}
                  </button>
                }
              />
              <div className="filter-row">
                <div className="select-wrap">
                  <span>{t('analyticsPage.scenario')}</span>
                  <select value={year} onChange={(e) => setYear(e.target.value)}>
                    <option value="year1">{t('years.year1')}</option>
                    <option value="year2_3">{t('years.year23')}</option>
                  </select>
                </div>
                <div className="filter-note">
                  <Activity size={15} /> {t('analyticsPage.live')}
                </div>
              </div>
              <div className="kpi-grid">
                <Kpi
                  title={t('active')}
                  value={formatCount(kpis.activeSubscribers)}
                  change="12.8%"
                  trend="up"
                  icon={Users}
                  color="teal"
                  caption={t('overviewPage.vsPriorShort')}
                />
                <Kpi
                  title={t('revenue')}
                  value={money(kpis.totalRevenue)}
                  change="8.3%"
                  trend="up"
                  icon={Banknote}
                  color="gold"
                  caption={t('overviewPage.paidContributions')}
                />
                <Kpi
                  title={t('yoyRenewal')}
                  value={`${kpis.yoyRenewalRate}%`}
                  change="2.4%"
                  trend="up"
                  icon={RefreshCw}
                  color="blue"
                  caption={t('overviewPage.yoyShort')}
                />
                <Kpi
                  title={t('churn')}
                  value={formatCount(kpis.unrenewed)}
                  change="4.1%"
                  trend="down"
                  icon={ArrowDownRight}
                  color="rose"
                  caption={t('overviewPage.followUpShort')}
                />
              </div>
              <div className="dashboard-grid">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>{t('analyticsPage.revenueBy')}</h3>
                      <p>{t('analyticsPage.revenueHint')}</p>
                    </div>
                  </div>
                  <div className="horizontal-bars">
                    {(
                      analytics.data?.distribution ??
                      DEMO_TIERS.slice(0, 6).map((tier, i) => ({
                        name: tier.name,
                        subscribers: 160 - i * 12,
                        revenue: (160 - i * 12) * tier.fee,
                      }))
                    )
                      .slice(0, 7)
                      .map((d: any) => (
                        <div className="horizontal-row" key={d.name}>
                          <div>
                            <span>{specialtyLabel(d.name)}</span>
                            <strong>{money(d.revenue)}</strong>
                          </div>
                          <div className="track">
                            <span
                              style={{ width: `${Math.min(100, (d.revenue / 90000) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </section>
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>{t('analyticsPage.cohorts')}</h3>
                      <p>{t('analyticsPage.cohortsHint')}</p>
                    </div>
                  </div>
                  <div className="cohort-list">
                    {(analytics.data?.cohorts ?? []).map((d: any) => (
                      <div className="cohort-row" key={d.name}>
                        <span>{cohortLabel(d.name)}</span>
                        <strong>
                          {formatCount(d.signups || d.newSignups || d.renewals || 0)}
                        </strong>
                        <div className="track">
                          <span
                            style={{
                              width: `${Math.min(100, (d.signups || d.newSignups || d.renewals || 0) / 10)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="note-card compact">
                    <Activity />
                    <div>
                      <strong>
                        {t('analyticsPage.scenarioNamed', {
                          name: year === 'year1' ? t('years.year1') : t('years.years23'),
                        })}
                      </strong>
                      <p>{t('analyticsPage.switchScenario')}</p>
                    </div>
                  </div>
                </section>
              </div>
              <section className="panel heatmap-panel">
                <div className="panel-heading">
                  <div>
                    <h3>{t('analyticsPage.heatmap')}</h3>
                    <p>{t('analyticsPage.heatmapHint')}</p>
                  </div>
                  <span className="status-chip warning">{t('analyticsPage.weakest')}</span>
                </div>
                <div className="heatmap-table">
                  <div className="heat-row heat-head">
                    <span>{t('analyticsPage.governorate')}</span>
                    {(
                      analytics.data?.heatmap?.[0]?.values ??
                      DEMO_TIERS.slice(0, 5).map((tier) => ({ specialty: tier.name }))
                    )
                      .slice(0, 5)
                      .map((v: any) => (
                        <span key={v.specialty}>{specialtyLabel(v.specialty)}</span>
                      ))}
                  </div>
                  {(analytics.data?.heatmap ?? []).slice(0, 7).map((g: any) => (
                    <div className="heat-row" key={g.governorate}>
                      <strong>{governorateLabel(g.governorate)}</strong>
                      {g.values.slice(0, 5).map((v: any) => (
                        <span
                          className={`heat-cell ${v.rate < 60 ? 'heat-low' : v.rate < 75 ? 'heat-mid' : 'heat-high'}`}
                          key={v.specialty}
                          title={`${specialtyLabel(v.specialty)}: ${v.rate}%`}
                        >
                          {v.rate}%
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
          {page === 'bulk' && (
            <>
              <PageTitle
                eyebrow={t('bulkPage.eyebrow')}
                title={t('bulkPage.title')}
                description={t('bulkPage.body')}
                action={
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      setBulkText(
                        'name,phone,nationalId,specialty,amount\nDr. Sample One,01012345678,29901011234567,General Practitioner,1800\nDr. Sample Two,01112345678,29902021234568,Surgery,4200\nDuplicate Example,01012345678,29901011234567,General Practitioner,1800\nInvalid ID,01212345678,123,Cardiology,3000',
                      );
                      setBulkPreview(null);
                    }}
                  >
                    <RefreshCw size={15} /> {t('bulkPage.reset')}
                  </button>
                }
              />
              <div className="bulk-summary">
                <div>
                  <FileSpreadsheet />
                  <span>
                    <small>{t('bulkPage.tiers')}</small>
                    <strong>{t('bulkPage.feeTiers', { n: DEMO_TIERS.length })}</strong>
                  </span>
                </div>
                <div>
                  <ShieldCheck />
                  <span>
                    <small>{t('bulkPage.duplicates')}</small>
                    <strong>{t('bulkPage.duplicateKey')}</strong>
                  </span>
                </div>
                <div>
                  <Bell />
                  <span>
                    <small>{t('bulkPage.notifications')}</small>
                    <strong>{t('bulkPage.sms')}</strong>
                  </span>
                </div>
              </div>
              <div className="panel upload-panel">
                <div className="panel-heading">
                  <div>
                    <h3>{t('bulkPage.import')}</h3>
                    <p>{t('bulkPage.importBody')}</p>
                  </div>
                  <span className="status-chip neutral">{t('bulkPage.dryRun')}</span>
                </div>
                <textarea
                  className="bulk-textarea"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={7}
                  aria-label={t('bulkPage.csvLabel')}
                />
                <div className="upload-footer">
                  <span>
                    <FileText size={15} /> {t('bulkPage.csvHint')}
                  </span>
                  <div>
                    <button className="btn btn-outline" onClick={() => void previewBulk(false)}>
                      <Search size={15} /> {t('bulkPage.preview')}
                    </button>
                    <button
                      className="btn btn-primary"
                      disabled={!bulkPreview?.rows?.length || bulkPreview?.dryRun === false}
                      onClick={() => void previewBulk(true)}
                    >
                      <Check size={16} /> {t('bulkPage.commit')}
                    </button>
                  </div>
                </div>
              </div>
              {bulkPreview && (
                <section className="panel results-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>{bulkPreview.dryRun ? t('bulkPage.previewTitle') : t('bulkPage.committedTitle')}</h3>
                      <p>{t('bulkPage.review')}</p>
                    </div>
                    <span className={`status-chip ${bulkPreview.dryRun ? 'warning' : 'success'}`}>
                      {bulkPreview.dryRun ? t('bulkPage.dryRunChip') : t('bulkPage.committedChip')}
                    </span>
                  </div>
                  <div className="mini-kpis">
                    <Mini
                      label={t('bulkPage.total')}
                      value={bulkPreview.summary?.total ?? bulkPreview.total}
                    />
                    <Mini
                      label={t('bulkPage.created')}
                      value={bulkPreview.summary?.created ?? bulkPreview.created}
                      tone="success"
                    />
                    <Mini
                      label={t('bulkPage.duplicate')}
                      value={bulkPreview.summary?.duplicate ?? bulkPreview.duplicate}
                      tone="warning"
                    />
                    <Mini
                      label={t('bulkPage.invalid')}
                      value={bulkPreview.summary?.invalid ?? bulkPreview.invalid}
                      tone="danger"
                    />
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>{t('bulkPage.row')}</th>
                          <th>{t('bulkPage.name')}</th>
                          <th>{t('bulkPage.nationalId')}</th>
                          <th>{t('bulkPage.specialty')}</th>
                          <th>{t('bulkPage.amount')}</th>
                          <th>{t('bulkPage.status')}</th>
                          <th>{t('bulkPage.reason')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(bulkPreview.rows ?? []).map((r: any) => (
                          <tr key={r.rowNumber}>
                            <td>{r.rowNumber}</td>
                            <td>{r.name}</td>
                            <td>{r.nationalId}</td>
                            <td>{specialtyLabel(r.specialty)}</td>
                            <td>{money(Number(r.amount) || 0)}</td>
                            <td>
                              <span
                                className={`status-chip ${r.status === 'created' ? 'success' : r.status === 'duplicate' ? 'warning' : 'danger'}`}
                              >
                                {statusLabel(r.status)}
                              </span>
                            </td>
                            <td>{reasonLabel(r.reason)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}
          {page === 'claims' && (
            <>
              <PageTitle
                eyebrow={t('claimsPage.eyebrow')}
                title={t('claimsPage.title')}
                description={t('claimsPage.body')}
                action={
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        const items = claimsQuery.data?.items ?? [];
                        const rows = items.map((c: any) => ({
                          [t('claimsPage.id') || 'رقم المطالبة']: c.id,
                          [t('claimsPage.doctor') || 'الطبيب / الممارس']: c.doctor,
                          [t('claimsPage.hospital') || 'المنشأة الطبية']: c.hospital,
                          [t('claimsPage.specialty') || 'التخصص']: specialtyLabel(c.specialty),
                          [t('claimsPage.stage') || 'المرحلة']: stageLabel(c.stage),
                          [t('claimsPage.awarded') || 'التعويض المقضي به (جنيه)']: c.awarded,
                          [t('claimsPage.paid') || 'المبلغ المنصرف (جنيه)']: c.paid,
                        }));
                        exportToExcel(
                          rows.length
                            ? rows
                            : [
                                {
                                  [t('claimsPage.id') || 'رقم المطالبة']: 'CLM-2026-001',
                                  [t('claimsPage.doctor') || 'الطبيب']: 'د. طارق محمود',
                                  [t('claimsPage.hospital') || 'المنشأة']: 'مستشفى السلام الدولي',
                                  [t('claimsPage.specialty') || 'التخصص']: 'جراحة عامة',
                                  [t('claimsPage.stage') || 'المرحلة']: 'صرف التعويض',
                                  [t('claimsPage.awarded') || 'التعويض']: 150000,
                                  [t('claimsPage.paid') || 'المنصرف']: 150000,
                                },
                              ],
                          'mlrf_claims_ledger.xlsx',
                          'Claims',
                        );
                        setToast(
                          i18n.language === 'ar'
                            ? 'تم استخراج وتحميل سجل التعويضات بنجاح'
                            : 'Claims ledger exported successfully',
                        );
                      }}
                    >
                      <Download size={16} /> {t('analyticsPage.export')}
                    </button>
                    <span className="status-chip neutral">{t('claimsPage.future')}</span>
                  </div>
                }
              />
              <div className="kpi-grid">
                <Kpi
                  title={t('claimsPage.filed')}
                  value={formatCount(claimsQuery.data?.kpis.totalFiled ?? 28)}
                  change=""
                  trend="up"
                  icon={ClipboardCheck}
                  color="teal"
                  caption={t('claimsPage.filedCaption')}
                />
                <Kpi
                  title={t('claimsPage.review')}
                  value={formatCount(claimsQuery.data?.kpis.underLegalReview ?? 6)}
                  change=""
                  trend="up"
                  icon={Clock3}
                  color="gold"
                  caption={t('claimsPage.reviewCaption')}
                />
                <Kpi
                  title={t('claimsPage.approved')}
                  value={formatCount(claimsQuery.data?.kpis.approvedCompensations ?? 22)}
                  change=""
                  trend="up"
                  icon={BadgeCheck}
                  color="blue"
                  caption={t('claimsPage.approvedCaption')}
                />
                <Kpi
                  title={t('claimsPage.disbursed')}
                  value={money(claimsQuery.data?.kpis.disbursed ?? 50000)}
                  change=""
                  trend="up"
                  icon={Banknote}
                  color="rose"
                  caption={t('claimsPage.disbursedCaption')}
                />
              </div>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>{t('claimsPage.ledger')}</h3>
                    <p>{t('claimsPage.ledgerBody')}</p>
                  </div>
                  <div className="search-field compact-search">
                    <Search size={15} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t('claimsPage.search')}
                    />
                  </div>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('claimsPage.id')}</th>
                        <th>{t('claimsPage.doctor')}</th>
                        <th>{t('claimsPage.hospital')}</th>
                        <th>{t('claimsPage.specialty')}</th>
                        <th>{t('claimsPage.stage')}</th>
                        <th>{t('claimsPage.awarded')}</th>
                        <th>{t('claimsPage.paid')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(claimsQuery.data?.items ?? [])
                        .filter((c: any) =>
                          `${c.id} ${c.doctor} ${c.hospital}`
                            .toLowerCase()
                            .includes(search.toLowerCase()),
                        )
                        .map((c: any) => (
                          <tr key={c.id}>
                            <td>
                              <strong>{c.id}</strong>
                            </td>
                            <td>{c.doctor}</td>
                            <td>{c.hospital}</td>
                            <td>{specialtyLabel(c.specialty)}</td>
                            <td>
                              <span
                                className={`status-chip ${c.stage === 'Payout' ? 'success' : c.stage === 'Legal Review' ? 'warning' : 'neutral'}`}
                              >
                                {stageLabel(c.stage)}
                              </span>
                            </td>
                            <td>{money(c.awarded)}</td>
                            <td>{money(c.paid)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
          {page === 'audit' && (
            <>
              <PageTitle
                eyebrow={t('auditPage.eyebrow')}
                title={t('auditPage.title')}
                description={t('auditPage.body')}
                action={
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        const items = auditQuery.data?.items ?? [];
                        const rows = items.map((a: any) => ({
                          [t('auditPage.time') || 'الوقت']: formatDateTime(a.timestamp),
                          [t('auditPage.user') || 'المستخدم']: a.user,
                          [t('usersPage.role') || 'الدور']: roleLabel(a.role),
                          [t('auditPage.action') || 'الإجراء']: actionLabel(a.action),
                          [t('auditPage.entity') || 'الكائن']: a.entity,
                          [t('auditPage.ip') || 'عنوان IP']: a.ip,
                        }));
                        exportToExcel(
                          rows.length ? rows : [{ 'الملاحظة': 'لا توجد سجلات حالية' }],
                          'mlrf_transactions_audit.xlsx',
                          'Transactions',
                        );
                        setToast(
                          i18n.language === 'ar'
                            ? 'تم استخراج وتحميل سجل العمليات والمعاملات بنجاح'
                            : 'Transactions log exported successfully',
                        );
                      }}
                    >
                      <Download size={16} /> {t('analyticsPage.export')}
                    </button>
                    <span className="live-indicator">
                      <i /> {t('auditPage.live')}
                    </span>
                  </div>
                }
              />
              <div className="filter-row">
                <div className="search-field compact-search">
                  <Search size={15} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('auditPage.filter')}
                  />
                </div>
                <button
                  className="btn btn-outline"
                  onClick={() => void qc.invalidateQueries({ queryKey: ['audit'] })}
                >
                  <RefreshCw size={15} /> {t('auditPage.refresh')}
                </button>
              </div>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>{t('auditPage.stream')}</h3>
                    <p>{t('auditPage.streamBody')}</p>
                  </div>
                  <span className="status-chip success">{t('auditPage.enabled')}</span>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('auditPage.time')}</th>
                        <th>{t('auditPage.user')}</th>
                        <th>{t('auditPage.action')}</th>
                        <th>{t('auditPage.entity')}</th>
                        <th>{t('auditPage.ip')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(auditQuery.data?.items ?? [])
                        .filter((a: any) =>
                          `${a.user} ${a.action}`.toLowerCase().includes(search.toLowerCase()),
                        )
                        .map((a: any) => (
                          <tr key={a.id}>
                            <td className="mono">{formatDateTime(a.timestamp)}</td>
                            <td>
                              <strong>{a.user}</strong>
                              <small className="table-sub">{roleLabel(a.role)}</small>
                            </td>
                            <td>
                              <span className="action-label">{actionLabel(a.action)}</span>
                            </td>
                            <td>{a.entity}</td>
                            <td className="mono">{a.ip}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {!auditQuery.data?.items?.length && (
                    <Empty text={t('auditPage.empty')} />
                  )}
                </div>
              </section>
            </>
          )}
          {page === 'users' && (
            <>
              <PageTitle
                eyebrow={t('usersPage.eyebrow')}
                title={t('usersPage.title')}
                description={t('usersPage.body')}
                action={<span className="status-chip neutral">{t('usersPage.rbac')}</span>}
              />
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>{t('usersPage.demoUsers')}</h3>
                    <p>{t('usersPage.demoBody')}</p>
                  </div>
                  <div className="search-field compact-search">
                    <Search size={15} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t('usersPage.search')}
                    />
                  </div>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('usersPage.name')}</th>
                        <th>{t('usersPage.email')}</th>
                        <th>{t('usersPage.role')}</th>
                        <th>{t('usersPage.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(userQuery.data ?? [])
                        .filter((u) =>
                          `${u.name} ${u.email} ${u.role}`
                            .toLowerCase()
                            .includes(search.toLowerCase()),
                        )
                        .map((u) => (
                          <tr key={u.id}>
                            <td>
                              <strong>{u.name}</strong>
                            </td>
                            <td>{u.email}</td>
                            <td>
                              <span className="role-chip">{roleLabel(u.role)}</span>
                            </td>
                            <td>
                              <span
                                className={`status-chip ${u.status === 'active' ? 'success' : 'warning'}`}
                              >
                                {statusLabel(u.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <section className="panel permissions-panel">
                <div className="panel-heading">
                  <div>
                    <h3>{t('usersPage.matrix')}</h3>
                    <p>{t('usersPage.matrixBody')}</p>
                  </div>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('usersPage.role')}</th>
                        {[
                          'users:manage',
                          'bulk:upload',
                          'analytics',
                          'claims:read',
                          'audit:read',
                          'inspections:verify',
                          'export:run',
                        ].map((p) => (
                          <th key={p}>{t(`permissions.${p.replaceAll(':', '_')}`)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map((r) => (
                        <tr key={r}>
                          <td>
                            <strong>{roleLabel(r)}</strong>
                          </td>
                          {[
                            'users:manage',
                            'bulk:upload',
                            'analytics',
                            'claims:read',
                            'audit:read',
                            'inspections:verify',
                            'export:run',
                          ].map((p) => (
                            <td key={p} className="permission-cell">
                              {(ROLE_PERMISSIONS[r] as readonly string[]).some((x) =>
                                p === 'analytics' ? x.startsWith('analytics:') : x === p,
                              ) ? (
                                <CheckCircle2 size={16} className="yes" />
                              ) : (
                                <span className="no">—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
          {page === 'guide' && (
            <>
              <PageTitle
                eyebrow={t('guidePage.eyebrow')}
                title={t('guidePage.title')}
                description={t('guidePage.body')}
              />
              <div className="guide-grid">
                <GuideStep
                  n="01"
                  title={t('guidePage.step1Title')}
                  text={t('guidePage.step1')}
                  onClick={() => setPage('analytics')}
                />
                <GuideStep
                  n="02"
                  title={t('guidePage.step2Title')}
                  text={t('guidePage.step2')}
                  onClick={() => void switchRole('inspector')}
                />
                <GuideStep
                  n="03"
                  title={t('guidePage.step3Title')}
                  text={t('guidePage.step3')}
                  onClick={() => setPage('bulk')}
                />
                <GuideStep
                  n="04"
                  title={t('guidePage.step4Title')}
                  text={t('guidePage.step4')}
                  onClick={() => setPage('audit')}
                />
              </div>
              <div className="note-card">
                <ShieldCheck />
                <div>
                  <strong>{t('guidePage.credentials')}</strong>
                  <p>{t('guidePage.credentialsBody')}</p>
                </div>
              </div>
              <button
                className="btn btn-outline"
                onClick={() =>
                  void request('/dev/demo-guide')
                    .then(() => setToast(t('toasts.checklist')))
                    .catch((e) => setToast(messageFromError(e, t('errors.REQUEST_FAILED'))))
                }
              >
                {t('guidePage.load')} <ArrowRight size={15} />
              </button>
            </>
          )}
        </div>
      </main>
      {sidebar && (
        <button
          className="sidebar-overlay"
          aria-label={t('shell.closeNav')}
          onClick={() => setSidebar(false)}
        />
      )}
    </div>
      )}

      {toast && (
        <div className="toast">
          <CheckCircle2 size={17} />
          {toast}
          <button onClick={() => setToast('')}>
            <X size={15} />
          </button>
        </div>
      )}
    </>
  );
}
function Kpi({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
  caption,
}: {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: any;
  color: string;
  caption: string;
}) {
  return (
    <div className="kpi-card">
      <div className="kpi-top">
        <span>{title}</span>
        <span className={`kpi-icon ${color}`}>
          <Icon size={18} />
        </span>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-bottom">
        {change && (
          <span className={`trend ${trend}`}>
            <ArrowUpRight size={14} />
            {change}
          </span>
        )}
        <span>{caption}</span>
      </div>
      <div className="sparkline">
        <svg viewBox="0 0 120 22" preserveAspectRatio="none">
          <path
            d={
              trend === 'up'
                ? 'M0 17 C12 15 14 18 24 12 S40 16 52 8 S71 13 82 6 S103 9 120 2'
                : 'M0 4 C12 6 14 3 24 8 S40 4 52 13 S71 8 82 14 S103 12 120 19'
            }
          />
        </svg>
      </div>
    </div>
  );
}
function Quick({
  icon: Icon,
  title,
  detail,
  onClick,
}: {
  icon: any;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button className="quick-card" onClick={onClick}>
      <span className="quick-icon">
        <Icon size={20} />
      </span>
      <span className="quick-copy">
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      <ArrowRight className="quick-arrow" size={17} />
    </button>
  );
}
function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-title-row">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {action}
    </div>
  );
}
function Mini({ label, value, tone = '' }: { label: string; value: any; tone?: string }) {
  return (
    <div className="mini-kpi">
      <span>{label}</span>
      <strong className={tone}>{value ?? 0}</strong>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <Activity size={24} />
      <p>{text}</p>
    </div>
  );
}
function GuideStep({
  n,
  title,
  text,
  onClick,
}: {
  n: string;
  title: string;
  text: string;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button className="guide-step" onClick={onClick}>
      <span>{n}</span>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
        <small>
          {t('guidePage.open')} <ArrowRight size={13} />
        </small>
      </div>
    </button>
  );
}
function Subscriber({
  setToast,
  forceCertificateView = false,
  onGoToJourney: _onGoToJourney,
}: {
  setToast: (s: string) => void;
  forceCertificateView?: boolean;
  onGoToJourney?: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [entity, setEntity] = useState<'individual' | 'facility'>('individual');
  const [tier, setTier] = useState('human_doctor_gp');
  const [governorate, setGovernorate] = useState('Cairo');
  const [profileId, setProfileId] = useState('29901011234567');
  const [step, setStep] = useState(1);
  const [paid, setPaid] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [cardName, setCardName] = useState('Dr. Demo User');
  const [cardNumber, setCardNumber] = useState('4000 1234 5678 9010');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const tiers = DEMO_TIERS.filter((t) => t.entityType === entity);
  const active = tiers.find((t) => t.id === tier) ?? tiers[0]!;
  const effectiveStep = forceCertificateView ? 4 : step;
  const isPaid = forceCertificateView || paid;
  const progressVal = effectiveStep === 4 ? 100 : effectiveStep === 3 ? 75 : effectiveStep === 2 ? 50 : 25;
  const progressFormatted =
    i18n.language === 'ar' ? Number(progressVal).toLocaleString('ar-EG') + '٪' : `${progressVal}%`;

  const handleSimulateSuccess = () => {
    setPaid(true);
    setStep(4);
    setToast(t('toasts.paymentOk'));
    void pay('success').catch(() => {});
  };

  const handleSimulateFailure = () => {
    setToast(t('subscriberPage.paymentDeclined'));
  };
  const saveProfile = async () => {
    try {
      await request('/subscriber/profile', 'put', {
        nationalId: profileId,
        governorate,
        entityType: entity,
      });
      setStep(2);
      setToast(t('toasts.profileSaved'));
    } catch (e) {
      setToast(messageFromError(e, t('toasts.profileFailed')));
    }
  };
  const saveTier = async () => {
    try {
      const r = await request<any>('/subscriber/select-tier', 'post', {
        tierId: tier,
        entityType: entity,
      });
      setSelected(r);
      setStep(3);
      setToast(t('toasts.specialtySelected'));
    } catch (e) {
      setToast(messageFromError(e, t('toasts.tierFailed')));
    }
  };
  const pay = async (outcome: 'success' | 'failure') => {
    try {
      const init = await request<any>('/payments/initiate', 'post', {});
      await request<any>(`/payments/${init.payment.id}/simulate`, 'post', { outcome });
      if (outcome === 'success') {
        setPaid(true);
        setStep(4);
        setToast(t('toasts.paymentOk'));
      } else setToast(t('toasts.paymentRetry'));
    } catch (e) {
      setToast(messageFromError(e, t('toasts.paymentFailed')));
    }
  };
  return (
    <>
      <PageTitle
        eyebrow={t('subscriberPage.eyebrow')}
        title={t('subscriberPage.title')}
        description={t('subscriberPage.body')}
        action={
          <span className={`status-chip ${isPaid ? 'success' : 'warning'}`}>
            {isPaid ? t('subscriberPage.active') : t('subscriberPage.incomplete')}
          </span>
        }
      />
      <div className="subscriber-steps">
        {[
          { n: 1, title: t('subscriberPage.professional') },
          { n: 2, title: t('subscriberPage.specialtyStep') },
          { n: 3, title: t('subscriberPage.paymentStep') },
          { n: 4, title: t('subscriberPage.certificateStep') },
        ].map((s) => (
          <div
            className={`subscriber-step ${effectiveStep === s.n ? 'current' : effectiveStep > s.n ? 'done' : ''}`}
            key={s.n}
          >
            <span>{effectiveStep > s.n ? <Check size={15} /> : s.n}</span>
            <strong>{s.title}</strong>
          </div>
        ))}
      </div>
      <div className="subscriber-layout">
        <section className="panel subscriber-main">
          <div className="panel-heading">
            <div>
              <h3>
                {effectiveStep === 1
                  ? t('subscriberPage.professionalTitle')
                  : step === 2
                    ? t('subscriberPage.chooseTitle')
                    : step === 3
                      ? t('subscriberPage.payTitle')
                      : t('subscriberPage.readyTitle')}
              </h3>
              <p>
                {effectiveStep === 1
                  ? t('subscriberPage.professionalBody')
                  : step === 2
                    ? t('subscriberPage.chooseBody')
                    : step === 3
                      ? t('subscriberPage.payBody')
                      : t('subscriberPage.readyBody')}
              </p>
            </div>
          </div>
          {effectiveStep === 1 && (
            <div className="form-grid">
              <div className="form-field full-field">
                <label>{t('subscriberPage.type')}</label>
                <div className="entity-toggle">
                  <button
                    className={entity === 'individual' ? 'selected' : ''}
                    onClick={() => {
                      setEntity('individual');
                      setTier('human_doctor_gp');
                    }}
                  >
                    <Stethoscope size={17} /> {t('subscriberPage.individual')}
                  </button>
                  <button
                    className={entity === 'facility' ? 'selected' : ''}
                    onClick={() => {
                      setEntity('facility');
                      setTier('facility_hospital');
                    }}
                  >
                    <Building2 size={17} /> {t('subscriberPage.facility')}
                  </button>
                </div>
              </div>
              <div className="form-field full-field">
                <label>
                  {entity === 'individual' ? t('subscriberPage.nationalId') : t('subscriberPage.license')}
                </label>
                <input
                  value={profileId}
                  onChange={(e) => setProfileId(e.target.value)}
                  placeholder={entity === 'individual' ? '29901011234567' : 'FAC-2026-0001'}
                />
                <small>{t('subscriberPage.demoOnly')}</small>
              </div>
              <div className="form-field full-field">
                <label>{t('subscriberPage.governorate')}</label>
                <select value={governorate} onChange={(e) => setGovernorate(e.target.value)}>
                  {PROFILE_GOVERNORATES.map((g) => (
                    <option key={g} value={g}>
                      {governorateLabel(g)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-note full-field">
                <ShieldCheck size={17} />
                <span>{t('subscriberPage.detailsNote')}</span>
              </div>
              <button className="btn btn-primary" onClick={() => void saveProfile()}>
                {t('subscriberPage.save')} <ArrowRight size={16} />
              </button>
            </div>
          )}
          {effectiveStep === 2 && (
            <>
              <div className="form-field">
                <label>{t('subscriberPage.tier')}</label>
                <select value={tier} onChange={(e) => setTier(e.target.value)}>
                  {tiers.map((item) => (
                    <option value={item.id} key={item.id}>
                      {specialtyLabel(item.id)} — EGP {item.fee}
                    </option>
                  ))}
                </select>
              </div>
              <div className="tier-summary">
                <div>
                  <span>{t('subscriberPage.annual')}</span>
                  <strong>{money(active.fee)}</strong>
                </div>
                <span className="status-chip neutral">
                  {t('subscriberPage.risk', { level: riskLabel(active.risk) })}
                </span>
                <p>{t('subscriberPage.feeNote')}</p>
              </div>
              <div className="button-row">
                <button className="btn btn-outline" onClick={() => setStep(1)}>
                  {t('subscriberPage.back')}
                </button>
                <button className="btn btn-primary" onClick={() => void saveTier()}>
                  {t('subscriberPage.confirm')} <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}
          {effectiveStep === 3 && (
            <>
              <div className="payment-summary">
                <div>
                  <span>{t('subscriberPage.coverage')}</span>
                  <strong>{specialtyLabel(active.name)}</strong>
                </div>
                <div>
                  <span>{t('subscriberPage.annual')}</span>
                  <strong>{money(selected?.amount ?? active.fee)}</strong>
                </div>
                <div>
                  <span>{t('subscriberPage.channel')}</span>
                  <strong>{t('subscriberPage.mockGateway')}</strong>
                </div>
                <div>
                  <span>{t('subscriberPage.reference')}</span>
                  <strong>MLRF-DEMO-2026</strong>
                </div>
              </div>
              <div className="gateway-card">
                <div className="gateway-header">
                  <div className="gateway-brand">
                    <div className="gateway-icon">
                      <CreditCard size={22} />
                    </div>
                    <div>
                      <h4>{t('subscriberPage.gatewayTitle')}</h4>
                      <p>{t('subscriberPage.gatewaySubtitle')}</p>
                    </div>
                  </div>
                  <div className="gateway-security">
                    <Lock size={13} />
                    <span>256-bit SSL</span>
                  </div>
                </div>

                {/* Realistic Bank Visa Card Visual Preview */}
                <div className="visa-card-preview">
                  <div className="visa-card-top">
                    <div className="visa-chip" />
                    <div className="visa-logo">VISA</div>
                  </div>
                  <div className="visa-card-number">{cardNumber || '•••• •••• •••• ••••'}</div>
                  <div className="visa-card-bottom">
                    <div>
                      <span className="visa-label">{t('subscriberPage.cardholderName')}</span>
                      <strong className="visa-val">{cardName || 'CARDHOLDER NAME'}</strong>
                    </div>
                    <div>
                      <span className="visa-label">{t('subscriberPage.expiryDate')}</span>
                      <strong className="visa-val">{cardExpiry || 'MM/YY'}</strong>
                    </div>
                  </div>
                </div>

                {/* Input Fields */}
                <div className="gateway-form-grid">
                  <div className="form-field full-field">
                    <label>{t('subscriberPage.cardholderName')}</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Dr. Demo User"
                    />
                  </div>
                  <div className="form-field full-field">
                    <label>{t('subscriberPage.cardNumber')}</label>
                    <div className="card-input-wrap">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4000 1234 5678 9010"
                      />
                      <span className="visa-badge">VISA</span>
                    </div>
                  </div>
                  <div className="form-field">
                    <label>{t('subscriberPage.expiryDate')}</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="12/28"
                    />
                  </div>
                  <div className="form-field">
                    <label>{t('subscriberPage.cvv')}</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="123"
                    />
                  </div>
                </div>
              </div>

              <div className="button-row payment-action-row">
                <button className="btn btn-outline" onClick={() => setStep(2)}>
                  {t('subscriberPage.back')}
                </button>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    className="btn btn-simulate-failure"
                    onClick={handleSimulateFailure}
                  >
                    <AlertTriangle size={16} /> {t('subscriberPage.simulateFailure')}
                  </button>
                  <button
                    className="btn btn-simulate-success"
                    onClick={handleSimulateSuccess}
                  >
                    <CheckCircle2 size={16} /> {t('subscriberPage.simulateSuccess')}
                  </button>
                </div>
              </div>
            </>
          )}
          {effectiveStep === 4 && (
            <div className="certificate-preview" dir="rtl">
              <div className="fund-logo-placeholder">
                <span>{t('certificate.logoPlaceholder', { lng: 'ar' })}</span>
              </div>
              <div className="certificate-seal">
                <ShieldCheck size={36} />
              </div>
              <div className="eyebrow">{t('brandShort', { lng: 'ar' })}</div>
              <h2>{t('subscriberPage.certTitle', { lng: 'ar' })}</h2>
              <p>{t('subscriberPage.certifies', { lng: 'ar' })}</p>
              <h3>{t('subscriberPage.demoSubscriber', { lng: 'ar' })}</h3>
              <p>{t('subscriberPage.registered', { lng: 'ar' })}</p>
              <p className="certificate-payment-note">
                {t('certificate.paymentConfirmation', {
                  lng: 'ar',
                  amount: Number(selected?.fee ?? selected?.amount ?? active.fee).toLocaleString('ar-EG'),
                })}
              </p>
              <div className="certificate-data">
                <div>
                  <span>{t('subscriberPage.certNumber', { lng: 'ar' })}</span>
                  <strong>MLRF-2026-000123</strong>
                </div>
                <div>
                  <span>{t('subscriberPage.coverageStatus', { lng: 'ar' })}</span>
                  <strong className="success-text">{t('subscriberPage.valid', { lng: 'ar' })}</strong>
                </div>
                <div>
                  <span>{t('subscriberPage.period', { lng: 'ar' })}</span>
                  <strong>{t('subscriberPage.oneYear', { lng: 'ar' })}</strong>
                </div>
              </div>
              <div className="certificate-footer">
                <div className="fund-stamp-placeholder">
                  <span>{t('certificate.stampPlaceholder', { lng: 'ar' })}</span>
                </div>
                <div className="qr-placeholder">
                  <QRCodeSVG
                    value={
                      typeof window !== 'undefined' && window.location.origin.includes('vercel.app')
                        ? `${window.location.origin}/api/v1/certificates/MLRF-2026-000123/pdf`
                        : 'https://mlrf-platform-ykit.vercel.app/api/v1/certificates/MLRF-2026-000123/pdf'
                    }
                    size={110}
                  />
                  <span>{t('subscriberPage.demoQr', { lng: 'ar' })}</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const pdfUrl =
                      typeof window !== 'undefined' && window.location.origin.includes('vercel.app')
                        ? `${window.location.origin}/api/v1/certificates/MLRF-2026-000123/pdf`
                        : 'https://mlrf-platform-ykit.vercel.app/api/v1/certificates/MLRF-2026-000123/pdf';
                    window.open(pdfUrl, '_blank');
                  }}
                >
                  <Download size={16} /> {t('subscriberPage.download', { lng: 'ar' })}
                </button>
              </div>
            </div>
          )}
        </section>
        <aside className="subscriber-aside">
          <div className="panel progress-panel">
            <div className="panel-heading">
              <div>
                <h3>{t('subscriberPage.progress')}</h3>
                <p>{t('subscriberPage.progressBody')}</p>
              </div>
            </div>
            <div className="progress-ring-wrap">
              <svg viewBox="0 0 120 120" className="progress-ring">
                <circle cx="60" cy="60" r="49" />
                <circle
                  cx="60"
                  cy="60"
                  r="49"
                  className="progress-ring-value"
                  style={{
                    strokeDasharray: `${progressVal * 3.08} 308`,
                  }}
                />
              </svg>
              <div className="progress-ring-text">
                <strong>{progressFormatted}</strong>
                <span>{t('subscriberPage.completed')}</span>
              </div>
            </div>
            <div className="progress-list">
              {[
                t('subscriberPage.professionalTitle'),
                t('subscriberPage.specialtyStep'),
                t('subscriberPage.paymentStep'),
                t('subscriberPage.issued'),
              ].map((s, i) => (
                <div key={s} className={effectiveStep > i ? 'complete' : ''}>
                  <span>{effectiveStep > i ? <Check size={13} /> : i + 1}</span>
                  {s}
                </div>
              ))}
            </div>
          </div>
          <div className="note-card">
            <ShieldCheck />
            <div>
              <strong>{t('subscriberPage.secure')}</strong>
              <p>{t('subscriberPage.secureBody')}</p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}


function InspectorStandalone({
  identifier,
  setIdentifier,
  verifyResult,
  setVerifyResult: _setVerifyResult,
  onVerify,
  onLogAction,
  history,
}: {
  identifier: string;
  setIdentifier: (val: string) => void;
  verifyResult: any;
  setVerifyResult: (val: any) => void;
  onVerify: (id?: string) => Promise<void>;
  onLogAction: (outcome: 'compliant' | 'notice' | 'violation') => Promise<void>;
  history: Array<{ id: string; identifier: string; outcome: string; time: string }>;
}) {
  const { t } = useTranslation();

  const handleScenario = (id: string) => {
    setIdentifier(id);
    void onVerify(id);
  };

  return (
    <div className="inspector-panel-standalone">
      <div className="inspector-search-card">
        <div className="page-title-row" style={{ marginBottom: 16 }}>
          <div>
            <div className="eyebrow">{t('inspectorPortal.badge')}</div>
            <h1 style={{ fontSize: 24, margin: '4px 0 6px' }}>{t('inspectorPortal.headerTitle')}</h1>
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>
              {t('inspectorPortal.headerSubtitle')}
            </p>
          </div>
        </div>

        <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, display: 'block' }}>
          {t('inspectorPage.label')}
        </label>
        <div className="search-field" style={{ marginBottom: 12 }}>
          <Search size={18} />
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={t('inspectorPortal.inputPlaceholder')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void onVerify();
            }}
          />
        </div>

        <button className="btn btn-primary full" onClick={() => void onVerify()}>
          <ScanLine size={18} /> {t('inspectorPortal.verifyButton')}
        </button>

        {/* 1-Click Presentation Scenarios */}
        <div style={{ marginTop: 18 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
            {t('inspectorPage.scenarios')}:
          </span>
          <div className="inspector-scenarios-row">
            <button
              type="button"
              className="scenario-quick-btn"
              onClick={() => handleScenario('demo-qr-valid-7f0c1a')}
            >
              <span className="scenario-dot valid-dot" />
              <span>{t('inspectorPortal.statusValid')}</span>
            </button>
            <button
              type="button"
              className="scenario-quick-btn"
              onClick={() => handleScenario('MLRF-EXPIRED-000001')}
            >
              <span className="scenario-dot expired-dot" />
              <span>{t('inspectorPortal.statusExpired')}</span>
            </button>
            <button
              type="button"
              className="scenario-quick-btn"
              onClick={() => handleScenario('unregistered-certificate')}
            >
              <span className="scenario-dot invalid-dot" />
              <span>{t('inspectorPortal.statusInvalid')}</span>
            </button>
          </div>
        </div>

        {/* Verification Result Card */}
        {verifyResult && (
          <div
            className={`verification-result ${verifyResult.result === 'VALID' ? 'valid' : verifyResult.result === 'EXPIRED' ? 'expired' : 'invalid'}`}
            style={{ marginTop: 20 }}
          >
            <div className="result-icon">
              {verifyResult.result === 'VALID' ? (
                <CheckCircle2 size={32} />
              ) : verifyResult.result === 'EXPIRED' ? (
                <AlertTriangle size={32} />
              ) : (
                <X size={32} />
              )}
            </div>
            <div>
              <strong style={{ fontSize: 16 }}>
                {verifyResult.result === 'VALID'
                  ? t('inspectorPortal.statusValid')
                  : verifyResult.result === 'EXPIRED'
                    ? t('inspectorPortal.statusExpired')
                    : verifyResult.result === 'INVALID'
                      ? t('inspectorPortal.statusInvalid')
                      : t('inspectorPage.error')}
              </strong>
              <p style={{ marginTop: 4, marginBottom: 4 }}>
                {verifyResult.name ?? verifyResult.message ?? t('inspectorPage.noMatch')}
              </p>
              {verifyResult.specialty && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {t('subscriberPage.specialtyStep')}: <b>{verifyResult.specialty}</b>
                </div>
              )}
              {verifyResult.certificateNumber && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {t('subscriberPage.certNumber')}: <b>{verifyResult.certificateNumber}</b>
                </div>
              )}
              {verifyResult.expiry && (
                <small style={{ display: 'block', marginTop: 4 }}>
                  {t('inspectorPage.expires', { date: formatDate(verifyResult.expiry) })}
                </small>
              )}
            </div>
          </div>
        )}

        {/* Field Action Controls */}
        {verifyResult && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {t('inspectorPortal.actionsHeading')}
            </span>
            <div className="inspector-actions-bar">
              {verifyResult.result === 'VALID' && (
                <button
                  type="button"
                  className="inspector-action-btn btn-compliant"
                  onClick={() => void onLogAction('compliant')}
                >
                  <CheckCircle2 size={16} /> {t('inspectorPortal.logAction')}
                </button>
              )}
              {verifyResult.result === 'EXPIRED' && (
                <>
                  <button
                    type="button"
                    className="inspector-action-btn btn-notice"
                    onClick={() => void onLogAction('notice')}
                  >
                    <Bell size={16} /> {t('inspectorPortal.sendNotice')}
                  </button>
                  <button
                    type="button"
                    className="inspector-action-btn btn-violation"
                    onClick={() => void onLogAction('violation')}
                  >
                    <AlertTriangle size={16} /> {t('inspectorPortal.reportViolation')}
                  </button>
                </>
              )}
              {verifyResult.result === 'INVALID' && (
                <button
                  type="button"
                  className="inspector-action-btn btn-violation"
                  onClick={() => void onLogAction('violation')}
                >
                  <AlertTriangle size={16} /> {t('inspectorPortal.reportViolation')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Shift Inspection History */}
      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>{t('inspectorPortal.recentLogs')}</h3>
            <p>{t('inspectorPage.scenariosBody')}</p>
          </div>
        </div>
        <table className="inspector-history-table">
          <thead>
            <tr>
              <th>{t('subscriberPage.reference')}</th>
              <th>{t('statusLabel')}</th>
              <th>{t('recentActivity')}</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.identifier}</strong>
                </td>
                <td>
                  <span
                    className={`status-chip ${item.outcome === 'compliant' ? 'success' : item.outcome === 'notice' ? 'warning' : 'danger'}`}
                  >
                    {item.outcome === 'compliant'
                      ? t('inspectorPortal.statusValid')
                      : item.outcome === 'notice'
                        ? t('inspectorPortal.sendNotice')
                        : t('inspectorPortal.reportViolation')}
                  </span>
                </td>
                <td style={{ color: 'var(--text-muted)' }}>{item.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

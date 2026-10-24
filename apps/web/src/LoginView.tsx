import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  Users,
  LockKeyhole,
  ArrowRight,
  ArrowLeft,
  Shield,
  Languages,
  Moon,
  Sun,
  Globe,
  Home,
  User,
  UserPlus,
} from 'lucide-react';
import { type Role } from '@mlrf/shared';

interface LoginViewProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSwitchRole: (role: Role) => Promise<void>;
  onBackToHome: () => void;
  onNavigateToRegister?: () => void;
  dark: boolean;
  onToggleDark: () => void;
  roleLabel: (role: Role) => string;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLogin,
  onSwitchRole,
  onBackToHome,
  onNavigateToRegister,
  dark,
  onToggleDark,
  roleLabel,
}) => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('super_admin@mlrf.demo');
  const [password, setPassword] = useState('demo12345');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onLogin(email, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleSelect = async (role: Role) => {
    setIsSubmitting(true);
    try {
      await onSwitchRole(role);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRtl = i18n.language === 'ar';
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div className="login-page-wrapper" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Floating Navbar for Login View */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div
            className="landing-brand"
            style={{ cursor: 'pointer' }}
            onClick={onBackToHome}
          >
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
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
              onClick={onBackToHome}
            >
              <Home size={15} />
              <span>{t('landing.backToHome')}</span>
            </button>
            {onNavigateToRegister && (
              <button
                type="button"
                className="nav-register-btn"
                onClick={onNavigateToRegister}
              >
                <UserPlus size={16} />
                <span>{t('landing.registerAction', { defaultValue: 'إنشاء حساب' })}</span>
              </button>
            )}
            <button
              type="button"
              className="nav-login-btn"
              style={{ cursor: 'default' }}
            >
              <User size={16} />
              <span>{t('landing.loginAction', { defaultValue: 'تسجيل الدخول' })}</span>
            </button>
            <button
              type="button"
              className="icon-btn"
              title={t('shell.toggleTheme')}
              onClick={onToggleDark}
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

      {/* Main Centered Login Container */}
      <div className="login-page-container">
        <div className="landing-login-card login-card-standalone">
          <div className="login-card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span className="eyebrow">{t('login.portal')}</span>
              <button
                type="button"
                className="btn-link"
                onClick={onBackToHome}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--teal)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <BackIcon size={14} /> {t('landing.backToHome')}
              </button>
            </div>
            <h2>{t('welcome')}</h2>
            <p className="muted">{t('login.manage')}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <label>{t('login.email')}</label>
            <div className="input-wrap">
              <Users size={17} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <label>{t('login.password')}</label>
            <div className="input-wrap">
              <LockKeyhole size={17} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <button className="btn btn-primary full" type="submit" disabled={isSubmitting}>
              {t('signIn')}{' '}
              {isRtl ? <ArrowLeft size={17} /> : <ArrowRight size={17} />}
            </button>
            {onNavigateToRegister && (
              <div style={{ marginTop: 14, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                <span>{t('register.hasNoAccount', { defaultValue: 'طبيب جديد؟ ليس لديك حساب؟' })} </span>
                <button
                  type="button"
                  onClick={onNavigateToRegister}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--teal)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  {t('register.submit', { defaultValue: 'إنشاء حساب جديد' })}
                </button>
              </div>
            )}
          </form>

          {/* Demo Login & Instant Role Switcher */}
          <div className="demo-login">
            <div className="demo-login-title">
              <span className="live-dot" /> {t('login.demoAccess')}{' '}
              <span className="demo-tag">{t('login.demoTag')}</span>
            </div>
            <p>{t('login.chooseRole')}</p>
            <div className="demo-portals-login">
              <button
                type="button"
                className="portal-login-card doctor-card"
                onClick={() => void handleRoleSelect('subscriber')}
                disabled={isSubmitting}
              >
                <div className="card-top">
                  <span className="icon">👨‍⚕️</span>
                  <strong>{t('portalSwitcher.doctor')}</strong>
                </div>
                <p>{t('doctorPortal.subtitle')}</p>
              </button>

              <button
                type="button"
                className="portal-login-card inspector-card"
                onClick={() => void handleRoleSelect('inspector')}
                disabled={isSubmitting}
              >
                <div className="card-top">
                  <span className="icon">🕵️‍♂️</span>
                  <strong>{t('portalSwitcher.inspector')}</strong>
                </div>
                <p>{t('inspectorPortal.subtitle')}</p>
              </button>

              <button
                type="button"
                className="portal-login-card admin-card"
                onClick={() => void handleRoleSelect('super_admin')}
                disabled={isSubmitting}
              >
                <div className="card-top">
                  <span className="icon">🏛️</span>
                  <strong>{t('portalSwitcher.admin')}</strong>
                </div>
                <p>{t('login.manage')}</p>
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  marginBottom: 6,
                  fontWeight: 600,
                }}
              >
                {t('portalSwitcher.adminRole')}:
              </div>
              <div className="admin-subroles-list">
                {(
                  [
                    'super_admin',
                    'finance_admin',
                    'practitioner_analyst',
                    'facility_analyst',
                    'claims_admin',
                  ] as Role[]
                ).map((r) => (
                  <button
                    key={r}
                    type="button"
                    className="admin-subrole-btn"
                    onClick={() => void handleRoleSelect(r)}
                    disabled={isSubmitting}
                  >
                    {roleLabel(r)}
                  </button>
                ))}
              </div>
            </div>
            <div className="hint">{t('login.hint')}</div>
          </div>

          <div className="login-panel-foot">
            <span>
              <Shield size={14} /> {t('login.secure')}
            </span>
            <button
              type="button"
              onClick={() => void i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en')}
            >
              <Languages size={15} /> {i18n.language === 'en' ? t('arabic') : t('english')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;

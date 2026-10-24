import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  LockKeyhole,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sun,
  Moon,
  Globe,
  Home,
  AlertCircle,
  Stethoscope,
} from 'lucide-react';
import { request } from './lib/api';

interface RegisterViewProps {
  onRegisterSuccess: (email: string, password: string) => Promise<void>;
  onNavigateToLogin: () => void;
  onBackToHome: () => void;
  dark: boolean;
  onToggleDark: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  onRegisterSuccess,
  onNavigateToLogin,
  onBackToHome,
  dark,
  onToggleDark,
}) => {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const isRtl = i18n.language === 'ar';
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const SubmitIcon = isRtl ? ArrowLeft : ArrowRight;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (password !== confirmPassword) {
      setFormError(t('register.passwordMismatch'));
      return;
    }

    if (password.length < 8) {
      setFormError(t('register.passwordMinLength'));
      return;
    }

    const cleanedPhone = phone.trim().replace(/[\s-]/g, '');
    if (!/^01[0125]\d{8}$/.test(cleanedPhone)) {
      setFormError(t('register.phoneInvalid'));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim() || `د. ${email.split('@')[0]}`,
        email: email.trim().toLowerCase(),
        phone: cleanedPhone,
        password,
      };

      await request('/auth/register', 'post', payload);
      await onRegisterSuccess(payload.email, payload.password);
    } catch (err: any) {
      const msg = err?.message || err?.error?.message || t('errors.REQUEST_FAILED');
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page-wrapper" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Floating Navbar for Registration View */}
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

      {/* Main Centered Registration Container */}
      <div className="login-page-container" style={{ paddingTop: 30, paddingBottom: 50 }}>
        <div
          className="landing-login-card login-card-standalone"
          style={{ maxWidth: 480, margin: '0 auto' }}
        >
          <div className="login-card-header">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <span className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Stethoscope size={14} /> {t('register.portalBadge')}
              </span>
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
            <h2>{t('register.title')}</h2>
            <p className="muted">{t('register.subtitle')}</p>
          </div>

          {formError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                marginBottom: 16,
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Doctor's Name */}
            <label>{t('register.name')}</label>
            <div className="input-wrap">
              <User size={17} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('register.namePlaceholder')}
                disabled={isSubmitting}
              />
            </div>

            {/* Email */}
            <label>{t('register.email')}</label>
            <div className="input-wrap">
              <Mail size={17} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('register.emailPlaceholder')}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Egyptian Phone Number */}
            <label>{t('register.phone')}</label>
            <div className="input-wrap">
              <Phone size={17} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('register.phonePlaceholder')}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Password */}
            <label>{t('register.password')}</label>
            <div className="input-wrap">
              <LockKeyhole size={17} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={isSubmitting}
              />
            </div>

            {/* Confirm Password */}
            <label>{t('register.confirmPassword')}</label>
            <div className="input-wrap">
              <CheckCircle2 size={17} />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                disabled={isSubmitting}
              />
            </div>

            <p
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                margin: '12px 0 16px',
                lineHeight: 1.5,
              }}
            >
              {t('register.doctorNotice')}
            </p>

            <button
              className="btn btn-primary full"
              type="submit"
              disabled={isSubmitting}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
                fontSize: 15,
                padding: '12px 20px',
              }}
            >
              <span>{isSubmitting ? t('register.submitting') : t('register.submit')}</span>
              <SubmitIcon size={18} />
            </button>
          </form>

          {/* Already have an account */}
          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid var(--line)',
              textAlign: 'center',
              fontSize: 13,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>{t('register.hasAccount')}</span>
            <button
              type="button"
              onClick={onNavigateToLogin}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--teal)',
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              {t('register.loginNow')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterView;

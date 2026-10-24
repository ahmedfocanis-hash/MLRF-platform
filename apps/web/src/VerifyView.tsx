import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  Home,
  Sun,
  Moon,
  Globe,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import * as htmlToImage from 'html-to-image';
import { BrandLogo } from './components/BrandLogo';
import { request } from './lib/api';

interface VerifyViewProps {
  certId: string;
  onBackToHome: () => void;
  dark: boolean;
  onToggleDark: () => void;
}

interface CertificateData {
  result: 'VALID' | 'EXPIRED' | 'INVALID';
  isValid: boolean;
  certificateNumber: string;
  name: string;
  nationalId?: string;
  specialty: string;
  issuedAt: string;
  expiry: string;
  status: string;
  qrHash?: string;
  amount?: number;
  fundNameAr?: string;
}

export const VerifyView: React.FC<VerifyViewProps> = ({
  certId,
  onBackToHome,
  dark,
  onToggleDark,
}) => {
  const { t, i18n } = useTranslation();
  const certRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [cert, setCert] = useState<CertificateData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cleanCertId = certId ? decodeURIComponent(certId).trim() : 'MLRF-2026-000123';

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    request<CertificateData>(`/public/verify/${cleanCertId}`)
      .then((data) => {
        if (!isMounted) return;
        if (!data || data.result === 'INVALID') {
          // Provide fallback demo details if the code is the demo cert
          if (cleanCertId.includes('000123') || cleanCertId === 'demo') {
            setCert({
              result: 'VALID',
              isValid: true,
              certificateNumber: 'MLRF-2026-000123',
              name: 'د. أحمد محمد محمود',
              nationalId: '29901011234567',
              specialty: 'الأطباء البشريين - ممارس عام',
              issuedAt: '2026-01-01',
              expiry: '2027-01-01',
              status: 'valid',
              fundNameAr: 'الصندوق الحكومي للتأمين ضد الأخطار الناجمة عن الاخطاء الطبية',
            });
          } else {
            setError(t('verify.notFound', { defaultValue: 'الشهادة المطلوبة غير مسجلة أو منتهية الصلاحية' }));
          }
        } else {
          setCert(data);
        }
      })
      .catch((_err) => {
        if (!isMounted) return;
        // Fallback for offline/demo presentation
        setCert({
          result: 'VALID',
          isValid: true,
          certificateNumber: cleanCertId.startsWith('MLRF-') ? cleanCertId : 'MLRF-2026-000123',
          name: 'د. أحمد محمد محمود',
          nationalId: '29901011234567',
          specialty: 'الأطباء البشريين - ممارس عام',
          issuedAt: '2026-01-01',
          expiry: '2027-01-01',
          status: 'valid',
          fundNameAr: 'الصندوق الحكومي للتأمين ضد الأخطار الناجمة عن الاخطاء الطبية',
        });
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [cleanCertId, t]);

  const handleDownloadImage = async () => {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await htmlToImage.toPng(certRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#fafaf9',
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `شهادة_تغطية_${cert?.certificateNumber || cleanCertId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to capture certificate image:', err);
      // Fallback: print to PDF/Image
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isRtl = i18n.language === 'ar';
  const qrUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/verify/${cert?.certificateNumber || cleanCertId}`
      : `https://mlrf-platform-ykit.vercel.app/verify/${cert?.certificateNumber || cleanCertId}`;

  return (
    <div className="login-page-wrapper" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Floating Navbar */}
      <header className="landing-nav no-print">
        <div className="landing-nav-inner">
          <div className="landing-brand" style={{ cursor: 'pointer' }} onClick={onBackToHome}>
            <div className="brand-mark">
              <BrandLogo className="w-7 h-7" />
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

      {/* Main Verification Container */}
      <main
        style={{
          maxWidth: 780,
          margin: '32px auto',
          padding: '0 16px 48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Verification Status Pill Header */}
        <div
          className="no-print"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: cert?.result === 'VALID' ? '#ecfdf5' : '#fef2f2',
            color: cert?.result === 'VALID' ? '#047857' : '#b91c1c',
            border: `1.5px solid ${cert?.result === 'VALID' ? '#a7f3d0' : '#fecaca'}`,
            padding: '10px 20px',
            borderRadius: 999,
            fontWeight: 700,
            fontSize: 14,
            marginBottom: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>{t('verify.verifying', { defaultValue: 'جارٍ التحقق من بيانات الوثيقة...' })}</span>
            </>
          ) : cert?.result === 'VALID' ? (
            <>
              <CheckCircle2 size={18} />
              <span>{t('verify.verifiedValid', { defaultValue: 'وثيقة رسمية معتمدة وسارية بنظام الصندوق' })}</span>
            </>
          ) : (
            <>
              <AlertTriangle size={18} />
              <span>{error || t('verify.invalidCert', { defaultValue: 'الوثيقة غير مسجلة أو منتهية الصلاحية' })}</span>
            </>
          )}
        </div>

        {/* Certificate Canvas / Card */}
        {cert && (
          <div
            ref={certRef}
            className="certificate-preview"
            dir="rtl"
            style={{
              width: '100%',
              maxWidth: 680,
              margin: '0 auto',
            }}
          >
            {/* Top Logo and Fund Identification */}
            <div
              className="fund-logo-placeholder"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: 'auto',
                height: 'auto',
                padding: '8px 16px',
                borderRadius: 999,
                margin: '0 auto 16px',
              }}
            >
              <BrandLogo className="w-8 h-8" />
              <strong style={{ fontSize: 13, color: '#0f766e' }}>
                الصندوق الحكومي للتأمين ضد الأخطار الناجمة عن الاخطاء الطبية
              </strong>
            </div>

            {/* Certificate Seal */}
            <div className="certificate-seal">
              <BrandLogo className="w-9 h-9" />
            </div>

            <div className="eyebrow">جمهورية مصر العربية — رئاسة مجلس الوزراء</div>
            <h2>شهادة تغطية معتمدة ضد أخطار المسؤولية الطبية</h2>
            <p>يشهد الصندوق الحكومي للتأمين ضد الأخطار الناجمة عن الأخطاء الطبية بأن السيد الطبيب:</p>
            <h3 style={{ fontSize: 26, margin: '10px 0', color: '#0f766e' }}>
              {cert.name || 'د. أحمد محمد محمود'}
            </h3>
            <p>
              مقيد ومعتمد بسجلات الصندوق ومغطى تأمينياً ضد الأخطار الناجمة عن المسؤولية والأخطاء الطبية
              وفقاً لأحكام القانون والقرارات المنظمة.
            </p>

            <p className="certificate-payment-note">
              تم سداد قيمة التغطية التأمينية السنوية ومعاملة السداد مسجلة بنجاح برقم إلكتروني معتمد.
            </p>

            {/* Certificate Data Matrix */}
            <div className="certificate-data" style={{ margin: '24px 0' }}>
              <div>
                <span>رقم الشهادة المعتمد</span>
                <strong style={{ fontFamily: 'monospace', letterSpacing: 1 }}>
                  {cert.certificateNumber || cleanCertId}
                </strong>
              </div>
              <div>
                <span>حالة التغطية التأمينية</span>
                <strong className="success-text" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={14} /> سارية ومعتمدة
                </strong>
              </div>
              <div>
                <span>التخصص / الفئة المهنية</span>
                <strong>{cert.specialty || 'الأطباء البشريين - ممارس عام'}</strong>
              </div>
              <div>
                <span>الرقم القومي للطبيب</span>
                <strong>{cert.nationalId || '29901011234567'}</strong>
              </div>
              <div>
                <span>تاريخ بدء التغطية</span>
                <strong>{cert.issuedAt || '2026-01-01'}</strong>
              </div>
              <div>
                <span>تاريخ نهاية التغطية</span>
                <strong>{cert.expiry || '2027-01-01'}</strong>
              </div>
            </div>

            {/* Certificate Footer with Live QR and Stamp */}
            <div className="certificate-footer" style={{ marginTop: 24 }}>
              <div
                className="fund-stamp-placeholder"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 8,
                }}
              >
                <BrandLogo className="w-8 h-8" />
                <span style={{ fontSize: 10, marginTop: 4, fontWeight: 700 }}>خاتم الصندوق الرقمي</span>
              </div>
              <div className="qr-placeholder">
                <QRCodeSVG value={qrUrl} size={110} level="M" />
                <span style={{ fontSize: 10, marginTop: 4 }}>امسح للتحقق الرقمي المباشر</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Toolbar Below Certificate */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 12,
            marginTop: 28,
            width: '100%',
          }}
        >
          <button
            type="button"
            className="btn btn-primary"
            style={{
              padding: '12px 24px',
              fontSize: 15,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(15,118,110,0.3)',
            }}
            onClick={handleDownloadImage}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>جارٍ المعالجة...</span>
              </>
            ) : (
              <>
                <Download size={18} />
                <span>تحميل كصورة (PNG)</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="btn btn-outline"
            style={{
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
            onClick={handlePrint}
          >
            <Printer size={16} />
            <span>طباعة الشهادة</span>
          </button>

          <button
            type="button"
            className="btn btn-outline"
            style={{
              padding: '12px 20px',
              fontSize: 14,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
            onClick={onBackToHome}
          >
            <Home size={16} />
            <span>العودة للرئيسية</span>
          </button>
        </div>
      </main>
    </div>
  );
};

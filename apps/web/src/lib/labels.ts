import { DEMO_TIERS, GOVERNORATES } from '@mlrf/shared';
import i18n from './i18n';
import { ApiError } from './api';

const locale = () => (i18n.language?.startsWith('ar') ? 'ar-EG' : 'en-EG');

export function money(n: number) {
  return new Intl.NumberFormat(locale(), {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatCount(n: number) {
  return Number(n).toLocaleString(locale());
}

export function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString(locale(), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatLongDate(value: string | Date) {
  return new Date(value).toLocaleDateString(locale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateTime(value: string | Date) {
  return new Date(value).toLocaleString(locale());
}

export function lookup(group: string, key: string, fallback?: string) {
  const id = `${group}.${key}`;
  const translated = i18n.t(id);
  return translated === id ? (fallback ?? key) : translated;
}

export function roleLabel(role: string) {
  return lookup('roles', role, role.replaceAll('_', ' '));
}

export function statusLabel(status: string) {
  const key = status.toLowerCase().replaceAll(' ', '_');
  return lookup('statuses', key, status.replaceAll('_', ' '));
}

export function stageLabel(stage: string) {
  const key = stage.toLowerCase().replaceAll(' ', '_');
  return lookup('stages', key, stage);
}

export function actionLabel(action: string) {
  return lookup('actions', action, action.replaceAll('_', ' '));
}

export function riskLabel(risk: string) {
  return lookup('risk', risk, risk);
}

export function specialtyLabel(name: string) {
  const aliases: Record<string, string> = { Obstetrics: 'obgyn' };
  const key = aliases[name] ?? name;
  const tier = DEMO_TIERS.find((item) => item.name === key || item.nameAr === key || item.id === key);
  if (!tier) return name;
  return i18n.language?.startsWith('ar') ? tier.nameAr : tier.name;
}

export function governorateLabel(name: string) {
  const row = GOVERNORATES.find(([english, arabic]) => english === name || arabic === name);
  if (!row) return name;
  return i18n.language?.startsWith('ar') ? row[1] : row[0];
}

export function cohortLabel(name: string) {
  const map: Record<string, string> = {
    'Year 1 signups': 'cohorts.year1Signups',
    'Year 2 renewals': 'cohorts.year2Renewals',
    'Year 2 new signups': 'cohorts.year2New',
    Q1: 'quarters.Q1',
    Q2: 'quarters.Q2',
    Q3: 'quarters.Q3',
    Q4: 'quarters.Q4',
  };
  const key = map[name];
  return key ? i18n.t(key) : name;
}

export function reasonLabel(reason?: string) {
  if (!reason) return '—';
  const expected = reason.match(/^Expected fee (\d+)/);
  if (expected) return i18n.t('reasons.expectedFee', { fee: expected[1] });
  const map: Record<string, string> = {
    'Duplicate national ID/phone': 'reasons.duplicate',
    'National ID must contain 14 digits': 'reasons.nationalId',
    'Specialty not matched': 'reasons.specialty',
  };
  const key = map[reason];
  return key ? i18n.t(key) : reason;
}

export function timeAgo(date: string) {
  const sec = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  if (sec < 60) return i18n.t('time.justNow');
  if (sec < 3600) return i18n.t('time.minutesAgo', { n: Math.floor(sec / 60) });
  if (sec < 86400) return i18n.t('time.hoursAgo', { n: Math.floor(sec / 3600) });
  return i18n.t('time.daysAgo', { n: Math.floor(sec / 86400) });
}

export function messageFromError(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.code) {
    const translated = i18n.t(`errors.${error.code}`);
    if (translated !== `errors.${error.code}`) return translated;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

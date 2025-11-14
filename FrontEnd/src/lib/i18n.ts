export type Locale = 'en';

let currentLocale: Locale = 'en';

const dict: Record<Locale, Record<string, string>> = {
  en: {
    'wallet.open': 'Opening wallet for signature...',
    'session.created': 'Session created',
    'attendance.submitted': 'Attendance claim submitted',
    'tx.viewOnExplorer': 'View on Explorer ↗',
    'tx.copied': 'TX ID copied',
    'tx.copy': 'Copy TX ID',
  },
};

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function t(key: string, params?: Record<string, string | number>): string {
  const table = dict[currentLocale] || dict.en;
  let text = table[key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`{${k}}`, 'g'), String(v));
    }
  }
  return text;
}

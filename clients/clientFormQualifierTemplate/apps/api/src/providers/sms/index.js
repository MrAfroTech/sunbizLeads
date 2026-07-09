export function createSmsProvider() {
  const provider = (process.env.SMS_PROVIDER ?? 'stub').toLowerCase();

  if (provider === 'stub') {
    return {
      name: 'stub',
      async sendSms({ to, body }) {
        if (!to) return { ok: false, skipped: true, reason: 'missing_to' };
        console.log('[sms:stub]', { to, body });
        return { ok: true, provider: 'stub' };
      }
    };
  }

  throw new Error(`Unknown SMS_PROVIDER: ${provider}`);
}


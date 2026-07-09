function getBaseUrl(req) {
  if (process.env.BASE_URL) {
    return process.env.BASE_URL.replace(/\/$/, '');
  }
  if (process.env.SITE_URL) {
    return process.env.SITE_URL.replace(/\/$/, '');
  }

  const host =
    (req.headers['x-forwarded-host'] || req.headers.host || '')
      .split(',')[0]
      .trim() || '';
  const proto =
    (req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim() ||
    'https';

  if (host) {
    if (host.includes('localhost') || host.startsWith('127.0.0.1')) {
      return `http://${host}`;
    }
    return `${proto}://${host}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'https://scan-and-scale.seamlessly.us';
}

module.exports = { getBaseUrl };

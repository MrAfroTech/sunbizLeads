export function getEnv(name, { required = true, defaultValue } = {}) {
  const v = process.env[name] ?? defaultValue;
  if (required && (v == null || v === '')) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}


/** Required secrets for funnel Edge Functions — never hardcode. */
export function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

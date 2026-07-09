export type CalculatorEmailFields = {
  estimated_loss: string;
  avg_wait_time: string;
  primary_friction_zone: string;
};

function coerceText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export function calculatorFieldsFromRow(
  row: Record<string, unknown> | null | undefined,
): CalculatorEmailFields | null {
  if (!row) return null;

  const estimated_loss = coerceText(row.estimated_loss);
  const avg_wait_time = coerceText(row.avg_wait_time);
  const primary_friction_zone = coerceText(row.primary_friction_zone);

  if (!estimated_loss || !avg_wait_time || !primary_friction_zone) {
    return null;
  }

  return { estimated_loss, avg_wait_time, primary_friction_zone };
}

export function hasCalculatorEmailFields(row: Record<string, unknown> | null | undefined): boolean {
  return calculatorFieldsFromRow(row) !== null;
}

/** Partial calculator fields for JSONB storage (dashboard / abandon rows). */
export function calculatorOutputFromRow(
  row: Record<string, unknown> | null | undefined,
): Record<string, string> {
  if (!row) return {};

  const out: Record<string, string> = {};
  const estimated_loss = coerceText(row.estimated_loss);
  const avg_wait_time = coerceText(row.avg_wait_time);
  const primary_friction_zone = coerceText(row.primary_friction_zone);

  if (estimated_loss) out.estimated_loss = estimated_loss;
  if (avg_wait_time) out.avg_wait_time = avg_wait_time;
  if (primary_friction_zone) out.primary_friction_zone = primary_friction_zone;

  return out;
}

export function calculatorOutputFromMeta(
  meta: Record<string, unknown> | null | undefined,
): Record<string, string> {
  return calculatorOutputFromRow(meta);
}

export function toBrevoContactAttributes(
  fields: CalculatorEmailFields,
  leadName?: string | null,
): Record<string, string> {
  const attrs: Record<string, string> = {
    estimated_loss: fields.estimated_loss,
    avg_wait_time: fields.avg_wait_time,
    primary_friction_zone: fields.primary_friction_zone,
  };

  const first = coerceText(leadName)?.split(/\s+/)[0];
  if (first) {
    attrs.FIRSTNAME = first;
  }

  return attrs;
}

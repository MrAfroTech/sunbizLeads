const BREVO_BASE = 'https://api.brevo.com/v3';

export type BrevoSenderResolved = {
  email: string;
  name?: string;
};

/** Brevo rejects payloads with both sender id and email — keep only email/name. */
export function normalizeSender(
  s: { email?: string; name?: string; id?: number } | null | undefined,
): BrevoSenderResolved | null {
  const email = typeof s?.email === 'string' ? s.email.trim() : '';
  if (!email) return null;
  const name = typeof s?.name === 'string' ? s.name.trim() : '';
  return name ? { email, name } : { email };
}

async function brevoFetch(
  path: string,
  apiKey: string,
  options: RequestInit = {},
): Promise<Response> {
  return await fetch(`${BREVO_BASE}${path}`, {
    ...options,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
      ...options.headers,
    },
  });
}

export async function getDefaultSender(apiKey: string): Promise<BrevoSenderResolved> {
  const response = await brevoFetch('/senders', apiKey);
  const payload = await response.json() as unknown;
  const body =
    typeof payload === 'object' &&
    payload !== null &&
    'senders' in payload &&
    Array.isArray((payload as { senders: unknown }).senders)
      ? (payload as {
        senders: Array<{ email?: string; name?: string; active?: boolean }>;
        message?: string;
      })
      : null;

  if (!response.ok || !body?.senders?.length) {
    const msg =
      body && typeof body.message === 'string'
        ? body.message
        : typeof payload === 'object' && payload !== null && 'message' in payload
        ? String((payload as { message: unknown }).message)
        : response.statusText;
    throw new Error(`Brevo senders lookup failed (${response.status}): ${msg}`);
  }

  const verified = body.senders.filter((s) => s.email?.trim());
  const active = verified.find((s) => s.active !== false) ?? verified[0];
  const first = active ?? body.senders[0];
  return {
    email: first.email!.trim(),
    ...(first.name?.trim() ? { name: first.name.trim() } : {}),
  };
}

export async function getTemplateDetail(
  apiKey: string,
  templateId: number,
): Promise<{
  subject: string;
  htmlContent?: string | null;
  sender?: BrevoSenderResolved | null;
}> {
  const response = await brevoFetch(`/smtp/templates/${templateId}`, apiKey);
  const data = await response.json() as Record<string, unknown>;

  if (!response.ok) {
    const detail = typeof data.message === 'string' ? data.message : response.statusText;
    throw new Error(`Brevo template ${templateId} fetch failed (${response.status}): ${detail}`);
  }

  return {
    subject: String(data.subject ?? ''),
    htmlContent: typeof data.htmlContent === 'string' ? data.htmlContent : null,
    sender: normalizeSender(
      typeof data.sender === 'object' && data.sender !== null
        ? data.sender as { email?: string; name?: string; id?: number }
        : null,
    ),
  };
}

export function stripBookingCtaFromEmailOneHtml(html: string): string {
  const pattern =
    /<a\s+[^>]*class="cta-btn"[^>]*href="https:\/\/seamlessly\.us\/calculator\/sports"[^>]*>\s*BOOK\s+YOUR\s+FREE\s+REVENUE\s+FIT\s+SESSION\s*→\s*<\/a>/i;
  return html.replace(pattern, '');
}

export async function sendTransactionalHtml(params: {
  apiKey: string;
  sender: BrevoSenderResolved;
  toEmail: string;
  toName?: string | null;
  subject: string;
  htmlBody: string;
  contactAttributes?: Record<string, string>;
}): Promise<void> {
  const sender = normalizeSender(params.sender);
  if (!sender) {
    throw new Error('Brevo transactional send requires a sender email');
  }

  if (params.contactAttributes && Object.keys(params.contactAttributes).length > 0) {
    await upsertContactAttributes(params.apiKey, {
      email: params.toEmail,
      leadName: params.toName,
      attributes: params.contactAttributes,
    });
  }

  const payload: Record<string, unknown> = {
    sender,
    to: [{
      email: params.toEmail,
      ...(params.toName?.trim() ? { name: params.toName.trim() } : {}),
    }],
    subject: params.subject,
    htmlContent: params.htmlBody,
  };

  const response = await brevoFetch('/smtp/email', params.apiKey, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Brevo transactional send failed (${response.status}): ${errBody}`);
  }
}

/** Upsert Brevo contact attributes used by {{ contact.* }} merge tags in templates. */
export async function upsertContactAttributes(
  apiKey: string,
  params: {
    email: string;
    leadName?: string | null;
    attributes: Record<string, string>;
  },
): Promise<void> {
  const email = params.email.trim().toLowerCase();
  if (!email) {
    throw new Error('Brevo contact upsert requires email');
  }

  const attributes = { ...params.attributes };
  const firstName = params.leadName?.trim().split(/\s+/)[0];
  if (firstName && !attributes.FIRSTNAME) {
    attributes.FIRSTNAME = firstName;
  }

  const response = await brevoFetch('/contacts', apiKey, {
    method: 'POST',
    body: JSON.stringify({
      email,
      updateEnabled: true,
      attributes,
    }),
  });

  if (!response.ok && response.status !== 204) {
    const text = await response.text();
    throw new Error(`Brevo contact upsert failed (${response.status}): ${text}`);
  }
}

export async function sendWithTemplate(
  apiKey: string,
  params: {
    templateId: number;
    leadEmail: string;
    leadName?: string | null;
    templateParams?: Record<string, string>;
    contactAttributes?: Record<string, string>;
  },
): Promise<void> {
  if (params.contactAttributes && Object.keys(params.contactAttributes).length > 0) {
    await upsertContactAttributes(apiKey, {
      email: params.leadEmail,
      leadName: params.leadName,
      attributes: params.contactAttributes,
    });
  }

  const body: Record<string, unknown> = {
    templateId: params.templateId,
    to: [{
      email: params.leadEmail,
      ...(params.leadName?.trim() ? { name: params.leadName.trim() } : {}),
    }],
  };

  if (params.templateParams && Object.keys(params.templateParams).length > 0) {
    body.params = params.templateParams;
  }

  const response = await brevoFetch('/smtp/email', apiKey, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Brevo template send failed (${response.status}): ${text}`);
  }
}

const BREVO_BASE = 'https://api.brevo.com/v3';

export type BrevoSenderResolved = {
  email: string;
  name?: string;
};

async function brevoFetch (
  path: string,
  apiKey: string,
  options: RequestInit = {}
): Promise<Response> {
  return await fetch(`${BREVO_BASE}${path}`, {
    ...options,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
      ...options.headers
    }
  });
}

/** First active sender returned by Brevo (account default UX uses verified senders). */
export async function getDefaultSender (apiKey: string): Promise<BrevoSenderResolved> {
  const response = await brevoFetch ('/senders', apiKey);
  const payload = await response.json () as unknown;
  const body =
    typeof payload === 'object' &&
    payload !== null &&
    'senders' in payload &&
    Array.isArray ((payload as { senders: unknown }).senders)
      ? (payload as { senders: Array<{ email?: string; name?: string; active?: boolean }>; message?: string })
      : null;

  if (!response.ok || !body?.senders?.length) {
    const msg =
      body && typeof body.message === 'string'
        ? body.message
        : typeof payload === 'object' && payload !== null && 'message' in payload
        ? String ((payload as { message: unknown }).message)
        : response.statusText;
    throw new Error(`Brevo senders lookup failed (${response.status}): ${msg}`);
  }

  const verified = body.senders.filter ((s) => s.email?.trim ());
  const active = verified.find ((s) => s.active !== false) ?? verified[0];
  const first = active ?? body.senders[0];
  return {
    email: first.email.trim (),
    ...(first.name?.trim () ? {
      name: first.name.trim ()
    } : {})
  };
}

export async function getTemplateDetail (
  apiKey: string,
  templateId: number
): Promise<{
  subject: string;
  htmlContent?: string | null;
  sender?: BrevoSenderResolved | null;
}> {
  const response = await brevoFetch (`/smtp/templates/${templateId}`, apiKey);
  const data = await response.json () as Record<string, unknown>;

  if (!response.ok) {
    const detail = typeof data.message === 'string' ? data.message : response.statusText;
    throw new Error(`Brevo template ${templateId} fetch failed (${response.status}): ${detail}`);
  }

  return {
    subject: String (data.subject ?? ''),
    htmlContent:
      typeof data.htmlContent === 'string' ? data.htmlContent : null,
    sender:
      typeof data.sender === 'object' && data.sender !== null && 'email' in data.sender
        ? data.sender as BrevoSenderResolved
        : null
  };
}

/** Runtime strip for Scan & Scale Email 1 only — removes the BOOK YOUR FREE… CTA <a>; leaves the Magic Guide CTA untouched. */
export function stripBookingCtaFromEmailOneHtml (html: string): string {
  const pattern =
    /<a\s+[^>]*class="cta-btn"[^>]*href="https:\/\/seamlessly\.us\/calculator\/sports"[^>]*>\s*BOOK\s+YOUR\s+FREE\s+REVENUE\s+FIT\s+SESSION\s*→\s*<\/a>/i;
  return html.replace (pattern, '');
}

export async function sendTransactionalHtml (params: {
  apiKey: string;
  sender: BrevoSenderResolved;
  toEmail: string;
  toName?: string | null;
  subject: string;
  htmlBody: string;
}): Promise<void> {
  const payload: Record<string, unknown> = {
    sender: params.sender,
    to: [{
      email: params.toEmail,
      ...(params.toName?.trim () ? {
        name: params.toName.trim ()
      } : {})
    }],
    subject: params.subject,
    htmlContent: params.htmlBody
  };

  const response = await brevoFetch ('/smtp/email', params.apiKey, {
    method: 'POST',
    body: JSON.stringify (payload)
  });

  if (!response.ok) {
    const errBody = await response.text ();
    throw new Error(`Brevo transactional send failed (${response.status}): ${errBody}`);
  }
}

/** Send via stored Brevo template (used for Email 2–4 and webhook template path when unchanged). */
export async function sendWithTemplate (
  apiKey: string,
  params: {
    templateId: number;
    leadEmail: string;
    leadName?: string | null;
  }
): Promise<void> {
  const body: Record<string, unknown> = {
    templateId: params.templateId,
    to: [{
      email: params.leadEmail,
      ...(params.leadName?.trim () ? {
        name: params.leadName.trim ()
      } : {})
    }]
  };

  const response = await brevoFetch ('/smtp/email', apiKey, {
    method: 'POST',
    body: JSON.stringify (body)
  });

  if (!response.ok) {
    const text = await response.text ();
    throw new Error(`Brevo template send failed (${response.status}): ${text}`);
  }
}

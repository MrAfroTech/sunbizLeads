# Email says “sent” but nothing in the inbox

The webhook only knows that **Brevo’s API returned success** (`201`). Delivery to the mailbox is handled by Brevo + the recipient’s provider (Gmail, Outlook, etc.).

## 1. Check spam / promotions

Transactional mail from a new domain often lands in **Spam**, **Junk**, or **Promotions**. Search for the **From** address you set in `BREVO_FROM_EMAIL`.

## 2. Confirm the address in Brevo

In **Brevo** → **Transactional** → **Logs** (or **Statistics**), find the sent message by:

- **Recipient** = `SALES_ALERT_EMAIL`, or  
- **Message ID** = copy from Vercel logs: `[webhook] Brevo accepted — …` (or `_debug.brevo_message_id` when `WEBHOOK_DEBUG=1`).

If it appears as **Delivered**, the problem is on the inbox side (spam, rules, wrong folder).  
If it **bounced** or **blocked**, Brevo will show the reason.

## 3. Sender and domain

- **`BREVO_FROM_EMAIL`** must be a **verified sender** (or domain) in Brevo.  
- Unverified senders can still get API success in some setups; deliverability is poor.  
- **Authenticate your domain** (SPF/DKIM) in Brevo for best results.

## 4. Copy yourself (CC)

Set **`SALES_ALERT_CC`** in Vercel to another address you control (e.g. personal Gmail).  
You’ll get a **CC** copy of the same message to compare with the primary inbox.

## 5. `SALES_ALERT_EMAIL` typo

Double-check the env value in **Vercel → Production** (no extra spaces, correct domain).

## 6. Corporate / Microsoft 365

Some orgs **quarantine** external senders. Ask IT to allowlist Brevo’s sending IPs or your **From** domain.

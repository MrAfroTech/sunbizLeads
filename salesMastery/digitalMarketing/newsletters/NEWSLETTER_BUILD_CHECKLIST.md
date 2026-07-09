# Newsletter Build Checklist

## Calculator CTA links (required)

Every calculator link in every newsletter must include Brevo merge tags:

```
?contactId={{ contact.ID }}&email={{ contact.EMAIL }}&firstName={{ contact.FIRSTNAME }}&lastName={{ contact.LASTNAME }}&campaign={{ message.id }}
```

**No exceptions.** Without these tags, `calculator_page_visits.email` is empty on page load and the visitor is anonymous and unrecoverable.

### Pre-send verification

```bash
grep -rn "seamlessly.us/calculator" . --include="*.html" | grep -v "contact.EMAIL"
```

Expected output: **empty** (no bare calculator URLs).

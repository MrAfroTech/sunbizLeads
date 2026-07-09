# Contact Data Format

This document defines how to structure contact data for the Brevo contact automation script. Use this format when editing `contacts.json` or when adding new contacts.

---

## File and location

- **File:** `contacts.json` in the `brevo-contact-automation` folder.
- **Root key:** `contacts` — an array of contact objects.

---

## Contact object fields

| Field       | Required | Description |
|------------|----------|-------------|
| `firstName`| No       | First name. Sent to Brevo as `FIRSTNAME`. |
| `lastName` | No       | Last name. Sent to Brevo as `LASTNAME`. |
| `email`    | **Yes**  | Email address. Must be valid and unique for create. |
| `phone`    | No       | Phone number. Sent to Brevo as `PHONE`. Can be empty string. |

All fields are strings. The script trims whitespace and sends email in lowercase to Brevo.

---

## Example: minimal (email only)

```json
{
  "contacts": [
    { "email": "lead@example.com" }
  ]
}
```

---

## Example: full fields

```json
{
  "contacts": [
    {
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane.doe@example.com",
      "phone": "+15551234567"
    },
    {
      "firstName": "John",
      "lastName": "Smith",
      "email": "john.smith@example.com",
      "phone": ""
    }
  ]
}
```

---

## Behavior

- Each contact is created in Brevo via **POST** `https://api.brevo.com/v3/contacts`.
- Each contact is added to the list whose ID is set in `.env` as `BREVO_LIST_ID` (e.g. `18` for TeamLeads).
- `updateEnabled: true` is used so existing contacts (same email) are updated instead of failing.
- The script writes **created-contacts.json** and **run.log** in the same folder after each run.

---

## Summary

| You want…           | Use in `contacts.json` |
|--------------------|------------------------|
| One or more leads  | `contacts` array with objects that have at least `email`. |
| Full name + phone  | Add `firstName`, `lastName`, `phone` to each object. |
| List in Brevo     | Set `BREVO_LIST_ID=18` (or your list ID) in `.env`. |

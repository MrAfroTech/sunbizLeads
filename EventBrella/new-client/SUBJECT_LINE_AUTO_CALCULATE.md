# Auto-Calculated Subject Line for Brevo HTML Email

## Instructions for Cursor

Create an HTML email template where the SUBJECT LINE automatically calculates and displays the next second Sunday of the month.

**FOCUS:** Subject line only for now.

## Requirements

1. Use JavaScript to calculate the next second Sunday from today's date
2. Format the date as "December 14th" or "January 12th"
3. Insert it into the subject line

## Subject Line Format

```
Sunday, [AUTO-CALCULATED DATE] at 8 AM, we're doing a farm tour.
```

## Calculation Logic

- If today is BEFORE the second Sunday of current month → use current month's second Sunday
- If today is ON or AFTER the second Sunday of current month → use NEXT month's second Sunday

## Examples

- Today is Dec 1, 2025 → Subject: "Sunday, December 14th at 8 AM, we're doing a farm tour."
- Today is Dec 15, 2025 → Subject: "Sunday, January 11th at 8 AM, we're doing a farm tour."
- Today is Jan 1, 2026 → Subject: "Sunday, January 11th at 8 AM, we're doing a farm tour."

## Implementation

The HTML file `email-subject-auto-calculate.html` contains:

1. **JavaScript function `calculateNextSecondSunday()`** - Calculates the next second Sunday
2. **JavaScript function `formatDateForSubject(date)`** - Formats date as "December 14th"
3. **JavaScript function `generateSubjectLine()`** - Combines everything into the subject line
4. **HTML code** - Runs on page load and displays the subject line

## Usage in Brevo

1. Copy the JavaScript code from `email-subject-auto-calculate.html`
2. Paste into Brevo's HTML editor
3. The subject line will automatically calculate and display

**Note:** For Brevo, you may need to:
- Use Brevo's subject line field and populate it via their merge tags
- Or use the calculated value in the email body as a reference
- Check Brevo's documentation for JavaScript execution in emails (some email clients don't support JavaScript)

## Alternative: Server-Side Calculation

If Brevo doesn't support JavaScript in emails, calculate the subject line server-side or use Brevo's date functions/merge tags if available.


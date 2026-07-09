const { sendHeyyouPdfEmail } = require('./lib/sendHeyyouPdfEmail');

module.exports = (req, res) =>
  sendHeyyouPdfEmail(req, res, {
    pdfFilename: 'heyyou-9-things-events.pdf',
    subject: 'Your guide: 9 things every event planner should know',
    successMessage: 'Events lead magnet email sent successfully',
    logTag: 'send-events-heyyou-pdf',
    emailOptions: {
      brandLabel: '9 Things · Seamlessly Events',
      lossContext: 'in estimated annual guest experience gaps',
      introLine:
        'built for event planners who want guest preferences executed flawlessly between brief and venue floor.',
    },
  });

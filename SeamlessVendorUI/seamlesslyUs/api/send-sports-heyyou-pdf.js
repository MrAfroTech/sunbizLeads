const { sendHeyyouPdfEmail } = require('./lib/sendHeyyouPdfEmail');

module.exports = (req, res) =>
  sendHeyyouPdfEmail(req, res, {
    pdfFilename: 'heyyou-9-things.pdf',
    subject: 'Your guide: 9 things every venue operator should know',
    successMessage: 'Sports lead magnet email sent successfully',
    logTag: 'send-sports-heyyou-pdf',
    emailOptions: {
      brandLabel: '9 Things · Seamlessly Sports',
      lossContext: 'on the table last game',
      introLine:
        'built for venue operators who want fans spending more without longer lines.',
    },
  });

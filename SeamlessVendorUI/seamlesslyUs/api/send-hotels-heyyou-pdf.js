const { sendHeyyouPdfEmail } = require('./lib/sendHeyyouPdfEmail');

module.exports = (req, res) =>
  sendHeyyouPdfEmail(req, res, {
    pdfFilename: 'heyyou-9-things-hotels.pdf',
    subject: 'Your guide: 9 things every hotel operator should know',
    successMessage: 'Hotels lead magnet email sent successfully',
    logTag: 'send-hotels-heyyou-pdf',
    emailOptions: {
      brandLabel: '9 Things · Seamlessly Hotels',
      lossContext: 'in missed on-property ancillary revenue each month',
      introLine:
        'built for hotel operators who want guest spend captured across every touchpoint on property.',
    },
  });

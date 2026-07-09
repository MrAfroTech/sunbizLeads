const AWS = require('aws-sdk');
const {
  generateMagicBandsResultsEmail,
  generateMagicBandsResultsPlainText,
} = require('../src/services/magicBandsResultsEmailTemplate');

const DEFAULT_BLUEPRINT_URL =
  process.env.MAGIC_BANDS_BLUEPRINT_URL ||
  'https://www.seamlessly.us/magicBandsImplementationGuide.html';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-vercel-protection-bypass'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  try {
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-2',
    });

    const ses = new AWS.SES({ apiVersion: '2010-12-01' });
    const { name, email, amount, lostPerFan, fans, parkingLoss, blueprintUrl } = req.body || {};

    if (!email || !String(email).includes('@')) {
      res.status(400).json({ success: false, message: 'A valid email address is required.' });
      return;
    }

    const templateData = {
      name: (name || 'there').trim(),
      amount: Number(amount) || 0,
      lostPerFan: Number(lostPerFan) || 0,
      fans: Number(fans) || 0,
      parkingLoss: Number(parkingLoss) || 0,
      blueprintUrl: blueprintUrl || DEFAULT_BLUEPRINT_URL,
    };

    const senderEmail =
      process.env.EMAIL_FROM || 'Seamlessly <team@seamlessly.us>';

    const emailParams = {
      Source: senderEmail,
      Destination: { ToAddresses: [String(email).trim()] },
      Message: {
        Subject: { Data: 'Your MagicBands guest flow results + blueprint' },
        Body: {
          Html: { Data: generateMagicBandsResultsEmail(templateData) },
          Text: { Data: generateMagicBandsResultsPlainText(templateData) },
        },
      },
      ReplyToAddresses: [process.env.REPLY_EMAIL || 'contact@seamlessly.us'],
    };

    const result = await ses.sendEmail(emailParams).promise();

    res.status(200).json({
      success: true,
      message: 'Results email sent successfully',
      id: result.MessageId,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[send-magic-bands-results]', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send email',
    });
  }
};

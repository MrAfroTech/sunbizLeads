const { CHECKOUT_PREVIEW } = require('./_data');

module.exports = (req, res) => {
  if (req.method === 'GET') {
    res.status(200).json({
      ok: true,
      checkout: CHECKOUT_PREVIEW,
    });
    return;
  }

  if (req.method === 'POST') {
    res.status(200).json({
      ok: true,
      mock: true,
      message: 'Payment not processed — mock checkout only.',
      confirmationId: 'mock-' + Date.now(),
      checkout: CHECKOUT_PREVIEW,
    });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};

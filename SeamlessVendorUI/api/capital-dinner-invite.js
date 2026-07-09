/**
 * Capital Dinner — Request Invitation API
 * POST /api/capital-dinner-invite
 * Body: { audience, fullName, email, companyOrFundName, description, investmentFocus? | arrOrFundingStatus? }
 *
 * Integrate with your backend: add DynamoDB/Klaviyo/email in the try block below.
 */

const enableCORS = (res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

export default async function handler(req, res) {
  enableCORS(res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const {
      audience,
      fullName,
      email,
      companyOrFundName,
      description,
      investmentFocus,
      arrOrFundingStatus,
    } = req.body || {};

    if (!audience || !fullName || !email || !companyOrFundName || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: audience, fullName, email, companyOrFundName, description',
      });
    }

    if (!['investor', 'founder'].includes(audience)) {
      return res.status(400).json({
        success: false,
        error: 'audience must be "investor" or "founder"',
      });
    }

    if (audience === 'founder' && !arrOrFundingStatus) {
      return res.status(400).json({
        success: false,
        error: 'arrOrFundingStatus is required for founder requests',
      });
    }

    if (audience === 'investor' && !investmentFocus) {
      return res.status(400).json({
        success: false,
        error: 'investmentFocus is required for investor requests',
      });
    }

    const payload = {
      id: `cd_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      audience,
      fullName: String(fullName).trim(),
      email: String(email).trim(),
      companyOrFundName: String(companyOrFundName).trim(),
      description: String(description).trim(),
      ...(audience === 'founder' && { arrOrFundingStatus: String(arrOrFundingStatus).trim() }),
      ...(audience === 'investor' && { investmentFocus: String(investmentFocus).trim() }),
      submittedAt: new Date().toISOString(),
    };

    console.log('Capital Dinner invite request:', JSON.stringify(payload, null, 2));

    const tableName = process.env.CAPITAL_DINNER_SUBMISSIONS_TABLE;
    if (tableName) {
      try {
        const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, PutCommand } = await import('@aws-sdk/lib-dynamodb');
        const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
        const docClient = DynamoDBDocumentClient.from(client);
        await docClient.send(new PutCommand({
          TableName: tableName,
          Item: payload,
        }));
        console.log('Capital Dinner submission stored in DynamoDB:', payload.id);
      } catch (dbErr) {
        console.error('Capital Dinner DynamoDB store failed:', dbErr);
        return res.status(500).json({
          success: false,
          error: 'Submission failed. Please try again.',
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Invitation request received',
      requestId: payload.id,
    });
  } catch (err) {
    console.error('Capital Dinner invite error:', err);
    return res.status(500).json({
      success: false,
      error: 'Submission failed. Please try again.',
    });
  }
}

// api/profit-secrets.js
const { generateBarProfitSecretsPDF } = require('../src/components/barProfitSeecretsTemplate');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Extract parameters from query string
    const name = req.query.name || 'Bar Owner';
    const businessName = req.query.business || 'Your Bar';
    const venueType = req.query.type || 'bar';
    
    console.log(`Generating profit secrets page for: ${name} at ${businessName}`);
    
    // Generate the HTML content using the template function
    const htmlContent = generateBarProfitSecretsPDF({
      name,
      businessName,
      venueType
    });
    
    // Set content type header
    res.setHeader('Content-Type', 'text/html');
    
    // Send the HTML response
    res.status(200).send(htmlContent);
    
  } catch (error) {
    console.error('Error generating profit secrets page:', error);
    
    // Return error in HTML format
    res.setHeader('Content-Type', 'text/html');
    res.status(500).send(`
      <html>
        <head>
          <title>Error</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              text-align: center;
              color: #333;
            }
            .error-container {
              max-width: 600px;
              margin: 0 auto;
              padding: 30px;
              border: 1px solid #ddd;
              border-radius: 8px;
              background-color: #f8f8f8;
            }
            h1 {
              color: #e74c3c;
            }
            .button {
              display: inline-block;
              margin-top: 20px;
              padding: 10px 20px;
              background-color: #3498db;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="error-container">
            <h1>Oops! Something went wrong</h1>
            <p>We couldn't generate your Bar Profit Secrets guide at this time.</p>
            <p>Please try again later or contact our support team for assistance.</p>
            <a href="https://ezdrink.us" class="button">Return to homepage</a>
          </div>
        </body>
      </html>
    `);
  }
};
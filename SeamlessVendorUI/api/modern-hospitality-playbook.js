// api/modern-hospitality-playbook.js
const { generateModernHospitalityPlaybookHTML } = require('../src/components/modernHospitalityPlaybookTemplate');

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
    console.log('Generating Modern Hospitality Playbook HTML');
    
    // Generate the HTML content using the template function
    const htmlContent = generateModernHospitalityPlaybookHTML();
    
    // Set content type header
    res.setHeader('Content-Type', 'text/html');
    
    // Send the HTML response
    res.status(200).send(htmlContent);
    
  } catch (error) {
    console.error('Error generating Modern Hospitality Playbook:', error);
    
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
            <p>We couldn't generate the Modern Hospitality Playbook at this time.</p>
            <p>Please try again later or contact our support team for assistance.</p>
            <a href="https://seamless.us" class="button">Return to homepage</a>
          </div>
        </body>
      </html>
    `);
  }
};

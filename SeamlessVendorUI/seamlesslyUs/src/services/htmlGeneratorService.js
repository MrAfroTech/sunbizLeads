// services/htmlGeneratorService.js
const { generateBarProfitSecretsPDF } = require('./barProfitSeecretsTemplate');

/**
 * Generates HTML content for the Bar Profit Secrets guide
 * 
 * @param {object} userData - User data for personalizing the HTML
 * @returns {string} - HTML content as a string
 */
function generateBarProfitSecretsHTML(userData) {
  // Simply use the existing HTML generator function
  // This will return the HTML string without converting to PDF
  return generateBarProfitSecretsPDF(userData);
}

/**
 * Creates a personalized Bar Profit Secrets HTML
 * 
 * @param {object} userData - User data for personalizing the HTML
 * @returns {object} - Object with HTML content and filename
 */
function createBarProfitSecretsHTML(userData) {
  try {
    // Generate the HTML content
    const htmlContent = generateBarProfitSecretsHTML(userData);
    
    // Create sanitized filename from business name or fallback
    const sanitizedName = (userData.businessName || 'YourBar')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
      
    const filename = `bar_profit_secrets_${sanitizedName}.html`;
    
    return {
      htmlContent,
      filename
    };
  } catch (error) {
    console.error('Error generating HTML:', error);
    throw error;
  }
}

module.exports = {
  generateBarProfitSecretsHTML,
  createBarProfitSecretsHTML
};
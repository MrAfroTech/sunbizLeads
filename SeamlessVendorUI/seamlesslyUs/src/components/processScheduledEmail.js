// processScheduledEmails.js
// This script would be run by a cron job or scheduled task to process queued emails

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Import email templates (assuming they're available server-side)
// In a real implementation, you might need to adapt the templates for server use
const { cashFinderPlusTemplate, cashFinderPlusTextTemplate } = require('../services/emailTemplates');

// Email configuration
const EMAIL_CONFIG = {
  host: 'smtp.yourdomain.com',
  port: 587,
  secure: false,
  auth: {
    user: 'reports@yourdomain.com',
    pass: 'your-email-password'
  }
};

// Path to the queue storage
// In production, you'd use a database instead
const QUEUE_PATH = path.join(__dirname, '../data/email_queue.json');
const SENT_PATH = path.join(__dirname, '../data/sent_emails.json');
const LOG_PATH = path.join(__dirname, '../logs/email_processor.log');

// Ensure directories exist
const ensureDirectoryExists = (filePath) => {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
};

// Log function
const log = (message) => {
  ensureDirectoryExists(LOG_PATH);
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  console.log(message);
  fs.appendFileSync(LOG_PATH, logMessage);
};

// Read the queue
const readQueue = () => {
  try {
    if (!fs.existsSync(QUEUE_PATH)) {
      return [];
    }
    
    const queueData = fs.readFileSync(QUEUE_PATH, 'utf8');
    return JSON.parse(queueData);
  } catch (error) {
    log(`Error reading queue: ${error.message}`);
    return [];
  }
};

// Save the queue
const saveQueue = (queue) => {
  try {
    ensureDirectoryExists(QUEUE_PATH);
    fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
  } catch (error) {
    log(`Error saving queue: ${error.message}`);
  }
};

// Record sent email
const recordSentEmail = (emailData, result) => {
  try {
    ensureDirectoryExists(SENT_PATH);
    
    let sentEmails = [];
    if (fs.existsSync(SENT_PATH)) {
      const sentData = fs.readFileSync(SENT_PATH, 'utf8');
      sentEmails = JSON.parse(sentData);
    }
    
    sentEmails.push({
      ...emailData,
      sentAt: new Date().toISOString(),
      result: result
    });
    
    fs.writeFileSync(SENT_PATH, JSON.stringify(sentEmails, null, 2));
  } catch (error) {
    log(`Error recording sent email: ${error.message}`);
  }
};

// Send an email
const sendEmail = async (to, subject, html, text, from) => {
  const transporter = nodemailer.createTransport(EMAIL_CONFIG);
  
  const mailOptions = {
    from: from || `"EzDrink Premium Insights" <${EMAIL_CONFIG.auth.user}>`,
    to,
    subject,
    text,
    html
  };
  
  return transporter.sendMail(mailOptions);
};

// Send a Cash Finder Plus email
const sendCashFinderPlusEmail = async (queuedEmail) => {
  const { name, email, company, cashFinderData } = queuedEmail;
  
  const templateData = {
    firstName: name.split(' ')[0],
    company,
    cashFinderData
  };
  
  const html = cashFinderPlusTemplate(templateData);
  const text = cashFinderPlusTextTemplate(templateData);
  
  const subject = `${templateData.firstName}, Here's Your Cash Finder Plus Analysis for ${company}`;
  
  return sendEmail(email, subject, html, text);
};

// Main function to process the queue
const processQueue = async () => {
  log('Starting scheduled email processing');
  
  const queue = readQueue();
  log(`Found ${queue.length} emails in queue`);
  
  const now = new Date();
  const updated = [];
  const results = {
    processed: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };
  
  for (const email of queue) {
    results.processed++;
    
    // Skip if already sent
    if (email.status === 'sent') {
      updated.push(email);
      results.skipped++;
      continue;
    }
    
    // Check if it's time to send
    const scheduledTime = new Date(email.scheduledFor);
    if (scheduledTime > now) {
      log(`Skipping email to ${email.email} - scheduled for ${email.scheduledFor}`);
      updated.push(email);
      results.skipped++;
      continue;
    }
    
    // Attempt to send the email
    try {
      log(`Sending Cash Finder Plus email to ${email.email}`);
      
      // Send based on email type
      let result;
      if (email.emailType === 'cash-finder-plus') {
        result = await sendCashFinderPlusEmail(email);
      } else {
        throw new Error(`Unknown email type: ${email.emailType}`);
      }
      
      // Mark as sent
      email.status = 'sent';
      email.sentAt = new Date().toISOString();
      email.messageId = result.messageId;
      
      updated.push(email);
      results.sent++;
      
      // Record the sent email
      recordSentEmail(email, { success: true, messageId: result.messageId });
      
      log(`Successfully sent email to ${email.email}`);
    } catch (error) {
      log(`Error sending email to ${email.email}: ${error.message}`);
      
      // Increment failure count
      email.failureCount = (email.failureCount || 0) + 1;
      email.lastError = error.message;
      email.lastErrorAt = new Date().toISOString();
      
      // Mark as failed after 3 attempts
      if (email.failureCount >= 3) {
        email.status = 'failed';
      }
      
      updated.push(email);
      results.failed++;
      results.errors.push({
        email: email.email,
        error: error.message
      });
    }
  }
  
  // Save the updated queue
  saveQueue(updated);
  
  log(`Email processing complete: ${results.sent} sent, ${results.skipped} skipped, ${results.failed} failed`);
  return results;
};

// If running as a script
if (require.main === module) {
  processQueue()
    .then(results => {
      log(`Finished with results: ${JSON.stringify(results)}`);
      process.exit(0);
    })
    .catch(error => {
      log(`Critical error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { processQueue };
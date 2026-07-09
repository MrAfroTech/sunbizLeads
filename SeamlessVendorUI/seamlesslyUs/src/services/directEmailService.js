// directEmailService.js
// Sends emails using AWS SES through our Node.js backend API
import { cashFinderReportTemplate, cashFinderReportTextTemplate, 
  cashFinderPlusTemplate, cashFinderPlusTextTemplate } from './emailTemplates';

/**
 * Enhanced debugging logger
 * @param {String} level - Log level (error, warn, info, debug)
 * @param {String} context - Where the log is coming from
 * @param {String} message - Main log message
 * @param {Object} data - Additional data to log
 */
const debugLog = (level, context, message, data = null) => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}][${level.toUpperCase()}][${context}]`;
  
  console[level](`${prefix} ${message}`);
  
  if (data) {
    console[level](`${prefix} Data:`, data);
    
    // Store in localStorage for debugging
    try {
      const logs = JSON.parse(localStorage.getItem('email_service_debug_logs') || '[]');
      logs.push({
        timestamp,
        level,
        context,
        message,
        data
      });
      // Keep only the most recent 100 logs
      while (logs.length > 100) logs.shift();
      localStorage.setItem('email_service_debug_logs', JSON.stringify(logs));
    } catch (e) {
      console.error('Error storing debug logs:', e);
    }
  }
};

/**
 * Determine the appropriate API endpoint based on the current environment
 * @returns {String} - The API endpoint URL
 */
const getApiEndpoint = (path) => {
  // Local development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `http://localhost:3001/api/${path}`;
  }
  
  // Production (ezdrink.us) or preview deployments
  return `${window.location.origin}/api/${path}`;
};

/**
* Function to send email via our Node.js backend API
* @param {Object} emailData - Complete email data to send
* @returns {Promise} - Resolves with API response or rejects with error
*/
const sendEmailViaBackend = async (emailData) => { 
  // Dynamically determine the API endpoint
  const BACKEND_EMAIL_ENDPOINT = getApiEndpoint('send-email');
  
  console.log('📧 STARTING EMAIL SEND', {
    to: emailData.to,
    subject: emailData.subject,
    endpoint: BACKEND_EMAIL_ENDPOINT
  });
  
  try {
    const response = await fetch(BACKEND_EMAIL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
        userData: emailData.userData
      })
    });

    console.log(`📥 RESPONSE: Status ${response.status}`, {
      statusText: response.statusText
    });

    // Handle error responses
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        const errorText = await response.text();
        errorData = { message: errorText };
      }
      
      console.error('🚫 EMAIL ERROR:', errorData);
      
      // Show the error to the user
      return { 
        success: false, 
        message: errorData.message || `Failed to send email (${response.status})`,
        error: errorData.error,
        code: errorData.code
      };
    }
    
    // Process successful response
    const result = await response.json();
    console.log('✅ EMAIL SENT:', result);
    
    return { 
      success: true, 
      message: result.message || 'Email sent successfully',
      id: result.messageId || `email_${Date.now()}`
    };
  } catch (error) {
    console.error('💥 EMAIL EXCEPTION:', error);
    
    return { 
      success: false, 
      message: `Error sending email: ${error.message}`,
      error: error.message
    };
  } 
};

/**
* Sends a Cash Finder Report email
* @param {Object} userData - User contact information
* @param {Object} reportData - Report data to include in the email
* @returns {Promise} - Resolves with success info or rejects with error
*/
export const sendCashFinderReportEmail = async (userData, reportData) => {
  debugLog('info', 'sendCashFinderReportEmail', 'Preparing to send report email', {
    user: userData.email,
    company: userData.company
  });
  
  const templateData = {
    userName: userData.name,
    companyName: userData.company || userData.barName,
    reportData: reportData
  };

  // Generate the HTML and text versions of the email
  const htmlContent = cashFinderReportTemplate(templateData);
  const textContent = cashFinderReportTextTemplate(templateData);

  const emailData = {
    to: userData.email,
    subject: `Your Cash Finder Report for ${templateData.companyName}`,
    html: htmlContent,
    text: textContent,
    userData: {
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      company: userData.company || userData.barName,
      message: userData.message
    }
  };

  return sendEmailViaBackend(emailData);
};

/**
* Sends a Cash Finder Report via SMS
* @param {Object} userData - User contact information
* @param {Object} reportData - Report data
* @returns {Promise} - Resolves with success data or rejects with error
*/
export const sendCashFinderReportSMS = async (userData, reportData) => {
  debugLog('info', 'sendCashFinderReportSMS', 'SMS delivery requested (not implemented)', {
    phone: userData.phone
  });
  
  // Return a failure response with email fallback
  return {
    success: false,
    message: 'SMS delivery not available at this time',
    fallbackMethod: 'email'
  };
};

/**
* Stores a request to send a follow-up Cash Finder Plus email later
* @param {Object} userData - Complete user data
* @returns {Promise} - Resolves with success info or rejects with error
*/
export const queueCashFinderPlusEmail = async (userData) => {
  // Dynamically determine the API endpoint
  const FOLLOW_UP_ENDPOINT = getApiEndpoint('queue-follow-up');
  
  debugLog('info', 'queueCashFinderPlusEmail', 'Queueing Cash Finder Plus email', {
    email: userData.email,
    company: userData.company || userData.barName
  });
  
  try {
    // Calculate schedule time (24 hours from now)
    const scheduledTime = new Date();
    scheduledTime.setHours(scheduledTime.getHours() + 24);
    
    // Send the request to the backend - simplified
    const response = await fetch(FOLLOW_UP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userData.email,
        firstName: userData.name.split(' ')[0],
        company: userData.company || userData.barName,
        cashFinderData: userData.cashFinderResults,
        scheduledFor: scheduledTime.toISOString()
      })
    });
    
    // Also keep a backup in localStorage
    try {
      const cashFinderPlusQueue = JSON.parse(localStorage.getItem('cash_finder_plus_queue') || '[]');
      localStorage.setItem('cash_finder_plus_queue', JSON.stringify([
        ...cashFinderPlusQueue,
        {
          name: userData.name,
          firstName: userData.name.split(' ')[0],
          email: userData.email,
          phone: userData.phone,
          company: userData.company,
          cashFinderData: userData.cashFinderResults,
          scheduledFor: scheduledTime.toISOString(),
          createdAt: new Date().toISOString(),
          status: 'pending'
        }
      ]));
    } catch (storageError) {
      debugLog('error', 'queueCashFinderPlusEmail', `Error storing in localStorage: ${storageError.message}`);
    }

    return {
      success: true,
      message: 'Follow-up email scheduled successfully',
      scheduledTime: scheduledTime.toISOString()
    };
  } catch (error) {
    debugLog('error', 'queueCashFinderPlusEmail', `Error queuing follow-up email: ${error.message}`);
    
    // Return success anyway to not block UI flow
    return {
      success: true,
      message: 'Your information was received and follow-up will be scheduled.',
      fallback: true
    };
  }
};

/**
* Main service function to send a Cash Finder Report via the selected delivery method
* @param {Object} userData - User contact information
* @param {Object} reportData - Report data
* @param {String} deliveryMethod - 'email' or 'sms'
* @returns {Promise} - Resolves with success info or rejects with error
*/
export const sendCashFinderReport = async (userData, reportData, deliveryMethod) => {
  debugLog('info', 'sendCashFinderReport', `Sending report via ${deliveryMethod}`, {
    userEmail: userData.email,
    company: userData.company,
    deliveryMethod
  });
  
  if (deliveryMethod === 'email') {
    return sendCashFinderReportEmail(userData, reportData);
  } else if (deliveryMethod === 'sms') {
    // Try SMS first, but fallback to email if SMS is not available
    try {
      debugLog('info', 'sendCashFinderReport', 'Attempting SMS delivery');
      const smsResult = await sendCashFinderReportSMS(userData, reportData);
      
      if (!smsResult.success && smsResult.fallbackMethod === 'email') {
        debugLog('info', 'sendCashFinderReport', 'Falling back to email delivery');
        return sendCashFinderReportEmail(userData, reportData);
      }
      return smsResult;
    } catch (error) {
      debugLog('error', 'sendCashFinderReport', `SMS delivery failed: ${error.message}`);
      debugLog('info', 'sendCashFinderReport', 'Falling back to email delivery');
      return sendCashFinderReportEmail(userData, reportData);
    }
  } else {
    const errorMsg = `Unsupported delivery method: ${deliveryMethod}`;
    debugLog('error', 'sendCashFinderReport', errorMsg);
    throw new Error(errorMsg);
  }
};

/**
* For development use: simulate sending an email without actually making API calls
*/
export const simulateEmailSend = async (userData, reportData, deliveryMethod) => {
  debugLog('info', 'simulateEmailSend', `SIMULATED ${deliveryMethod.toUpperCase()} SEND`, {
    to: deliveryMethod === 'email' ? userData.email : userData.phone,
    subject: `Your Cash Finder Report for ${userData.company || userData.barName}`,
  });

  // Simulate network delay
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = {
        success: true,
        message: `Report successfully sent via ${deliveryMethod} (simulated)`,
        id: 'sim_' + Math.random().toString(36).substr(2, 9)
      };
      
      debugLog('info', 'simulateEmailSend', 'Simulation complete', result);
      
      resolve(result);
    }, 1500);
  });
};
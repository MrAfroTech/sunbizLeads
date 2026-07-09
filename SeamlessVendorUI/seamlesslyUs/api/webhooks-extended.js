// Extended Webhook Handlers - Adds NCR Aloha webhook support to existing Square/Clover webhooks
const express = require('express');
const crypto = require('crypto');
const ExtendedPOSService = require('../services/extendedPOSService');

const router = express.Router();
const posService = new ExtendedPOSService();

// Middleware to capture raw body for signature verification
const rawBodyMiddleware = express.raw({ type: 'application/json' });

// NCR Aloha webhook handler (new)
router.post('/webhooks/ncr', rawBodyMiddleware, async (req, res) => {
    try {
        const signature = req.headers['x-ncr-signature'];
        const webhookData = JSON.parse(req.body.toString());

        console.log('NCR webhook received:', {
            eventType: webhookData.eventType,
            orderId: webhookData.orderId,
            status: webhookData.status
        });

        // Verify signature and process webhook
        await posService.handleNCRWebhook(webhookData, signature);

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('NCR webhook error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Your existing Square webhook handler (reference - you already have this)
router.post('/webhooks/square', rawBodyMiddleware, async (req, res) => {
    try {
        const signature = req.headers['x-square-signature'];
        const webhookData = JSON.parse(req.body.toString());

        // Your existing Square webhook handling logic
        // await handleSquareWebhook(webhookData, signature);

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Square webhook error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Your existing Clover webhook handler (reference - you already have this)
router.post('/webhooks/clover', rawBodyMiddleware, async (req, res) => {
    try {
        const signature = req.headers['x-clover-signature'];
        const webhookData = JSON.parse(req.body.toString());

        // Your existing Clover webhook handling logic
        // await handleCloverWebhook(webhookData, signature);

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Clover webhook error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Generic webhook handler that routes to appropriate POS system
router.post('/webhooks/:posType', rawBodyMiddleware, async (req, res) => {
    try {
        const { posType } = req.params;
        const webhookData = JSON.parse(req.body.toString());
        
        switch (posType) {
            case 'ncr':
                const ncrSignature = req.headers['x-ncr-signature'];
                await posService.handleNCRWebhook(webhookData, ncrSignature);
                break;
            
            case 'square':
                // Route to your existing Square handler
                break;
                
            case 'clover':
                // Route to your existing Clover handler
                break;
                
            default:
                return res.status(400).json({ error: `Unsupported POS type: ${posType}` });
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error(`${posType} webhook error:`, error);
        res.status(400).json({ error: error.message });
    }
});

// Webhook test endpoint for development
router.post('/webhooks/test/:posType', express.json(), async (req, res) => {
    try {
        const { posType } = req.params;
        const testData = req.body;
        
        console.log(`Test webhook for ${posType}:`, testData);
        
        // Process test webhook without signature verification
        switch (posType) {
            case 'ncr':
                await posService.handleNCRWebhook(testData, 'test-signature');
                break;
            default:
                return res.status(400).json({ error: `Test not implemented for ${posType}` });
        }
        
        res.status(200).json({ 
            received: true, 
            message: `Test webhook processed for ${posType}` 
        });
    } catch (error) {
        console.error(`Test webhook error for ${posType}:`, error);
        res.status(400).json({ error: error.message });
    }
});

// Webhook registration endpoint (for NCR Aloha webhook setup)
router.post('/webhooks/register/:posType', express.json(), async (req, res) => {
    try {
        const { posType } = req.params;
        const { restaurantId, webhookUrl } = req.body;

        if (posType === 'ncr') {
            // Register webhook with NCR Aloha for this restaurant
            const result = await registerNCRWebhook(restaurantId, webhookUrl);
            res.status(200).json(result);
        } else {
            res.status(400).json({ error: `Webhook registration not needed for ${posType}` });
        }
    } catch (error) {
        console.error(`Webhook registration error for ${posType}:`, error);
        res.status(400).json({ error: error.message });
    }
});

// Helper function to register NCR webhooks
async function registerNCRWebhook(restaurantId, webhookUrl) {
    const posIntegration = await posService.getPOSIntegration(restaurantId);
    const accessToken = await posService.ensureValidNCRToken(posIntegration);
    
    const webhookConfig = {
        url: webhookUrl,
        events: ['ORDER_STATUS_CHANGED', 'ORDER_CREATED', 'ORDER_CANCELLED'],
        active: true
    };

    const response = await axios.post(
        `${process.env.NCR_API_BASE_URL}/sites/${posIntegration.site_id}/webhooks`,
        webhookConfig,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Application-Id': process.env.NCR_APPLICATION_ID
            }
        }
    );

    return {
        webhookId: response.data.id,
        url: response.data.url,
        events: response.data.events,
        message: 'Webhook registered successfully'
    };
}

module.exports = router;
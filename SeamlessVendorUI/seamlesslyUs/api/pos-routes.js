// Extended POS API Routes - Unified API for all POS systems including NCR Aloha and TouchBistro
const express = require('express');
const ExtendedPOSService = require('../services/extendedPOSService');
const ExtendedPOSModels = require('../models/extendedPOSModels');
const posConfig = require('../config/posConfig');

const router = express.Router();
const posService = new ExtendedPOSService();

// Middleware for authentication (you'll implement based on your existing auth)
const authenticateRequest = (req, res, next) => {
    // Your existing authentication middleware
    next();
};

// Get supported POS types
router.get('/pos/types', (req, res) => {
    try {
        const supportedTypes = posConfig.getSupportedPOSTypes();
        const availableTypes = supportedTypes.filter(type => posConfig.isPOSAvailable(type));
        
        res.json({
            supported: supportedTypes,
            available: availableTypes,
            configurations: posConfig.getDebugInfo()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Restaurant POS Integration Management
router.post('/restaurants/:restaurantId/pos/integrate', authenticateRequest, async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { posType, credentials } = req.body;

        if (!posConfig.isPOSAvailable(posType)) {
            return res.status(400).json({ 
                error: `POS type ${posType} is not available or configured` 
            });
        }

        // Create POS integration
        const integrationData = {
            restaurant_id: restaurantId,
            pos_type: posType,
            api_credentials_encrypted: JSON.stringify(credentials), // You should encrypt this
            ...credentials // This might include site_id, location_id, etc.
        };

        const integration = await ExtendedPOSModels.createPOSIntegration(integrationData);

        // For NCR Aloha, set up OAuth
        if (posType === 'ncr_aloha') {
            try {
                const accessToken = await posService.refreshNCRToken(integration);
                await posService.registerNCRWebhook(restaurantId);
            } catch (error) {
                console.error('NCR OAuth setup failed:', error);
                // Continue anyway - can be set up later
            }
        }

        // Initial menu sync
        try {
            await posService.syncMenu(restaurantId);
        } catch (error) {
            console.error('Initial menu sync failed:', error);
            // Continue anyway - can be synced later
        }

        res.status(201).json({
            integration,
            message: `${posType} integration created successfully`
        });
    } catch (error) {
        console.error('POS integration error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get restaurant's POS integration status
router.get('/restaurants/:restaurantId/pos', authenticateRequest, async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const integration = await ExtendedPOSModels.getPOSIntegration(restaurantId);
        
        if (!integration) {
            return res.status(404).json({ error: 'No POS integration found' });
        }

        // Check token status for OAuth-based systems
        let tokenStatus = 'valid';
        if (integration.pos_type === 'ncr_aloha') {
            const tokenData = await ExtendedPOSModels.getOAuthToken(integration.id);
            if (!tokenData || new Date() >= new Date(tokenData.expires_at)) {
                tokenStatus = 'expired';
            }
        }

        res.json({
            integration: {
                id: integration.id,
                posType: integration.pos_type,
                isActive: integration.is_active,
                tokenStatus,
                createdAt: integration.created_at
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create order through POS system
router.post('/restaurants/:restaurantId/orders', authenticateRequest, async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const orderData = req.body;

        // Validate order data
        if (!orderData.customer || !orderData.items || orderData.items.length === 0) {
            return res.status(400).json({ error: 'Invalid order data' });
        }

        // Create order through appropriate POS system
        const result = await posService.createOrder(restaurantId, orderData);

        // Save order to database
        const savedOrder = await ExtendedPOSModels.createOrder({
            restaurant_id: restaurantId,
            customer_id: orderData.customer.id,
            pos_type: result.posType,
            pos_order_id: result.posOrderId,
            pos_site_id: result.siteId,
            pos_location_id: result.locationId,
            order_data: orderData,
            status: result.status,
            total_amount: orderData.totalAmount
        });

        res.status(201).json({
            order: savedOrder,
            posResponse: result,
            message: 'Order created successfully'
        });
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get order status
router.get('/orders/:orderId/status', authenticateRequest, async (req, res) => {
    try {
        const { orderId } = req.params;
        
        // Get order from database
        const order = await ExtendedPOSModels.getOrderById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // For TouchBistro, trigger immediate poll
        if (order.pos_type === 'touchbistro') {
            try {
                const posIntegration = await ExtendedPOSModels.getPOSIntegration(order.restaurant_id);
                const latestStatus = await posService.pollTouchBistroOrderStatus(posIntegration, order.pos_order_id);
                await ExtendedPOSModels.updateOrderStatus(orderId, latestStatus);
                order.status = latestStatus.status;
            } catch (error) {
                console.error('Status poll error:', error);
            }
        }

        res.json({
            orderId: order.id,
            posOrderId: order.pos_order_id,
            status: order.status,
            posStatus: order.pos_status,
            updatedAt: order.updated_at
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Sync menu from POS
router.post('/restaurants/:restaurantId/menu/sync', authenticateRequest, async (req, res) => {
    try {
        const { restaurantId } = req.params;
        
        const menuData = await posService.syncMenu(restaurantId);
        
        res.json({
            message: 'Menu synced successfully',
            menuData,
            syncedAt: new Date()
        });
    } catch (error) {
        console.error('Menu sync error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get restaurant menu
router.get('/restaurants/:restaurantId/menu', async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const posIntegration = await ExtendedPOSModels.getPOSIntegration(restaurantId);
        
        if (!posIntegration) {
            return res.status(404).json({ error: 'No POS integration found' });
        }

        const menu = await ExtendedPOSModels.getMenu(restaurantId, posIntegration.pos_type);
        
        if (!menu) {
            return res.status(404).json({ error: 'Menu not found - try syncing first' });
        }

        res.json({
            menu: menu.menu_data,
            lastSynced: menu.last_synced_at,
            posType: posIntegration.pos_type
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Test POS connection
router.post('/restaurants/:restaurantId/pos/test', authenticateRequest, async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const posIntegration = await ExtendedPOSModels.getPOSIntegration(restaurantId);
        
        if (!posIntegration) {
            return res.status(404).json({ error: 'No POS integration found' });
        }

        // Test connection based on POS type
        let testResult;
        
        switch (posIntegration.pos_type) {
            case 'ncr_aloha':
                testResult = await testNCRConnection(posIntegration);
                break;
            case 'touchbistro':
                testResult = await testTouchBistroConnection(posIntegration);
                break;
            case 'square':
                // Your existing Square test
                testResult = await testSquareConnection(posIntegration);
                break;
            case 'clover':
                // Your existing Clover test
                testResult = await testCloverConnection(posIntegration);
                break;
            default:
                throw new Error(`Test not implemented for ${posIntegration.pos_type}`);
        }

        res.json({
            posType: posIntegration.pos_type,
            status: 'success',
            testResult,
            testedAt: new Date()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message,
            testedAt: new Date()
        });
    }
});

// Get POS analytics
router.get('/analytics/pos', authenticateRequest, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        const metrics = await ExtendedPOSModels.getPOSPerformanceMetrics(start, end);
        const systemStats = await ExtendedPOSModels.getSystemStats();
        
        res.json({
            period: { startDate: start, endDate: end },
            posMetrics: metrics,
            systemStats,
            generatedAt: new Date()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
router.get('/health', async (req, res) => {
    try {
        const dbHealth = await ExtendedPOSModels.checkDatabaseConnection();
        const posStatus = {};
        
        // Check each POS system availability
        posConfig.getSupportedPOSTypes().forEach(posType => {
            posStatus[posType] = {
                configured: posConfig.isPOSAvailable(posType),
                supportsWebhooks: posConfig.getWebhookConfig(posType) !== null
            };
        });

        res.json({
            status: 'healthy',
            timestamp: new Date(),
            database: {
                connected: true,
                serverTime: dbHealth.current_time
            },
            posSystems: posStatus
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date()
        });
    }
});

// Helper functions for connection testing
async function testNCRConnection(posIntegration) {
    try {
        const accessToken = await posService.ensureValidNCRToken(posIntegration);
        // Test API call to get sites
        const response = await axios.get(
            `${posConfig.getConfig('ncr_aloha').baseUrl}/sites`,
            { headers: posConfig.getAuthHeaders('ncr_aloha', accessToken) }
        );
        return { success: true, sitesCount: response.data.sites?.length || 0 };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function testTouchBistroConnection(posIntegration) {
    try {
        const config = posConfig.getConfig('touchbistro');
        const response = await axios.get(
            `${config.baseUrl}/restaurants`,
            { headers: posConfig.getAuthHeaders('touchbistro') }
        );
        return { success: true, restaurantsCount: response.data.restaurants?.length || 0 };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

module.exports = router;
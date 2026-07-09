// Demo POS API Routes - Test NCR Aloha and TouchBistro without real credentials
const express = require('express');
const DemoPOSService = require('../services/demoPOSService');

const router = express.Router();
const demoPOSService = new DemoPOSService();

// Demo mode indicator
router.get('/demo/status', (req, res) => {
    res.json({
        message: '🎭 POS Demo Mode Active',
        status: demoPOSService.getDemoStatus(),
        availableEndpoints: [
            'GET /demo/status - This status page',
            'POST /demo/restaurants/:id/orders - Create demo order',
            'GET /demo/orders/:id/status - Get demo order status',
            'POST /demo/restaurants/:id/menu/sync - Sync demo menu',
            'GET /demo/restaurants/:id/menu - Get demo menu',
            'POST /demo/pos/:type/test - Test demo POS connection',
            'GET /demo/orders - List all demo orders',
            'DELETE /demo/clear - Clear all demo data'
        ]
    });
});

// Create demo order
router.post('/demo/restaurants/:restaurantId/orders', async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const orderData = req.body;

        console.log(`🎭 DEMO: Creating order for restaurant ${restaurantId}`);

        // Validate demo order data
        if (!orderData.customer || !orderData.items || orderData.items.length === 0) {
            return res.status(400).json({ 
                error: 'Invalid order data',
                required: ['customer', 'items'],
                example: {
                    customer: { name: 'John Doe', phone: '+1234567890', email: 'john@example.com' },
                    items: [{ id: 'item_001', name: 'Demo Item', quantity: 1, price: 10.00 }]
                }
            });
        }

        const result = await demoPOSService.createOrder(restaurantId, orderData);

        res.status(201).json({
            success: true,
            message: `🎭 Demo order created for ${result.posType}`,
            order: result,
            note: 'This is a demo order - no real POS system was contacted'
        });
    } catch (error) {
        console.error('Demo order creation error:', error);
        res.status(500).json({ 
            error: error.message,
            demo: true
        });
    }
});

// Get demo order status
router.get('/demo/orders/:orderId/status', async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const status = await demoPOSService.getDemoOrderStatus(orderId);
        
        res.json({
            success: true,
            status,
            message: '🎭 Demo order status retrieved',
            note: 'Status updates are simulated - real integrations would query actual POS systems'
        });
    } catch (error) {
        res.status(404).json({ 
            error: error.message,
            demo: true
        });
    }
});

// Sync demo menu
router.post('/demo/restaurants/:restaurantId/menu/sync', async (req, res) => {
    try {
        const { restaurantId } = req.params;
        
        const menuData = await demoPOSService.syncDemoMenu(restaurantId);
        
        res.json({
            success: true,
            message: '🎭 Demo menu synced successfully',
            menuData,
            syncedAt: new Date(),
            note: 'This is demo menu data - real integrations would fetch from actual POS systems'
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            demo: true
        });
    }
});

// Get demo menu
router.get('/demo/restaurants/:restaurantId/menu', async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const posIntegration = await demoPOSService.getDemoPOSIntegration(restaurantId);
        
        if (!posIntegration) {
            return res.status(404).json({ 
                error: 'Demo restaurant not found',
                availableRestaurants: ['1', '2', '3', '4'],
                posTypes: { '1': 'ncr_aloha', '2': 'touchbistro', '3': 'ncr_aloha', '4': 'touchbistro' }
            });
        }

        const menuData = demoPOSService.demoMenus.get(posIntegration.pos_type);
        
        res.json({
            success: true,
            restaurantId,
            posType: posIntegration.pos_type,
            menu: menuData,
            message: '🎭 Demo menu retrieved',
            note: 'This is demo menu data'
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            demo: true
        });
    }
});

// Test demo POS connection
router.post('/demo/pos/:posType/test', async (req, res) => {
    try {
        const { posType } = req.params;
        
        if (!['ncr_aloha', 'touchbistro'].includes(posType)) {
            return res.status(400).json({
                error: 'Invalid POS type for demo',
                availableTypes: ['ncr_aloha', 'touchbistro']
            });
        }

        const testResult = await demoPOSService.testDemoConnection(posType);
        
        res.json({
            success: true,
            posType,
            testResult,
            message: `🎭 Demo ${posType} connection test completed`,
            testedAt: new Date(),
            note: 'This is a simulated connection test'
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            demo: true
        });
    }
});

// List all demo orders
router.get('/demo/orders', (req, res) => {
    try {
        const orders = demoPOSService.getAllDemoOrders();
        
        res.json({
            success: true,
            count: orders.length,
            orders: orders.map(order => ({
                id: order.id,
                posType: order.id.includes('ncr') ? 'ncr_aloha' : 'touchbistro',
                status: order.normalizedStatus,
                posStatus: order.status,
                customer: order.customer.name,
                total: order.totalAmount,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt
            })),
            message: '🎭 All demo orders retrieved'
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            demo: true
        });
    }
});

// Clear all demo data
router.delete('/demo/clear', (req, res) => {
    try {
        demoPOSService.clearDemoData();
        
        res.json({
            success: true,
            message: '🧹 All demo data cleared',
            clearedAt: new Date()
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            demo: true
        });
    }
});

// Demo restaurant management
router.get('/demo/restaurants', (req, res) => {
    const demoRestaurants = [
        { id: '1', name: 'Demo NCR Restaurant', posType: 'ncr_aloha', siteId: 'demo_site_123' },
        { id: '2', name: 'Demo TouchBistro Cafe', posType: 'touchbistro', locationId: 'demo_location_456' },
        { id: '3', name: 'Demo NCR Bistro', posType: 'ncr_aloha', siteId: 'demo_site_789' },
        { id: '4', name: 'Demo TouchBistro Restaurant', posType: 'touchbistro', locationId: 'demo_location_012' }
    ];

    res.json({
        success: true,
        restaurants: demoRestaurants,
        message: '🎭 Demo restaurants available for testing',
        note: 'Use these restaurant IDs to test different POS integrations'
    });
});

// Demo webhook simulation
router.post('/demo/webhooks/:posType', express.json(), async (req, res) => {
    try {
        const { posType } = req.params;
        const webhookData = req.body;
        
        console.log(`📨 DEMO Webhook received for ${posType}:`, webhookData);
        
        // Simulate webhook processing
        if (posType === 'ncr_aloha' && webhookData.orderId) {
            const order = demoPOSService.getDemoOrder(webhookData.orderId);
            if (order && webhookData.status) {
                order.status = webhookData.status;
                order.normalizedStatus = demoPOSService.normalizeOrderStatus(webhookData.status, 'ncr_aloha');
                order.updatedAt = new Date().toISOString();
            }
        }
        
        res.json({
            success: true,
            message: `🎭 Demo webhook processed for ${posType}`,
            webhookData,
            processedAt: new Date()
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            demo: true
        });
    }
});

// Demo order flow test
router.post('/demo/test/complete-flow/:restaurantId', async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const posIntegration = await demoPOSService.getDemoPOSIntegration(restaurantId);
        
        console.log(`🧪 DEMO: Starting complete flow test for restaurant ${restaurantId} (${posIntegration.pos_type})`);
        
        // Step 1: Sync menu
        const menuData = await demoPOSService.syncDemoMenu(restaurantId);
        
        // Step 2: Create order
        const demoOrderData = {
            customer: {
                name: 'Test Customer',
                phone: '+1234567890', 
                email: 'test@example.com'
            },
            items: [
                { id: 'item_001', name: 'Demo Item 1', quantity: 2, price: 12.99 },
                { id: 'item_002', name: 'Demo Item 2', quantity: 1, price: 8.50 }
            ]
        };
        
        const orderResult = await demoPOSService.createOrder(restaurantId, demoOrderData);
        
        res.json({
            success: true,
            message: `🧪 Complete flow test started for ${posIntegration.pos_type}`,
            steps: {
                menuSync: { success: true, itemCount: menuData.categories.length },
                orderCreation: { success: true, orderId: orderResult.orderId }
            },
            note: `Watch the console for simulated ${posIntegration.pos_type === 'ncr_aloha' ? 'webhook' : 'polling'} updates`,
            orderStatus: 'Monitor order status updates over the next 30 seconds'
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            demo: true
        });
    }
});

module.exports = router;
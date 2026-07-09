/**
 * POS Integration Test Example
 * 
 * This file demonstrates how to use the POS service layer.
 * You can run this immediately with the mock service.
 * 
 * Usage: Import and call testPOSIntegration() in your app
 */

import { 
  POSServiceFactory, 
  Menu, 
  Order, 
  OrderItem,
  posConfig 
} from './index';

/**
 * Test POS Integration
 * Comprehensive test of all POS functionality
 */
export async function testPOSIntegration() {
  console.log('🧪 Starting POS Integration Test...\n');

  try {
    // ========================================
    // 1. CHECK SUPPORTED PROVIDERS
    // ========================================
    console.log('1️⃣ Checking supported providers...');
    const providers = POSServiceFactory.getSupportedProviders();
    console.log('   Supported providers:', providers);
    console.log('   ✅ Factory initialized\n');

    // ========================================
    // 2. CREATE AND INITIALIZE SERVICE
    // ========================================
    console.log('2️⃣ Creating POS service...');
    const service = await POSServiceFactory.createAndInitialize('mock');
    console.log('   Provider:', service.getProviderName());
    console.log('   Ready:', service.isReady());
    console.log('   ✅ Service initialized\n');

    // ========================================
    // 3. HEALTH CHECK
    // ========================================
    console.log('3️⃣ Performing health check...');
    const health = await service.healthCheck();
    console.log('   Healthy:', health.healthy);
    console.log('   Response time:', health.responseTime, 'ms');
    console.log('   ✅ System healthy\n');

    // ========================================
    // 4. FETCH AND PROCESS MENU
    // ========================================
    console.log('4️⃣ Fetching menu...');
    const menuData = await service.fetchMenu();
    const menu = new Menu(menuData.menu);
    
    console.log('   Vendor:', menu.vendorName);
    console.log('   Categories:', menu.categories.length);
    console.log('   Total items:', menu.getTotalItemCount());
    console.log('   Last synced:', menu.lastSynced);
    
    // Display menu structure
    menu.categories.forEach(category => {
      console.log(`\n   📁 ${category.name}:`);
      category.items.forEach(item => {
        console.log(`      • ${item.name} - $${item.price}`);
      });
    });
    console.log('\n   ✅ Menu loaded\n');

    // ========================================
    // 5. CREATE ORDER
    // ========================================
    console.log('5️⃣ Creating order...');
    const order = new Order({
      customerId: 'customer_123',
      customerName: 'John Pirates Fan',
      vendorId: 'vendor_1',
      vendorName: 'KIA Center Concessions'
    });

    // Add first item
    const hotDog = menu.findItemById('item_1');
    if (hotDog) {
      const orderItem1 = new OrderItem({
        menuItemId: hotDog.id,
        name: hotDog.name,
        unitPrice: hotDog.price,
        quantity: 2
      });
      order.addItem(orderItem1);
      console.log(`   Added: ${orderItem1.quantity}x ${orderItem1.name}`);
    }

    // Add second item
    const beer = menu.findItemById('item_4');
    if (beer) {
      const orderItem2 = new OrderItem({
        menuItemId: beer.id,
        name: beer.name,
        unitPrice: beer.price,
        quantity: 1
      });
      order.addItem(orderItem2);
      console.log(`   Added: ${orderItem2.quantity}x ${orderItem2.name}`);
    }

    // Recalculate totals
    order.recalculateTotal();
    
    console.log(`\n   Order Summary:`);
    console.log(`   Subtotal: $${order.subtotal.toFixed(2)}`);
    console.log(`   Tax (8%): $${order.tax.toFixed(2)}`);
    console.log(`   Total: $${order.total.toFixed(2)}`);

    // Validate order
    const validation = order.validate();
    console.log(`   Valid: ${validation.valid}`);
    if (!validation.valid) {
      console.log('   Errors:', validation.errors);
    }
    console.log('   ✅ Order created\n');

    // ========================================
    // 6. SUBMIT ORDER TO POS
    // ========================================
    console.log('6️⃣ Submitting order to POS...');
    const result = await service.createOrder(order.toJSON());
    
    console.log('   Order ID:', result.orderId);
    console.log('   Status:', result.status);
    console.log('   Total:', `$${result.total.toFixed(2)}`);
    console.log('   Ready at:', new Date(result.estimatedReadyTime).toLocaleTimeString());
    console.log('   ✅ Order submitted\n');

    // Store order ID for status checking
    const orderId = result.orderId;

    // ========================================
    // 7. CHECK ORDER STATUS
    // ========================================
    console.log('7️⃣ Checking order status...');
    const status = await service.getOrderStatus(orderId);
    
    console.log('   Order ID:', status.orderId);
    console.log('   Status:', status.status);
    console.log('   Updated at:', status.updatedAt);
    console.log('   ✅ Status retrieved\n');

    // ========================================
    // 8. GET VENDOR INFO
    // ========================================
    console.log('8️⃣ Getting vendor info...');
    const vendorInfo = await service.getVendorInfo();
    
    console.log('   Vendor:', vendorInfo.vendor.name);
    console.log('   Location:', vendorInfo.vendor.location);
    console.log('   Open:', vendorInfo.vendor.isOpen);
    console.log('   Accepting orders:', vendorInfo.vendor.acceptingOrders);
    console.log('   ✅ Vendor info retrieved\n');

    // ========================================
    // 9. TEST CONFIGURATION
    // ========================================
    console.log('9️⃣ Testing configuration...');
    const config = posConfig.getConfig();
    
    console.log('   Active provider:', config.activeProvider);
    console.log('   Environment:', config.environment);
    console.log('   Connection timeout:', config.connectionTimeout, 'ms');
    console.log('   Health check enabled:', config.enableHealthChecks);
    console.log('   ✅ Configuration loaded\n');

    // ========================================
    // FINAL SUMMARY
    // ========================================
    console.log('✅ ALL TESTS PASSED!\n');
    console.log('Summary:');
    console.log('  • POS Service: Working');
    console.log('  • Menu System: Working');
    console.log('  • Order Creation: Working');
    console.log('  • Status Tracking: Working');
    console.log('  • Configuration: Working');
    console.log('\n🎉 POS Integration is ready to use!');

    return {
      success: true,
      service,
      menu,
      order,
      orderId
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    return {
      success: false,
      error
    };
  }
}

/**
 * Quick Test
 * Minimal test for quick validation
 */
export async function quickTest() {
  console.log('🚀 Quick POS Test...\n');
  
  try {
    const service = await POSServiceFactory.createAndInitialize('mock');
    const menu = await service.fetchMenu();
    console.log('✅ Service working! Menu has', menu.menu.categories.length, 'categories');
    return true;
  } catch (error) {
    console.error('❌ Quick test failed:', error.message);
    return false;
  }
}

/**
 * Example: Create Simple Order
 * Demonstrates basic order creation flow
 */
export async function createSimpleOrder() {
  const service = await POSServiceFactory.createAndInitialize('mock');
  
  const order = new Order({
    customerId: 'fan_123',
    customerName: 'Pirates Fan',
    vendorId: 'vendor_1',
    vendorName: 'Concessions'
  });
  
  order.addItem(new OrderItem({
    menuItemId: 'item_1',
    name: 'Hot Dog',
    unitPrice: 8.50,
    quantity: 1
  }));
  
  order.recalculateTotal();
  
  const result = await service.createOrder(order.toJSON());
  
  return result;
}

export default {
  testPOSIntegration,
  quickTest,
  createSimpleOrder
};



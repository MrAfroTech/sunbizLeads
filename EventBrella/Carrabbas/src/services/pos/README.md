# POS Integration Service Layer

## 📋 Overview

This directory contains a **provider-agnostic POS integration foundation** for the Orlando Pirates app. The architecture is designed to accept any POS system (Square, Clover, Toast, etc.) without requiring architectural changes.

## 🏗️ Architecture

```
src/services/pos/
├── BasePOSService.js         # Abstract base class - defines POS service contract
├── POSServiceFactory.js      # Factory pattern - creates POS service instances
├── POSDataStructures.js      # Data models - Menu, Order, OrderItem, etc.
├── POSConfig.js              # Configuration management
├── index.js                  # Main export file
└── README.md                 # This file
```

## 🚀 Quick Start

### Initialize a POS Service

```javascript
import { POSServiceFactory } from './services/pos';

// Create and initialize (currently uses mock service)
const posService = await POSServiceFactory.createAndInitialize('mock');

// Check if ready
console.log(posService.isReady()); // true
```

### Fetch Menu

```javascript
const menuData = await posService.fetchMenu();
const menu = new Menu(menuData.menu);

console.log(`Total items: ${menu.getTotalItemCount()}`);
console.log(`Categories: ${menu.categories.length}`);
```

### Create an Order

```javascript
import { Order, OrderItem } from './services/pos';

const order = new Order({
  customerId: 'customer_123',
  customerName: 'John Doe',
  vendorId: 'vendor_1',
  vendorName: 'Concessions'
});

// Add items
const item = new OrderItem({
  menuItemId: 'item_1',
  name: 'Hot Dog',
  unitPrice: 8.50,
  quantity: 2
});

order.addItem(item);
order.recalculateTotal();

// Submit to POS
const result = await posService.createOrder(order.toJSON());
console.log('Order ID:', result.orderId);
```

## 🔌 Adding a New POS Provider

When you've confirmed which POS system to use, follow these steps:

### Step 1: Create POS Service Class

Create a new file: `SquarePOSService.js` (or CloverPOSService.js, etc.)

```javascript
import { BasePOSService } from './BasePOSService';

export class SquarePOSService extends BasePOSService {
  constructor(config) {
    super(config);
    this.providerName = 'square';
    this.apiKey = config.apiKey;
    this.locationId = config.locationId;
  }

  async initialize() {
    // Implement Square-specific initialization
    this.isInitialized = true;
    return true;
  }

  async fetchMenu() {
    // Implement Square menu fetching
    // Map Square's menu format to our Menu structure
  }

  async createOrder(orderData) {
    // Implement Square order creation
    // Map our Order format to Square's format
  }

  // Implement other required methods...
}
```

### Step 2: Register with Factory

```javascript
import { POSServiceFactory } from './POSServiceFactory';
import { SquarePOSService } from './SquarePOSService';

POSServiceFactory.registerProvider('square', SquarePOSService);
```

### Step 3: Update Configuration

```javascript
import { posConfig } from './POSConfig';

posConfig.setActiveProvider('square');
posConfig.addVendor({
  id: 'vendor_1',
  name: 'KIA Center Concessions',
  provider: 'square',
  location: 'Section 101',
  credentials: {
    apiKey: 'your_square_api_key',
    locationId: 'your_location_id'
  }
});
```

### Step 4: Use the New Provider

```javascript
// Now creates Square service instead of mock
const posService = await POSServiceFactory.createAndInitialize('square');
```

## 📦 Data Structures

### Menu Hierarchy

```
Menu
└── MenuCategory[]
    └── MenuItem[]
        └── ModifierGroup[]
            └── ModifierOption[]
```

### Order Hierarchy

```
Order
└── OrderItem[]
    └── ModifierOption[] (selected modifiers)
```

## 🎯 Key Features

### ✅ Provider-Agnostic
- Common interface for all POS systems
- No hardcoded provider logic
- Easy to swap providers

### ✅ Type-Safe Data Models
- Validation methods on all classes
- Consistent data structure across providers
- JSON serialization support

### ✅ Mock Service Included
- Full working mock implementation
- Test without real POS connection
- Realistic delays and responses

### ✅ Configuration Management
- Centralized settings
- Environment-specific configs
- Vendor management

## 🔧 Configuration Options

```javascript
import { posConfig } from './services/pos';

// Update configuration
posConfig.updateConfig({
  connectionTimeout: 30000,
  healthCheckTimeout: 5000,
  maxRetries: 3,
  defaultTaxRate: 0.08,
  enableHealthChecks: true
});
```

## 📊 Available Methods

### BasePOSService Methods (must implement)

| Method | Description | Returns |
|--------|-------------|---------|
| `initialize()` | Initialize POS connection | `Promise<boolean>` |
| `healthCheck()` | Check POS system health | `Promise<Object>` |
| `fetchMenu()` | Get menu from POS | `Promise<Object>` |
| `createOrder(orderData)` | Create order in POS | `Promise<Object>` |
| `getOrderStatus(orderId)` | Get order status | `Promise<Object>` |
| `cancelOrder(orderId, reason)` | Cancel/refund order | `Promise<Object>` |
| `getVendorInfo()` | Get vendor details | `Promise<Object>` |
| `validateConnection()` | Test connection | `Promise<boolean>` |

## 🧪 Testing

```javascript
// Test with mock service
const service = await POSServiceFactory.createAndInitialize('mock');

// Health check
const health = await service.healthCheck();
console.log('Healthy:', health.healthy);

// Fetch menu
const menuData = await service.fetchMenu();
console.log('Menu items:', menuData.menu.categories.length);

// Create test order
const order = new Order({
  customerId: 'test_123',
  vendorId: 'vendor_1',
  items: [
    new OrderItem({
      menuItemId: 'item_1',
      name: 'Hot Dog',
      unitPrice: 8.50,
      quantity: 1
    })
  ]
});

order.recalculateTotal();
const result = await service.createOrder(order.toJSON());
console.log('Order created:', result.orderId);
```

## 🎨 UI Integration Example

```javascript
// In your React Native component
import { POSServiceFactory, Menu } from '../services/pos';

const FoodBeveragesScreen = () => {
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const service = await POSServiceFactory.createAndInitialize('mock');
      const menuData = await service.fetchMenu();
      const menuObj = new Menu(menuData.menu);
      setMenu(menuObj);
    } catch (error) {
      console.error('Failed to load menu:', error);
    } finally {
      setLoading(false);
    }
  };

  // Render menu...
};
```

## 📝 Notes

- **No AWS Dependencies**: This layer doesn't require Lambda or DynamoDB
- **No Database**: All state management is in-memory or passed to POS
- **No Auth Yet**: Authentication will be added when POS is confirmed
- **Mock Service Ready**: Use immediately for development/testing
- **Production Ready**: Architecture matches SeamlessMarketplace patterns

## 🚧 Current Status

- ✅ Service abstraction layer complete
- ✅ Data structures defined
- ✅ Mock service implemented
- ✅ Configuration management ready
- ⏳ Awaiting POS system confirmation
- ⏳ Real POS implementation pending
- ⏳ UI integration pending (Phase 3)

## 📞 Next Steps

1. **Confirm POS System**: Determine which POS system to use
2. **Implement Provider**: Create specific POS service class
3. **Add Credentials**: Configure API keys and endpoints
4. **Test Connection**: Validate integration with real POS
5. **Build UI**: Create Food & Beverages screen (Phase 3)

---

**Last Updated**: Phase 2 Complete
**Ready For**: POS System Integration



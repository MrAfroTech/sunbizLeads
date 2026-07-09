/**
 * POS Service Layer - Main Export
 * 
 * This module provides a complete POS integration foundation that is:
 * - Provider-agnostic (works with any POS system)
 * - Plug-and-play (ready for real implementations)
 * - Fully documented (each class has clear contracts)
 * 
 * Usage:
 * import { POSServiceFactory, Menu, Order } from './services/pos';
 * 
 * const posService = await POSServiceFactory.createAndInitialize('mock');
 * const menu = await posService.fetchMenu();
 */

// Service Layer
export { BasePOSService } from './BasePOSService';
export { POSServiceFactory } from './POSServiceFactory';

// Data Structures
export {
  MenuItem,
  ModifierGroup,
  ModifierOption,
  MenuCategory,
  Menu,
  OrderItem,
  Order,
  OrderStatus,
  PaymentStatus,
  VendorConfig
} from './POSDataStructures';

// Configuration
export {
  POSProviderConfig,
  POSConfig,
  posConfig
} from './POSConfig';

// Default export for convenience
export default {
  POSServiceFactory,
  Menu,
  Order,
  OrderItem,
  MenuItem,
  posConfig
};



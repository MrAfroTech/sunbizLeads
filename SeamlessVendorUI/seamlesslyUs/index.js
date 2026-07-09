/**
 * Coffee & Conversations Collective - Shared Booking System
 * Export all components for use in multiple projects
 */

// Booking Components
export { default as BookingSystem } from './src/components/booking/BookingSystem';
export { default as BookingCalendar } from './src/components/booking/BookingCalendar';
export { default as CustomerBookingFlow } from './src/components/booking/CustomerBookingFlow';

// Loyalty Components
export { default as LoyaltyRewards } from './src/components/loyalty/LoyaltyRewards';

// Admin Components
export { default as BookingDashboard } from './src/components/admin/BookingDashboard';
export { default as ServiceConfig } from './src/components/admin/ServiceConfig';

// Schemas
export * from './src/schemas/bookings-schema';
export * from './src/schemas/services-schema';
export * from './src/schemas/staff-schema';
export * from './src/schemas/loyalty-schema';
export * from './src/schemas/availability-schema';


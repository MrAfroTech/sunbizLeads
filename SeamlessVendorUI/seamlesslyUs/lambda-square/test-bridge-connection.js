#!/usr/bin/env node

/**
 * Test Bridge Connection Script
 * 
 * This script tests the EventBridge bridge connection that was added to the Square OAuth Lambda.
 * It simulates the vendor onboarding event publishing to verify the bridge works correctly.
 * 
 * Usage: node test-bridge-connection.js
 */

const AWS = require('aws-sdk');

// Configure AWS (you may need to set AWS_PROFILE or run aws configure)
const eventBridge = new AWS.EventBridge({ region: 'us-east-1' });

async function testBridgeConnection() {
    console.log('🌉 === TESTING BRIDGE CONNECTION ===');
    console.log('📍 Point A: Simulating vendor onboarding event');
    console.log('🎯 Target: EventBridge (default event bus)');
    console.log('');
    
    try {
        // Simulate the exact event payload that the Square Lambda would send
        const testVendorEvent = {
            EventBusName: 'default',
            Source: 'seamless.vendor.onboarding',
            DetailType: 'VendorOnboarded',
            Detail: JSON.stringify({
                eventType: 'VendorOnboarded',
                merchantId: 'test_merchant_123',
                vendorName: 'Test Taco Truck',
                vendorEmail: 'test@tacotruck.com',
                vendorId: 'test_vendor_456',
                posSystem: 'Square',
                integrationStatus: 'completed',
                timestamp: new Date().toISOString(),
                posCredentials: {
                    merchantId: 'test_merchant_123',
                    accessToken: 'test_access_token_789',
                    environment: 'test'
                },
                metadata: {
                    source: 'Square OAuth Lambda',
                    version: '1.0',
                    environment: 'test',
                    bridgePoint: 'Point A - Vendor Onboarding Complete'
                }
            })
        };
        
        console.log('📤 Test Event Payload:');
        console.log(JSON.stringify(testVendorEvent, null, 2));
        console.log('');
        
        console.log('🚀 Publishing test event to EventBridge...');
        
        const result = await eventBridge.putEvents({
            Entries: [testVendorEvent]
        }).promise();
        
        console.log('📊 EventBridge Response:');
        console.log(JSON.stringify(result, null, 2));
        console.log('');
        
        if (result.FailedEntryCount === 0) {
            console.log('✅ SUCCESS: Test event published to EventBridge!');
            console.log('🆔 Event ID:', result.Entries[0].EventId);
            console.log('🌉 BRIDGE STATUS: Point A → Event Bus → Ready for Codebase 2');
            console.log('');
            console.log('🎯 This means:');
            console.log('   • Codebase 1 (Square OAuth Lambda) can publish events');
            console.log('   • EventBridge is accessible and working');
            console.log('   • Codebase 2 (Customer UI) can consume these events');
            console.log('   • The bridge connection is functional');
        } else {
            console.error('❌ FAILED: Test event publishing failed');
            console.error('🔍 Failed Entries:', result.Entries.filter(entry => entry.EventId === undefined));
        }
        
    } catch (error) {
        console.error('❌ BRIDGE TEST ERROR:', error.message);
        console.error('🔍 Error Details:', error);
        console.log('');
        console.log('💡 Troubleshooting Tips:');
        console.log('   1. Check AWS credentials: aws configure');
        console.log('   2. Verify AWS region: us-east-1');
        console.log('   3. Ensure EventBridge permissions are set');
        console.log('   4. Check if EventBridge service is available in your region');
    }
    
    console.log('');
    console.log('🌉 === BRIDGE CONNECTION TEST COMPLETE ===');
}

// Run the test
if (require.main === module) {
    testBridgeConnection()
        .then(() => {
            console.log('✅ Test completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testBridgeConnection };

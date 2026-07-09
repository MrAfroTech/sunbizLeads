# 📋 Event Structure Specification

## 🌉 Bridge Event: VendorOnboarded

This document specifies the exact event structure that **Point A** (Square OAuth Lambda) sends to EventBridge, and what **Point B** (Customer UI) should expect to receive.

---

## 📤 **Point A Sends (EventBridge Event)**

### **EventBridge Structure**
```json
{
  "EventBusName": "default",
  "Source": "seamless.vendor.onboarding",
  "DetailType": "VendorOnboarded",
  "Detail": "JSON_STRINGIFIED_DETAIL"
}
```

### **Event Detail (JSON Stringified)**
```json
{
  "eventType": "VendorOnboarded",
  "merchantId": "abc123def456",
  "vendorName": "Tasty Tacos Truck",
  "vendorEmail": "tasty@tacotruck.com",
  "vendorId": "vendor_789",
  "posSystem": "Square",
  "integrationStatus": "completed",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "posCredentials": {
    "merchantId": "abc123def456",
    "accessToken": "access_token_xyz789",
    "environment": "production"
  },
  "metadata": {
    "source": "Square OAuth Lambda",
    "version": "1.0",
    "environment": "production",
    "bridgePoint": "Point A - Vendor Onboarding Complete"
  }
}
```

---

## 📥 **Point B Receives (Customer UI Consumption)**

### **EventBridge Rule Pattern**
```json
{
  "source": ["seamless.vendor.onboarding"],
  "detail-type": ["VendorOnboarded"]
}
```

### **Parsed Event Detail (After JSON.parse)**
```json
{
  "eventType": "VendorOnboarded",
  "merchantId": "abc123def456",
  "vendorName": "Tasty Tacos Truck",
  "vendorEmail": "tasty@tacotruck.com",
  "vendorId": "vendor_789",
  "posSystem": "Square",
  "integrationStatus": "completed",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "posCredentials": {
    "merchantId": "abc123def456",
    "accessToken": "access_token_xyz789",
    "environment": "production"
  },
  "metadata": {
    "source": "Square OAuth Lambda",
    "version": "1.0",
    "environment": "production",
    "bridgePoint": "Point A - Vendor Onboarding Complete"
  }
}
```

---

## 🔍 **Field-by-Field Analysis**

### **Required EventBridge Fields**
| Field | Value | Description | Required |
|-------|-------|-------------|----------|
| `EventBusName` | `"default"` | AWS default event bus | ✅ Yes |
| `Source` | `"seamless.vendor.onboarding"` | Event source identifier | ✅ Yes |
| `DetailType` | `"VendorOnboarded"` | Event type for filtering | ✅ Yes |
| `Detail` | JSON string | Stringified vendor data | ✅ Yes |

### **Required Vendor Data Fields**
| Field | Type | Description | Required | Example |
|-------|------|-------------|----------|---------|
| `eventType` | String | Event type identifier | ✅ Yes | `"VendorOnboarded"` |
| `merchantId` | String | Square merchant ID | ✅ Yes | `"abc123def456"` |
| `vendorName` | String | Business name | ✅ Yes | `"Tasty Tacos Truck"` |
| `vendorEmail` | String | Contact email | ✅ Yes | `"tasty@tacotruck.com"` |
| `vendorId` | String | Internal vendor ID | ✅ Yes | `"vendor_789"` |
| `posSystem` | String | POS system type | ✅ Yes | `"Square"` |
| `integrationStatus` | String | Integration status | ✅ Yes | `"completed"` |
| `timestamp` | String | ISO 8601 timestamp | ✅ Yes | `"2024-01-15T10:30:00.000Z"` |

### **Required POS Credentials Fields**
| Field | Type | Description | Required | Example |
|-------|------|-------------|----------|---------|
| `posCredentials.merchantId` | String | Square merchant ID | ✅ Yes | `"abc123def456"` |
| `posCredentials.accessToken` | String | Square access token | ✅ Yes | `"access_token_xyz789"` |
| `posCredentials.environment` | String | Square environment | ✅ Yes | `"production"` |

### **Required Metadata Fields**
| Field | Type | Description | Required | Example |
|-------|------|-------------|----------|---------|
| `metadata.source` | String | Source system | ✅ Yes | `"Square OAuth Lambda"` |
| `metadata.version` | String | API version | ✅ Yes | `"1.0"` |
| `metadata.environment` | String | Environment | ✅ Yes | `"production"` |
| `metadata.bridgePoint` | String | Bridge location | ✅ Yes | `"Point A - Vendor Onboarding Complete"` |

---

## 🚦 **Event Flow**

### **1. Point A (Square OAuth Lambda)**
- ✅ OAuth callback succeeds
- ✅ Vendor data extracted from session
- ✅ Event payload constructed
- ✅ Event published to EventBridge
- ✅ Event ID generated and logged

### **2. EventBridge (Bridge)**
- ✅ Event received and stored
- ✅ Event available for consumption
- ✅ Event rules can be applied
- ✅ Event routing to targets

### **3. Point B (Customer UI)**
- ✅ Event consumed via EventBridge rules
- ✅ Vendor data parsed and validated
- ✅ Customer UI updated with vendor info
- ✅ Real-time vendor availability

---

## 🔧 **Point B Implementation Guide**

### **EventBridge Rule Creation**
```bash
aws events put-rule \
  --name "VendorOnboardedRule" \
  --event-pattern '{"source":["seamless.vendor.onboarding"],"detail-type":["VendorOnboarded"]}' \
  --state ENABLED
```

### **Lambda Function Handler**
```javascript
exports.handler = async (event) => {
  console.log('Received vendor onboarding event:', JSON.stringify(event, null, 2));
  
  // Parse the event detail
  const vendorData = JSON.parse(event.detail);
  
  // Extract vendor information
  const {
    merchantId,
    vendorName,
    vendorEmail,
    vendorId,
    posSystem,
    integrationStatus,
    timestamp,
    posCredentials,
    metadata
  } = vendorData;
  
  // Update customer UI with vendor data
  // ... implementation details ...
  
  return { statusCode: 200, body: 'Vendor data processed' };
};
```

### **Event Validation**
```javascript
function validateVendorEvent(event) {
  const requiredFields = [
    'eventType', 'merchantId', 'vendorName', 'vendorEmail',
    'vendorId', 'posSystem', 'integrationStatus', 'timestamp'
  ];
  
  const detail = JSON.parse(event.detail);
  
  for (const field of requiredFields) {
    if (!detail[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  return detail;
}
```

---

## 📊 **Event Examples**

### **Production Event**
```json
{
  "version": "0",
  "id": "486b136c-fb7c-bf8b-e91a-b30e918fa456",
  "detail-type": "VendorOnboarded",
  "source": "seamless.vendor.onboarding",
  "account": "123456789012",
  "time": "2024-01-15T10:30:00Z",
  "region": "us-east-1",
  "detail": {
    "eventType": "VendorOnboarded",
    "merchantId": "MLYFDRXCAQ1V8",
    "vendorName": "Downtown Coffee Co",
    "vendorEmail": "coffee@downtown.com",
    "vendorId": "vendor_coffee_001",
    "posSystem": "Square",
    "integrationStatus": "completed",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "posCredentials": {
      "merchantId": "MLYFDRXCAQ1V8",
      "accessToken": "EAAAEO...",
      "environment": "production"
    },
    "metadata": {
      "source": "Square OAuth Lambda",
      "version": "1.0",
      "environment": "production",
      "bridgePoint": "Point A - Vendor Onboarding Complete"
    }
  }
}
```

---

## ✅ **Validation Checklist**

### **Point A Validation**
- [ ] All required EventBridge fields present
- [ ] All required vendor data fields present
- [ ] All required POS credentials fields present
- [ ] All required metadata fields present
- [ ] Event successfully published to EventBridge
- [ ] Event ID generated and logged

### **Point B Validation**
- [ ] EventBridge rule configured correctly
- [ ] Event consumed successfully
- [ ] Event detail parsed correctly
- [ ] All required fields validated
- [ ] Vendor data processed and stored
- [ ] Customer UI updated with vendor info

---

## 🎯 **Summary**

**Point A** sends a complete, validated vendor onboarding event to EventBridge with:
- ✅ **EventBridge Structure**: Proper source, detail-type, and detail
- ✅ **Vendor Data**: Complete vendor profile with all required fields
- ✅ **POS Credentials**: Square integration details for API access
- ✅ **Metadata**: Source tracking and bridge point identification

**Point B** receives a ready-to-use vendor event that can be:
- ✅ **Consumed**: Via EventBridge rules and targets
- ✅ **Parsed**: JSON detail with complete vendor information
- ✅ **Validated**: All required fields present and correct
- ✅ **Processed**: Ready for customer UI updates

This event structure ensures reliable data flow from vendor onboarding to customer availability. 🚀

# 🚀 Customer UI Integration Guide
## EzDrink Vendor-to-Customer Bridge

**Version:** 1.0  
**Date:** December 2024  
**Team:** Customer UI Development Team  

---

## 📋 **Overview**

This guide provides complete implementation instructions for integrating the Customer UI with the EzDrink vendor management system. Once implemented, your Customer UI will:

- ✅ Display real-time vendor availability
- ✅ Show Square-connected restaurants
- ✅ Receive instant updates when vendors change status
- ✅ Handle vendor additions/removals seamlessly

---

## 🏗️ **Architecture Overview**

```
Customer UI ←→ WebSocket API ←→ AWS Lambda ←→ DynamoDB
     ↓              ↓              ↓           ↓
Display Vendors  Real-time     Process      Store Vendor
                 Updates       Events       Data
```

---

## 🔧 **Phase 1: AWS Infrastructure Setup**

### **Prerequisites**
- AWS CLI installed and configured
- Node.js 18+ installed
- Access to AWS account

### **Setup Steps**

1. **Clone the Vendor UI repository** (if you haven't already)
2. **Navigate to the lambda-square directory**
3. **Run the infrastructure setup script:**

```bash
cd lambda-square
./setup-aws-infrastructure.sh
```

4. **Deploy the Lambda functions:**

```bash
./deploy-lambda-functions.sh
```

5. **Copy the generated environment variables** from `.env.aws` to your Customer UI project

---

## 📡 **Phase 2: WebSocket Integration**

### **WebSocket Connection Setup**

```javascript
// vendor-websocket-service.js
class VendorWebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.eventHandlers = new Map();
  }

  connect() {
    try {
      const wsEndpoint = process.env.REACT_APP_WEBSOCKET_ENDPOINT;
      this.ws = new WebSocket(wsEndpoint);

      this.ws.onopen = () => {
        console.log('✅ Connected to EzDrink WebSocket');
        this.reconnectAttempts = 0;
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('❌ WebSocket connection closed');
        this.emit('disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.scheduleReconnect();
    }
  }

  handleMessage(data) {
    const { type, vendor, timestamp } = data;
    
    switch (type) {
      case 'VENDOR_ADDED':
        this.emit('vendorAdded', vendor);
        break;
      case 'VENDOR_STATUS_CHANGED':
        this.emit('vendorStatusChanged', vendor);
        break;
      case 'VENDOR_UPDATED':
        this.emit('vendorUpdated', vendor);
        break;
      default:
        console.log('Unknown message type:', type);
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
    }
  }

  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => handler(data));
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default VendorWebSocketService;
```

### **Integration in Your React App**

```javascript
// App.js or main component
import VendorWebSocketService from './services/vendor-websocket-service';

function App() {
  const [vendors, setVendors] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    const wsService = new VendorWebSocketService();

    // Handle vendor events
    wsService.on('vendorAdded', (vendor) => {
      setVendors(prev => [...prev, vendor]);
    });

    wsService.on('vendorStatusChanged', (vendor) => {
      setVendors(prev => prev.map(v => 
        v.merchantId === vendor.merchantId 
          ? { ...v, status: vendor.status }
          : v
      ));
    });

    wsService.on('vendorUpdated', (vendor) => {
      setVendors(prev => prev.map(v => 
        v.merchantId === vendor.merchantId 
          ? { ...v, ...vendor }
          : v
      ));
    });

    // Handle connection events
    wsService.on('connected', () => setWsConnected(true));
    wsService.on('disconnected', () => setWsConnected(false));

    // Connect to WebSocket
    wsService.connect();

    // Cleanup on unmount
    return () => {
      wsService.disconnect();
    };
  }, []);

  return (
    <div>
      <div className="connection-status">
        {wsConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
      
      <VendorList vendors={vendors} />
    </div>
  );
}
```

---

## 🍽️ **Phase 3: Vendor Display Components**

### **Vendor List Component**

```javascript
// components/VendorList.js
import React from 'react';
import './VendorList.css';

const VendorList = ({ vendors }) => {
  const activeVendors = vendors.filter(vendor => vendor.status === 'active');

  if (activeVendors.length === 0) {
    return (
      <div className="no-vendors">
        <h3>No vendors available at the moment</h3>
        <p>Check back later for available restaurants!</p>
      </div>
    );
  }

  return (
    <div className="vendor-list">
      <h2>Available Restaurants ({activeVendors.length})</h2>
      
      <div className="vendor-grid">
        {activeVendors.map(vendor => (
          <VendorCard key={vendor.merchantId} vendor={vendor} />
        ))}
      </div>
    </div>
  );
};

const VendorCard = ({ vendor }) => {
  const { merchantId, businessName, posSystem, lastUpdated } = vendor;

  return (
    <div className="vendor-card">
      <div className="vendor-header">
        <h3>{businessName}</h3>
        <span className="pos-badge">{posSystem}</span>
      </div>
      
      <div className="vendor-details">
        <p><strong>ID:</strong> {merchantId}</p>
        <p><strong>Last Updated:</strong> {new Date(lastUpdated).toLocaleString()}</p>
      </div>
      
      <div className="vendor-actions">
        <button className="btn-primary">View Menu</button>
        <button className="btn-secondary">Place Order</button>
      </div>
    </div>
  );
};

export default VendorList;
```

### **CSS Styling**

```css
/* VendorList.css */
.vendor-list {
  padding: 20px;
}

.vendor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.vendor-card {
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.vendor-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.vendor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.vendor-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.pos-badge {
  background: #3498db;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.vendor-details {
  margin-bottom: 20px;
}

.vendor-details p {
  margin: 5px 0;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.vendor-actions {
  display: flex;
  gap: 10px;
}

.btn-primary, .btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}

.btn-primary {
  background: #27ae60;
  color: white;
}

.btn-primary:hover {
  background: #229954;
}

.btn-secondary {
  background: #ecf0f1;
  color: #2c3e50;
}

.btn-secondary:hover {
  background: #d5dbdb;
}

.no-vendors {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}

.connection-status {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 10px 15px;
  border-radius: 20px;
  font-weight: bold;
  z-index: 1000;
}
```

---

## 🔌 **Phase 4: REST API Integration (Optional)**

### **Fetch Active Vendors on Page Load**

```javascript
// services/vendor-api-service.js
class VendorApiService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_VENDOR_LAMBDA_URL;
  }

  async getActiveVendors() {
    try {
      const response = await fetch(`${this.baseUrl}/vendors/active`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.vendors;
    } catch (error) {
      console.error('Failed to fetch active vendors:', error);
      throw error;
    }
  }
}

export default VendorApiService;
```

### **Use in Component**

```javascript
// In your main component
useEffect(() => {
  const loadInitialVendors = async () => {
    try {
      const vendorService = new VendorApiService();
      const initialVendors = await vendorService.getActiveVendors();
      setVendors(initialVendors);
    } catch (error) {
      console.error('Failed to load initial vendors:', error);
      // Fallback to empty array - WebSocket will populate
    }
  };

  loadInitialVendors();
}, []);
```

---

## 🧪 **Phase 5: Testing & Validation**

### **Testing Checklist**

- [ ] WebSocket connects successfully
- [ ] Vendor events are received in real-time
- [ ] UI updates when vendors are added/removed
- [ ] UI updates when vendor status changes
- [ ] Reconnection works after disconnection
- [ ] Fallback to REST API works if WebSocket fails
- [ ] Error handling works gracefully

### **Test Data**

```javascript
// Test vendor data for development
const testVendors = [
  {
    merchantId: 'test-merchant-1',
    businessName: 'Test Restaurant 1',
    status: 'active',
    posSystem: 'square',
    lastUpdated: new Date().toISOString()
  },
  {
    merchantId: 'test-merchant-2',
    businessName: 'Test Restaurant 2',
    status: 'inactive',
    posSystem: 'square',
    lastUpdated: new Date().toISOString()
  }
];
```

### **Testing Commands**

```bash
# Test WebSocket connection
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test123" \
  "wss://your-websocket-endpoint"

# Test REST API
curl -X GET "https://your-rest-api-endpoint/vendors/active"
```

---

## 🚨 **Error Handling & Fallbacks**

### **WebSocket Disconnection Handling**

```javascript
// Automatic fallback to REST API
useEffect(() => {
  let interval;
  
  if (!wsConnected) {
    // Poll REST API every 30 seconds when WebSocket is down
    interval = setInterval(async () => {
      try {
        const vendorService = new VendorApiService();
        const vendors = await vendorService.getActiveVendors();
        setVendors(vendors);
      } catch (error) {
        console.error('Fallback API call failed:', error);
      }
    }, 30000);
  }

  return () => {
    if (interval) clearInterval(interval);
  };
}, [wsConnected]);
```

### **Error Boundaries**

```javascript
// components/ErrorBoundary.js
class VendorErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Vendor system error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong with the vendor system</h2>
          <p>Please refresh the page or try again later.</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 📱 **Phase 6: Mobile & Responsive Design**

### **Responsive Grid**

```css
/* Mobile-first responsive design */
.vendor-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
  margin-top: 15px;
}

@media (min-width: 768px) {
  .vendor-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-top: 20px;
  }
}

@media (min-width: 1024px) {
  .vendor-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 25px;
  }
}

@media (min-width: 1440px) {
  .vendor-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## 🔒 **Security Considerations**

### **API Key Management**

```javascript
// Store API keys securely
const API_KEYS = {
  vendor: process.env.REACT_APP_VENDOR_API_KEY,
  websocket: process.env.REACT_APP_WEBSOCKET_API_KEY
};

// Add to request headers
const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': API_KEYS.vendor
};
```

### **Input Validation**

```javascript
// Validate vendor data before processing
const validateVendor = (vendor) => {
  const required = ['merchantId', 'businessName', 'status'];
  const missing = required.filter(field => !vendor[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  if (!['active', 'inactive'].includes(vendor.status)) {
    throw new Error('Invalid vendor status');
  }
  
  return true;
};
```

---

## 📊 **Monitoring & Analytics**

### **Connection Metrics**

```javascript
// Track WebSocket performance
const metrics = {
  connectionTime: 0,
  messagesReceived: 0,
  reconnectionAttempts: 0,
  errors: 0
};

// Send metrics to your analytics service
const sendMetrics = () => {
  analytics.track('websocket_performance', metrics);
};
```

---

## 🚀 **Deployment Checklist**

### **Pre-Deployment**
- [ ] All environment variables configured
- [ ] WebSocket endpoint tested
- [ ] REST API endpoints tested
- [ ] Error handling implemented
- [ ] Mobile responsive design verified
- [ ] Performance testing completed

### **Post-Deployment**
- [ ] Monitor WebSocket connections
- [ ] Check vendor data flow
- [ ] Verify real-time updates
- [ ] Monitor error rates
- [ ] Test with real vendor data

---

## 📞 **Support & Troubleshooting**

### **Common Issues**

1. **WebSocket Connection Fails**
   - Check endpoint URL
   - Verify CORS settings
   - Check network connectivity

2. **Vendors Not Displaying**
   - Check WebSocket connection status
   - Verify vendor data format
   - Check browser console for errors

3. **Real-time Updates Not Working**
   - Verify WebSocket is connected
   - Check event handler registration
   - Verify vendor status changes

### **Contact Information**

- **Technical Support:** [Your Support Email]
- **Documentation:** [Your Docs URL]
- **GitHub Issues:** [Your Repo URL]

---

## 🎯 **Success Metrics**

- ✅ WebSocket connection success rate > 99%
- ✅ Real-time vendor updates < 1 second
- ✅ Page load time < 2 seconds
- ✅ Mobile performance score > 90
- ✅ Error rate < 1%

---

## 📝 **Next Steps**

1. **Review this guide** with your development team
2. **Set up AWS infrastructure** using the provided scripts
3. **Implement WebSocket integration** following the code examples
4. **Test thoroughly** with the provided test procedures
5. **Deploy to staging** and validate functionality
6. **Go live** with real vendor data

---

**🎉 Congratulations! You're now ready to build the Customer UI that will display real-time vendor availability from the EzDrink platform.**

**Need help?** Refer to the troubleshooting section or contact the technical support team.

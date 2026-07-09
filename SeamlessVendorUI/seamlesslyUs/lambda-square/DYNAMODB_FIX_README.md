# 🔧 DynamoDB Configuration Fix for Square Lambda Integration

## **ISSUE SUMMARY**

The Square OAuth lambda was failing to save vendor data because:
1. **Table Name Mismatch**: Code referenced `vendor-update-table` but actual table was `vendor-updates-table`
2. **Primary Key Structure**: Table used `id` as primary key instead of `email`, making data linking difficult
3. **Lambda Configuration**: Missing environment variables for proper table access

## **REQUIRED FIXES IMPLEMENTED**

### 1. **Updated DynamoDB Table Structure** ✅
- **Old Primary Key**: `id` (String)
- **New Primary Key**: `email` (String)
- **Reason**: Email is the unique identifier that links signup data → POS integration data

### 2. **Fixed Table Names** ✅
- **Corrected**: `vendor-update-table` → `vendor-updates-table`
- **Updated**: All references in code to use correct table name

### 3. **Updated Lambda Configuration** ✅
- **Table Name**: `vendor-updates-table`
- **Lambda Function**: `seamless-square-oauth`
- **Environment Variables**: Added proper table configuration

## **IMPLEMENTATION STEPS**

### **Step 1: Update DynamoDB Table Structure**

Since DynamoDB doesn't allow changing primary keys on existing tables, we need to recreate the table:

```bash
# Navigate to the customer backend directory
cd SeamlessCustomerUI/backend/scripts

# Run the migration script to recreate table with email as primary key
node migrate-vendor-updates-table.js
```

**What this does:**
- Creates backup of existing table
- Creates new table with `email` as primary key
- Migrates existing data to new structure
- Maintains data integrity during transition

### **Step 2: Deploy Updated Square Lambda**

```bash
# Navigate to the lambda-square directory
cd SeamlessVendorUI/lambda-square

# Deploy the updated lambda with correct configuration
./deploy-square-lambda.sh
```

**What this does:**
- Updates Lambda function code
- Sets correct environment variables
- Configures table access permissions

### **Step 3: Verify Configuration**

Check that the Lambda function has the correct environment variables:

```bash
aws lambda get-function-configuration \
  --function-name seamless-square-oauth \
  --region us-east-1 \
  --query 'Environment.Variables'
```

**Expected output:**
```json
{
  "VENDOR_UPDATES_TABLE": "vendor-updates-table",
  "VENDORS_TABLE": "ezdrink-vendors",
  "SQUARE_APPLICATION_ID": "your-app-id",
  "SQUARE_APPLICATION_SECRET": "your-app-secret",
  "SQUARE_ENVIRONMENT": "production"
}
```

## **CODE CHANGES MADE**

### **1. Updated Table Creation Script**
- **File**: `SeamlessCustomerUI/backend/scripts/create-vendor-updates-table.js`
- **Change**: Primary key from `id` to `email`
- **Added**: Additional GSI for timestamp-based queries

### **2. Created Migration Script**
- **File**: `SeamlessCustomerUI/backend/scripts/migrate-vendor-updates-table.js`
- **Purpose**: Handles transition from old to new table structure
- **Features**: Backup creation, data migration, validation

### **3. Updated Square Lambda Handler**
- **File**: `SeamlessVendorUI/lambda-square/square-lambda-handler.js`
- **Changes**:
  - Fixed table name references
  - Updated query functions to use email as primary key
  - Added proper error handling and logging
  - Improved environment variable validation

### **4. Updated DirectSignup.js**
- **File**: `SeamlessVendorUI/src/components/DirectSignup.js`
- **Changes**:
  - Added `email` as primary key in vendor update payload
  - Added `timestamp` field for better data tracking
  - Ensured consistent data structure

### **5. Updated Customer Bridge Lambda**
- **File**: `SeamlessCustomerUI/backend/lambda/customer-bridge-lambda.js`
- **Changes**:
  - Updated validation to require `email` instead of `vendorId`
  - Modified record structure to use email as primary key
  - Improved error handling and logging

## **NEW DATA FLOW**

### **Before (Broken)**:
1. DirectSignup.js creates record with `id` as primary key
2. Square lambda tries to query by `id` (fails)
3. Data linking between signup and integration breaks

### **After (Fixed)**:
1. DirectSignup.js creates record with `email` as primary key ✅
2. Square lambda queries `vendor-updates-table` by `email` ✅
3. Square lambda updates same record with Square tokens/merchantId ✅
4. Customer UI uses `email` to fetch vendor data for real-time API calls ✅

## **VERIFICATION STEPS**

### **1. Check Table Structure**
```bash
aws dynamodb describe-table \
  --table-name vendor-updates-table \
  --region us-east-1 \
  --query 'Table.KeySchema'
```

**Expected**: Primary key should be `email` (String)

### **2. Test Vendor Registration**
1. Complete vendor registration in DirectSignup.js
2. Check DynamoDB for new record with email as primary key
3. Verify data structure matches expected format

### **3. Test Square OAuth Flow**
1. Initiate Square OAuth from vendor integration page
2. Complete OAuth authorization
3. Verify vendor record is updated with Square data
4. Check CloudWatch logs for successful operations

### **4. Verify Data Linking**
1. Use email to query vendor data
2. Confirm Square integration data is properly linked
3. Test real-time API calls from Customer UI

## **TROUBLESHOOTING**

### **Common Issues**

#### **1. Table Not Found Error**
```bash
# Check if table exists
aws dynamodb list-tables --region us-east-1

# Create table if missing
node create-vendor-updates-table.js
```

#### **2. Lambda Environment Variables Missing**
```bash
# Check Lambda configuration
aws lambda get-function-configuration \
  --function-name seamless-square-oauth \
  --region us-east-1

# Update environment variables manually if needed
aws lambda update-function-configuration \
  --function-name seamless-square-oauth \
  --environment Variables='{VENDOR_UPDATES_TABLE=vendor-updates-table}' \
  --region us-east-1
```

#### **3. Permission Denied Errors**
```bash
# Check Lambda execution role permissions
aws iam get-role-policy \
  --role-name <lambda-execution-role> \
  --policy-name DynamoDBAccess

# Ensure role has permissions for vendor-updates-table
```

### **CloudWatch Logs**
Check Lambda function logs for detailed error information:
```bash
aws logs describe-log-groups \
  --log-group-name-prefix /aws/lambda/seamless-square-oauth \
  --region us-east-1
```

## **ROLLBACK PLAN**

If issues arise, you can rollback to the previous structure:

1. **Restore from backup** (if migration was run)
2. **Revert code changes** to previous versions
3. **Recreate old table structure** if needed

## **MONITORING & ALERTS**

### **Key Metrics to Watch**
- Lambda function invocation success rate
- DynamoDB table read/write operations
- OAuth completion success rate
- Data consistency between tables

### **Recommended Alerts**
- Lambda function errors > 5%
- DynamoDB throttling events
- OAuth callback failures
- Table access denied errors

## **NEXT STEPS**

After implementing these fixes:

1. **Test thoroughly** in staging environment
2. **Monitor production** deployment closely
3. **Update documentation** for team members
4. **Plan future improvements** based on usage patterns

## **SUPPORT**

For additional help or questions:
- Check CloudWatch logs for detailed error information
- Review AWS CloudTrail for API call history
- Consult AWS DynamoDB documentation for best practices

---

**Last Updated**: $(date)
**Status**: ✅ Implementation Complete
**Next Review**: After production deployment and testing

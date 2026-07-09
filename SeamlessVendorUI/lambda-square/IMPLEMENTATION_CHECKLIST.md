# 🚀 Implementation Checklist for DynamoDB Fix

## **IMMEDIATE ACTIONS REQUIRED**

### **Phase 1: Database Migration** ⚠️ CRITICAL
- [ ] **Run migration script** to update table structure
  ```bash
  cd SeamlessCustomerUI/backend/scripts
  node migrate-vendor-updates-table.js
  ```
- [ ] **Verify table structure** uses email as primary key
- [ ] **Check data migration** completed successfully

### **Phase 2: Lambda Deployment** ⚠️ CRITICAL
- [ ] **Deploy updated Square Lambda**
  ```bash
  cd SeamlessVendorUI/lambda-square
  ./deploy-square-lambda.sh
  ```
- [ ] **Verify environment variables** are set correctly
- [ ] **Test Lambda function** responds to requests

### **Phase 3: Frontend Updates** ✅ COMPLETED
- [x] **DirectSignup.js** updated to use email as primary key
- [x] **Customer Bridge Lambda** updated for new structure
- [x] **Square Lambda Handler** updated for new table structure

## **VERIFICATION STEPS**

### **Database Verification**
- [ ] Table `vendor-updates-table` exists
- [ ] Primary key is `email` (String)
- [ ] GSIs are properly configured
- [ ] Existing data migrated successfully

### **Lambda Verification**
- [ ] Function `seamless-square-oauth` exists
- [ ] Environment variable `VENDOR_UPDATES_TABLE=vendor-updates-table`
- [ ] Function can read/write to DynamoDB table
- [ ] CloudWatch logs show successful operations

### **Integration Testing**
- [ ] Vendor registration creates record with email as primary key
- [ ] Square OAuth flow completes successfully
- [ ] Vendor data is properly linked between signup and integration
- [ ] Customer UI can fetch vendor data using email

## **ROLLBACK PLAN**

If issues arise:
1. **Stop deployment** immediately
2. **Restore from backup** (if migration was run)
3. **Revert code changes** to previous versions
4. **Investigate root cause** before retrying

## **SUCCESS CRITERIA**

- [ ] ✅ Vendor registration works without errors
- [ ] ✅ Square OAuth completes successfully
- [ ] ✅ Vendor data saves to correct table
- [ ] ✅ Email-based lookup works for linking signup → integration
- [ ] ✅ No data loss during migration
- [ ] ✅ All existing functionality preserved

## **TIMELINE**

- **Phase 1**: 15-30 minutes (Database migration)
- **Phase 2**: 10-15 minutes (Lambda deployment)
- **Phase 3**: ✅ Already completed (Code updates)
- **Testing**: 30-60 minutes (Verification)
- **Total**: 1-2 hours

## **RISK ASSESSMENT**

- **LOW RISK**: Code changes are additive and don't break existing functionality
- **MEDIUM RISK**: Database migration requires careful execution
- **MITIGATION**: Backup creation, rollback plan, thorough testing

## **TEAM RESPONSIBILITIES**

- **DevOps**: Run migration script, deploy Lambda
- **Backend**: Verify data integrity, test integrations
- **Frontend**: Test vendor registration flow
- **QA**: End-to-end testing of complete flow

---

**Status**: Ready for Implementation
**Priority**: HIGH - Foundation for vendor integration system
**Dependencies**: AWS CLI configured, proper permissions

# 🚀 Klaviyo Setup Roadmap - Event Series Architecture

## ✅ Code Changes Complete

**Added `eventSlug` to payload:**
- Auto-generated from `eventName` + `eventDate`
- Format: `cassava_harvest_2026_01_03`
- Included in all Klaviyo events

**Slug Generation:**
```javascript
const eventSlug = `${eventName.toLowerCase().replace(/\s+/g, '_')}_${eventDate.replace(/-/g, '_')}`;
```

---

## 📋 Klaviyo Setup Steps

### **Step 1: Create Master Flow Template**

1. **Klaviyo Dashboard** → **Flows** → **Create Flow**
2. **Name:** `Event Ticket Confirmation – MASTER`
3. **Type:** Event-triggered

### **Step 2: Set Trigger**

1. Click **"Start"** or **"Add Trigger"**
2. Select **"Event"** trigger
3. **Metric:** `Ticket Purchased`
4. **Flow Filter:** 
   - Property: `eventSlug`
   - Condition: `equals`
   - Value: `cassava_harvest_2026_01_03`
   - *(This will be changed per cloned flow)*

### **Step 3: Build Email Template**

**Add Email Step:**
- Click **"Add Step"** → **"Send Email"**
- Click email step to edit

**Email Settings:**
- **Subject:** `Your {{ eventName }} Tickets - {{ eventDate }}`
- **From Name:** "Farmer Banks"
- **From Email:** Your verified sender

**Available Properties:**
- `{{ eventSlug }}` - **NEW** - For flow filtering
- `{{ eventName }}` - Event name
- `{{ eventDate }}` - Event date
- `{{ eventTime }}` - Event time
- `{{ eventVenue }}` - Venue
- `{{ organizerName }}` - Organizer
- `{{ transactionId }}` - Transaction ID
- `{{ ticketCount }}` - Number of tickets
- `{{ ticketNumber }}` - Ticket number (1, 2, 3...)
- `{{ tier }}` - Ticket tier
- `{{ amount }}` - Amount paid
- `{{ qrCodeUrl }}` - QR code (base64 data URL)
- `{{ purchaseDate }}` - Purchase date
- `{{ customerName }}` - Customer name

**Add QR Code:**
1. Add **Image** block in email editor
2. Image source: `{{ qrCodeUrl }}`
3. Width: 300px
4. Alt text: "Ticket QR Code"

**Note:** `qrCodeUrl` is base64, works directly: `<img src="{{ qrCodeUrl }}" width="300">`

### **Step 4: Apply Transactional Status**

1. In email step → **Settings**
2. Find **"Email Type"** or **"Transactional"**
3. Click **"Apply for Transactional Status"**
4. Fill form:
   - Type: Transactional
   - Reason: "Order/ticket confirmation email"
   - Frequency: Per transaction
5. Submit (approval ~24 hours)

**Important:** Transactional emails bypass unsubscribe lists

### **Step 5: Test Master Flow**

1. Click **"Send Test"** in Flow builder
2. Use test email address
3. Verify:
   - ✅ Email received
   - ✅ All properties display correctly
   - ✅ QR code displays
   - ✅ Formatting looks good
   - ✅ `eventSlug` property is present

### **Step 6: Clone Flow for Each Event**

**For each new event (monthly):**

1. **Duplicate** the master flow
2. **Rename:** `Event Ticket Confirmation – [Event Name] [Date]`
   - Example: `Event Ticket Confirmation – Goat Yoga Feb 2026`
3. **Change Flow Filter:**
   - Property: `eventSlug`
   - Condition: `equals`
   - Value: `[new_event_slug]`
     - Example: `goat_yoga_2026_02_12`
4. **Activate** the flow
5. **Done** - No template edits needed

**Example Flow Filters:**
- `cassava_harvest_2026_01_03`
- `goat_yoga_2026_02_12`
- `spring_festival_2026_03_15`
- `summer_harvest_2026_06_20`

### **Step 7: Activate Flows**

1. Each event flow should be **Activated** when ready
2. Flows will automatically trigger when `Ticket Purchased` events are sent with matching `eventSlug`

---

## 🎯 Event Slug Examples

**Generated automatically from:**
- `eventName`: "Cassava Harvest"
- `eventDate`: "2026-01-03"
- **Result:** `cassava_harvest_2026_01_03`

**More examples:**
- "Goat Yoga" + "2026-02-12" → `goat_yoga_2026_02_12`
- "Spring Festival" + "2026-03-15" → `spring_festival_2026_03_15`
- "Summer Harvest Special" + "2026-06-20" → `summer_harvest_special_2026_06_20`

---

## ✅ Verification Checklist

**After setup:**
- [ ] Master flow created
- [ ] Trigger: "Ticket Purchased" event
- [ ] Flow filter: `eventSlug equals "cassava_harvest_2026_01_03"`
- [ ] Email template includes all properties
- [ ] QR code image displays correctly
- [ ] Transactional status applied
- [ ] Test email received successfully
- [ ] First event flow cloned and activated

**For each new event:**
- [ ] Flow cloned from master
- [ ] Flow filter updated with new `eventSlug`
- [ ] Flow activated
- [ ] Test purchase confirms email delivery

---

## 🔧 Troubleshooting

**Event not triggering:**
- Check `eventSlug` in Klaviyo Metrics → "Ticket Purchased" events
- Verify Flow filter matches exact slug (case-sensitive)
- Check Vercel logs for webhook errors

**Email not sending:**
- Verify Flow is activated
- Check Flow filter matches event slug exactly
- Verify transactional status is approved
- Check email didn't go to spam

**QR code not displaying:**
- Verify `qrCodeUrl` property in email template
- Check image tag syntax: `<img src="{{ qrCodeUrl }}" width="300">`
- Test with direct base64 data URL

**Properties not displaying:**
- Verify property names match exactly (case-sensitive)
- Check event data in Klaviyo Metrics
- Use Klaviyo preview/test feature

---

## 📊 Architecture Benefits

✅ **Scalable:** One master template, clone per event  
✅ **Maintainable:** Update master, clone new flows  
✅ **Organized:** Each event has its own flow  
✅ **Automated:** Slug generated automatically  
✅ **Future-proof:** Works for 12-16 events per year  
✅ **Zero maintenance:** Beyond cloning flows  

---

## 🚀 Next Steps

1. ✅ Code updated with `eventSlug` generation
2. ⏳ Create master flow in Klaviyo
3. ⏳ Test master flow
4. ⏳ Clone flow for first event
5. ⏳ Make test purchase
6. ⏳ Verify email delivery
7. 🎉 Go live!

---

**Ready to deploy?** The code is updated. Follow steps 1-7 above to complete Klaviyo setup.


# CONTRACT SYSTEM - STEP-BY-STEP TESTING GUIDE

## 📍 TEST IN 5 STEPS (30 minutes)

### STEP 1: Apply SQL Migration (5 minutes)

1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Create NEW Query
4. Copy ALL content from: **supabase-setup-contracts.sql**
5. Paste into query window
6. Click blue **RUN** button
7. Wait for success message ✓

**Verification:**
- Go to **Table Editor**
- You should see 3 new tables:
  - ✅ contracts
  - ✅ contract_signatories
  - ✅ contract_versions

---

### STEP 2: Prepare Test Data (5 minutes)

**You need:**
- 1 CLIENT user (can be you)
- 1+ SUPPLIER or PROFESSIONAL user (test account)

**If you don't have test accounts:**
1. Sign up as new user with different email
2. Go to User Management (admin panel)
3. Change role to 'supplier' or 'pro'

---

### STEP 3: Create & Approve Bids (10 minutes)

**As CLIENT User:**

1. Navigate to **Tender Creation** page
2. Create NEW tender with title: "Test Tender for Contracts"
3. Set required_roles: ['supplier'] or ['pro']
4. Set budget: 50000
5. Click "Publish Tender"
6. Copy tender ID from URL or details page

**As SUPPLIER/PRO User (or submit from another browser/incognito):**

1. Navigate to **Tenders** page
2. Find "Test Tender for Contracts"
3. Fill bid form:
   - Bid Amount: 45000
   - Add any documents
4. Click "Submit Bid"
5. Repeat (submit 2nd bid from different supplier)

**Back as CLIENT User:**

1. Navigate to **Tender → View Bids**
2. Should see 2 bids in table
3. Click green ✅ **Approve** button for BOTH bids
4. Each bid status → "approved"

---

### STEP 4: Test Contract Generation (10 minutes)

**As CLIENT User (on TenderBids page):**

1. See button: **"Close Tender & Finalize Team"**
2. Click it
3. See confirmation dialog
4. Click "Proceed"

**Expected: ContractDraftModal appears with 3 tabs**

Tab 1 - **PREVIEW:**
- ✅ See HTML contract with:
  - Header: "SERVICE AGREEMENT CONTRACT"
  - Parties: Client + 2 bidders with amounts
  - Tender Details section
  - T&C section
  - Declarations & Forms section (per bidder)
- ✅ "Edit Fields" button
- ✅ "Download HTML" button

Tab 2 - **EDIT:**
- ✅ Can scroll through editable HTML
- ✅ See form fields (Name, Position, Company, etc.)
- ✅ "Save Changes" button (creates Version 2)
- ✅ Draft Versions list showing v1, v2, etc.

Tab 3 - **CONFIRM:**
- ✅ Orange warning: "Once sent..."
- ✅ List of signatories:
  - Your email (Client)
  - Bidder 1 email + amount
  - Bidder 2 email + amount
- ✅ "Send Contract to Signatories" button
- ✅ "Discard Draft" button

---

### STEP 5: Send & Track (10 minutes)

**On Confirm tab:**

1. Click **"Send Contract to Signatories"**
2. See success toast: "Contract sent to 3 signatories"
3. Modal closes

**Expected After Sending:**
- Tender closes (status = closed)
- Non-approved bids get rejected
- Bidders get notifications

**Verify in Database:**

Open Supabase SQL Editor and run:

`sql
SELECT * FROM contracts ORDER BY created_at DESC LIMIT 1;
`

You should see:
- ✅ status = 'sent'
- ✅ contract_number = 'CTR-20260303-001' (or similar)
- ✅ sent_at = TODAY's date/time

`sql
SELECT signatory_email, signatory_type, signing_status 
FROM contract_signatories 
WHERE signatory_email IN ('your_email', 'bidder1_email', 'bidder2_email');
`

You should see:
- ✅ 3 rows (1 client + 2 bidders)
- ✅ signatory_type = 'client' or 'bidder'
- ✅ signing_status = 'pending' (currently)

---

## ✅ TESTING CHECKLIST

- [ ] SQL migration runs successfully
- [ ] 3 new tables visible in Supabase
- [ ] Can create tender and approve 2+ bids
- [ ] "Close Tender & Finalize Team" button visible
- [ ] ContractDraftModal appears
- [ ] Can see all 3 tabs (Preview, Edit, Confirm)
- [ ] Contract HTML generated with correct details
- [ ] Can save draft (creates new version)
- [ ] Can send contract
- [ ] Success toast appears
- [ ] Contract record in database (status='sent')
- [ ] Signatory records created (3 total)

---

## 🐛 TROUBLESHOOTING

### ContractDraftModal doesn't appear
**Check:**
- Are there 2+ approved bids? (Must have status='approved')
- Check browser console (F12) for errors
- Verify ContractDraftModal.jsx imported in TenderBids.jsx

### Modal appears but blank
**Check:**
- Refresh page with Ctrl+F5
- Check browser console for errors
- Verify tender data loading (tender object not null)

### Can't see contract HTML
**Check:**
- Scroll down in Preview tab
- Check browser console for errors
- Verify contractGenerator.js loaded

### Database records not creating
**Check:**
- Verify Supabase connected
- Check browser console for DB errors
- Verify RLS policies allow INSERT (authenticated users)

### Notifications not appearing
**Check:**
- Refresh page
- Check notifications table in DB (may be empty if notifications table has issues)

---

## 🎯 NEXT: What to Test After Basic Flow

Once basic flow works, test these scenarios:

### Scenario: Edit Contract Version
1. On Edit tab → Save Changes
2. Should create Version 2
3. Verify in DB: contract_versions has 2 rows
4. Check modified_by field shows your email

### Scenario: Handle Declines (When DocuSign added)
1. Signatory declines
2. signed_at = NULL
3. signing_status = 'declined'
4. declined_reason shows "reason"
5. ContractProgress shows decline

### Scenario: Auto-Complete
1. All signatories sign
2. DB trigger fires automatically
3. contracts.status becomes 'executed'
4. contracts.fully_executed_at set to NOW()
5. ContractProgress shows "Contract Fully Executed"

---

## 📊 What You Should See (Screenshots)

### After SQL Migration - Supabase Table Editor:
`
Public Tables:
  ✓ contracts (0 rows initially)
  ✓ contract_signatories (0 rows initially)
  ✓ contract_versions (0 rows initially)
`

### After Sending Contract - SQL Query Result:
`
contracts table row:
  id: xxxxx-xxxxx
  contract_number: CTR-20260303-001
  status: sent
  tender_id: xxxxx-xxxxx
  created_by: client@example.com
  sent_at: 2026-03-03 14:30:00
  fully_executed_at: (null - until all sign)

contract_signatories rows (3):
  Row1: client@example.com | client | pending
  Row2: bidder1@example.com | bidder | pending
  Row3: bidder2@example.com | bidder | pending
`

---

## ⏭️ AFTER TESTING WORKS

Once you've verified:
1. ✅ Migration runs
2. ✅ Contract generates
3. ✅ Records create in DB
4. ✅ Signing status tracks

**You're ready for Phase 2: DocuSign Integration**

See CONTRACT_SYSTEM_GUIDE.md section: "DocuSign Integration"

Time to integrate DocuSign: ~4-6 hours

---

## 📞 Questions?

- Detailed architecture → CONTRACT_SYSTEM_GUIDE.md
- Quick start → CONTRACT_QUICKSTART.md
- This guide → CONTRACT_TESTING_STEPS.md

Good luck! 🚀

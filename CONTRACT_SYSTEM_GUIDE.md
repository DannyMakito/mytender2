# Contract Management System Implementation Guide

## 📋 Overview

A complete contract management system has been implemented that allows clients to:
1. **Generate contracts** when finalizing a tender with approved bids
2. **Preview & edit** contract terms and forms before sending
3. **Save multiple versions** for audit trail
4. **Send contracts** to all signatories (client + all approved bidders)
5. **Track signing progress** in real-time
6. **Archive final signed documents** once fully executed
7. **Admin review** capabilities for compliance

## 🗄️ Database Schema

### New Tables Created

#### 1. **contracts**
Stores contract master records with content and metadata.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| tender_id | UUID | Links to tender |
| contract_number | TEXT UNIQUE | Auto-generated (CTR-YYYYMMDD-NNN) |
| status | TEXT | draft \| sent \| signed \| executed \| cancelled |
| content | TEXT | Full HTML contract content |
| terms_and_conditions | TEXT | Editable T&C section |
| declarations_forms | JSONB | Fillable form data as JSON |
| docusign_envelope_id | TEXT | DocuSign integration ID |
| created_by | TEXT | Client email |
| created_at | TIMESTAMP | Auto-set to NOW() |
| sent_at | TIMESTAMP | When contract sent to signatories |
| fully_executed_at | TIMESTAMP | When all parties signed |
| updated_at | TIMESTAMP | Auto-updated on changes |

**RLS Policies:**
- Clients can CRUD their own contracts
- Signatories can SELECT contracts they're signed into
- Only authenticated users

#### 2. **contract_signatories**
Tracks each person who needs to sign and their status.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| contract_id | UUID | Links to contract |
| signatory_email | TEXT | Email address |
| signatory_type | TEXT | 'client' \| 'bidder' |
| bid_id | UUID | Links to approved bid (for bidders) |
| bid_amount | NUMERIC | Snapshot of bid amount |
| company_name | TEXT | Signatory company |
| signing_status | TEXT | pending \| viewed \| signed \| declined |
| signature_data | JSONB | {timestamp, ip_address, etc.} |
| signed_at | TIMESTAMP | When they signed |
| declined_at | TIMESTAMP | When they declined |
| declined_reason | TEXT | Why they declined |
| signed_document_url | TEXT | Link to their signed PDF |
| docusign_signer_id | TEXT | DocuSign signer ID |
| created_at | TIMESTAMP | Auto-set |
| updated_at | TIMESTAMP | Auto-updated |

**RLS Policies:**
- Users can view their own signatory record
- Clients can view all signatories on their contracts
- Signatories can UPDATE their own signing_status

#### 3. **contract_versions**
Audit trail of all edits before sending.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| contract_id | UUID | Links to contract |
| version_number | INT | 1, 2, 3, etc. |
| content | TEXT | Full HTML at this version |
| modified_by | TEXT | User email |
| change_description | TEXT | "Updated T&C", "Initial draft" |
| created_at | TIMESTAMP | Auto-set |

**RLS Policies:**
- Users can view versions of contracts they can access

### Database Triggers

1. **trigger_generate_contract_number** - Auto-generates CTR-YYYYMMDD-NNN on insert
2. **trigger_update_contracts_updated_at** - Updates timestamp on every change
3. **trigger_update_contract_signatories_updated_at** - Updates timestamp on signatory changes
4. **trigger_check_contract_execution** - AUTO-COMPLETES contract when last signatory signs

## 🛠️ Components Created

### 1. **contractGenerator.js** (Utility)
Location: src/lib/contractGenerator.js

**Functions:**
- generateContractHTML(tender, bids, clientEmail, clientCompany) - Creates full HTML contract with all sections
- extractContractFormData() - Collects filled form data from DOM
- alidateContractForm() - Checks all required fields are completed
- generateContractPlainText() - Creates text version for emails/archiving

**Contract HTML Includes:**
- Header with contract title & date
- Parties section (client + all bidders with amounts)
- Tender details (ID, title, description, budget, type)
- Terms & Conditions (fully editable before sending)
- Declarations & Forms (per-bidder fillable fields)
- Signature placeholders (for DocuSign)

### 2. **ContractDraftModal.jsx** (Component)
Location: src/components/contractor/ContractDraftModal.jsx

**Props:**
- open: boolean - Modal visibility
- onOpenChange: (bool) => void - Opens/closes modal
- 	ender: object - The tender being finalized
- pprovedBids: array - All bids with status='approved'
- onContractSent: (contract) => void - Callback after sending

**Workflow:**
1. **Preview Tab** - Shows HTML preview, download HTML option
2. **Edit Tab** - Displays HTML in editable area, save new versions
3. **Confirm Tab** - Final review before sending, list all signatories

**Features:**
- Auto-generates contract on modal open
- Creates version 1 as initial draft
- Creates contract_signatories records for client & all bidders
- Each edit creates new version (version 2, 3, etc.)
- Validates all forms before sending
- Changes contract status to 'sent' and sends notifications

**State:**
- step - which tab (preview | edit | confirm)
- contractHTML - current HTML content
- contract - DB record
- draftVersions - array of { version, createdAt }
- loading - for async operations

### 3. **ContractProgress.jsx** (Dashboard)
Location: src/components/contractor/ContractProgress.jsx

**Props:**
- contractId: string - UUID of contract to display

**Features:**
- Real-time signing progress via Supabase subscription
- Progress bar showing % signed
- Stats cards: Signed | Pending | Viewed | Declined counts
- Signatories table with:
  - Email, type, bid amount, status, signed date
  - Resend button (for pending signatories)
  - Download button (for signed documents)
- Declined reasons display with details
- Download final contract when status='executed'

**Real-time Updates:**
- Subscribes to contract_signatories changes
- Auto-updates when anyone signs or declines
- Automatically triggers contract completion when all sign

## 🔄 Workflow Integration

### When Client Clicks "Close Tender & Finalize Team"

1. **TenderBids.jsx** confirms 2+ approved bids exist
2. Opens **ContractDraftModal**
3. Modal calls generateContractHTML() with tender + bids
4. Creates contracts record (status='draft')
5. Creates contract_signatories for client + all bidders
6. Client can preview, edit, save versions
7. Client clicks "Send Contract to Signatories"
8. Updates contract status to 'sent'
9. Creates notifications for all signatories
10. Callbacks to TenderBids.handleContractSent()
11. TenderBids then closes tender + rejects non-approved bids

### When Signatory Signs (PostDocuSign Integration)

1. DocuSign sends webhook event
2. Backend handler updates contract_signatories (signing_status='signed', signed_at=NOW())
3. contect_signatories.updated_at trigger fires
4. **trigger_check_contract_execution** runs
5. If all signatories signed/declined → contract.status='executed', fully_executed_at=NOW()
6. ContractProgress component real-time updates via subscription

## 📦 Dependencies

**Already Installed:**
- jspdf - PDF generation
- html2canvas - HTML to canvas/image conversion
- sonner - Toast notifications
- @tabler/icons-react - Icons

**Still Needed (Optional but Recommended):**
- @docusign/esign-node-client - Official DocuSign SDK for e-signature integration

## 🚀 NEXT STEPS: DocuSign Integration

### Option 1: Full DocuSign (Recommended for Enterprise)

1. **Setup DocuSign Account:**
   - Create developer account at https://developer.docusign.com
   - Create app integration
   - Get: IntegrationKey (Client ID) and Private Key
   - Store in .env.local:
     `
     VITE_DOCUSIGN_INTEGRATION_KEY=your_integration_key
     VITE_DOCUSIGN_ACCOUNT_ID=your_account_id
     `

2. **Install DocuSign SDK:**
   `ash
   npm install @docusign/esign-node-client
   `

3. **Backend API Endpoint for DocuSign:**
   Create src/api/docuSignService.js:
   `javascript
   // Uses @docusign/esign-node-client
   // generateDocuSignEnvelope(contractId, signatories)
   // Updates contract.docusign_envelope_id
   `

4. **Webhook Handler:**
   Create src/api/docuSignWebhook.js to receive signing events:
   - Listen for envelope_status changes
   - Update contract_signatories table
   - Auto-complete contract when done

5. **Modify ContractDraftModal:**
   - Call DocuSign API instead of just changing status
   - Convert HTML to PDF before uploading to DocuSign
   - Embed signing flow in website

### Option 2: Simplified Version (Current Implementation)

Currently implemented with placeholder for DocuSign:
- Contract is marked as 'sent' when client confirms
- All signatories get notifications
- Manual signing workflow can be added later
- Full DocuSign integration can be bolted on

To complete simplified version:
1. Create signing portal component: src/components/bidder/ContractSigningPortal.jsx
2. Signatories click email link → view contract
3. Fill forms → click "Accept & Sign"
4. Updates contract_signatories (signing_status='signed', signed_at=NOW())
5. Auto-triggers contract completion

## 📝 Usage Instructions

### For Clients

1. **Create & Approve Bids:**
   - Create tender with one or more required roles
   - Receive bids from suppliers/professionals
   - Approve 2+ bids using the Approve button on TenderBids page

2. **Finalize & Generate Contract:**
   - Click "Close Tender & Finalize Team" button
   - ContractDraftModal appears
   - Preview auto-generated contract
   - Click "Edit" tab to modify T&C and forms
   - Save changes (creates new version)
   - Click "Confirm" tab → "Send Contract"
   - Contract sent to all signatories

3. **Track Signing Progress:**
   - View ContractProgress component
   - See real-time status updates
   - Download final contract once executed

### For Signatories (Bidders)

1. **Receive Notification:**
   - Get in-app notification: "Contract Ready for Signature"
   - Receive email link (if DocuSign enabled)

2. **Review & Sign:**
   - Open contract link
   - View contract preview
   - Fill signatory forms (name, position, company, phone)
   - Check authorization checkbox
   - Sign contract
   - Get confirmation & signed copy

3. **View Signed Document:**
   - Download their copy of signed contract from email/portal

### For Admins

1. **Access Contract Audit:**
   - View all executed contracts
   - See signing history & versions
   - Download final documents for archival
   - Track compliance

## 🔐 Security & Compliance

**RLS Ensures:**
- Clients only manage their own contracts
- Signatories only view contracts they're part of
- No cross-tenant data leakage

**Audit Trail Includes:**
- All version changes with timestamps
- Who modified what and when
- Signature timestamps and IP addresses
- Declined reasons

**Compliance Features:**
- Immutable version history
- Legally binding signatures (with DocuSign)
- ESIGN Act compliant (with DocuSign)
- Full contract archived in DB

## 🧪 Testing Checklist

- [ ] SQL migration runs without errors in Supabase
- [ ] TenderBids.jsx compiles and button triggers modal
- [ ] ContractDraftModal generates HTML contract
- [ ] Can edit T&C and forms in Edit tab
- [ ] Draft versions create new records in DB
- [ ] Sending contract creates contract_signatories records
- [ ] ContractProgress loads and shows signatories
- [ ] Real-time subscription works (open 2 browser tabs, sign in one, see update in other)
- [ ] Declining contract shows reason
- [ ] Contract auto-completes when all sign
- [ ] Tender closes and rejects non-approved bids after contract sent

## 📞 Support & Debugging

**Check Database:**
`sql
-- View contracts
SELECT id, contract_number, status, created_by, sent_at FROM contracts;

-- View signatories for contract
SELECT signatory_email, signatory_type, signing_status, signed_at 
FROM contract_signatories 
WHERE contract_id = 'your_contract_id';

-- View versions
SELECT version_number, modified_by, change_description, created_at 
FROM contract_versions 
WHERE contract_id = 'your_contract_id';
`

**Common Issues:**
1. **Modal doesn't appear** - Check ContractDraftModal import in TenderBids
2. **No signatories created** - Verify approved bids exist before finalization
3. **Contract not updating** - Check RLS policies allow authenticated access
4. **Real-time not working** - Verify Supabase subscription is active


/**
 * Contract Generator Utility
 * Generates HTML contracts from tender and bid data
 * Includes T&C section and fillable declaration forms
 */

export function generateContractHTML(tender, approvedBids, clientEmail, clientCompany = 'Client Company') {
  if (!tender || !approvedBids || approvedBids.length === 0) {
    throw new Error('Invalid tender or bids data')
  }

  const contractDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const biddersHTML = approvedBids.map((bid, index) => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${index + 1}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${bid.bidder || 'N/A'}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">R${parseFloat(bid.bid_amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${bid.role === 'supplier' ? 'Supplier' : bid.role || 'Professional'}</td>
    </tr>
  `).join('')

  const formFields = approvedBids.map((bid, index) => `
    <fieldset style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 4px;">
      <legend style="font-weight: bold; padding: 0 10px;">Signatory Information - ${bid.bidder}</legend>
      
      <div style="margin: 15px 0;">
        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Full Name</label>
        <input 
          type="text" 
          id="form_bidder_${index}_name" 
          style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;"
          placeholder="Enter full name of authorized signatory"
        />
      </div>

      <div style="margin: 15px 0;">
        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Position/Title</label>
        <input 
          type="text" 
          id="form_bidder_${index}_position" 
          style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;"
          placeholder="e.g., Managing Director, Authorized Signatory"
        />
      </div>

      <div style="margin: 15px 0;">
        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Company Name</label>
        <input 
          type="text" 
          id="form_bidder_${index}_company" 
          style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;"
          placeholder="Company or trading name"
        />
      </div>

      <div style="margin: 15px 0;">
        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Email Address</label>
        <input 
          type="email" 
          id="form_bidder_${index}_email" 
          value="${bid.bidder}"
          style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;"
          readonly
        />
      </div>

      <div style="margin: 15px 0;">
        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Phone Number</label>
        <input 
          type="tel" 
          id="form_bidder_${index}_phone" 
          style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;"
          placeholder="+27 (country code)"
        />
      </div>

      <div style="margin: 15px 0; background: #f9f9f9; padding: 10px; border-radius: 4px;">
        <label style="display: flex; align-items: center; font-size: 14px;">
          <input 
            type="checkbox" 
            id="form_bidder_${index}_authorized" 
            style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;"
          />
          <span>I confirm that I am authorized to sign this contract on behalf of the company</span>
        </label>
      </div>
    </fieldset>
  `).join('')

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Service Agreement Contract</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #1f2937;
      padding-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      color: #1f2937;
      font-size: 28px;
    }
    .header p {
      margin: 5px 0;
      color: #666;
      font-size: 14px;
    }
    .section {
      margin: 30px 0;
    }
    .section h2 {
      color: #1f2937;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
      font-size: 18px;
    }
    .section h3 {
      color: #374151;
      margin-top: 20px;
      margin-bottom: 10px;
      font-size: 16px;
    }
    .section p {
      margin: 10px 0;
      text-align: justify;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border: 1px solid #ddd;
      color: #1f2937;
    }
    td {
      padding: 10px;
    }
    .signature-section {
      margin-top: 40px;
      page-break-before: avoid;
    }
    .signature-line {
      margin-top: 40px;
      display: inline-block;
      width: 45%;
      margin-right: 5%;
    }
    .signature-line input {
      border: none;
      border-bottom: 2px solid #000;
      width: 100%;
      margin-top: 5px;
    }
    .date-line {
      margin-top: 10px;
    }
    .party-info {
      background: #f9fafb;
      padding: 15px;
      margin: 10px 0;
      border-left: 4px solid #3b82f6;
      border-radius: 4px;
    }
    .party-info strong {
      color: #1f2937;
    }
    input[type="text"], 
    input[type="email"], 
    input[type="tel"],
    textarea {
      font-family: inherit;
    }
    .editable-section {
      background: #fffbeb;
      padding: 10px;
      margin: 10px 0;
      border-left: 3px solid #f59e0b;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SERVICE AGREEMENT CONTRACT</h1>
      <p>This agreement is entered on ${contractDate}</p>
    </div>

    <!-- PARTIES SECTION -->
    <div class="section">
      <h2>1. PARTIES TO THE AGREEMENT</h2>
      
      <div class="party-info">
        <strong>Client:</strong><br/>
        ${clientCompany}<br/>
        Email: ${clientEmail}<br/>
      </div>

      <div class="party-info">
        <strong>Accepted Service Providers/Bidders:</strong>
      </div>
      
      <table>
        <thead>
          <tr>
            <th style="width: 10%;">No.</th>
            <th style="width: 35%;">Company/Individual</th>
            <th style="width: 35%;">Accepted Bid Amount</th>
            <th style="width: 20%;">Role</th>
          </tr>
        </thead>
        <tbody>
          ${biddersHTML}
        </tbody>
      </table>
    </div>

    <!-- TENDER DETAILS SECTION -->
    <div class="section">
      <h2>2. TENDER DETAILS</h2>
      
      <div style="background: #f9fafb; padding: 15px; border-radius: 4px;">
        <p><strong>Tender ID:</strong> ${tender.id}</p>
        <p><strong>Tender Title:</strong> ${tender.title}</p>
        <p><strong>Description:</strong></p>
        <p>${tender.description || 'N/A'}</p>
        <p><strong>Budget:</strong> R${tender.budget ? parseFloat(tender.budget).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}</p>
        <p><strong>Tender Type:</strong> ${tender.tender_type === 'supplier' ? 'Supplier Quotation' : 'Professional Project'}</p>
      </div>
    </div>

    <!-- TERMS & CONDITIONS SECTION -->
    <div class="section">
      <h2>3. TERMS & CONDITIONS</h2>
      
      <div class="editable-section">
        <p><strong>⚠️ Client Note:</strong> copy and paste the term below and Edit terms as needed before sending to signatories.</p>
      </div>

      <div id="terms_content" style="border: 1px solid #ddd; padding: 15px; border-radius: 4px; min-height: 200px; background: white;">
        <h3>Service Delivery Terms</h3>
        <p>3.1 The Service Provider agrees to deliver the services as outlined in the tender specification within the agreed timeframe.</p>
        <p>3.2 All deliverables shall meet the quality standards specified in the tender documentation.</p>
        <p>3.3 The Service Provider shall maintain confidentiality regarding all proprietary information shared during the engagement.</p>
        
        <h3>Payment Terms</h3>
        <p>3.4 Payment shall be made within 30 days of invoice submission and acceptance of deliverables.</p>
        <p>3.5 The bid amount quoted is inclusive of all costs; no additional charges shall be claimed unless previously agreed in writing.</p>
        
        <h3>Liability and Insurance</h3>
        <p>3.6 The Service Provider shall maintain appropriate professional liability insurance throughout the contract period.</p>
        <p>3.7 Neither party shall be liable for indirect, incidental, or consequential damages arising from this agreement.</p>
        
        <h3>Termination</h3>
        <p>3.8 Either party may terminate this agreement with 30 days written notice if the other party materially breaches its obligations.</p>
        <p>3.9 Upon termination, the Service Provider shall deliver all work in progress and proprietary materials to the Client.</p>
        
        <h3>Governance</h3>
        <p>3.10 This agreement shall be governed by the laws of the Republic of South Africa.</p>
        <p>3.11 Any disputes shall be resolved through negotiation, and if unresolved, through arbitration in accordance with the Arbitration Act.</p>
      </div>

      <div style="margin-top: 15px;">
        <label style="display: block; margin-bottom: 10px; font-weight: 500;">Edit Terms & Conditions (Client Only):</label>
        <textarea 
          id="terms_textarea"
          style="width: 100%; height: 300px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 12px; box-sizing: border-box;"
          placeholder="Paste updated T&C here or modify existing terms above"
        ></textarea>
      </div>
    </div>

    <!-- DECLARATIONS & FORMS SECTION -->
    <div class="section">
      <h2>4. DECLARATIONS & FORMS</h2>
      
      <div class="editable-section">
        <p><strong>⚠️ Signatories must fill in all fields below with their information before signing.</strong></p>
      </div>

      ${formFields}

      <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 4px;">
        <h3 style="margin-top: 0; color: #0369a1;">Acceptance & Acknowledgment</h3>
        <p><strong>By signing this agreement, each party:</strong></p>
        <ul>
          <li>Confirms they have read and understood all terms and conditions</li>
          <li>Agrees to perform their obligations as outlined in this contract</li>
          <li>Certifies they are authorized to sign on behalf of their organization</li>
          <li>Acknowledges this is a legally binding agreement</li>
        </ul>
        
        <div style="margin-top: 15px;">
          <label style="display: flex; align-items: flex-start;">
            <input 
              type="checkbox" 
              id="acceptance_all_parties" 
              style="margin-right: 10px; margin-top: 2px; width: 18px; height: 18px; cursor: pointer;"
            />
            <span>I acknowledge that all signatories have reviewed and accept the terms of this agreement</span>
          </label>
        </div>
      </div>
    </div>

    <!-- SIGNATURE SECTION (For DocuSign) -->
    <div class="section signature-section">
      <h2>5. SIGNATURES</h2>
      <p style="font-size: 12px; color: #666;">
        <em>Note: Signatures will be collected electronically via DocuSign. Each party will receive a separate signing request.</em>
      </p>
    </div>
  </div>
</body>
</html>
  `

  return html
}

/**
 * Extract form data from contract HTML
 * Returns object with all filled form field values
 */
export function extractContractFormData() {
  const formData = {
    bidder_info: [],
    terms_and_conditions: null,
    timestamp: new Date().toISOString()
  }

  // Get all form fieldsets (one per bidder)
  const fieldsets = document.querySelectorAll('fieldset')

  fieldsets.forEach((fieldset, idx) => {
    const bidderData = {}

    // Get all inputs in this fieldset
    const inputs = fieldset.querySelectorAll('input')
    inputs.forEach(input => {
      if (input.type === 'checkbox') {
        bidderData[input.id] = input.checked
      } else if (input.id) {
        bidderData[input.id] = input.value
      }
    })

    if (Object.keys(bidderData).length > 0) {
      formData.bidder_info.push(bidderData)
    }
  })

  // Get T&C if it was edited
  const tcTextarea = document.getElementById('terms_textarea')
  if (tcTextarea) {
    formData.terms_and_conditions = tcTextarea.value
  }

  return formData
}

/**
 * Validate all required form fields are filled
 * Returns object with valid flag and error message
 */
export function validateContractForm() {
  const errors = []

  // Check text/email/tel fields
  const requiredFields = document.querySelectorAll('input[id*="form_bidder"][type="text"], input[id*="form_bidder"][type="email"], input[id*="form_bidder"][type="tel"]')
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      const label = field.previousElementSibling?.textContent || field.id
      errors.push(`${label} is required`)
    }
  })

  // Check authorization checkboxes
  const authorizedCheckboxes = document.querySelectorAll('input[id*="authorized"]')
  if (authorizedCheckboxes.length > 0) {
    authorizedCheckboxes.forEach((checkbox, idx) => {
      if (!checkbox.checked) {
        errors.push(`Signatory ${idx + 1} must confirm authorization`)
      }
    })
  }

  // Check acceptance checkbox if it exists
  const acceptanceCheckbox = document.getElementById('acceptance_all_parties')
  if (acceptanceCheckbox && !acceptanceCheckbox.checked) {
    errors.push('You must acknowledge receipt and acceptance of terms')
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    error: errors.length > 0 ? errors[0] : null
  }
}

/**
 * Generate plain text version of contract (for email/archive)
 */
export function generateContractPlainText(tender, approvedBids, clientEmail, clientCompany) {
  let plainText = `SERVICE AGREEMENT CONTRACT\nGenerated: ${new Date().toLocaleDateString()}\n\n`;

  plainText += `PARTIES:\n`;
  plainText += `Client: ${clientCompany} (${clientEmail})\n\n`;
  plainText += `Service Providers:\n`;
  approvedBids.forEach((bid, idx) => {
    plainText += `${idx + 1}. ${bid.bidder} - R${bid.bid_amount} (${bid.role === 'supplier' ? 'Supplier' : 'Professional'})\n`;
  });

  plainText += `\n\nTENDER DETAILS:\n`;
  plainText += `Title: ${tender.title}\n`;
  plainText += `Description: ${tender.description || 'N/A'}\n`;
  plainText += `Budget: R${tender.budget || 'N/A'}\n\n`;

  plainText += `TERMS & CONDITIONS:\n`;
  plainText += `[See full HTML version for complete T&C]\n\n`;

  plainText += `SIGNATORIES REQUIRED: ${approvedBids.length + 1} (Client + ${approvedBids.length} Service Provider(s))\n`;

  return plainText
}

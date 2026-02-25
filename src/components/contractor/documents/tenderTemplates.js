/**
 * Tender Document Template Definitions
 * Based on standard South African tender/procurement document structures
 */

export const TEMPLATE_TYPES = {
    STANDARD: 'standard',
    EOI: 'eoi',
    RFQ: 'rfq',
}

/**
 * Section definitions — each section is a block in the document editor.
 * `defaultContent` is pre-populated HTML for the Quill editor.
 */
export const SECTION_DEFINITIONS = {
    cover_page: {
        id: 'cover_page',
        title: 'Cover Page',
        icon: '📄',
        order: 1,
        defaultContent: `
      <h1 style="text-align: center;"><strong>TENDER DOCUMENT</strong></h1>
      <p style="text-align: center;"><br></p>
      <h2 style="text-align: center;">TENDER NO: [ENTER TENDER NUMBER]</h2>
      <p style="text-align: center;"><br></p>
      <h2 style="text-align: center;">[ENTER PROJECT TITLE]</h2>
      <p style="text-align: center;"><br></p>
      <p style="text-align: center;"><strong>Issued By:</strong></p>
      <p style="text-align: center;">[Organisation / Municipality Name]</p>
      <p style="text-align: center;">[Physical Address]</p>
      <p style="text-align: center;">[Contact Number] | [Email Address]</p>
      <p style="text-align: center;"><br></p>
      <p style="text-align: center;"><strong>Issue Date:</strong> [DD/MM/YYYY]</p>
      <p style="text-align: center;"><strong>Closing Date:</strong> [DD/MM/YYYY] at [TIME]</p>
      <p style="text-align: center;"><strong>Compulsory Briefing Session:</strong> [DD/MM/YYYY] at [TIME]</p>
      <p style="text-align: center;"><br></p>
      <p style="text-align: center;"><em>Late submissions will not be accepted.</em></p>
    `,
    },

    scope_of_work: {
        id: 'scope_of_work',
        title: 'Scope of Work / Requirements',
        icon: '📋',
        order: 2,
        defaultContent: `
      <h2><u>PART E3: INDICATIVE SCOPE OF WORK</u></h2>
      <p><strong>THE FOLLOWING FORMS PART OF THE TECHNICAL SPECIFICATION</strong></p>
      <p><br></p>

      <h3>1. SCOPE OF CONTRACT</h3>
      <p><br></p>

      <h4>1.1. REQUIREMENTS</h4>
      <p>[Organisation Name] invites all eligible service providers to submit expressions of interest / proposals / quotations for the provision of the following services:</p>
      <ul>
        <li>[Describe service/product 1]</li>
        <li>[Describe service/product 2]</li>
        <li>[Describe service/product 3]</li>
      </ul>
      <p><br></p>
      <p>The contract period shall be for a period of [NUMBER] months/years commencing from the date of appointment.</p>
      <p><br></p>
      <p>Only service providers who comply with the criteria prescribed in the Submission Data will be considered. The date of assumption of work per contract may vary since these contracts are based upon requests from various line departments.</p>
      <p><br></p>

      <h4>1.2. OBJECTIVES</h4>
      <ul>
        <li>[Objective 1]</li>
        <li>[Objective 2]</li>
        <li>[Objective 3]</li>
      </ul>
      <p><br></p>

      <h4>1.3. DELIVERABLES</h4>
      <ul>
        <li>[Deliverable 1]</li>
        <li>[Deliverable 2]</li>
        <li>[Deliverable 3]</li>
      </ul>
    `,
    },

    labour_standards: {
        id: 'labour_standards',
        title: 'Labour Standards',
        icon: '👷',
        order: 3,
        defaultContent: `
      <h3>1.2. LABOUR STANDARDS</h3>
      <p><br></p>
      <p>As this contract requires a labour component, the Contractor/Service Provider must pay the gazetted minimum labour rate as prescribed by the Department of Employment and Labour for the duration of the contract.</p>
      <p><br></p>
      <p>The Contractor must also ensure that the wages are based on the current labour rate. <strong>Failing which the Contract with the Contractor will be terminated.</strong></p>
      <p><br></p>

      <h4>Key Labour Requirements:</h4>
      <ul>
        <li>Compliance with the Basic Conditions of Employment Act (BCEA)</li>
        <li>Compliance with the Occupational Health and Safety Act (OHSA)</li>
        <li>Payment of minimum wages as per sectoral determination</li>
        <li>Registration with the Department of Labour</li>
        <li>Provision of protective clothing and equipment to all workers</li>
        <li>Maintaining an attendance register for all workers</li>
      </ul>
      <p><br></p>

      <h4>Working Hours:</h4>
      <p>[Specify working hours, e.g. Monday to Friday, 07:30 – 16:30]</p>
    `,
    },

    project_specifications: {
        id: 'project_specifications',
        title: 'Project Specifications',
        icon: '🔧',
        order: 4,
        defaultContent: `
      <h3>1.3. PROJECT SPECIFICATIONS</h3>
      <p><br></p>
      <p>Technical specifications vary as per each end-user's requirement. Therefore, final technical specifications/requirements will be detailed in the service level agreement which will be signed by the Contractor and the respective line Department.</p>
      <p><br></p>

      <h4>General Specifications:</h4>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Specification</th>
            <th>Standard/Code</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>[Item 1]</td>
            <td>[Description]</td>
            <td>[SANS/ISO Standard]</td>
          </tr>
          <tr>
            <td>[Item 2]</td>
            <td>[Description]</td>
            <td>[SANS/ISO Standard]</td>
          </tr>
          <tr>
            <td>[Item 3]</td>
            <td>[Description]</td>
            <td>[SANS/ISO Standard]</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>

      <h4>Quality Requirements:</h4>
      <ul>
        <li>[Quality requirement 1]</li>
        <li>[Quality requirement 2]</li>
        <li>[Quality requirement 3]</li>
      </ul>
    `,
    },

    technical_requirements: {
        id: 'technical_requirements',
        title: 'Technical Requirements from Line Departments',
        icon: '🏗️',
        order: 5,
        defaultContent: `
      <h3><u>SUMMARY OF TECHNICAL REQUIREMENTS FROM VARIOUS LINE DEPARTMENTS</u></h3>
      <p><br></p>

      <h4>2. [DEPARTMENT NAME] — [PROJECT DESCRIPTION]</h4>
      <p><br></p>
      <p>[Describe the specific scope for this department. E.g.: "This contract covers the cutting of grass and removal of grass cuttings to the nearest dumpsite from the Council's sites in the Municipal Area for the period of three years commencing on the date of acceptance of the Service Level Agreement."]</p>
      <p><br></p>

      <h4>a. Service Zones / Areas</h4>
      <p>[Describe geographic zones, service areas, or districts covered by this department's requirements.]</p>
      <p><br></p>

      <h4>b. Scope of Services</h4>
      <ul>
        <li>[Service item 1]</li>
        <li>[Service item 2]</li>
        <li>[Service item 3]</li>
      </ul>
      <p><br></p>

      <h4>c. Performance Standards</h4>
      <ul>
        <li>Response time: [e.g. within 48 hours of request]</li>
        <li>Frequency: [e.g. monthly / quarterly / as required]</li>
        <li>Quality standard: [e.g. SLA rate of 40 cents/m²]</li>
      </ul>
      <p><br></p>

      <p><em>Note: Add additional department sections as required by repeating the structure above.</em></p>
    `,
    },

    returnable_documents: {
        id: 'returnable_documents',
        title: 'List of Returnable Documents',
        icon: '📑',
        order: 6,
        defaultContent: `
      <h2><u>E2.1: LIST OF RETURNABLE DOCUMENTS</u></h2>
      <p><br></p>

      <h4>E2.1.1 General</h4>
      <p>The submission document must be submitted as a whole. All forms must be properly completed as required, and the document shall not be taken apart or altered in any way whatsoever.</p>
      <p><br></p>
      <p>The respondent is required to complete each and every Schedule and Form listed below to the best of his/her ability. Failure to complete the Schedules and Forms to the satisfaction of the Employer will inevitably prejudice the tender and may lead to rejection on the grounds that the submission is not responsive.</p>
      <p><br></p>

      <h4>E2.1.2 Returnable Schedules, Forms and Certificates</h4>
      <ul>
        <li>Certificate of Attendance at Clarification Meeting</li>
        <li>Certificate of Authority</li>
        <li>Declaration of Municipal Fees</li>
        <li>Record of Addenda to Tender Documents</li>
      </ul>
      <p><br></p>

      <h4>Consolidated Municipal Bidding Documents</h4>
      <ul>
        <li>MBD 2: Tax Clearance Certificate Requirements</li>
        <li>MBD 4: Declaration of Interest</li>
        <li>MBD 5: Declaration for Procurement Above R10 Million</li>
        <li>MBD 6.1: Preference Points</li>
        <li>MBD 6.2: Declaration Certificate for Local Production and Content for Designated Sectors</li>
        <li>MBD 8: Declaration of Bidder's Past SCM Practices</li>
        <li>MBD 9: Certificate of Independent Bid Determination</li>
      </ul>
    `,
    },

    evaluation_criteria: {
        id: 'evaluation_criteria',
        title: 'Evaluation Criteria',
        icon: '✅',
        order: 7,
        defaultContent: `
      <h3>EVALUATION CRITERIA</h3>
      <p><br></p>
      <p>Tenders will be evaluated in accordance with the Preferential Procurement Policy Framework Act (PPPFA) and its associated regulations.</p>
      <p><br></p>

      <h4>Stage 1: Administrative Compliance</h4>
      <p>All submissions will first be evaluated for administrative compliance. Non-compliant submissions will be disqualified.</p>
      <ul>
        <li>Valid Tax Clearance Certificate (or Tax Compliance PIN)</li>
        <li>Valid CIDB Registration (where applicable)</li>
        <li>Proof of Company Registration</li>
        <li>Valid B-BBEE Certificate or Sworn Affidavit</li>
        <li>All MBD forms completed and signed</li>
      </ul>
      <p><br></p>

      <h4>Stage 2: Functionality / Technical Evaluation</h4>
      <table>
        <thead>
          <tr>
            <th>Criteria</th>
            <th>Weight</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Relevant Experience</td>
            <td>[XX] points</td>
            <td>[Description of what constitutes relevant experience]</td>
          </tr>
          <tr>
            <td>Methodology / Approach</td>
            <td>[XX] points</td>
            <td>[Description of expected methodology]</td>
          </tr>
          <tr>
            <td>Resources / Capacity</td>
            <td>[XX] points</td>
            <td>[Description of required resources]</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
      <p><strong>Minimum qualifying score: [XX] out of [100] points</strong></p>
      <p><br></p>

      <h4>Stage 3: Price and Preference Points (80/20 or 90/10)</h4>
      <p>[Specify which system applies based on tender value]</p>
    `,
    },

    pricing_schedule: {
        id: 'pricing_schedule',
        title: 'Pricing / Bill of Quantities',
        icon: '💰',
        order: 8,
        defaultContent: `
      <h3>PRICING SCHEDULE / BILL OF QUANTITIES</h3>
      <p><br></p>
      <p>The bidder must complete the pricing schedule below. All prices must be inclusive of VAT unless otherwise stated. Prices must be firm for the duration of the contract.</p>
      <p><br></p>

      <table>
        <thead>
          <tr>
            <th>Item No.</th>
            <th>Description</th>
            <th>Unit</th>
            <th>Quantity</th>
            <th>Rate (excl. VAT)</th>
            <th>Amount (excl. VAT)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>[Item description]</td>
            <td>[Each/m²/hour]</td>
            <td>[Qty]</td>
            <td>R [0.00]</td>
            <td>R [0.00]</td>
          </tr>
          <tr>
            <td>2</td>
            <td>[Item description]</td>
            <td>[Each/m²/hour]</td>
            <td>[Qty]</td>
            <td>R [0.00]</td>
            <td>R [0.00]</td>
          </tr>
          <tr>
            <td>3</td>
            <td>[Item description]</td>
            <td>[Each/m²/hour]</td>
            <td>[Qty]</td>
            <td>R [0.00]</td>
            <td>R [0.00]</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>

      <p><strong>Sub-Total (excl. VAT):</strong> R [0.00]</p>
      <p><strong>VAT (15%):</strong> R [0.00]</p>
      <p><strong>TOTAL (incl. VAT):</strong> R [0.00]</p>
      <p><br></p>
      <p><em>Note: The employer reserves the right to increase or decrease quantities as required.</em></p>
    `,
    },

    terms_and_conditions: {
        id: 'terms_and_conditions',
        title: 'Terms & Conditions',
        icon: '⚖️',
        order: 9,
        defaultContent: `
      <h3>TERMS AND CONDITIONS</h3>
      <p><br></p>

      <h4>1. Contract Period</h4>
      <p>The contract shall be for a period of [XX] months/years from the date of commencement, with an option to extend for a further [XX] months/years subject to satisfactory performance and mutual agreement.</p>
      <p><br></p>

      <h4>2. Payment Terms</h4>
      <p>Payment will be made within [30] days of receipt of a valid invoice and upon verification of satisfactory delivery/completion of services.</p>
      <p><br></p>

      <h4>3. Penalties</h4>
      <p>In the event of non-performance or late delivery, a penalty of [X%] of the contract value per day/week may be applied, up to a maximum of [X%].</p>
      <p><br></p>

      <h4>4. Termination</h4>
      <p>Either party may terminate this contract by giving [30/60/90] days written notice. The employer reserves the right to terminate immediately in cases of gross misconduct, fraud, or material breach.</p>
      <p><br></p>

      <h4>5. Insurance</h4>
      <p>The contractor shall maintain adequate insurance coverage for the duration of the contract, including but not limited to:</p>
      <ul>
        <li>Public liability insurance</li>
        <li>Professional indemnity insurance (where applicable)</li>
        <li>Workmen's compensation</li>
      </ul>
      <p><br></p>

      <h4>6. Dispute Resolution</h4>
      <p>Any disputes arising from this contract shall first be resolved through mediation. Failing which, the matter shall be referred to arbitration in accordance with the Arbitration Act.</p>
    `,
    },

    declarations: {
        id: 'declarations',
        title: 'Declarations & Forms',
        icon: '✍️',
        order: 10,
        defaultContent: `
      <h3>DECLARATION FORMS</h3>
      <p><br></p>

      <h4>MBD 4: Declaration of Interest</h4>
      <p>Any legal person, including persons employed by the state, or persons having a kinship with persons employed by the state, including a blood relationship, may make an offer or offers in terms of this invitation to bid. However, in view of possible allegations of favouritism, should the resulting bid, or part thereof, be awarded to persons employed by the state, or to persons connected with or related to them, it is required that the bidder or his/her authorised representative declare his/her position.</p>
      <p><br></p>

      <h4>MBD 9: Certificate of Independent Bid Determination</h4>
      <p>I, the undersigned, in submitting the accompanying bid:</p>
      <p>[TENDER NUMBER AND DESCRIPTION]</p>
      <p>in response to the invitation for the bid made by:</p>
      <p>[NAME OF INSTITUTION]</p>
      <p>do hereby make the following statements that I certify to be true and complete in every respect:</p>
      <ol>
        <li>I have read and I understand the contents of this Certificate.</li>
        <li>I understand that the accompanying bid will be disqualified if this Certificate is found not to be true and complete in every respect.</li>
        <li>The accompanying bid has been arrived at independently from, and without consultation, communication, agreement or arrangement with any competitor.</li>
      </ol>
      <p><br></p>

      <p><strong>Signed:</strong> ________________________</p>
      <p><strong>Name:</strong> ________________________</p>
      <p><strong>Position:</strong> ________________________</p>
      <p><strong>Date:</strong> ________________________</p>
    `,
    },
}

/**
 * Template presets — each template includes a subset of sections
 */
export const TEMPLATES = [
    {
        id: 'standard',
        name: 'Standard Tender Document',
        description: 'Complete tender document with all sections — scope, specifications, technical requirements, returnable documents, evaluation criteria, pricing, terms, and declarations.',
        icon: '📝',
        color: '#6366f1',
        sections: [
            'cover_page',
            'scope_of_work',
            'labour_standards',
            'project_specifications',
            'technical_requirements',
            'returnable_documents',
            'evaluation_criteria',
            'pricing_schedule',
            'terms_and_conditions',
            'declarations',
        ],
    },
    {
        id: 'eoi',
        name: 'Expression of Interest (EOI)',
        description: 'Simplified document for inviting expressions of interest — focuses on scope, requirements, and evaluation criteria only.',
        icon: '📩',
        color: '#0ea5e9',
        sections: [
            'cover_page',
            'scope_of_work',
            'labour_standards',
            'project_specifications',
            'evaluation_criteria',
            'declarations',
        ],
    },
    {
        id: 'rfq',
        name: 'Request for Quotation (RFQ)',
        description: 'Brief request for pricing on specific goods or services — includes specifications and a pricing schedule.',
        icon: '💼',
        color: '#10b981',
        sections: [
            'cover_page',
            'scope_of_work',
            'project_specifications',
            'pricing_schedule',
            'terms_and_conditions',
            'declarations',
        ],
    },
]

/**
 * Build initial sections content from a template
 */
export function buildSectionsFromTemplate(templateId) {
    const template = TEMPLATES.find((t) => t.id === templateId)
    if (!template) return {}

    const sections = {}
    template.sections.forEach((sectionId) => {
        const def = SECTION_DEFINITIONS[sectionId]
        if (def) {
            sections[sectionId] = {
                id: sectionId,
                title: def.title,
                content: def.defaultContent,
                order: def.order,
            }
        }
    })
    return sections
}

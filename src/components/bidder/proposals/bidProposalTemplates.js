// Templates and predefined sections for Bid Proposals

const DEFAULT_COVER_LETTER = (entity) => `
<p>Dear Procurement Team,</p>
<p><br></p>
<p>We are writing to formally submit our proposal for the upcoming project. ${entity} have carefully reviewed the requirements and are confident in our ability to deliver exceptional results.</p>
<p><br></p>
<p><strong>Why We Are the Best Fit:</strong></p>
<ul>
    <li>Extensive experience in ähnliche projects.</li>
    <li>Dedicated and highly skilled team.</li>
    <li>Commitment to delivering on time and within budget.</li>
</ul>
<p><br></p>
<p>We look forward to the possibility of working together.</p>
<p><br></p>
<p>Sincerely,</p>
<p>[Your Name / Company Name]</p>
`;

const DEFAULT_EXECUTIVE_SUMMARY = `
<h2>Executive Summary</h2>
<p>This proposal outlines our approach to fulfilling the requirements of the tender. Our primary objective is to deliver a high-quality solution that addresses all your underlying needs while ensuring cost-effectiveness and timely execution.</p>
<p><br></p>
<p><strong>Key Objectives:</strong></p>
<ul>
    <li>Deliverable 1</li>
    <li>Deliverable 2</li>
</ul>
<p><br></p>
<p><strong>Expected Results:</strong></p>
<p>By partnering with us, you can expect a seamless project execution resulting in measurable improvements and sustainable value.</p>
`;

const DEFAULT_COMPANY_PROFILE = (entity) => `
<h2>${entity === 'We' ? 'Company' : 'Freelancer'} Profile</h2>
<p><strong>History & Background:</strong></p>
<p>Detail your history, founding date, and core mission here.</p>
<p><br></p>
<p><strong>Key Expertise:</strong></p>
<ul>
    <li>Area of expertise 1</li>
    <li>Area of expertise 2</li>
    <li>Area of expertise 3</li>
</ul>
<p><br></p>
<p><strong>Relevant Past Projects:</strong></p>
<ul>
    <li><em>Project Name A</em> - Summary of project and outcomes.</li>
    <li><em>Project Name B</em> - Summary of project and outcomes.</li>
</ul>
`;

const DEFAULT_TECHNICAL_PROPOSAL = `
<h2>Technical Bid Proposal</h2>
<p><strong>1. Project Understanding:</strong></p>
<p>Based on the tender documents, we understand the scope of work involves [summarize the project scope]. Our team has thoroughly analyzed the requirements and identified the critical success factors.</p>
<p><br></p>
<p><strong>2. Proposed Approach & Methodology:</strong></p>
<p>We will employ a [Phased / Agile / Step-by-step] approach to execute this project. This includes:</p>
<ol>
    <li>Phase 1: Planning and Discovery</li>
    <li>Phase 2: Execution and Implementation</li>
    <li>Phase 3: QA and Handover</li>
</ol>
<p><br></p>
<p><strong>3. Key Resources:</strong></p>
<ul>
    <li><strong>Personnel:</strong> 1x Project Manager, 2x Specialists</li>
    <li><strong>Equipment/Tools:</strong> Necessary equipment list here</li>
</ul>
`;

const DEFAULT_FINANCIAL_BID = `
<h2>Financial Bid</h2>
<p>Below is a comprehensive breakdown of the costs associated with the proposed methodology.</p>
<p><br></p>
<table>
    <thead>
        <tr>
            <th>Item Description</th>
            <th>Quantity</th>
            <th>Unit Cost (R)</th>
            <th>Total Cost (R)</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Resource Person / Labor</td>
            <td>1</td>
            <td>0.00</td>
            <td>0.00</td>
        </tr>
        <tr>
            <td>Materials / Software</td>
            <td>1</td>
            <td>0.00</td>
            <td>0.00</td>
        </tr>
        <tr>
            <td><strong>Total (Excl. VAT)</strong></td>
            <td></td>
            <td></td>
            <td><strong>0.00</strong></td>
        </tr>
    </tbody>
</table>
<p><br></p>
<p><strong>Cost Justification:</strong></p>
<p>The costs outlined above reflect competitive market rates ensuring high-quality delivery without compromising on standards.</p>
`;

const DEFAULT_TIMELINE = `
<h2>Project Timeline</h2>
<p>We propose the following schedule of deliverables:</p>
<p><br></p>
<table>
    <thead>
        <tr>
            <th>Phase / Milestone</th>
            <th>Deliverable</th>
            <th>Timeline (Weeks)</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Phase 1</td>
            <td>Initial setup and planning document</td>
            <td>Week 1-2</td>
        </tr>
        <tr>
            <td>Phase 2</td>
            <td>Core implementation</td>
            <td>Week 3-6</td>
        </tr>
        <tr>
            <td>Phase 3</td>
            <td>Final review and handover</td>
            <td>Week 7-8</td>
        </tr>
    </tbody>
</table>
`;

const DEFAULT_VALUE_PROPOSITION = `
<h2>Value Proposition</h2>
<p>What sets us apart is our commitment to excellence and our unique approach to solving complex problems. By choosing our proposal, you benefit from:</p>
<ul>
    <li><strong>Innovation:</strong> Cutting-edge approaches to legacy problems.</li>
    <li><strong>Reliability:</strong> A track record of zero delayed deliveries.</li>
    <li><strong>Support:</strong> Ongoing post-project support and maintenance.</li>
</ul>
`;

const DEFAULT_COVER_PAGE = `
<div style="text-align: center; margin-top: 100px;">
    <h1><strong>BID PROPOSAL</strong></h1>
    <p><br></p>
    <h2>[Tender Name / Project Title]</h2>
    <p><br></p>
    <p><strong>Prepared For:</strong></p>
    <p>[Client Name / Organization]</p>
    <p><br></p>
    <p><br></p>
    <p><strong>Prepared By:</strong></p>
    <p>[Your Name / Company Name]</p>
    <p>[Contact Information]</p>
    <p><br></p>
    <p><strong>Date:</strong> [Current Date]</p>
</div>
`;

const DEFAULT_DECLARATIONS = `
<h2>Declarations & Compliance</h2>
<p>We hereby declare that the information provided in this bid proposal is true and accurate to the best of our knowledge. We confirm our compliance with all terms and conditions specified in the tender document.</p>
<p><br></p>
<p><br></p>
<p>___________________________</p>
<p><strong>Authorized Signature</strong></p>
<p>Name: [Your Name]</p>
<p>Title: [Your Title]</p>
<p>Date: [Date]</p>
`;

export const BID_SECTION_DEFINITIONS = {
    cover_page: {
        id: 'cover_page',
        title: 'Cover Page',
        icon: '📄',
        order: 1,
        getDefaultContent: () => DEFAULT_COVER_PAGE,
    },
    cover_letter: {
        id: 'cover_letter',
        title: 'Cover Letter',
        icon: '✉️',
        order: 2,
        getDefaultContent: (type) => DEFAULT_COVER_LETTER(type === 'company' ? 'We' : 'I'),
    },
    executive_summary: {
        id: 'executive_summary',
        title: 'Executive Summary',
        icon: '📋',
        order: 3,
        getDefaultContent: () => DEFAULT_EXECUTIVE_SUMMARY,
    },
    company_profile: {
        id: 'company_profile',
        title: 'Profile',
        icon: '🏢',
        order: 4,
        getDefaultContent: (type) => DEFAULT_COMPANY_PROFILE(type === 'company' ? 'We' : 'I'),
    },
    technical_proposal: {
        id: 'technical_proposal',
        title: 'Technical Proposal',
        icon: '⚙️',
        order: 5,
        getDefaultContent: () => DEFAULT_TECHNICAL_PROPOSAL,
    },
    financial_bid: {
        id: 'financial_bid',
        title: 'Financial Bid',
        icon: '💰',
        order: 6,
        getDefaultContent: () => DEFAULT_FINANCIAL_BID,
    },
    timeline: {
        id: 'timeline',
        title: 'Timeline',
        icon: '⏱️',
        order: 7,
        getDefaultContent: () => DEFAULT_TIMELINE,
    },
    value_proposition: {
        id: 'value_proposition',
        title: 'Value Proposition',
        icon: '✨',
        order: 8,
        getDefaultContent: () => DEFAULT_VALUE_PROPOSITION,
    },
    declarations: {
        id: 'declarations',
        title: 'Declarations',
        icon: '✍️',
        order: 9,
        getDefaultContent: () => DEFAULT_DECLARATIONS,
    },
};

export const BID_TEMPLATES = [
    {
        id: 'full',
        name: 'Full Proposal',
        description: 'Comprehensive proposal including cover page, profiling, and declarations. Best for formal company bids.',
        icon: '📑',
        color: '#8b5cf6', // purple
        sections: [
            'cover_page',
            'cover_letter',
            'executive_summary',
            'company_profile',
            'technical_proposal',
            'financial_bid',
            'timeline',
            'value_proposition',
            'declarations'
        ],
    },
    {
        id: 'compact',
        name: 'Compact Proposal',
        description: 'Streamlined proposal focusing on technical and financial details. Best for freelancers or quick bids.',
        icon: '📝',
        color: '#10b981', // emerald
        sections: [
            'cover_letter',
            'executive_summary',
            'technical_proposal',
            'financial_bid',
            'timeline',
            'value_proposition'
        ],
    }
];

/**
 * Build the initial state for the editor sections based on template and bidder type.
 */
export function buildBidSectionsFromTemplate(templateId, bidderType = 'company') {
    const template = BID_TEMPLATES.find((t) => t.id === templateId);
    const sections = {};

    if (!template) return sections;

    template.sections.forEach((sectionId, index) => {
        const def = BID_SECTION_DEFINITIONS[sectionId];
        if (def) {
            sections[sectionId] = {
                id: sectionId,
                title: def.title,
                content: def.getDefaultContent(bidderType),
                order: index + 1,
            };
        }
    });

    return sections;
}

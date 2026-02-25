import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx'
import { saveAs } from 'file-saver'

/**
 * Export the rendered HTML content to a multi-page PDF
 * @param {HTMLElement} element - The DOM element to capture
 * @param {string} filename - Name of the output file (without .pdf)
 */
export async function exportToPDF(element, filename = 'tender-document') {
    if (!element) throw new Error('No element provided for PDF export')

    // Render inside an isolated iframe to avoid html2canvas parsing
    // Tailwind v4's oklch() colors from the main page's stylesheets.
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.left = '-10000px'
    iframe.style.top = '0'
    iframe.style.width = '794px' // A4 at 96dpi
    iframe.style.height = '1123px'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)

    try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
        iframeDoc.open()
        iframeDoc.write(`<!DOCTYPE html>
<html><head><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #000000;
    background: #ffffff;
    padding: 40px 50px;
  }
  h1 { font-size: 22pt; font-weight: 700; margin-bottom: 12px; color: #111; }
  h2 { font-size: 17pt; font-weight: 700; margin-bottom: 10px; margin-top: 18px; color: #111; }
  h3 { font-size: 14pt; font-weight: 600; margin-bottom: 8px; margin-top: 14px; color: #222; }
  h4 { font-size: 12pt; font-weight: 600; margin-bottom: 6px; margin-top: 10px; color: #333; }
  p { margin-bottom: 8px; color: #222; }
  ul, ol { padding-left: 28px; margin-bottom: 10px; }
  li { margin-bottom: 4px; color: #222; }
  u { text-decoration: underline; text-underline-offset: 2px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10pt; }
  th, td { border: 1px solid #888; padding: 6px 10px; text-align: left; }
  th { background: #e5e5e5; font-weight: 600; }
  tr:nth-child(even) td { background: #f5f5f5; }
  strong, b { font-weight: 700; }
  em, i { font-style: italic; }
  .section-break { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; }
</style></head><body></body></html>`)
        iframeDoc.close()

        // Inject content
        iframeDoc.body.innerHTML = element.innerHTML

        // Wait for rendering
        await new Promise((r) => setTimeout(r, 300))

        const canvas = await html2canvas(iframeDoc.body, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 794,
            window: iframe.contentWindow,
        })

        const pdf = new jsPDF('p', 'mm', 'a4')

        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = pdf.internal.pageSize.getHeight()
        const margin = 10

        const contentWidth = pdfWidth - margin * 2
        const imgWidth = canvas.width
        const imgHeight = canvas.height
        const ratio = contentWidth / imgWidth
        const scaledHeight = imgHeight * ratio

        const pageContentHeight = pdfHeight - margin * 2
        let position = 0
        let page = 0

        while (position < scaledHeight) {
            if (page > 0) {
                pdf.addPage()
            }

            const sourceY = position / ratio
            const sourceHeight = Math.min(pageContentHeight / ratio, imgHeight - sourceY)
            const destHeight = sourceHeight * ratio

            const pageCanvas = document.createElement('canvas')
            pageCanvas.width = imgWidth
            pageCanvas.height = sourceHeight
            const ctx = pageCanvas.getContext('2d')
            ctx.drawImage(canvas, 0, sourceY, imgWidth, sourceHeight, 0, 0, imgWidth, sourceHeight)

            const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95)
            pdf.addImage(pageImgData, 'JPEG', margin, margin, contentWidth, destHeight)

            position += pageContentHeight
            page++
        }

        pdf.save(`${filename}.pdf`)
    } finally {
        document.body.removeChild(iframe)
    }
}


/**
 * Parse HTML string into docx-compatible elements
 */
function parseHtmlToDocxElements(html) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const elements = []

    function processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent
            if (text.trim()) {
                return [new TextRun({ text: text })]
            }
            return []
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return []

        const tag = node.tagName.toLowerCase()

        switch (tag) {
            case 'h1':
                elements.push(
                    new Paragraph({
                        children: getInlineRuns(node, { bold: true, size: 32 }),
                        heading: HeadingLevel.HEADING_1,
                        alignment: getAlignment(node),
                        spacing: { after: 200, before: 200 },
                    })
                )
                break

            case 'h2':
                elements.push(
                    new Paragraph({
                        children: getInlineRuns(node, { bold: true, size: 28 }),
                        heading: HeadingLevel.HEADING_2,
                        alignment: getAlignment(node),
                        spacing: { after: 160, before: 200 },
                    })
                )
                break

            case 'h3':
                elements.push(
                    new Paragraph({
                        children: getInlineRuns(node, { bold: true, size: 24 }),
                        heading: HeadingLevel.HEADING_3,
                        alignment: getAlignment(node),
                        spacing: { after: 120, before: 160 },
                    })
                )
                break

            case 'h4':
                elements.push(
                    new Paragraph({
                        children: getInlineRuns(node, { bold: true, size: 22 }),
                        heading: HeadingLevel.HEADING_4,
                        alignment: getAlignment(node),
                        spacing: { after: 100, before: 120 },
                    })
                )
                break

            case 'p':
                elements.push(
                    new Paragraph({
                        children: getInlineRuns(node),
                        alignment: getAlignment(node),
                        spacing: { after: 100 },
                    })
                )
                break

            case 'ul':
            case 'ol':
                node.querySelectorAll(':scope > li').forEach((li, idx) => {
                    elements.push(
                        new Paragraph({
                            children: getInlineRuns(li),
                            bullet: tag === 'ul' ? { level: 0 } : undefined,
                            numbering: tag === 'ol' ? { reference: 'default-numbering', level: 0 } : undefined,
                            spacing: { after: 60 },
                        })
                    )
                })
                break

            case 'table':
                try {
                    const rows = []
                    node.querySelectorAll('tr').forEach((tr) => {
                        const cells = []
                        tr.querySelectorAll('td, th').forEach((cell) => {
                            const isHeader = cell.tagName.toLowerCase() === 'th'
                            cells.push(
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [
                                                new TextRun({
                                                    text: cell.textContent.trim(),
                                                    bold: isHeader,
                                                    size: 20,
                                                }),
                                            ],
                                        }),
                                    ],
                                    width: { size: 100 / tr.children.length, type: WidthType.PERCENTAGE },
                                })
                            )
                        })
                        if (cells.length > 0) {
                            rows.push(new TableRow({ children: cells }))
                        }
                    })
                    if (rows.length > 0) {
                        elements.push(
                            new Table({
                                rows: rows,
                                width: { size: 100, type: WidthType.PERCENTAGE },
                            })
                        )
                        // Add spacing after table
                        elements.push(new Paragraph({ children: [], spacing: { after: 200 } }))
                    }
                } catch (e) {
                    console.warn('Table parsing failed, skipping', e)
                }
                break

            case 'br':
                elements.push(new Paragraph({ children: [] }))
                break

            default:
                // Recurse for divs, spans, etc.
                for (const child of node.childNodes) {
                    processNode(child)
                }
                break
        }
    }

    function getInlineRuns(node, defaultStyle = {}) {
        const runs = []

        function walk(n, style) {
            if (n.nodeType === Node.TEXT_NODE) {
                const text = n.textContent
                if (text.trim() || text.includes(' ')) {
                    runs.push(
                        new TextRun({
                            text: text,
                            bold: style.bold || false,
                            italics: style.italics || false,
                            underline: style.underline ? {} : undefined,
                            size: style.size || 22,
                        })
                    )
                }
                return
            }

            if (n.nodeType !== Node.ELEMENT_NODE) return

            const tag = n.tagName.toLowerCase()
            const newStyle = { ...style }

            if (tag === 'strong' || tag === 'b') newStyle.bold = true
            if (tag === 'em' || tag === 'i') newStyle.italics = true
            if (tag === 'u') newStyle.underline = true

            for (const child of n.childNodes) {
                walk(child, newStyle)
            }
        }

        for (const child of node.childNodes) {
            walk(child, defaultStyle)
        }

        return runs.length > 0 ? runs : [new TextRun({ text: '' })]
    }

    function getAlignment(node) {
        const style = node.getAttribute('style') || ''
        if (style.includes('text-align: center') || style.includes('text-align:center')) {
            return AlignmentType.CENTER
        }
        if (style.includes('text-align: right') || style.includes('text-align:right')) {
            return AlignmentType.RIGHT
        }
        return AlignmentType.LEFT
    }

    for (const child of doc.body.childNodes) {
        processNode(child)
    }

    return elements
}

/**
 * Export sections to DOCX
 * @param {Object} sections - Object with section data { id: { title, content } }
 * @param {string} filename - Output filename (without .docx)
 */
export async function exportToDocx(sections, filename = 'tender-document') {
    const children = []

    // Sort sections by order
    const sortedSections = Object.values(sections).sort((a, b) => (a.order || 0) - (b.order || 0))

    sortedSections.forEach((section, idx) => {
        if (idx > 0) {
            // Page break between sections
            children.push(
                new Paragraph({
                    children: [],
                    pageBreakBefore: true,
                })
            )
        }

        // Parse the section HTML content into docx elements
        const sectionElements = parseHtmlToDocxElements(section.content || '')
        children.push(...sectionElements)
    })

    const doc = new Document({
        numbering: {
            config: [
                {
                    reference: 'default-numbering',
                    levels: [
                        {
                            level: 0,
                            format: 'decimal',
                            text: '%1.',
                            alignment: AlignmentType.LEFT,
                        },
                    ],
                },
            ],
        },
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: 1440,    // 1 inch
                            right: 1440,
                            bottom: 1440,
                            left: 1440,
                        },
                    },
                },
                children: children,
            },
        ],
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `${filename}.docx`)
}

/**
 * Export Bid Proposal sections and attached documents to DOCX
 * @param {Object} sections - Object with section data { id: { title, content } }
 * @param {Array} attachedDocuments - Array of attached documents { name, url }
 * @param {string} filename - Output filename (without .docx)
 */
export async function exportBidProposalToDocx(sections, attachedDocuments, filename = 'bid-proposal') {
    const children = []

    // Sort sections by order
    const sortedSections = Object.values(sections).sort((a, b) => (a.order || 0) - (b.order || 0))

    sortedSections.forEach((section, idx) => {
        if (idx > 0) {
            // Page break between sections
            children.push(
                new Paragraph({
                    children: [],
                    pageBreakBefore: true,
                })
            )
        }

        // Parse the section HTML content into docx elements
        const sectionElements = parseHtmlToDocxElements(section.content || '')
        children.push(...sectionElements)
    })

    // Add Appendix if there are attached documents
    if (attachedDocuments && attachedDocuments.length > 0) {
        children.push(
            new Paragraph({
                children: [],
                pageBreakBefore: true,
            })
        )
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "Appendix: Supporting Documents",
                        bold: true,
                        size: 32, // 16pt
                    }),
                ],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            })
        )
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: "The following supporting documents have been attached to this proposal:",
                        size: 24, // 12pt
                    }),
                ],
                spacing: { after: 200 }
            })
        )

        attachedDocuments.forEach((doc, idx) => {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `${idx + 1}. `,
                            size: 24,
                        }),
                        new TextRun({
                            text: doc.name,
                            size: 24,
                            color: "0563C1",
                            underline: {
                                type: "single",
                                color: "0563C1"
                            }
                        })
                    ],
                    spacing: { after: 120 }
                })
            )
            // We can't actually hyperlink correctly easily without defining external relationship links in docx
            // but writing them out as blue underlined text signifies them being attachments/links.
        })
    }

    const doc = new Document({
        numbering: {
            config: [
                {
                    reference: 'default-numbering',
                    levels: [
                        {
                            level: 0,
                            format: 'decimal',
                            text: '%1.',
                            alignment: AlignmentType.LEFT,
                        },
                    ],
                },
            ],
        },
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: 1440,    // 1 inch
                            right: 1440,
                            bottom: 1440,
                            left: 1440,
                        },
                    },
                },
                children: children,
            },
        ],
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `${filename}.docx`)
}


import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import '../../contractor/documents/quill-custom.css'
import { BID_SECTION_DEFINITIONS, buildBidSectionsFromTemplate } from './bidProposalTemplates'
import { exportToPDF, exportBidProposalToDocx } from '../../contractor/documents/exportUtils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import supabase from '../../../../supabase-client.js'
import {
    IconArrowLeft,
    IconDeviceFloppy,
    IconFileTypePdf,
    IconFileTypeDocx,
    IconLoader2,
    IconCheck,
    IconTrash,
    IconUpload,
    IconFile,
    IconEye,
    IconEdit,
} from '@tabler/icons-react'

const QUILL_MODULES = {
    toolbar: [
        [{ header: [1, 2, 3, 4, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        [{ indent: '-1' }, { indent: '+1' }],
        ['blockquote'],
        ['link'],
        ['clean'],
    ],
}

const QUILL_FORMATS = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'indent',
    'align',
    'blockquote',
    'link',
]

export default function BidProposalEditor() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { id } = useParams()

    const { user } = useAuth()
    const printRef = useRef(null)
    const quillRef = useRef(null)
    const fileInputRef = useRef(null)

    const [documentTitle, setDocumentTitle] = useState('Untitled Bid Proposal')
    const [templateType, setTemplateType] = useState('full')
    const [bidderType, setBidderType] = useState('company')
    const [sections, setSections] = useState({})
    const [activeSection, setActiveSection] = useState(null)
    const [attachedDocuments, setAttachedDocuments] = useState([])

    const [saving, setSaving] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [uploading, setUploading] = useState(false)

    const [documentId, setDocumentId] = useState(id || null)
    const [loading, setLoading] = useState(!!id)
    const [lastSaved, setLastSaved] = useState(null)

    const [isPreviewMode, setIsPreviewMode] = useState(false)

    // Initialize from template or load existing document
    useEffect(() => {
        if (id) {
            loadDocument(id)
        } else {
            const templateParam = searchParams.get('template') || 'full'
            const typeParam = searchParams.get('type') || 'company'

            setTemplateType(templateParam)
            setBidderType(typeParam)

            if (templateParam === 'blank') {
                const title = typeParam === 'company' ? 'Company Proposal' : 'Freelancer Proposal'
                setSections({
                    main: {
                        id: 'main',
                        title: 'Proposal Content',
                        content: `<h1>${title}</h1><p><br></p><p>Start typing your content here...</p>`,
                        order: 1,
                    },
                })
                setActiveSection('main')
            } else {
                const builtSections = buildBidSectionsFromTemplate(templateParam, typeParam)
                setSections(builtSections)
                const firstKey = Object.keys(builtSections).sort(
                    (a, b) => (builtSections[a].order || 0) - (builtSections[b].order || 0)
                )[0]
                setActiveSection(firstKey || null)
            }
        }
    }, [id, searchParams])

    const loadDocument = async (docId) => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('bid_proposals')
                .select('*')
                .eq('id', docId)
                .single()

            if (error) throw error

            setDocumentTitle(data.title)
            setTemplateType(data.template_type)
            setBidderType(data.bidder_type)
            setSections(data.sections || {})
            setAttachedDocuments(data.attached_documents || [])
            setDocumentId(data.id)

            const keys = Object.keys(data.sections || {}).sort(
                (a, b) => ((data.sections[a]?.order) || 0) - ((data.sections[b]?.order) || 0)
            )
            setActiveSection(keys[0] || null)
        } catch (error) {
            console.error('Error loading proposal:', error)
            toast.error('Failed to load proposal')
            navigate('/bdocuments')
        } finally {
            setLoading(false)
        }
    }

    const handleContentChange = useCallback(
        (value) => {
            if (!activeSection) return
            setSections((prev) => ({
                ...prev,
                [activeSection]: {
                    ...prev[activeSection],
                    content: value,
                },
            }))
        },
        [activeSection]
    )

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Limit file size to 5MB here as a reasonable default
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size exceeds 5MB limit')
            return
        }

        try {
            setUploading(true)
            const fileExt = file.name.split('.').pop()
            const fileName = `bid-supp-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
            const filePath = `bid-supporting-docs/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('tender-documents')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data } = supabase.storage
                .from('tender-documents')
                .getPublicUrl(filePath)

            const newDoc = {
                name: file.name,
                url: data.publicUrl,
                type: file.type,
                size: file.size
            }

            setAttachedDocuments(prev => [...prev, newDoc])
            toast.success('Document attached successfully')
        } catch (error) {
            console.error('Error uploading document:', error)
            toast.error('Failed to upload document')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleRemoveDocument = (indexToRemove) => {
        setAttachedDocuments(prev => prev.filter((_, idx) => idx !== indexToRemove))
    }

    const handleSave = async (silent = false) => {
        if (!user?.email) {
            if (!silent) toast.error('You must be logged in to save')
            return
        }

        try {
            if (!silent) setSaving(true)
            const payload = {
                user_email: user.email,
                title: documentTitle,
                template_type: templateType,
                bidder_type: bidderType,
                sections: sections,
                attached_documents: attachedDocuments,
                status: 'draft',
            }

            if (documentId) {
                // Update
                const { error } = await supabase
                    .from('bid_proposals')
                    .update(payload)
                    .eq('id', documentId)

                if (error) throw error
            } else {
                // Insert
                const { data, error } = await supabase
                    .from('bid_proposals')
                    .insert([payload])
                    .select()
                    .single()

                if (error) throw error
                setDocumentId(data.id)
                // Update URL without full reload
                window.history.replaceState(null, '', `/bdocuments/edit/${data.id}`)
            }

            setLastSaved(new Date())
            if (!silent) toast.success('Proposal saved successfully')
        } catch (error) {
            console.error('Error saving proposal:', error)
            if (!silent) toast.error('Failed to save proposal', { description: error.message })
        } finally {
            if (!silent) setSaving(false)
        }
    }

    const handleExportPDF = async () => {
        if (!printRef.current) return
        try {
            setExporting(true)
            // Save draft first implicitly if in preview mode so we have latest changes
            if (!isPreviewMode) {
                toast.info('Generating PDF...', { duration: 2000 })
            } else {
                toast.info('Exporting preview to PDF...', { duration: 2000 })
            }

            await exportToPDF(printRef.current, documentTitle || 'bid-proposal')
            toast.success('PDF downloaded successfully')
        } catch (error) {
            console.error('PDF export error:', error)
            toast.error('Failed to export PDF')
        } finally {
            setExporting(false)
        }
    }

    const handleExportDocx = async () => {
        try {
            setExporting(true)
            toast.info('Generating Word document...', { duration: 2000 })
            await exportBidProposalToDocx(sections, attachedDocuments, documentTitle || 'bid-proposal')
            toast.success('Word document downloaded successfully')
        } catch (error) {
            console.error('DOCX export error:', error)
            toast.error('Failed to export Word document')
        } finally {
            setExporting(false)
        }
    }

    // Sort sections by order
    const sortedSections = Object.values(sections).sort(
        (a, b) => (a.order || 0) - (b.order || 0)
    )

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <IconLoader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full min-h-[calc(100vh-80px)]">
            {/* Top action bar */}
            <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center justify-between px-4 py-3 gap-3">
                    {/* Left: Back + Title */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                            onClick={() => navigate('/bdocuments')}
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                        >
                            <IconArrowLeft className="size-4" />
                            <span className="hidden sm:inline">Back</span>
                        </button>
                        <Input
                            value={documentTitle}
                            onChange={(e) => setDocumentTitle(e.target.value)}
                            className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0 h-auto bg-transparent max-w-md"
                            placeholder="Proposal title..."
                        />
                        {bidderType && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium flex-shrink-0">
                                {bidderType === 'company' ? 'Company' : 'Individual'}
                            </span>
                        )}
                        {lastSaved && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0 ml-2">
                                <IconCheck className="size-3 text-green-500" />
                                Saved {lastSaved.toLocaleTimeString()}
                            </span>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                            variant={isPreviewMode ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setIsPreviewMode(!isPreviewMode)}
                            className="gap-1.5"
                        >
                            {isPreviewMode ? <IconEdit className="size-4" /> : <IconEye className="size-4" />}
                            <span className="hidden md:inline">{isPreviewMode ? 'Edit Mode' : 'Preview'}</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportPDF}
                            disabled={exporting}
                            className="gap-1.5"
                        >
                            <IconFileTypePdf className="size-4" />
                            <span className="hidden md:inline">PDF</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportDocx}
                            disabled={exporting}
                            className="gap-1.5"
                        >
                            <IconFileTypeDocx className="size-4" />
                            <span className="hidden md:inline">DOCX</span>
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => handleSave(false)}
                            disabled={saving}
                            className="gap-1.5"
                        >
                            {saving ? (
                                <IconLoader2 className="size-4 animate-spin" />
                            ) : (
                                <IconDeviceFloppy className="size-4" />
                            )}
                            <span className="hidden md:inline">{saving ? 'Saving...' : 'Save Draft'}</span>
                        </Button>
                    </div>
                </div>
            </div>

            {isPreviewMode ? (
                // --- PREVIEW MODE ---
                <div className="flex-1 overflow-y-auto bg-muted p-8">
                    <div className="max-w-4xl mx-auto bg-background rounded-xl shadow-lg pb-10">
                        <div className="border-b p-6 bg-secondary/30 rounded-t-xl flex justify-between items-center print:hidden">
                            <div>
                                <h2 className="text-xl font-bold">Proposal Preview</h2>
                                <p className="text-sm text-muted-foreground">This is how your final document will look when exported.</p>
                            </div>
                            <Button onClick={() => setIsPreviewMode(false)} variant="outline" size="sm">
                                <IconEdit className="size-4 mr-2" /> Resume Editing
                            </Button>
                        </div>

                        <div className="p-10 pdf-export-preview">
                            {/* Content to be printed */}
                            <div ref={printRef} className="pdf-export-content" style={{ width: '210mm', padding: '15mm', background: '#fff', margin: '0 auto' }}>
                                <h1 style={{ textAlign: 'center', fontSize: '22pt', marginBottom: '20px' }}>
                                    {documentTitle}
                                </h1>
                                {sortedSections.map((section, idx) => (
                                    <div key={section.id} style={{ marginBottom: '30px' }}>
                                        <div dangerouslySetInnerHTML={{ __html: section.content || '' }} />
                                        {idx < sortedSections.length - 1 && (
                                            <div style={{ pageBreakAfter: 'always' }} />
                                        )}
                                    </div>
                                ))}

                                {/* Appendix: Supporting Documents */}
                                {attachedDocuments.length > 0 && (
                                    <div style={{ borderTop: '2px solid #e2e8f0', marginTop: '40px', paddingTop: '20px', pageBreakBefore: 'always' }}>
                                        <h2 style={{ fontSize: '18pt', fontWeight: 'bold', marginBottom: '16px' }}>Appendix: Supporting Documents</h2>
                                        <p style={{ marginBottom: '16px' }}>The following supporting documents have been attached to this proposal:</p>
                                        <ul style={{ paddingLeft: '24px' }}>
                                            {attachedDocuments.map((doc, idx) => (
                                                <li key={idx} style={{ marginBottom: '8px' }}>
                                                    <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                                                        {doc.name}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // --- EDIT MODE ---
                <div className="flex flex-1 overflow-hidden">
                    {/* Left Sidebar: Section Navigator + Documents */}
                    <aside className="w-72 border-r bg-muted/30 p-3 overflow-y-auto hidden lg:flex flex-col flex-shrink-0">
                        <div className="flex-1">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                                Sections
                            </div>
                            <nav className="space-y-1">
                                {sortedSections.map((section) => {
                                    const def = BID_SECTION_DEFINITIONS[section.id]
                                    return (
                                        <div
                                            key={section.id}
                                            className={`section-nav-item ${activeSection === section.id ? 'active' : ''
                                                }`}
                                            onClick={() => setActiveSection(section.id)}
                                        >
                                            <span className="section-icon">{def?.icon || '📄'}</span>
                                            <span className="section-label">{section.title}</span>
                                        </div>
                                    )
                                })}
                            </nav>
                        </div>

                        {/* Supporting Documents Section */}
                        <div className="mt-6 pt-6 border-t">
                            <div className="flex items-center justify-between mb-3 px-2">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Supporting Docs
                                </span>
                                <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">Optional</span>
                            </div>

                            <div className="space-y-2 mb-3">
                                {attachedDocuments.map((doc, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-card border rounded-md p-2 text-sm group">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <IconFile className="size-4 text-blue-500 shrink-0" />
                                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline" title={doc.name}>
                                                {doc.name}
                                            </a>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveDocument(idx)}
                                            className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                        >
                                            <IconTrash className="size-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                />
                                <Button
                                    variant="outline"
                                    className="w-full text-xs h-8 dashed-border"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                >
                                    {uploading ? <IconLoader2 className="size-3.5 mr-2 animate-spin" /> : <IconUpload className="size-3.5 mr-2" />}
                                    {uploading ? 'Uploading...' : 'Attach Document'}
                                </Button>
                            </div>
                        </div>
                    </aside>

                    {/* Editor Area */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-muted/10">
                        {/* Mobile section tabs */}
                        {sortedSections.length > 1 && (
                            <div className="lg:hidden mb-4 overflow-x-auto">
                                <div className="flex gap-2 pb-2">
                                    {sortedSections.map((section) => {
                                        const def = BID_SECTION_DEFINITIONS[section.id]
                                        return (
                                            <button
                                                key={section.id}
                                                onClick={() => setActiveSection(section.id)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeSection === section.id
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                    }`}
                                            >
                                                <span>{def?.icon || '📄'}</span>
                                                {section.title}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Active section title */}
                        {activeSection && sections[activeSection] && (
                            <div className="mb-4">
                                <h2 className="text-xl font-bold tracking-tight text-foreground">
                                    {sections[activeSection].title}
                                </h2>
                            </div>
                        )}

                        {/* Quill Editor */}
                        {activeSection && sections[activeSection] && (
                            <div className="tender-editor-wrapper bg-card rounded-xl shadow-sm border overflow-hidden">
                                <ReactQuill
                                    ref={quillRef}
                                    key={activeSection}
                                    theme="snow"
                                    value={sections[activeSection]?.content || ''}
                                    onChange={handleContentChange}
                                    modules={QUILL_MODULES}
                                    formats={QUILL_FORMATS}
                                    placeholder="Start drafting this section..."
                                    className="min-h-[500px]"
                                />
                            </div>
                        )}
                    </div>

                    {/* Hidden print-ready element for PDF export (only used if we save without previewing) */}
                    {!isPreviewMode && (
                        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                            <div ref={printRef} className="pdf-export-content" style={{ width: '210mm', padding: '15mm', background: '#fff' }}>
                                <h1 style={{ textAlign: 'center', fontSize: '22pt', marginBottom: '20px' }}>
                                    {documentTitle}
                                </h1>
                                {sortedSections.map((section, idx) => (
                                    <div key={section.id} style={{ marginBottom: '30px' }}>
                                        <div dangerouslySetInnerHTML={{ __html: section.content || '' }} />
                                        {idx < sortedSections.length - 1 && (
                                            <div style={{ pageBreakAfter: 'always' }} />
                                        )}
                                    </div>
                                ))}
                                {attachedDocuments.length > 0 && (
                                    <div style={{ borderTop: '2px solid #e2e8f0', marginTop: '40px', paddingTop: '20px', pageBreakBefore: 'always' }}>
                                        <h2 style={{ fontSize: '18pt', fontWeight: 'bold', marginBottom: '16px' }}>Appendix: Supporting Documents</h2>
                                        <p style={{ marginBottom: '16px' }}>The following supporting documents have been attached to this proposal:</p>
                                        <ul style={{ paddingLeft: '24px' }}>
                                            {attachedDocuments.map((doc, idx) => (
                                                <li key={idx} style={{ marginBottom: '8px' }}>
                                                    <a href={doc.url} style={{ color: '#2563eb', textDecoration: 'underline' }}>{doc.name}</a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

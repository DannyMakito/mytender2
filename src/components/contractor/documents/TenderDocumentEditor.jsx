import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import './quill-custom.css'
import { SECTION_DEFINITIONS, TEMPLATES, buildSectionsFromTemplate } from './tenderTemplates'
import { exportToPDF, exportToDocx } from './exportUtils'
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

export default function TenderDocumentEditor() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { id } = useParams()

    const { user } = useAuth()
    const printRef = useRef(null)
    const quillRef = useRef(null)

    const [documentTitle, setDocumentTitle] = useState('Untitled Tender Document')
    const [templateType, setTemplateType] = useState('standard')
    const [sections, setSections] = useState({})
    const [activeSection, setActiveSection] = useState(null)
    const [saving, setSaving] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [documentId, setDocumentId] = useState(id || null)
    const [loading, setLoading] = useState(!!id)
    const [lastSaved, setLastSaved] = useState(null)

    // Initialise from template or load existing document
    useEffect(() => {
        if (id) {
            loadDocument(id)
        } else {
            const templateParam = searchParams.get('template') || 'standard'
            setTemplateType(templateParam)

            if (templateParam === 'blank') {
                // Blank document — single editable section
                setSections({
                    main: {
                        id: 'main',
                        title: 'Document Content',
                        content: '<h1>Untitled Tender Document</h1><p><br></p><p>Start typing your content here...</p>',
                        order: 1,
                    },
                })
                setActiveSection('main')
            } else {
                const builtSections = buildSectionsFromTemplate(templateParam)
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
                .from('tender_documents')
                .select('*')
                .eq('id', docId)
                .single()

            if (error) throw error

            setDocumentTitle(data.title)
            setTemplateType(data.template_type)
            setSections(data.sections || {})
            setDocumentId(data.id)

            const keys = Object.keys(data.sections || {}).sort(
                (a, b) => ((data.sections[a]?.order) || 0) - ((data.sections[b]?.order) || 0)
            )
            setActiveSection(keys[0] || null)
        } catch (error) {
            console.error('Error loading document:', error)
            toast.error('Failed to load document')
            navigate('/cdocuments')
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

    const handleSave = async () => {
        if (!user?.email) {
            toast.error('You must be logged in to save')
            return
        }

        try {
            setSaving(true)
            const payload = {
                user_email: user.email,
                title: documentTitle,
                template_type: templateType,
                sections: sections,
                status: 'draft',
            }

            if (documentId) {
                // Update
                const { error } = await supabase
                    .from('tender_documents')
                    .update(payload)
                    .eq('id', documentId)

                if (error) throw error
            } else {
                // Insert
                const { data, error } = await supabase
                    .from('tender_documents')
                    .insert([payload])
                    .select()
                    .single()

                if (error) throw error
                setDocumentId(data.id)
                // Update URL without full reload
                window.history.replaceState(null, '', `/cdocuments/edit/${data.id}`)
            }

            setLastSaved(new Date())
            toast.success('Document saved successfully')
        } catch (error) {
            console.error('Error saving document:', error)
            toast.error('Failed to save document', { description: error.message })
        } finally {
            setSaving(false)
        }
    }

    const handleExportPDF = async () => {
        if (!printRef.current) return
        try {
            setExporting(true)
            toast.info('Generating PDF...', { duration: 2000 })
            await exportToPDF(printRef.current, documentTitle || 'tender-document')
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
            await exportToDocx(sections, documentTitle || 'tender-document')
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
                            onClick={() => navigate('/cdocuments')}
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                        >
                            <IconArrowLeft className="size-4" />
                            <span className="hidden sm:inline">Back</span>
                        </button>
                        <Input
                            value={documentTitle}
                            onChange={(e) => setDocumentTitle(e.target.value)}
                            className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0 h-auto bg-transparent max-w-md"
                            placeholder="Document title..."
                        />
                        {lastSaved && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                                <IconCheck className="size-3 text-green-500" />
                                Saved {lastSaved.toLocaleTimeString()}
                            </span>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
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
                            onClick={handleSave}
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

            {/* Main content area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Section Navigator — sidebar */}
                {sortedSections.length > 1 && (
                    <aside className="w-64 border-r bg-muted/30 p-3 overflow-y-auto hidden lg:block flex-shrink-0">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                            Sections
                        </div>
                        <nav className="space-y-1">
                            {sortedSections.map((section) => {
                                const def = SECTION_DEFINITIONS[section.id]
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
                    </aside>
                )}

                {/* Editor area */}
                <div className="flex-1 overflow-y-auto p-4">
                    {/* Mobile section tabs */}
                    {sortedSections.length > 1 && (
                        <div className="lg:hidden mb-4 overflow-x-auto">
                            <div className="flex gap-2 pb-2">
                                {sortedSections.map((section) => {
                                    const def = SECTION_DEFINITIONS[section.id]
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
                        <div className="mb-3">
                            <h2 className="text-lg font-semibold text-foreground">
                                {sections[activeSection].title}
                            </h2>
                        </div>
                    )}

                    {/* Quill Editor */}
                    {activeSection && sections[activeSection] && (
                        <div className="tender-editor-wrapper">
                            <ReactQuill
                                ref={quillRef}
                                key={activeSection}
                                theme="snow"
                                value={sections[activeSection]?.content || ''}
                                onChange={handleContentChange}
                                modules={QUILL_MODULES}
                                formats={QUILL_FORMATS}
                                placeholder="Start typing your content..."
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Hidden print-ready element for PDF export */}
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
                </div>
            </div>
        </div>
    )
}

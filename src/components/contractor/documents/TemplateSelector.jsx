import React from 'react'
import { useNavigate } from 'react-router-dom'
import { TEMPLATES } from './tenderTemplates'
import { Button } from '@/components/ui/button'
import {
    IconFileText,
    IconPlus,
    IconArrowLeft,
} from '@tabler/icons-react'

export default function TemplateSelector() {
    const navigate = useNavigate()

    const handleSelectTemplate = (templateId) => {
        navigate(`/cdocuments/new?template=${templateId}`)
    }

    const handleBlank = () => {
        navigate('/cdocuments/new?template=blank')
    }

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/cdocuments')}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                >
                    <IconArrowLeft className="size-4" />
                    Back to Documents
                </button>
                <h1 className="text-3xl font-bold tracking-tight">
                    Choose a Template
                </h1>
                <p className="text-muted-foreground mt-2 text-base">
                    Select a predefined tender document template to get started, or start
                    with a blank document.
                </p>
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {TEMPLATES.map((template) => (
                    <div
                        key={template.id}
                        className="group relative rounded-xl border bg-card p-6 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer"
                        onClick={() => handleSelectTemplate(template.id)}
                    >
                        {/* Icon */}
                        <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-4"
                            style={{ backgroundColor: template.color + '15', color: template.color }}
                        >
                            {template.icon}
                        </div>

                        {/* Content */}
                        <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                            {template.name}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                            {template.description}
                        </p>

                        {/* Section count badge */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <IconFileText className="size-3.5" />
                            <span>{template.sections.length} sections</span>
                        </div>

                        {/* Hover CTA */}
                        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button size="sm" className="w-full" style={{ backgroundColor: template.color }}>
                                Use Template
                            </Button>
                        </div>
                    </div>
                ))}

                {/* Blank Document */}
                <div
                    className="group relative rounded-xl border-2 border-dashed bg-card/50 p-6 hover:border-primary/40 hover:bg-card transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center min-h-[230px]"
                    onClick={handleBlank}
                >
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                        <IconPlus className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                        Start from Scratch
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Create a blank document and add your own content
                    </p>
                </div>
            </div>
        </div>
    )
}

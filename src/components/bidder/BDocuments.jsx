import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import supabase from '../../../supabase-client.js'
import { toast } from 'sonner'
import {
  IconPlus,
  IconSearch,
  IconFileText,
  IconTrash,
  IconEdit,
  IconFileTypePdf,
  IconFileTypeDocx,
  IconLoader2,
  IconClock,
  IconDots,
  IconBuilding,
  IconUser,
} from '@tabler/icons-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { exportBidProposalToDocx } from '../contractor/documents/exportUtils'

const STATUS_STYLES = {
  draft: {
    label: 'Draft',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  complete: {
    label: 'Complete',
    bg: 'bg-green-50 dark:bg-green-950/30',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
}

const TEMPLATE_LABELS = {
  full: 'Full Proposal',
  compact: 'Compact Proposal',
  blank: 'Custom Proposal',
}

export default function BDocuments() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    if (user?.email) {
      fetchProposals()
    }
  }, [user?.email])

  const fetchProposals = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('bid_proposals')
        .select('*')
        .eq('user_email', user?.email || '')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setProposals(data || [])
    } catch (error) {
      console.error('Error fetching proposals:', error)
      toast.error('Failed to load proposals')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (docId) => {
    try {
      setDeleting(docId)
      const { error } = await supabase
        .from('bid_proposals')
        .delete()
        .eq('id', docId)

      if (error) throw error

      setProposals((prev) => prev.filter((d) => d.id !== docId))
      toast.success('Proposal deleted')
    } catch (error) {
      console.error('Error deleting proposal:', error)
      toast.error('Failed to delete proposal')
    } finally {
      setDeleting(null)
    }
  }

  const handleQuickExportDocx = async (doc) => {
    try {
      toast.info('Generating Word document...')
      await exportBidProposalToDocx(
        doc.sections || {},
        doc.attached_documents || [],
        doc.title || 'bid-proposal'
      )
      toast.success('Word document downloaded')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export')
    }
  }

  const filteredProposals = proposals.filter((doc) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      doc.title?.toLowerCase().includes(q) ||
      doc.template_type?.toLowerCase().includes(q)
    )
  })

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Bid Proposals</h1>
        <p className="text-muted-foreground mt-1">
          Draft, manage, and export professional bid proposals with supporting documents.
        </p>
      </div>

      {/* Actions bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
            <IconSearch className="size-4" />
          </span>
          <Input
            placeholder="Search proposals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => navigate('/bdocuments/templates')}
          className="gap-2"
        >
          <IconPlus className="size-4" />
          Create Proposal
        </Button>
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <IconFileText className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">
            {searchQuery ? 'No proposals found' : 'No proposals yet'}
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            {searchQuery
              ? 'Try adjusting your search query.'
              : 'Create your first professional bid proposal using our tailored templates.'}
          </p>
          {!searchQuery && (
            <Button onClick={() => navigate('/bdocuments/templates')} className="gap-2">
              <IconPlus className="size-4" />
              Create Your First Proposal
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredProposals.map((doc) => {
            const status = STATUS_STYLES[doc.status] || STATUS_STYLES.draft
            const sectionCount = Object.keys(doc.sections || {}).length
            const hasAttachments = (doc.attached_documents || []).length > 0
            const bidderType = doc.bidder_type || 'company'

            return (
              <div
                key={doc.id}
                className="group flex items-center gap-4 rounded-xl border bg-card p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => navigate(`/bdocuments/edit/${doc.id}`)}
              >
                {/* Icon */}
                <div className="w-11 h-11 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                  <IconFileText className="size-5 text-primary" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-sm truncate">
                      {doc.title || 'Untitled Proposal'}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${status.bg} ${status.text} ${status.border}`}
                    >
                      {status.label}
                    </span>
                    {hasAttachments && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border bg-blue-50 text-blue-700 border-blue-200">
                        Attachments
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {bidderType === 'company' ? <IconBuilding className="size-3" /> : <IconUser className="size-3" />}
                      <span className="capitalize">{bidderType}</span>
                    </span>
                    <span>•</span>
                    <span>{TEMPLATE_LABELS[doc.template_type] || doc.template_type}</span>
                    <span>•</span>
                    <span>{sectionCount} section{sectionCount !== 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <IconClock className="size-3" />
                      {formatDate(doc.updated_at)} at {formatTime(doc.updated_at)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <IconDots className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => navigate(`/bdocuments/edit/${doc.id}`)}>
                        <IconEdit className="size-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleQuickExportDocx(doc)}>
                        <IconFileTypeDocx className="size-4 mr-2" />
                        Export as Word
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(doc.id)}
                        disabled={deleting === doc.id}
                      >
                        {deleting === doc.id ? (
                          <IconLoader2 className="size-4 mr-2 animate-spin" />
                        ) : (
                          <IconTrash className="size-4 mr-2" />
                        )}
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

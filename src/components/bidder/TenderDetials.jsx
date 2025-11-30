import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { IconMapPin, IconClock, IconCalendar, IconTag, IconArrowLeft, IconFileText } from "@tabler/icons-react"
import supabase from "../../../supabase-client.js"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"

function daysUntil(dateStr) {
  const today = new Date()
  const then = new Date(dateStr + "T00:00:00")
  const diff = Math.ceil((then - today) / (1000 * 60 * 60 * 24))
  return diff
}

export default function TenderDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tender, setTender] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [bidModalOpen, setBidModalOpen] = useState(false)
  const [bidAmount, setBidAmount] = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [bidError, setBidError] = useState("")
  const [userBid, setUserBid] = useState(null)

  useEffect(() => {
    if (id && user?.email) {
      fetchTenderDetails()
      fetchUserBid()
    }
  }, [id, user?.email])

  async function fetchTenderDetails() {
    try {
      setLoading(true)
      setError("")
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setTender(data)
    } catch (err) {
      console.error('Error fetching tender details:', err)
      setError(err?.message || 'Failed to load tender details')
    } finally {
      setLoading(false)
    }
  }

  async function fetchUserBid() {
    const { data, error } = await supabase
      .from('bids')
      .select('*')
      .eq('tender_id', id)
      .eq('bidder', user.email)
      .maybeSingle()
    if (!error) setUserBid(data)
  }

  function handleViewDocument() {
    if (tender?.document_url) {
      window.open(tender.document_url, '_blank')
    }
  }

  function handleBid() {
    if (!user?.email) {
      setError("You must be logged in to submit a bid")
      return
    }
    if (userBid) {
      toast.info('You have already placed a bid on this tender.')
      return
    }
    setBidModalOpen(true)
    setBidError("")
    setBidAmount("")
    setSelectedFile(null)
  }

  function handleCloseBidModal() {
    setBidModalOpen(false)
    setBidError("")
    setBidAmount("")
    setSelectedFile(null)
  }

  async function uploadProposal(file) {
    if (!file) return null

    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `bid-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `bid-proposals/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('tender-documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('tender-documents')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading proposal:', error)
      throw error
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmitBid(e) {
    e.preventDefault()
    setBidError("")

    if (!bidAmount.trim()) {
      setBidError("Please enter a bid amount")
      return
    }

    const amount = parseFloat(bidAmount)
    if (isNaN(amount) || amount <= 0) {
      setBidError("Please enter a valid bid amount greater than 0")
      return
    }

    if (!selectedFile) {
      setBidError("Please upload your bid proposal document")
      return
    }

    if (!user?.email) {
      setBidError("You must be logged in to submit a bid")
      return
    }

    try {
      setSubmitting(true)

      // Upload proposal document
      const proposalUrl = await uploadProposal(selectedFile)

      // Create bid in database
      const { data, error } = await supabase
        .from('bids')
        .insert({
          tender_id: id,
          bidder: user.email,
          bid_amount: amount,
          proposal_url: proposalUrl,
          status: 'submitted'
        })
        .select()
        .single()

      if (error) throw error

      // Show success toast
      toast.success('Bid submitted successfully!', {
        description: `Your bid of R${amount} has been submitted for ${tender.title}.`,
        duration: 5000,
      })
      
      // Close modal and refresh tender details
      handleCloseBidModal()
      
      // Refresh the page to show the updated bid list
      window.location.reload()
    } catch (err) {
      console.error('Error submitting bid:', err)
      const errorMessage = err?.message || 'Failed to submit bid. Please try again.'
      setBidError(errorMessage)
      toast.error('Bid submission failed', {
        description: errorMessage,
        duration: 5000,
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-muted-foreground">Loading tender details...</div>
      </div>
    )
  }

  if (error || !tender) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-red-600 mb-4">{error || "Tender not found"}</div>
        <Button variant="outline" onClick={() => navigate("/tenders")}>
          <IconArrowLeft className="size-4" />
          Back to Tenders
        </Button>
      </div>
    )
  }

  const days = tender.closing_date ? daysUntil(tender.closing_date) : null
  const statusColor = tender.status === 'open' ? 'bg-green-50 text-green-700 border-green-100' : 
                      tender.status === 'closed' ? 'bg-red-50 text-red-700 border-red-100' : 
                      'bg-gray-50 text-gray-700 border-gray-100'

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Button 
        variant="ghost" 
        onClick={() => navigate("/tenders")}
        className="mb-4"
      >
        <IconArrowLeft className="size-4" />
        Back to Tenders
      </Button>

      <Card className="w-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{tender.title}</CardTitle>
              <div className="flex items-center gap-2 mb-2">
                <span className={`rounded-full px-3 py-1 text-xs font-medium border capitalize ${statusColor}`}>
                  {tender.status || 'open'}
                </span>
                {days !== null && (
                  <span className={`text-sm font-medium ${
                    days > 0 ? 'text-orange-600' : days === 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {days > 0 ? `Closes in ${days} days` : days === 0 ? "Closes today" : "Closed"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {tender.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <CardDescription className="text-base whitespace-pre-wrap">
                {tender.description}
              </CardDescription>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tender.province && (
              <div className="flex items-start gap-3">
                <IconMapPin className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Province</p>
                  <p className="font-medium">{tender.province}</p>
                </div>
              </div>
            )}

            {tender.budget && (
              <div className="flex items-start gap-3">
                <IconTag className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="font-medium">R{tender.budget}</p>
                </div>
              </div>
            )}

            {tender.closing_date && (
              <div className="flex items-start gap-3">
                <IconCalendar className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Closing Date</p>
                  <p className="font-medium">{tender.closing_date}</p>
                </div>
              </div>
            )}

            {tender.created_at && (
              <div className="flex items-start gap-3">
                <IconClock className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Published Date</p>
                  <p className="font-medium">
                    {new Date(tender.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}

            {tender.posted_by && (
              <div className="flex items-start gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Posted By</p>
                  <p className="font-medium">{tender.posted_by}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex gap-4 pt-6 border-t">
          {tender.document_url && (
            <Button 
              variant="outline" 
              onClick={handleViewDocument}
              className="flex-1"
            >
              <IconFileText className="size-4" />
              View Documentation
            </Button>
          )}
          <Button 
            onClick={handleBid}
            className="flex-1"
            disabled={tender.status === 'closed' || (days !== null && days < 0) || !!userBid}
            style={userBid ? {backgroundColor:'#4a5565', color:'#ffff', cursor: 'not-allowed', borderColor:'#e5e7eb'} : {}}
          >
            {userBid ? 'Bid Already Placed' : 'Bid'}
          </Button>
        </CardFooter>
      </Card>

      {/* Bid Modal */}
      <Dialog open={bidModalOpen} onOpenChange={setBidModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Submit Your Bid</DialogTitle>
            <DialogDescription>
              Enter your bid amount and upload your proposal document for this tender.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitBid}>
            <div className="space-y-4 py-4">
              {/* Bid Amount Input */}
              <div className="space-y-2">
                <label htmlFor="bidAmount" className="text-sm font-medium">
                  Bid Amount (R) <span className="text-red-500">*</span>
                </label>
                <Input
                  id="bidAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter your bid amount"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  disabled={submitting || uploading}
                  required
                />
              </div>

              {/* File Upload Section */}
              <div className="space-y-2">
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800 font-medium mb-1">Important Note:</p>
                  <p className="text-xs text-blue-700">
                    Please ensure you have submitted all supporting documents and your bid documents in one file before uploading.
                  </p>
                </div>
                <label htmlFor="proposalFile" className="text-sm font-medium">
                  Bid Proposal Document <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    id="proposalFile"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    disabled={submitting || uploading}
                    required
                    className="cursor-pointer"
                  />
                </div>
                {selectedFile && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>

              {/* Error Message */}
              {bidError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {bidError}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseBidModal}
                disabled={submitting || uploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || uploading || !bidAmount.trim() || !selectedFile}
              >
                {uploading ? "Uploading..." : submitting ? "Submitting..." : "Submit Bid"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}


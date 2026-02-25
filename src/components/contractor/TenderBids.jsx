import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { IconArrowLeft, IconFileText, IconCheck, IconX, IconLock } from "@tabler/icons-react"
import { toast } from "sonner"
import supabase from "../../../supabase-client"
import { useAuth } from "@/context/AuthContext"

export default function TenderBids() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tender, setTender] = useState(null)
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updating, setUpdating] = useState(null) // Track which bid is being updated

  useEffect(() => {
    if (id) {
      fetchTenderDetails()
      fetchBids()
    }
  }, [id])

  async function fetchTenderDetails() {
    try {
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
    }
  }

  async function fetchBids() {
    try {
      setLoading(true)
      setError("")
      const { data, error } = await supabase
        .from('bids')
        .select('*')
        .eq('tender_id', id)
        .order('submitted_at', { ascending: false })

      if (error) throw error
      setBids(data || [])
    } catch (err) {
      console.error('Error fetching bids:', err)
      setError(err?.message || 'Failed to load bids')
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusUpdate(bidId, newStatus) {
    if (!user?.email) {
      alert("You must be logged in to update bid status")
      return
    }

    try {
      setUpdating(bidId)

      // 1. Get bid details first
      const { data: bidData, error: bidFetchError } = await supabase
        .from('bids')
        .select('*')
        .eq('id', bidId)
        .single()

      if (bidFetchError) throw bidFetchError

      // 2. Update the status
      const { error } = await supabase
        .from('bids')
        .update({ status: newStatus })
        .eq('id', bidId)

      if (error) throw error

      // 3. Send notification to the bidder
      try {
        const { data: userData } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('user_email', bidData.bidder)
          .single()

        if (userData) {
          await supabase.from('notifications').insert({
            user_email: bidData.bidder,
            type: newStatus === 'approved' ? 'AWARDED_TENDER' : 'REJECTED_BID',
            title: newStatus === 'approved' ? 'Bid Approved!' : 'Bid Update',
            message: newStatus === 'approved'
              ? `Congratulations! Your bid for "${tender?.title}" has been approved.`
              : `Your bid for "${tender?.title}" was not successful.`,
            tender_id: id,
            is_read: false
          })
        }

        // If approving, notify others who were automatically rejected by the DB trigger
        if (newStatus === 'approved') {
          const { data: otherBids } = await supabase
            .from('bids')
            .select('bidder')
            .eq('tender_id', id)
            .neq('id', bidId)
            .eq('status', 'rejected') // They should be rejected now by trigger

          if (otherBids && otherBids.length > 0) {
            const otherEmails = otherBids.map(b => b.bidder)
            const { data: otherRoles } = await supabase
              .from('user_roles')
              .select('user_id, user_email')
              .in('user_email', otherEmails)

            if (otherRoles && otherRoles.length > 0) {
              const otherNotifs = otherRoles.map(r => ({
                user_email: r.user_email,
                type: 'REJECTED_BID',
                title: 'Bid Update',
                message: `The tender "${tender?.title}" has been awarded to another bidder.`,
                tender_id: id,
                is_read: false
              }))
              await supabase.from('notifications').insert(otherNotifs)
            }
          }
        }
      } catch (notifErr) {
        console.error('Failed to send notification:', notifErr)
      }

      // Refresh bids list to show updated status
      await fetchBids()
    } catch (err) {
      console.error('Error updating bid status:', err)
      alert(`Failed to update bid status: ${err?.message || 'Unknown error'}`)
    } finally {
      setUpdating(null)
    }
  }

  async function handleFinalizeTender() {
    if (!window.confirm("Are you sure you want to close this tender and finalize your team? All unapproved bids will be automatically rejected.")) {
      return
    }

    try {
      setLoading(true)

      // 1. Fetch bids that will be rejected before we update them
      const { data: bidsToReject } = await supabase
        .from('bids')
        .select('bidder')
        .eq('tender_id', id)
        .eq('status', 'submitted')

      // 2. Update tender status
      const { error: tenderError } = await supabase
        .from('tenders')
        .update({ status: 'closed' })
        .eq('id', id)

      if (tenderError) throw tenderError

      // 3. Reject all remaining 'submitted' bids
      const { error: bidsError } = await supabase
        .from('bids')
        .update({ status: 'rejected' })
        .eq('tender_id', id)
        .eq('status', 'submitted')

      if (bidsError) throw bidsError

      // 4. Notify rejected bidders
      try {
        if (bidsToReject && bidsToReject.length > 0) {
          const emails = bidsToReject.map(b => b.bidder)
          const { data: userRoles } = await supabase
            .from('user_roles')
            .select('user_email, user_id')
            .in('user_email', emails)

          if (userRoles && userRoles.length > 0) {
            const notifications = userRoles.map(role => ({
              user_email: role.user_email,
              type: 'REJECTED_BID',
              title: 'Tender Closed',
              message: `The tender "${tender?.title}" has been closed and your bid was not successful.`,
              tender_id: id,
              is_read: false
            }))

            await supabase.from('notifications').insert(notifications)
          }
        }
      } catch (notifErr) {
        console.error('Failed to notify rejected bidders:', notifErr)
      }

      toast.success('Tender finalized successfully')

      await fetchTenderDetails()
      await fetchBids()
    } catch (err) {
      console.error('Error finalizing tender:', err)
      toast.error(`Failed to finalize tender: ${err?.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-100'
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-100'
      case 'submitted':
        return 'bg-blue-50 text-blue-700 border-blue-100'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100'
    }
  }

  if (loading && !tender) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (error && !tender) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-red-600 mb-4">{error}</div>
        <Button variant="outline" onClick={() => navigate("/tender")}>
          <IconArrowLeft className="size-4" />
          Back to Tenders
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Button
        variant="ghost"
        onClick={() => navigate("/tender")}
        className="mb-4"
      >
        <IconArrowLeft className="size-4" />
        Back to Tenders
      </Button>

      {tender && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>{tender.title}</CardTitle>
            {tender.status !== 'closed' && (
              <Button
                onClick={handleFinalizeTender}
                className="bg-primary hover:bg-primary/90"
              >
                <IconLock className="size-4 mr-2" />
                Close Tender & Finalize Team
              </Button>
            )}
            {tender.status === 'closed' && (
              <span className="rounded-full bg-red-100 text-red-700 px-3 py-1 text-sm font-medium border border-red-200">
                Tender Closed
              </span>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>Total Bids: {bids.length}</p>
              {tender.budget && <p>Budget: R{tender.budget}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-muted-foreground">Loading bids...</div>
      ) : bids.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No bids submitted for this tender yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Bids for this Tender</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bidder</TableHead>
                  {tender?.required_roles?.length > 0 && (
                    <TableHead>Role</TableHead>
                  )}
                  <TableHead>Bid Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Proposal</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bids.map((bid) => (
                  <TableRow key={bid.id}>
                    <TableCell className="font-medium">
                      {bid.bidder}
                      {bid.role === 'Company (All Roles)' && (
                        <span className="ml-2 inline-flex items-center text-[10px] bg-blue-50 text-blue-700 border-blue-200 px-1.5 py-0.5 rounded border">
                          Company
                        </span>
                      )}
                    </TableCell>
                    {tender?.required_roles?.length > 0 && (
                      <TableCell>
                        <span className="inline-flex items-center bg-secondary/50 text-secondary-foreground text-xs px-2 py-1 rounded border">
                          {bid.role || '—'}
                        </span>
                      </TableCell>
                    )}
                    <TableCell>R{parseFloat(bid.bid_amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium border capitalize ${getStatusColor(bid.status)}`}>
                        {bid.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {bid.submitted_at
                        ? new Date(bid.submitted_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {bid.proposal_url ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(bid.proposal_url, '_blank')}
                        >
                          <IconFileText className="size-4" />
                          View
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">No document</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {bid.status === 'submitted' && tender?.status !== 'closed' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusUpdate(bid.id, 'approved')}
                              disabled={updating === bid.id}
                              className="text-green-600 hover:text-green-700"
                            >
                              <IconCheck className="size-4" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusUpdate(bid.id, 'rejected')}
                              disabled={updating === bid.id}
                              className="text-red-600 hover:text-red-700"
                            >
                              <IconX className="size-4" />
                              Reject
                            </Button>
                          </>
                        )}
                        {(bid.status !== 'submitted' || tender?.status === 'closed') && (
                          <span className="text-xs text-muted-foreground">
                            {updating === bid.id ? 'Updating...' : bid.status === 'submitted' ? 'Tender Closed' : 'Already reviewed'}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

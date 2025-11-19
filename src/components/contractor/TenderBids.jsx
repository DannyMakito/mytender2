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
import { IconArrowLeft, IconFileText, IconCheck, IconX } from "@tabler/icons-react"
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
      const { error } = await supabase
        .from('bids')
        .update({ status: newStatus })
        .eq('id', bidId)

      if (error) throw error

      // Refresh bids list to show updated status
      await fetchBids()
    } catch (err) {
      console.error('Error updating bid status:', err)
      alert(`Failed to update bid status: ${err?.message || 'Unknown error'}`)
    } finally {
      setUpdating(null)
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
          <CardHeader>
            <CardTitle>{tender.title}</CardTitle>
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
                    <TableCell className="font-medium">{bid.bidder}</TableCell>
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
                        {bid.status === 'submitted' && (
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
                        {bid.status !== 'submitted' && (
                          <span className="text-xs text-muted-foreground">
                            {updating === bid.id ? 'Updating...' : 'Already reviewed'}
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

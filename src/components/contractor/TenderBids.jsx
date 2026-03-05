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
import { IconArrowLeft, IconFileText, IconCheck, IconX, IconLock, IconClock } from "@tabler/icons-react"
import { toast } from "sonner"
import supabase from "../../../supabase-client"
import { useAuth } from "@/context/AuthContext"
import ContractProgress from "./ContractProgress"

export default function TenderBids() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tender, setTender] = useState(null)
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updating, setUpdating] = useState(null) // Track which bid is being updated
  const [contract, setContract] = useState(null) // Track if contract exists
  const [project, setProject] = useState(null) // Track linked project
  const [projectLoading, setProjectLoading] = useState(false)
  const [contractDebug, setContractDebug] = useState(null)

  useEffect(() => {
    if (id && user) {
      fetchTenderDetails()
      fetchBids()
      checkForContract()
      fetchLinkedProject()
    }
  }, [id, user])

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

  async function checkForContract() {
    try {
      setContractDebug("Fetching contract...")
      const { data, error } = await supabase
        .from('contracts')
        .select('id, status')
        .eq('tender_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        setContractDebug(`Error fetching contract: ${error.message}`)
        throw error
      }

      if (data) {
        setContractDebug(`Contract found: ID ${data.id}, Status ${data.status}`)
        setContract(data)
      } else {
        setContractDebug(`No contract returned for tender_id: ${id}`)
        setContract(null)
      }
    } catch (err) {
      console.error('Error checking for contract:', err)
      setContract(null)
    }
  }

  async function fetchLinkedProject() {
    try {
      setProjectLoading(true)
      const { data, error } = await supabase
        .from('projects')
        .select('*, tasks(*)')
        .eq('tender_id', id)
        .maybeSingle()

      if (data) {
        setProject(data)
      }
    } catch (err) {
      console.error('Error fetching linked project:', err)
    } finally {
      setProjectLoading(false)
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

      // 3. Send notification to the bidder directly (no user_roles lookup needed)
      try {
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
    if (!window.confirm("Finalizing this tender will open a contract generation page. Proceed?")) {
      return
    }

    try {
      // Get all approved bids
      const { data: approvedBids, error: bidsError } = await supabase
        .from('bids')
        .select('*')
        .eq('tender_id', id)
        .eq('status', 'approved')

      if (bidsError) throw bidsError

      if (!approvedBids || approvedBids.length === 0) {
        toast.error('Please approve at least 2 bids before finalizing')
        return
      }

      // Navigate to contract page
      navigate(`/contract/${id}`)
    } catch (err) {
      console.error('Error preparing finalization:', err)
      toast.error(`Failed to prepare finalization: ${err?.message || 'Unknown error'}`)
    }
  }


  function getStatusColor(status) {
    switch (status) {
      case 'approved':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-100'
      case 'submitted':
        return 'bg-amber-50 text-amber-700 border-amber-100'
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

      {contractDebug && (
        <div className="mb-4 p-3 bg-slate-100 text-slate-800 text-xs rounded-md border border-slate-300 font-mono">
          <strong>Debug Contract Progress:</strong> {contractDebug}
        </div>
      )}

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Description</h4>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{tender.description || 'No description provided.'}</p>
                </div>

                {tender.required_roles && tender.required_roles.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Required Roles / Items</h4>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tender.required_roles.map(role => (
                        <span key={role} className="inline-flex items-center bg-secondary/50 text-secondary-foreground text-[11px] px-2 py-0.5 rounded border">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 border-l md:pl-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Bids</p>
                    <p className="font-medium">{bids.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Budget</p>
                    <p className="font-medium">{tender.budget ? `R${tender.budget}` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Province</p>
                    <p className="font-medium">{tender.province || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Category</p>
                    <p className="font-medium">{tender.category || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Closing Date</p>
                    <p className="font-medium">{tender.closing_date || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tender Type</p>
                    <p className="font-medium capitalize">{tender.tender_type || 'Project'}</p>
                  </div>
                </div>

                {tender.document_url && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(tender.document_url, '_blank')}
                    >
                      <IconFileText className="size-4 mr-2" />
                      View Tender Document
                    </Button>
                  </div>
                )}

                {tender.project_id && (
                  <div className="mt-2 flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-md">
                      <IconFileText className="size-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-orange-500 tracking-wider">Linked to Project</p>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-orange-700 font-semibold text-xs"
                        onClick={() => navigate(`/projects`)}
                      >
                        View Parent Project
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tender?.status === 'closed' && (
        <div className="space-y-6">
          {contract && (
            <ContractProgress tenderId={id} contractId={contract.id} />
          )}

          {/* Project Progress Section */}
          {project && (
            <Card className="border-blue-200 bg-blue-50/10">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconFileText className="size-5" />
                    Project Execution Progress
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-700 border-blue-200 hover:bg-blue-50"
                    onClick={() => navigate('/projects')}
                  >
                    Go to Project Board
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Task Progress Bar */}
                  {project.tasks && project.tasks.length > 0 ? (
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Task Completion</span>
                        <span className="text-sm font-medium">
                          {Math.round((project.tasks.filter(t => t.status === 'done').length / project.tasks.length) * 100)}%
                        </span>
                      </div>
                      <progress
                        value={project.tasks.filter(t => t.status === 'done').length}
                        max={project.tasks.length}
                        className="w-full h-2 rounded overflow-hidden"
                      />
                      <div className="flex justify-between mt-1.5 text-xs text-muted-foreground font-medium">
                        <span>{project.tasks.filter(t => t.status === 'done').length} Done</span>
                        <span>{project.tasks.filter(t => t.status !== 'done').length} Remaining</span>
                        <span>{project.tasks.length} Total</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-sm border border-dashed rounded-lg">
                      Project board initialized. No tasks created yet.
                    </div>
                  )}

                  {/* Milestones */}
                  {project.tasks && project.tasks.some(t => t.is_milestone) && (
                    <div className="pt-2">
                      <h4 className="text-xs font-bold uppercase text-blue-800 mb-3 tracking-wider">Key Milestones</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {project.tasks.filter(t => t.is_milestone).map(milestone => (
                          <div key={milestone.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-100 shadow-sm">
                            <div className={`p-2 rounded-full ${milestone.status === 'done' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                              {milestone.status === 'done' ? <IconCheck className="size-4" /> : <IconClock className="size-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate ${milestone.status === 'done' ? 'text-green-800' : 'text-blue-900'}`}>{milestone.title}</p>
                              <p className="text-[10px] text-muted-foreground capitalize">{milestone.status === 'done' ? 'Completed' : 'Upcoming'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Successful Bidders Section */}
          {bids.some(b => b.status === 'approved') && (
            <Card className="border-orange-200 bg-orange-50/30">
              <CardHeader>
                <CardTitle className="text-orange-800 flex items-center gap-2">
                  <IconCheck className="size-5" />
                  Successful Bidders (Team Members)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bids.filter(b => b.status === 'approved').map(bid => (
                    <div key={bid.id} className="bg-white p-4 rounded-lg border border-orange-100 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-bold text-sm truncate" title={bid.bidder}>{bid.bidder}</h5>
                        <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold uppercase">Approved</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">Role: <span className="text-foreground font-medium">{bid.role}</span></p>
                      <p className="text-xs text-muted-foreground mb-3">Amount: <span className="text-foreground font-medium">R{parseFloat(bid.bid_amount).toLocaleString('en-ZA')}</span></p>
                      {bid.proposal_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-orange-600 p-0 hover:bg-transparent hover:text-orange-700"
                          onClick={() => window.open(bid.proposal_url, '_blank')}
                        >
                          <IconFileText className="size-3 mr-1" />
                          View Proposal
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {error && (
        <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {tender?.status !== 'closed' && (
        <div className="mt-6">
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
                      <TableHead>Role</TableHead>
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
                            <span className="ml-2 inline-flex items-center text-[10px] bg-orange-50 text-orange-700 border-orange-200 px-1.5 py-0.5 rounded border">
                              Company
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center bg-secondary/50 text-secondary-foreground text-xs px-2 py-1 rounded border">
                            {bid.role === 'supplier' ? 'Supplier' : bid.role || '—'}
                          </span>
                        </TableCell>
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
                                  className="text-orange-600 hover:text-orange-700"
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
      )}

    </div>
  )
}

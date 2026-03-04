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
import {
    IconMapPin,
    IconClock,
    IconCalendar,
    IconArrowLeft,
    IconFileText,
    IconReceipt2,
    IconCheck
} from "@tabler/icons-react"
import supabase from "../../../supabase-client.js"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { format } from "date-fns"

export default function STenderDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user, accountStatus } = useAuth()
    const [tender, setTender] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [bidModalOpen, setBidModalOpen] = useState(false)
    const [quoteAmount, setQuoteAmount] = useState("")
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
            const { data, error } = await supabase
                .from('tenders')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            setTender(data)
        } catch (err) {
            console.error('Error fetching tender details:', err)
            setError('Failed to load tender details')
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

    async function handleSubmitQuote(e) {
        e.preventDefault()
        setBidError("")

        if (!quoteAmount.trim()) {
            setBidError("Please enter your quotation amount")
            return
        }

        const amount = parseFloat(quoteAmount)
        if (isNaN(amount) || amount <= 0) {
            setBidError("Please enter a valid amount")
            return
        }

        if (!selectedFile) {
            setBidError("Please upload your invoice/quotation document")
            return
        }

        try {
            setSubmitting(true)
            setUploading(true)

            // Upload invoice
            const fileExt = selectedFile.name.split('.').pop()
            const fileName = `invoice-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
            const filePath = `supplier-invoices/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('tender-documents')
                .upload(filePath, selectedFile)

            if (uploadError) throw uploadError

            const { data: urlData } = supabase.storage
                .from('tender-documents')
                .getPublicUrl(filePath)

            // Create bid
            const { error: bidError } = await supabase
                .from('bids')
                .insert({
                    tender_id: id,
                    bidder: user.email,
                    bid_amount: amount,
                    proposal_url: urlData.publicUrl,
                    status: 'submitted'
                })

            if (bidError) throw bidError

            // Notify owner
            if (tender?.posted_by) {
                await supabase.from('notifications').insert({
                    user_email: tender.posted_by,
                    type: 'NEW_BID',
                    title: 'New Quotation Received',
                    message: `Supplier ${user.email} submitted a quotation of R${amount.toLocaleString()} for "${tender.title}".`,
                    tender_id: id
                })
            }

            toast.success('Quotation submitted successfully!')
            setBidModalOpen(false)
            fetchUserBid()
        } catch (err) {
            console.error('Error submitting quote:', err)
            setBidError(err.message || "Failed to submit quotation")
        } finally {
            setSubmitting(false)
            setUploading(false)
        }
    }

    if (loading) return <div className="p-8 text-center">Loading...</div>
    if (error || !tender) return <div className="p-8 text-center text-red-500">{error || "Tender not found"}</div>

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <Button variant="ghost" onClick={() => navigate("/stenders")} className="gap-2">
                <IconArrowLeft className="size-4" /> Back to Tenders
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant="outline">{tender.category || "General"}</Badge>
                                {userBid && (
                                    <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 flex gap-1">
                                        <IconCheck className="size-3" /> Submitted
                                    </Badge>
                                )}
                            </div>
                            <CardTitle className="text-2xl">{tender.title}</CardTitle>
                            <div className="flex flex-wrap gap-4 mt-2">
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <IconMapPin className="h-4 w-4 mr-1" />
                                    {tender.province}
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <IconCalendar className="h-4 w-4 mr-1" />
                                    Ends {format(new Date(tender.closing_date), 'MMM d, yyyy')}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="prose prose-sm max-w-none">
                            <h3 className="text-lg font-semibold mb-2">Description</h3>
                            <p className="text-muted-foreground whitespace-pre-wrap">{tender.description}</p>

                            {tender.required_roles && tender.required_roles.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-lg font-semibold mb-2">Requirements</h3>
                                    <ul className="list-disc pl-5 space-y-1">
                                        {tender.required_roles.map((req, idx) => (
                                            <li key={idx} className="text-muted-foreground">{req}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle className="text-lg text-center">Submission</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {userBid ? (
                                <div className="text-center p-4 bg-muted/50 rounded-lg">
                                    <IconReceipt2 className="size-10 mx-auto text-orange-500 mb-2" />
                                    <p className="font-semibold text-lg">R{userBid.bid_amount.toLocaleString()}</p>
                                    <p className="text-sm text-muted-foreground">Your quotation has been submitted.</p>
                                    <Button variant="outline" className="w-full mt-4" asChild>
                                        <a href={userBid.proposal_url} target="_blank" rel="noopener noreferrer">
                                            View Invoice
                                        </a>
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-muted-foreground text-center">
                                        Submit your quotation and invoice to bid for this tender.
                                    </p>
                                    <Button
                                        className={`w-full h-11 ${accountStatus === 'approved' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-400 cursor-not-allowed opacity-70'}`}
                                        onClick={() => {
                                            if (accountStatus === 'approved') {
                                                setBidModalOpen(true)
                                            } else {
                                                toast.error("Account Not Approved", {
                                                    description: "Your account must be approved by an admin before you can submit quotations. Current status: " + (accountStatus || 'pending')
                                                })
                                            }
                                        }}
                                    >
                                        {accountStatus === 'approved' ? 'Submit Quotation' : 'Account Not Approved'}
                                    </Button>
                                </>
                            )}
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3 pt-0">
                            {tender.document_url && (
                                <Button variant="outline" className="w-full gap-2" asChild>
                                    <a href={tender.document_url} target="_blank" rel="noopener noreferrer">
                                        <IconFileText className="size-4" /> Download Brief
                                    </a>
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            </div>

            <Dialog open={bidModalOpen} onOpenChange={setBidModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Submit Quotation</DialogTitle>
                        <DialogDescription>
                            Enter the total amount and upload your invoice or quotation document.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitQuote} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Quotation Amount (R)</label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={quoteAmount}
                                onChange={(e) => setQuoteAmount(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Invoice / Quotation File</label>
                            <Input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => setSelectedFile(e.target.files[0])}
                                required
                            />
                            <p className="text-[10px] text-muted-foreground">Max 5MB (PDF or Image)</p>
                        </div>
                        {bidError && <p className="text-sm text-red-500">{bidError}</p>}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setBidModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={submitting} className="bg-orange-500 hover:bg-orange-600">
                                {submitting ? "Submitting..." : "Submit Quote"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function Badge({ children, className = "", variant = "default" }) {
    const variants = {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "text-foreground border border-input hover:bg-accent hover:text-accent-foreground"
    }
    return (
        <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]} ${className}`}>
            {children}
        </div>
    )
}

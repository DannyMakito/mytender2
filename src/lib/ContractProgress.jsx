import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  IconCheck,
  IconClock,
  IconX,
  IconSend,
  IconDownload,
  IconEye,
  IconRefresh,
} from "@tabler/icons-react"
import { toast } from "sonner"
import supabase from "../../../supabase-client"
import { useAuth } from "@/context/AuthContext"

/**
 * ContractProgress Component
 * Displays real-time signing progress of contracts
 * Tracks which signatories have signed, declined, or are still pending
 */
export default function ContractProgress({ contractId }) {
  const { user } = useAuth()
  const [contract, setContract] = useState(null)
  const [signatories, setSignatories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [resending, setResending] = useState(null)

  useEffect(() => {
    if (contractId) {
      fetchContractData()

      // Set up real-time subscription
      const subscription = supabase
        .channel(`contract_${contractId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "contract_signatories",
            filter: `contract_id=eq.${contractId}`,
          },
          (payload) => {
            updateSignatoryStatus(payload.new)
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [contractId])

  async function fetchContractData() {
    try {
      setLoading(true)

      const { data: contractData, error: contractError } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", contractId)
        .single()

      if (contractError) throw contractError
      setContract(contractData)

      const { data: signatoriesData, error: signatoriesError } = await supabase
        .from("contract_signatories")
        .select("*")
        .eq("contract_id", contractId)
        .order("created_at", { ascending: true })

      if (signatoriesError) throw signatoriesError
      setSignatories(signatoriesData || [])
    } catch (err) {
      console.error("Error fetching contract data:", err)
      setError(err?.message || "Failed to load contract")
    } finally {
      setLoading(false)
    }
  }

  function updateSignatoryStatus(updatedSignatory) {
    setSignatories((prev) =>
      prev.map((s) => (s.id === updatedSignatory.id ? updatedSignatory : s))
    )
  }

  async function handleResendSigningRequest(signatory) {
    if (signatory.signing_status !== "pending") {
      toast.error("Can only resend to pending signatories")
      return
    }

    try {
      setResending(signatory.id)

      // In a real implementation, this would call DocuSign API to resend envelope

      // Send notification
      const notification = {
        user_email: signatory.signatory_email,
        type: "CONTRACT_REMINDER",
        title: "Contract Signature Reminder",
        message: `Reminder: Contract ${contract.contract_number} is still awaiting your signature`,
        contract_id: contract.id,
        is_read: false,
      }

      const { error } = await supabase.from("notifications").insert(notification)

      if (error) throw error

      toast.success(`Reminder sent to ${signatory.signatory_email}`)
    } catch (err) {
      console.error("Error resending:", err)
      toast.error("Failed to send reminder")
    } finally {
      setResending(null)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading contract...</div>
  }

  if (error) {
    return <div className="text-red-600 py-8">{error}</div>
  }

  if (!contract) {
    return <div className="text-center py-8 text-muted-foreground">Contract not found</div>
  }

  const signedCount = signatories.filter((s) => s.signing_status === "signed").length
  const declinedCount = signatories.filter((s) => s.signing_status === "declined").length
  const pendingCount = signatories.filter((s) => s.signing_status === "pending").length
  const viewedCount = signatories.filter((s) => s.signing_status === "viewed").length
  const totalSignatories = signatories.length

  const progressPercentage = totalSignatories > 0 ? (signedCount / totalSignatories) * 100 : 0
  const statusColor =
    contract.status === "executed"
      ? "text-green-600"
      : contract.status === "sent"
        ? "text-blue-600"
        : contract.status === "draft"
          ? "text-gray-600"
          : "text-red-600"

  return (
    <div className="space-y-6">
      {/* Contract Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{contract.contract_number}</CardTitle>
              <CardDescription>Contract Status Tracking</CardDescription>
            </div>
            <Badge className={`text-lg px-4 py-1 ${statusColor}`}>
              {contract.status.toUpperCase()}
            </Badge>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <p>
              <strong>Created:</strong> {new Date(contract.created_at).toLocaleDateString()}
            </p>
            {contract.sent_at && (
              <p>
                <strong>Sent:</strong> {new Date(contract.sent_at).toLocaleDateString()}
              </p>
            )}
            {contract.fully_executed_at && (
              <p>
                <strong>Fully Executed:</strong>{" "}
                {new Date(contract.fully_executed_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Signature Progress</CardTitle>
          <CardDescription>
            {signedCount} of {totalSignatories} signatories have signed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span className="font-semibold">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-muted-foreground">Signed</div>
              <div className="text-2xl font-bold text-green-600">{signedCount}</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-sm text-muted-foreground">Pending</div>
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-muted-foreground">Viewed</div>
              <div className="text-2xl font-bold text-blue-600">{viewedCount}</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="text-sm text-muted-foreground">Declined</div>
              <div className="text-2xl font-bold text-red-600">{declinedCount}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signatories Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Signatories</CardTitle>
          <CardDescription>All parties involved in this contract</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Bid Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Signed Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signatories.map((sig) => {
                  const isClient = sig.signatory_type === "client"
                  const statusBadge =
                    sig.signing_status === "signed" ? (
                      <Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                        <IconCheck className="size-3" />
                        Signed
                      </Badge>
                    ) : sig.signing_status === "pending" ? (
                      <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit">
                        <IconClock className="size-3" />
                        Pending
                      </Badge>
                    ) : sig.signing_status === "viewed" ? (
                      <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1 w-fit">
                        <IconEye className="size-3" />
                        Viewed
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                        <IconX className="size-3" />
                        Declined
                      </Badge>
                    )

                  return (
                    <TableRow key={sig.id}>
                      <TableCell>
                        <div className="font-medium">{sig.signatory_email}</div>
                        {sig.company_name && (
                          <div className="text-sm text-gray-500">{sig.company_name}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {isClient ? "Client" : "Bidder"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sig.bid_amount ? (
                          <strong>R{parseFloat(sig.bid_amount).toLocaleString("en-ZA")}</strong>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{statusBadge}</TableCell>
                      <TableCell>
                        {sig.signed_at ? (
                          <div className="text-sm">
                            {new Date(sig.signed_at).toLocaleDateString()}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {sig.signing_status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResendSigningRequest(sig)}
                              disabled={resending === sig.id}
                              title="Send reminder to sign"
                            >
                              <IconSend className="size-3" />
                            </Button>
                          )}
                          {sig.signed_at && sig.signed_document_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(sig.signed_document_url, "_blank")}
                              title="View signed document"
                            >
                              <IconDownload className="size-3" />
                            </Button>
                          )}
                          {sig.declined_reason && (
                            <Button
                              size="sm"
                              variant="ghost"
                              title={`Declined: ${sig.declined_reason}`}
                              disabled
                            >
                              <IconX className="size-3 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Download Final Document (Once Executed) */}
      {contract.status === "executed" && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900">Contract Fully Executed</CardTitle>
            <CardDescription className="text-green-800">
              All signatories have signed. You can now download the final signed contract.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="bg-green-600 hover:bg-green-700">
              <IconDownload className="size-4 mr-2" />
              Download Final Signed Contract
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Declined Reasons */}
      {signatories.some((s) => s.signing_status === "declined") && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900 text-lg">Declined Signatures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {signatories
                .filter((s) => s.signing_status === "declined")
                .map((s) => (
                  <div key={s.id} className="p-3 bg-white rounded border border-red-200">
                    <div className="font-medium">{s.signatory_email}</div>
                    <div className="text-sm text-red-700 mt-1">
                      <strong>Reason:</strong> {s.declined_reason || "No reason provided"}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Declined: {new Date(s.declined_at).toLocaleString()}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

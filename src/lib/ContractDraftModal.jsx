import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IconArrowLeft, IconDownload, IconSend, IconX, IconEye, IconFileText } from "@tabler/icons-react"
import { toast } from "sonner"
import supabase from "../../../supabase-client"
import { useAuth } from "@/context/AuthContext"
import { generateContractHTML, extractContractFormData, validateContractForm } from "@/lib/contractGenerator"

/**
 * ContractDraftModal
 * Shows draft contract generation, editing, and preview
 * Called when client clicks "Close Tender & Finalize Team"
 */
export default function ContractDraftModal({ open, onOpenChange, tender, approvedBids, onContractSent }) {
  const { user } = useAuth()
  const [step, setStep] = useState("preview") // preview | edit | confirm
  const [contractHTML, setContractHTML] = useState("")
  const [contract, setContract] = useState(null)
  const [loading, setLoading] = useState(false)
  const [draftVersions, setDraftVersions] = useState([])
  const [currentVersion, setCurrentVersion] = useState(1)

  useEffect(() => {
    if (open && tender && approvedBids.length > 0) {
      generateDraft()
    }
  }, [open, tender, approvedBids])

  async function generateDraft() {
    try {
      setLoading(true)

      // Generate HTML contract
      const html = generateContractHTML(
        tender,
        approvedBids,
        user?.email || "client@company.com",
        user?.email?.split("@")[0] || "Client Company"
      )
      setContractHTML(html)

      // Create contract record in DB with draft status
      const { data, error } = await supabase
        .from("contracts")
        .insert({
          tender_id: tender.id,
          status: "draft",
          content: html,
          terms_and_conditions: null,
          declarations_forms: null,
          created_by: user?.email,
        })
        .select()
        .single()

      if (error) throw error

      setContract(data)

      // Create version 1
      const { error: versionError } = await supabase
        .from("contract_versions")
        .insert({
          contract_id: data.id,
          version_number: 1,
          content: html,
          modified_by: user?.email,
          change_description: "Initial draft",
        })

      if (versionError) throw versionError

      setDraftVersions([{ version: 1, createdAt: new Date().toISOString() }])
      setCurrentVersion(1)

      // Insert signatories
      const signatories = [
        // Add client as signatory
        {
          contract_id: data.id,
          signatory_email: user?.email,
          signatory_type: "client",
          signing_status: "pending",
        },
        // Add bidders as signatories
        ...approvedBids.map((bid) => ({
          contract_id: data.id,
          signatory_email: bid.bidder,
          signatory_type: "bidder",
          bid_id: bid.id,
          bid_amount: parseFloat(bid.bid_amount),
          signing_status: "pending",
        })),
      ]

      const { error: sigError } = await supabase
        .from("contract_signatories")
        .insert(signatories)

      if (sigError) throw sigError

      toast.success("Contract draft created successfully")
      setStep("preview")
    } catch (err) {
      console.error("Error generating contract:", err)
      toast.error(`Failed to generate contract: ${err?.message}`)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveDraft() {
    try {
      setLoading(true)

      const formData = extractContractFormData()
      const errors = validateContractForm()

      if (errors.length > 0) {
        toast.error(errors[0])
        return
      }

      // Get updated T&C if modified
      const termsTextarea = document.getElementById("terms_textarea")
      const updatedTerms = termsTextarea?.value || null

      // Create new version
      const newVersion = currentVersion + 1
      const { error: versionError } = await supabase
        .from("contract_versions")
        .insert({
          contract_id: contract.id,
          version_number: newVersion,
          content: contractHTML,
          modified_by: user?.email,
          change_description: "Updated terms and forms",
        })

      if (versionError) throw versionError

      // Update contract with new content
      const { error: updateError } = await supabase
        .from("contracts")
        .update({
          content: contractHTML,
          terms_and_conditions: updatedTerms,
          declarations_forms: formData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contract.id)

      if (updateError) throw updateError

      setCurrentVersion(newVersion)
      setDraftVersions([
        ...draftVersions,
        { version: newVersion, createdAt: new Date().toISOString() },
      ])

      toast.success(`Contract updated to version ${newVersion}`)
    } catch (err) {
      console.error("Error saving draft:", err)
      toast.error(`Failed to save draft: ${err?.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendContract() {
    try {
      setLoading(true)

      // Validate before sending
      const errors = validateContractForm()
      if (errors.length > 0) {
        toast.error("Please fix all form errors before sending: " + errors[0])
        return
      }

      // Update contract status to "sent"
      const { error } = await supabase
        .from("contracts")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", contract.id)

      if (error) throw error

      // In a real implementation, this would call DocuSign API
      // For now, we just send notifications
      const signatories = await supabase
        .from("contract_signatories")
        .select("signatory_email")
        .eq("contract_id", contract.id)

      if (signatories.data && signatories.data.length > 0) {
        // Send notifications to all signatories
        const notifications = signatories.data.map((sig) => ({
          user_email: sig.signatory_email,
          type: "CONTRACT_READY",
          title: "Contract Ready for Signature",
          message: `A new contract (${contract.contract_number}) is ready for your signature on tender "${tender.title}"`,
          contract_id: contract.id,
          is_read: false,
        }))

        await supabase.from("notifications").insert(notifications)
      }

      toast.success(
        `Contract sent to ${approvedBids.length + 1} signatories for signature`
      )

      onContractSent?.(contract)
      onOpenChange(false)
    } catch (err) {
      console.error("Error sending contract:", err)
      toast.error(`Failed to send contract: ${err?.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    if (
      window.confirm(
        "Are you sure? This will delete the draft contract and all changes."
      )
    ) {
      try {
        setLoading(true)

        // Delete contract and all related records (cascade)
        const { error } = await supabase
          .from("contracts")
          .delete()
          .eq("id", contract.id)

        if (error) throw error

        toast.success("Contract draft discarded")
        onOpenChange(false)
      } catch (err) {
        console.error("Error canceling contract:", err)
        toast.error(`Failed to cancel contract: ${err?.message}`)
      } finally {
        setLoading(false)
      }
    }
  }

  if (!contract) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconFileText className="size-5" />
            Generate & Edit Contract
          </DialogTitle>
          <DialogDescription>
            Contract {contract?.contract_number} - {step === "preview" ? "Preview Draft" : "Edit Fields"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={step} onValueChange={setStep} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">
              <IconEye className="size-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="edit">
              <IconFileText className="size-4 mr-2" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="confirm">
              <IconSend className="size-4 mr-2" />
              Send
            </TabsTrigger>
          </TabsList>

          {/* PREVIEW TAB */}
          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contract Preview</CardTitle>
                <CardDescription>
                  Review the generated contract below. Make edits in the Edit tab and save versions before sending.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="bg-white border border-gray-200 rounded overflow-auto max-h-[500px] p-4"
                  dangerouslySetInnerHTML={{ __html: contractHTML }}
                />
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("edit")}
                disabled={loading}
              >
                <IconFileText className="size-4 mr-2" />
                Edit Fields
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const link = document.createElement("a")
                  const blob = new Blob([contractHTML], { type: "text/html" })
                  link.href = URL.createObjectURL(blob)
                  link.download = `${contract.contract_number}_draft.html`
                  link.click()
                }}
              >
                <IconDownload className="size-4 mr-2" />
                Download HTML
              </Button>
            </div>
          </TabsContent>

          {/* EDIT TAB */}
          <TabsContent value="edit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Edit Contract Terms & Forms</CardTitle>
                <CardDescription>
                  Modify the T&C and form fields. A new version will be saved when you click Save Changes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="bg-white border border-gray-200 rounded overflow-auto max-h-[500px] p-4"
                  dangerouslySetInnerHTML={{ __html: contractHTML }}
                />
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                onClick={handleSaveDraft}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <IconFileText className="size-4 mr-2" />
                Save Changes (Version {currentVersion + 1})
              </Button>
              <Button variant="outline" onClick={() => setStep("preview")}>
                <IconArrowLeft className="size-4 mr-2" />
                Back to Preview
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Draft Versions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {draftVersions.map((dv) => (
                    <div key={dv.version} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">
                        Version {dv.version}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(dv.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONFIRM & SEND TAB */}
          <TabsContent value="confirm" className="space-y-4">
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-900">Ready to Send?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-orange-800">
                  Once sent, the contract will be distributed to all signatories for electronic signature.
                  You can still view and download the final signed version once all parties have completed signing.
                </p>

                <div className="space-y-2 bg-white p-3 rounded border border-orange-200">
                  <p className="font-semibold text-sm">Signatories to receive contract:</p>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>
                      <strong>You (Client):</strong> {user?.email}
                    </li>
                    {approvedBids.map((bid) => (
                      <li key={bid.bidder}>
                        <strong>{bid.bidder}</strong> - R
                        {parseFloat(bid.bid_amount).toLocaleString("en-ZA", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-xs font-mono text-blue-900">
                    Contract Number: <strong>{contract.contract_number}</strong>
                  </p>
                  <p className="text-xs font-mono text-blue-900">
                    Tender: <strong>{tender.title}</strong>
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                onClick={handleSendContract}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <IconSend className="size-4 mr-2" />
                Send Contract to Signatories
              </Button>
              <Button variant="outline" onClick={() => setStep("preview")}>
                <IconArrowLeft className="size-4 mr-2" />
                Back to Preview
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={loading}
              >
                <IconX className="size-4 mr-2" />
                Discard Draft
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

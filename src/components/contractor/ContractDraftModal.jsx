import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { IconDownload, IconSend, IconX } from '@tabler/icons-react'
import supabase from '../../../supabase-client'
import { generateContractHTML, extractContractFormData, validateContractForm } from '../../lib/contractGenerator'
import { useAuth } from '../../context/AuthContext'

export default function ContractDraftModal({
  tender,
  approvedBids,
  open,
  onOpenChange,
  onContractSent
}) {
  const { user } = useAuth()
  const [contractData, setContractData] = useState(null)
  const [generatingContract, setGeneratingContract] = useState(false)
  const [sendingContract, setSendingContract] = useState(false)
  const [contractHTML, setContractHTML] = useState('')
  const [activeTab, setActiveTab] = useState('preview')

  // Generate contract when modal opens
  useEffect(() => {
    if (open && tender && approvedBids?.length > 0) {
      generateContract()
    }
  }, [open, tender, approvedBids])

  async function generateContract() {
    try {
      setGeneratingContract(true)

      // Generate HTML
      const html = generateContractHTML(
        tender,
        approvedBids,
        user?.email,
        user?.user_metadata?.company_name || 'Client'
      )
      setContractHTML(html)

      // Create contract record in database
      const { data: contractRecord, error: contractError } = await supabase
        .from('contracts')
        .insert([
          {
            tender_id: tender.id,
            content: html,
            terms_and_conditions: extractContractFormData()?.terms_and_conditions || '',
            created_by: user?.email,
            status: 'draft'
          }
        ])
        .select()
        .single()

      if (contractError) {
        console.error('Contract insert error:', contractError)
        throw new Error(`Failed to create contract: ${contractError.message}`)
      }

      if (!contractRecord) {
        throw new Error('No contract record returned from database')
      }

      setContractData(contractRecord)
      console.log('Contract created:', contractRecord)

      // Create signatory records (client + all approved bidders)
      const signatories = [
        {
          contract_id: contractRecord.id,
          signatory_email: user?.email,
          signatory_type: 'client',
          company_name: user?.user_metadata?.company_name || 'Client',
          signing_status: 'pending'
        },
        ...approvedBids.map(bid => ({
          contract_id: contractRecord.id,
          signatory_email: bid.bidder,
          signatory_type: 'bidder',
          bid_id: bid.id,
          bid_amount: bid.bid_amount,
          company_name: bid.company_name || 'Bidder',
          signing_status: 'pending'
        }))
      ]

      console.log('Creating signatories:', signatories)

      const { error: signatoriesError } = await supabase
        .from('contract_signatories')
        .insert(signatories)

      if (signatoriesError) {
        console.error('Signatories insert error:', signatoriesError)
        throw new Error(`Failed to create signatories: ${signatoriesError.message}`)
      }

      console.log('Signatories created successfully')
      toast.success('Contract generated successfully')
    } catch (err) {
      console.error('Error generating contract:', err)
      toast.error(`Failed to generate contract: ${err?.message || 'Unknown error'}`)
    } finally {
      setGeneratingContract(false)
    }
  }

  async function handleSendContract() {
    try {
      // Validate form first
      const validation = validateContractForm()
      if (!validation.valid) {
        toast.error(validation.error)
        return
      }

      setSendingContract(true)

      if (!contractData?.id) {
        toast.error('Contract data not found')
        return
      }

      // Extract and save form data
      const formData = extractContractFormData()

      // Update contract status to 'sent'
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          declarations_forms: formData
        })
        .eq('id', contractData.id)

      if (updateError) throw updateError

      // Create notifications for all signatories
      const signatories = [
        { email: user?.email, name: 'Client' },
        ...approvedBids.map(bid => ({ email: bid.bidder, name: bid.bidder }))
      ]

      for (const signatory of signatories) {
        try {
          await supabase.from('notifications').insert([
            {
              user_email: signatory.email,
              type: 'contract_sent',
              title: 'Contract Ready for Signature',
              message: `A contract for "${tender.title}" has been sent and is waiting for your signature.`,
              contract_id: contractData.id,
              read: false
            }
          ])
        } catch (notifErr) {
          console.warn(`Failed to send notification to ${signatory.email}:`, notifErr)
        }
      }

      toast.success('Contract sent to all signatories')
      onOpenChange(false)
      onContractSent(contractData)
    } catch (err) {
      console.error('Error sending contract:', err)
      toast.error(`Failed to send contract: ${err?.message}`)
    } finally {
      setSendingContract(false)
    }
  }

  function downloadHTML() {
    const element = document.createElement('a')
    const file = new Blob([contractHTML], { type: 'text/html' })
    element.href = URL.createObjectURL(file)
    element.download = `contract-${contractData?.contract_number || 'draft'}.html`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Contract Draft - {tender?.title}</DialogTitle>
        </DialogHeader>

        {generatingContract ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Generating contract...</div>
          </div>
        ) : contractData ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="confirm">Confirm & Send</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="flex-1 overflow-y-auto">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Contract Preview</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadHTML}
                    >
                      <IconDownload className="size-4 mr-2" />
                      Download HTML
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className="border rounded-lg p-6 bg-white prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: contractHTML }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="edit" className="flex-1 overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Edit Contract</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Terms & Conditions</label>
                      <textarea
                        id="terms_and_conditions"
                        className="w-full h-64 p-3 border rounded-lg font-mono text-sm"
                        placeholder="Edit terms and conditions..."
                        defaultValue={contractData.terms_and_conditions || ''}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Changes made here will be saved when you send the contract.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="confirm" className="flex-1 overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Review & Send</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Signatories List</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{user?.email}</p>
                          <p className="text-xs text-muted-foreground">Client</p>
                        </div>
                        <Badge variant="outline">Pending</Badge>
                      </div>
                      {approvedBids.map((bid, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{bid.bidder}</p>
                            <p className="text-xs text-muted-foreground">
                              Bidder • R{parseFloat(bid.bid_amount).toLocaleString('en-ZA')}
                            </p>
                          </div>
                          <Badge variant="outline">Pending</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Once sent, signatories will receive notifications to review and sign the contract. This action cannot be undone.
                    </p>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={sendingContract}
                    >
                      <IconX className="size-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSendContract}
                      disabled={sendingContract}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <IconSend className="size-4 mr-2" />
                      {sendingContract ? 'Sending...' : 'Send Contract to Signatories'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">No contract data</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

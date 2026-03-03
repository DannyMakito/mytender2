import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { IconDownload, IconSend, IconArrowLeft, IconX } from '@tabler/icons-react'
import supabase from '../../../supabase-client'
import { generateContractHTML, extractContractFormData, validateContractForm } from '../../lib/contractGenerator'
import { useAuth } from '../../context/AuthContext'

export default function ContractPage() {
  const navigate = useNavigate()
  const { tenderId } = useParams()
  const { user } = useAuth()
  
  const [tender, setTender] = useState(null)
  const [approvedBids, setApprovedBids] = useState([])
  const [contractData, setContractData] = useState(null)
  const [generatingContract, setGeneratingContract] = useState(false)
  const [sendingContract, setSendingContract] = useState(false)
  const [contractHTML, setContractHTML] = useState('')
  const [termsEdited, setTermsEdited] = useState('')
  const [activeTab, setActiveTab] = useState('preview')
  const [loading, setLoading] = useState(true)
  const [checkingExisting, setCheckingExisting] = useState(true)

  useEffect(() => {
    if (tenderId) {
      checkExistingContract()
    }
  }, [tenderId])

  async function checkExistingContract() {
    try {
      setCheckingExisting(true)
      
      // Check if contract already exists for this tender
      const { data: existingContract, error: checkError } = await supabase
        .from('contracts')
        .select('*')
        .eq('tender_id', tenderId)
        .eq('status', 'draft')
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') throw checkError

      if (existingContract) {
        // Contract already exists, load it
        setContractData(existingContract)
        setContractHTML(existingContract.content)
        setTermsEdited(existingContract.terms_and_conditions || '')
        setCheckingExisting(false)
        setLoading(false)
      } else {
        // No existing contract, fetch tender and bids to create new one
        fetchTenderAndBids()
      }
    } catch (err) {
      console.error('Error checking existing contract:', err)
      toast.error('Failed to check contract status')
    }
  }

  async function fetchTenderAndBids() {
    try {
      setLoading(true)

      // Fetch tender
      const { data: tenderData, error: tenderError } = await supabase
        .from('tenders')
        .select('*')
        .eq('id', tenderId)
        .single()

      if (tenderError) throw tenderError
      setTender(tenderData)

      // Fetch approved bids
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select('*')
        .eq('tender_id', tenderId)
        .eq('status', 'approved')

      if (bidsError) throw bidsError
      setApprovedBids(bidsData || [])

      if (bidsData && bidsData.length > 0) {
        generateContract(tenderData, bidsData)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      toast.error('Failed to load tender and bids')
    } finally {
      setLoading(false)
      setCheckingExisting(false)
    }
  }

  async function generateContract(tenderData, bidsData) {
    try {
      setGeneratingContract(true)

      // Generate HTML
      const html = generateContractHTML(
        tenderData,
        bidsData,
        user?.email,
        user?.user_metadata?.company_name || 'Client'
      )
      setContractHTML(html)

      // Create contract record in database
      const { data: contractRecord, error: contractError } = await supabase
        .from('contracts')
        .insert([
          {
            tender_id: tenderData.id,
            content: html,
            terms_and_conditions: '',
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
        ...bidsData.map(bid => ({
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
      console.log('Starting contract send process...')

      if (!contractData?.id) {
        console.error('Contract data missing')
        toast.error('Contract data not found')
        return
      }

      setSendingContract(true)

      // Update contract with terms and send status
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          terms_and_conditions: termsEdited
        })
        .eq('id', contractData.id)

      if (updateError) {
        console.error('Contract update error:', updateError)
        throw updateError
      }

      console.log('Creating notifications for signatories...')
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

      // Close the tender
      console.log('Closing tender...')
      const { error: tenderError } = await supabase
        .from('tenders')
        .update({ status: 'closed' })
        .eq('id', tenderId)

      if (tenderError) {
        console.warn('Could not close tender:', tenderError)
      }

      // Reject non-approved bids
      const { error: rejectError } = await supabase
        .from('bids')
        .update({ status: 'rejected' })
        .eq('tender_id', tenderId)
        .neq('status', 'approved')

      if (rejectError) {
        console.warn('Could not reject bids:', rejectError)
      }

      toast.success('Contract sent to all signatories!')
      console.log('Contract successfully sent, navigating back...')
      
      // Navigate back to tender bids page
      navigate(`/tender/${tenderId}/bids`)
    } catch (err) {
      console.error('Error sending contract:', err)
      toast.error(`Failed to send contract: ${err?.message || 'Unknown error'}`)
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

  if (loading || generatingContract || checkingExisting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground text-lg">
          {checkingExisting ? 'Loading contract...' : loading ? 'Loading contract...' : 'Generating contract...'}
        </div>
      </div>
    )
  }

  if (!tender || approvedBids.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-muted-foreground text-lg">No contract data available</div>
        <Button variant="outline" onClick={() => navigate(`/tender/${tenderId}/bids`)}>
          <IconArrowLeft className="size-4 mr-2" />
          Back to Tender
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate(`/tender/${tenderId}/bids`)}
              >
                <IconArrowLeft className="size-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{tender.title}</h1>
                <p className="text-sm text-muted-foreground">
                  Contract #{contractData?.contract_number || 'Generating...'} • {contractData?.status || 'draft'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="preview" className="text-base">
              Preview Contract
            </TabsTrigger>
            <TabsTrigger value="confirm" className="text-base">
              Review & Send
            </TabsTrigger>
          </TabsList>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Contract Preview</h2>
              <Button
                variant="outline"
                onClick={downloadHTML}
                size="sm"
              >
                <IconDownload className="size-4 mr-2" />
                Download HTML
              </Button>
            </div>
            <div className="bg-white border rounded-lg p-8 max-h-96 overflow-auto">
              <div
                className="text-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: contractHTML }}
              />
            </div>
          </TabsContent>

          {/* Confirm Tab */}
          <TabsContent value="confirm" className="space-y-6">
            <h2 className="text-lg font-semibold">Review & Send Contract</h2>
            
            {/* Terms Editing Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <label className="text-sm font-medium block">Edit Terms & Conditions</label>
                  <textarea
                    value={termsEdited}
                    onChange={(e) => setTermsEdited(e.target.value)}
                    className="w-full h-32 p-3 border rounded-lg font-mono text-sm"
                    placeholder="Add or modify terms and conditions here..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Changes will be saved when you send the contract.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Signatories Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Signatories List</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Client */}
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">{user?.email}</p>
                    <p className="text-xs text-muted-foreground">Client</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Pending</Badge>
                </div>

                {/* Bidders */}
                {approvedBids.map((bid, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-semibold text-sm">{bid.bidder}</p>
                      <p className="text-xs text-muted-foreground">
                        Approved Bidder • R{parseFloat(bid.bid_amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Warning */}
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Important:</strong> Once sent, signatories will receive notifications and the tender will be closed. This action cannot be undone.
                </p>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => navigate(`/tender/${tenderId}/bids`)}
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

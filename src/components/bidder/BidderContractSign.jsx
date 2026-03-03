import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { IconArrowLeft, IconCheck } from '@tabler/icons-react'
import supabase from '../../../supabase-client'
import { useAuth } from '../../context/AuthContext'

export default function BidderContractSign() {
  const navigate = useNavigate()
  const { contractId } = useParams()
  const { user } = useAuth()

  const [contract, setContract] = useState(null)
  const [signatory, setSignatory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    phone: '',
    authorized: false
  })

  useEffect(() => {
    fetchContractData()
  }, [contractId, user?.email])

  async function fetchContractData() {
    try {
      setLoading(true)

      // Fetch contract
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single()

      if (contractError) throw contractError
      setContract(contractData)

      // Fetch tender data if tender_id exists
      let tenderData = null
      if (contractData.tender_id) {
        const { data: tender } = await supabase
          .from('tenders')
          .select('id, title, description, budget')
          .eq('id', contractData.tender_id)
          .single()
        tenderData = tender
      }

      // Merge tender data with contract
      if (tenderData) {
        setContract(prev => ({ ...prev, tenders: tenderData }))
      }

      // Fetch signatory record
      const { data: signatoryData, error: sigError } = await supabase
        .from('contract_signatories')
        .select('*')
        .eq('contract_id', contractId)
        .eq('signatory_email', user?.email)
        .single()

      if (sigError && sigError.code !== 'PGRST116') throw sigError
      setSignatory(signatoryData || null)

      // Pre-fill form from signatory data if exists
      if (signatoryData) {
        setFormData({
          name: signatoryData.signature_data?.name || '',
          position: signatoryData.signature_data?.position || '',
          phone: signatoryData.signature_data?.phone || '',
          authorized: signatoryData.signature_data?.authorized || false
        })
      }
    } catch (err) {
      console.error('Error fetching contract:', err)
      toast.error('Failed to load contract')
    } finally {
      setLoading(false)
    }
  }

  async function handleSign() {
    try {
      // Validate form
      if (!formData.name.trim()) {
        toast.error('Please enter your full name')
        return
      }
      if (!formData.position.trim()) {
        toast.error('Please enter your position/title')
        return
      }
      if (!formData.phone.trim()) {
        toast.error('Please enter your phone number')
        return
      }
      if (!formData.authorized) {
        toast.error('Please confirm you are authorized to sign')
        return
      }

      setSigning(true)

      // Update signatory record with signature data
      const { error: updateError } = await supabase
        .from('contract_signatories')
        .update({
          signing_status: 'signed',
          signed_at: new Date().toISOString(),
          signature_data: {
            name: formData.name,
            position: formData.position,
            phone: formData.phone,
            authorized: formData.authorized,
            signed_at: new Date().toISOString()
          }
        })
        .eq('contract_id', contractId)
        .eq('signatory_email', user?.email)

      if (updateError) {
        console.error('Update error:', updateError)
        throw updateError
      }

      toast.success('Contract signed successfully!')
      
      // Navigate back to contracts list
      setTimeout(() => navigate('/bcontracts'), 1500)
    } catch (err) {
      console.error('Error signing contract:', err)
      toast.error(`Failed to sign contract: ${err?.message || 'Unknown error'}`)
    } finally {
      setSigning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground text-lg">Loading contract...</div>
      </div>
    )
  }

  if (!contract || !signatory) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-muted-foreground text-lg">Contract not found</div>
        <Button variant="outline" onClick={() => navigate('/bcontracts')}>
          <IconArrowLeft className="size-4 mr-2" />
          Back to Contracts
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur z-40 -mx-6 px-6 py-4 border-b">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/bcontracts')}
          >
            <IconArrowLeft className="size-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">{contract.contract_number}</h1>
          <Badge className={signatory.signing_status === 'signed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
            {signatory.signing_status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground ml-10">{contract.tenders?.title}</p>
      </div>

      {/* Contract Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Contract Preview */}
        <div className="col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contract Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm max-w-none bg-white p-6 rounded-lg border overflow-auto max-h-96"
                dangerouslySetInnerHTML={{ __html: contract.content }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Signing Form */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sign Contract</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {signatory.signing_status === 'signed' ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>✓ Already Signed</strong>
                    </p>
                    {signatory.signed_at && (
                      <p className="text-xs text-green-700 mt-2">
                        Signed on {new Date(signatory.signed_at).toLocaleDateString('en-ZA')}
                      </p>
                    )}
                  </div>
                  <Button variant="outline" className="w-full" disabled>
                    <IconCheck className="size-4 mr-2" />
                    Already Signed
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium block mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      placeholder="e.g., John Smith"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-2">Position/Title *</label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      placeholder="e.g., Managing Director"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      placeholder="+27 (country code)"
                    />
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.authorized}
                        onChange={(e) => setFormData({ ...formData, authorized: e.target.checked })}
                        className="mt-1 w-4 h-4"
                      />
                      <span className="text-xs text-blue-900">
                        I confirm that I am authorized to sign this contract on behalf of the company
                      </span>
                    </label>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800">
                      <strong>⚠️ Important:</strong> By signing, you agree to the terms and conditions above.
                    </p>
                  </div>

                  <Button
                    onClick={handleSign}
                    disabled={signing}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {signing ? 'Signing...' : 'Sign Contract'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="text-sm">
            <CardHeader>
              <CardTitle className="text-base">Contract Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-muted-foreground text-xs">Created</p>
                <p>{new Date(contract.created_at).toLocaleDateString('en-ZA')}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Status</p>
                <p className="capitalize">{contract.status}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { IconArrowLeft, IconCheck, IconSignature } from '@tabler/icons-react'
import supabase from '../../../supabase-client'
import { useAuth } from '../../context/AuthContext'
import SignatureField from '../ui/SignatureField'

export default function SupplierContractSign() {
  const navigate = useNavigate()
  const { contractId } = useParams()
  const { user } = useAuth()

  const [contract, setContract] = useState(null)
  const [signatory, setSignatory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)

  // Form fields
  const [fullName, setFullName] = useState('')
  const [title, setTitle] = useState('')
  const [phone, setPhone] = useState('')
  const [signatureValue, setSignatureValue] = useState('')
  const [agreed, setAgreed] = useState(false)

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
    } catch (err) {
      console.error('Error fetching contract:', err)
      toast.error('Failed to load contract')
    } finally {
      setLoading(false)
    }
  }

  async function handleSign(e) {
    e.preventDefault()

    if (!fullName.trim()) return toast.error('Please enter your full name')
    if (!title.trim()) return toast.error('Please enter your position/title')
    if (!phone.trim()) return toast.error('Please enter your phone number')
    if (!signatureValue) return toast.error('Please provide your signature')
    if (!agreed) return toast.error('You must agree to the terms and conditions')

    try {
      setSigning(true)

      // Prepare signature data payload
      const signaturePayload = {
        full_name: fullName.trim(),
        title: title.trim(),
        phone: phone.trim(),
        signature: signatureValue,
        signed_at: new Date().toISOString(),
        signer_email: user?.email,
      }

      // Update signatory record
      const { error: updateError } = await supabase
        .from('contract_signatories')
        .update({
          signing_status: 'signed',
          signed_at: new Date().toISOString(),
          signature_data: signaturePayload,
        })
        .eq('contract_id', contractId)
        .eq('signatory_email', user?.email)

      if (updateError) {
        console.error('Update error:', updateError)
        throw updateError
      }

      toast.success('Contract signed successfully!')

      // Navigate back to contracts list
      setTimeout(() => navigate('/scontracts'), 1500)
    } catch (err) {
      console.error('Error signing contract:', err)
      toast.error(`Failed to sign contract: ${err?.message || 'Unknown error'}`)
    } finally {
      setSigning(false)
    }
  }

  const [showContract, setShowContract] = useState(false)

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
        <Button variant="outline" onClick={() => navigate('/scontracts')}>
          <IconArrowLeft className="size-4 mr-2" />
          Back to Contracts
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-1 sm:px-0">
      {/* Header — mobile-friendly stacking */}
      <div className="sticky top-0 bg-background/95 backdrop-blur z-40 -mx-1 sm:-mx-6 px-3 sm:px-6 py-3 sm:py-4 border-b">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-1">
          <Button
            variant="ghost"
            size="sm"
            className="px-2 sm:px-3"
            onClick={() => navigate('/scontracts')}
          >
            <IconArrowLeft className="size-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold truncate max-w-[200px] sm:max-w-none">
            {contract.contract_number}
          </h1>
          <Badge className={`text-[10px] sm:text-xs ${signatory.signing_status === 'signed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {signatory.signing_status}
          </Badge>
        </div>
        {contract.tenders?.title && (
          <p className="text-xs sm:text-sm text-muted-foreground ml-0 sm:ml-10 truncate">
            {contract.tenders.title}
          </p>
        )}
      </div>

      {/* Mobile-first layout: Signing form FIRST, contract details below */}
      <div className="flex flex-col-reverse lg:grid lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Contract Preview — on mobile this sits below the form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Mobile: collapsible contract details */}
          <Card className="overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 text-left lg:cursor-default"
              onClick={() => setShowContract(!showContract)}
            >
              <CardTitle className="text-sm sm:text-base">
                📄 Quotation Contract Details
              </CardTitle>
              <span className="lg:hidden text-xs text-muted-foreground border rounded-md px-2 py-1">
                {showContract ? 'Hide ▲' : 'View ▼'}
              </span>
            </button>

            {/* Always visible on large screens, toggled on mobile */}
            <div className={`${showContract ? 'block' : 'hidden'} lg:block`}>
              <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6 pt-0">
                <div
                  className="prose prose-sm max-w-none bg-white p-3 sm:p-6 rounded-lg border overflow-auto max-h-60 sm:max-h-96 text-xs sm:text-sm"
                  dangerouslySetInnerHTML={{ __html: contract.content }}
                />
              </CardContent>
            </div>
          </Card>
        </div>

        {/* Signing Form — on mobile this sits on top */}
        <div className="space-y-4">
          <Card className="overflow-hidden border-0 shadow-lg">
            {/* Gradient header bar */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 sm:px-5 py-3 sm:py-4">
              <div className="flex items-center gap-2 text-white">
                <IconSignature className="size-4 sm:size-5" />
                <h3 className="text-sm sm:text-base font-semibold">Sign Quotation</h3>
              </div>
              <p className="text-orange-100 text-[10px] sm:text-xs mt-1">Review the contract, then sign below</p>
            </div>

            <CardContent className="p-4 sm:p-5">
              {signatory.signing_status === 'signed' ? (
                <div className="space-y-4">
                  <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
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
                <form onSubmit={handleSign} className="space-y-4 sm:space-y-5">
                  {/* Full Name & Title — side by side on tablet+ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-[11px] sm:text-xs font-semibold text-slate-600 mb-1 sm:mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. John Smith"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 sm:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all placeholder:text-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] sm:text-xs font-semibold text-slate-600 mb-1 sm:mb-1.5">
                        Position/Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Manager"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 sm:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-[11px] sm:text-xs font-semibold text-slate-600 mb-1 sm:mb-1.5">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+27 (country code)"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 sm:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all placeholder:text-slate-300"
                    />
                  </div>

                  {/* Signature Field */}
                  <div className="pt-1">
                    <SignatureField
                      label="Your Signature *"
                      value={signatureValue}
                      onChange={(val) => setSignatureValue(val)}
                    />
                  </div>

                  {/* Authorization Checkbox */}
                  <div className="flex items-start gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <input
                      type="checkbox"
                      id="agreeTerms"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-amber-300 text-orange-600 focus:ring-orange-500 cursor-pointer shrink-0"
                    />
                    <label htmlFor="agreeTerms" className="text-[11px] sm:text-xs text-amber-800 cursor-pointer leading-relaxed">
                      I confirm that I am authorized to sign this quotation contract on behalf of the company, and I agree to the terms and conditions above.
                    </label>
                  </div>

                  {/* Important notice */}
                  <div className="flex items-start gap-2 p-2.5 sm:p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <span className="text-orange-500 text-xs sm:text-sm mt-px shrink-0">⚠️</span>
                    <p className="text-[10px] sm:text-[11px] text-orange-700 leading-relaxed">
                      <strong>Important:</strong> By signing, you agree to the terms and conditions stated in the contract document.
                    </p>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all h-10 sm:h-11 text-xs sm:text-sm font-semibold"
                    disabled={signing || !agreed || !signatureValue}
                  >
                    {signing ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Signing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <IconSignature className="size-4" />
                        Sign Quotation Contract
                      </span>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Contract Info Card — compact on mobile */}
          <Card className="text-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-4 sm:gap-0 sm:flex-col sm:items-start sm:space-y-3">
                <div>
                  <p className="text-muted-foreground text-[10px] sm:text-xs">Created</p>
                  <p className="text-xs sm:text-sm">{new Date(contract.created_at).toLocaleDateString('en-ZA')}</p>
                </div>
                <div className="border-l sm:border-l-0 pl-4 sm:pl-0">
                  <p className="text-muted-foreground text-[10px] sm:text-xs">Status</p>
                  <p className="capitalize text-xs sm:text-sm">{contract.status}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

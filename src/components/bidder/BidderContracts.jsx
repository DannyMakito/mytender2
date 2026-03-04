import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { IconEye, IconCheck } from '@tabler/icons-react'
import supabase from '../../../supabase-client'
import { useAuth } from '../../context/AuthContext'

export default function BidderContracts() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBidderContracts()
  }, [user?.email])

  async function fetchBidderContracts() {
    try {
      setLoading(true)

      // Fetch contracts where user is a signatory
      const { data: signatories, error: sigError } = await supabase
        .from('contract_signatories')
        .select('contract_id, signing_status, bid_amount, company_name')
        .eq('signatory_email', user?.email)
        .eq('signatory_type', 'bidder')

      if (sigError) throw sigError

      if (!signatories || signatories.length === 0) {
        setContracts([])
        setLoading(false)
        return
      }

      // Fetch the actual contracts
      const contractIds = signatories.map(s => s.contract_id)
      const { data: contractsData, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .in('id', contractIds)

      if (contractError) throw contractError

      // Fetch tender data for each contract
      const tendersMap = {}
      for (const contract of contractsData) {
        if (contract.tender_id && !tendersMap[contract.tender_id]) {
          const { data: tender } = await supabase
            .from('tenders')
            .select('id, title, description')
            .eq('id', contract.tender_id)
            .single()
          if (tender) {
            tendersMap[contract.tender_id] = tender
          }
        }
      }

      // Merge contract data with signatory status and tender info
      const merged = contractsData.map(contract => {
        const signatory = signatories.find(s => s.contract_id === contract.id)
        return {
          ...contract,
          signing_status: signatory?.signing_status || 'pending',
          bid_amount: signatory?.bid_amount,
          company_name: signatory?.company_name,
          tenders: tendersMap[contract.tender_id] || null
        }
      })

      setContracts(merged)
    } catch (err) {
      console.error('Error fetching contracts:', err)
      toast.error('Failed to load contracts')
    } finally {
      setLoading(false)
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'signed':
        return <Badge className="bg-orange-100 text-orange-800">Signed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Signature</Badge>
      case 'viewed':
        return <Badge className="bg-orange-50 text-orange-700">Viewed</Badge>
      case 'declined':
        return <Badge className="bg-red-100 text-red-800">Declined</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground text-lg">Loading contracts...</div>
      </div>
    )
  }

  if (contracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground text-lg mb-4">No contracts assigned to you yet</div>
        <p className="text-sm text-muted-foreground">Contracts will appear here once clients send them for signature</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Contracts for Signature</h1>
        <p className="text-muted-foreground mt-2">Review and sign contracts from your approved bids</p>
      </div>

      <div className="grid gap-4">
        {contracts.map((contract) => (
          <Card key={contract.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{contract.contract_number}</h3>
                    {getStatusBadge(contract.signing_status)}
                  </div>
                  <p className="text-muted-foreground">{contract.tenders?.title || 'Tender'}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Bid Amount</p>
                  <p className="font-semibold">R{parseFloat(contract.bid_amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Your Company</p>
                  <p className="font-semibold">{contract.company_name || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">Created</p>
                  <p className="text-sm">{new Date(contract.created_at).toLocaleDateString('en-ZA')}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/bcontracts/${contract.id}`)}
                  className="flex-1"
                >
                  <IconEye className="size-4 mr-2" />
                  Review Contract
                </Button>
                {contract.signing_status === 'signed' && (
                  <Button
                    variant="ghost"
                    className="flex-1 text-orange-600"
                    disabled
                  >
                    <IconCheck className="size-4 mr-2" />
                    Signed
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

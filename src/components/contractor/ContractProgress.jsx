import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { IconDownload, IconCheck, IconX, IconClock } from '@tabler/icons-react'
import supabase from '../../../supabase-client'
import { toast } from 'sonner'

export default function ContractProgress({ contractId, tenderId }) {
  const [contract, setContract] = useState(null)
  const [signatories, setSignatories] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ signed: 0, pending: 0, declined: 0, total: 0 })

  useEffect(() => {
    if (contractId) {
      fetchContractData()
      subscribeToUpdates()
    }
  }, [contractId])

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

      // Fetch signatories
      const { data: signatoriesData, error: signatoriesError } = await supabase
        .from('contract_signatories')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: true })

      if (signatoriesError) throw signatoriesError
      setSignatories(signatoriesData || [])

      // Calculate stats
      updateStats(signatoriesData || [])
    } catch (err) {
      console.error('Error fetching contract data:', err)
      toast.error('Failed to load contract progress')
    } finally {
      setLoading(false)
    }
  }

  function subscribeToUpdates() {
    const subscription = supabase
      .channel(`contract_${contractId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contract_signatories',
          filter: `contract_id=eq.${contractId}`
        },
        (payload) => {
          // Update signatories list
          setSignatories((prev) =>
            prev.map((sig) =>
              sig.id === payload.new.id ? payload.new : sig
            )
          )
          updateStats(signatories)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  function updateStats(signatoriesData) {
    const stats = {
      signed: signatoriesData.filter(s => s.signing_status === 'signed').length,
      pending: signatoriesData.filter(s => s.signing_status === 'pending').length,
      declined: signatoriesData.filter(s => s.signing_status === 'declined').length,
      total: signatoriesData.length
    }
    setStats(stats)
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'signed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><IconCheck className="size-3 mr-1" /> Signed</Badge>
      case 'declined':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><IconX className="size-3 mr-1" /> Declined</Badge>
      case 'viewed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Viewed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><IconClock className="size-3 mr-1" /> Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  function formatDate(dateString) {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const progressPercent = stats.total > 0 ? (stats.signed / stats.total) * 100 : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading contract progress...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Signatories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Signed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.signed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Declined</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.declined}</div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signing Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">{stats.signed} of {stats.total} signed</span>
              <span className="text-sm font-medium text-muted-foreground">{Math.round(progressPercent)}%</span>
            </div>
            <progress value={progressPercent} max="100" className="w-full h-2 rounded" />
          </div>

          {contract?.status === 'executed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>✓ Contract Executed</strong> - All signatures received on {formatDate(contract.fully_executed_at)}
              </p>
            </div>
          )}

          {stats.declined > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>⚠ {stats.declined} signatory declined</strong> - See details below
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Signatories Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signatories</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Signed At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {signatories.map((sig) => (
                <TableRow key={sig.id}>
                  <TableCell className="font-medium text-sm">{sig.signatory_email}</TableCell>
                  <TableCell className="text-sm capitalize">{sig.signatory_type}</TableCell>
                  <TableCell>{getStatusBadge(sig.signing_status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {sig.signing_status === 'signed' ? formatDate(sig.signed_at) : '—'}
                  </TableCell>
                  <TableCell>
                    {sig.signed_document_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(sig.signed_document_url, '_blank')}
                      >
                        <IconDownload className="size-4" />
                        Download
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {signatories.filter(s => s.signing_status === 'declined').length > 0 && (
            <div className="mt-4 space-y-3">
              <h4 className="font-medium text-sm">Decline Reasons</h4>
              {signatories
                .filter(s => s.signing_status === 'declined')
                .map((sig) => (
                  <div key={sig.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-900">{sig.signatory_email}</p>
                    <p className="text-sm text-red-800 mt-1">{sig.declined_reason || 'No reason provided'}</p>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

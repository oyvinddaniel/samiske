'use client'

import { useState, useEffect } from 'react'
import { Loader2, Check, X, Edit, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getAllIndustries, approveIndustry, rejectIndustry } from '@/lib/industries'
import { createClient } from '@/lib/supabase/client'
import { EditIndustryModal } from '@/components/admin/EditIndustryModal'
import type { Industry } from '@/lib/types/industries'
import { getIndustryDisplayName } from '@/lib/types/industries'
import { toast } from 'sonner'

export function BransjerTab() {
  const [industries, setIndustries] = useState<Industry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const supabase = createClient()

  const fetchIndustries = async () => {
    setLoading(true)
    const data = await getAllIndustries()
    setIndustries(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchIndustries()
  }, [])

  const handleApprove = async (industryId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const result = await approveIndustry(industryId, user.id)
    if (result.success) {
      toast.success('Bransje godkjent')
      fetchIndustries()
    } else {
      toast.error(result.error || 'Kunne ikke godkjenne bransje')
    }
  }

  const handleReject = async (industryId: string) => {
    const result = await rejectIndustry(industryId)
    if (result.success) {
      toast.success('Bransje avvist')
      fetchIndustries()
    } else {
      toast.error(result.error || 'Kunne ikke avvise bransje')
    }
  }

  const handleEdit = (industry: Industry) => {
    setSelectedIndustry(industry)
    setShowEditModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  const pendingIndustries = industries.filter((i) => !i.is_approved && i.is_active)
  const approvedIndustries = industries.filter((i) => i.is_approved && i.is_active)

  return (
    <div className="space-y-6">
      {/* Pending Industries */}
      {pendingIndustries.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">
            Ventende godkjenning ({pendingIndustries.length})
          </h3>
          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Navn (norsk)</TableHead>
                  <TableHead>Opprettet av</TableHead>
                  <TableHead>Dato</TableHead>
                  <TableHead className="text-right">Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingIndustries.map((industry) => (
                  <TableRow key={industry.id}>
                    <TableCell className="font-medium">
                      {industry.name_no}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {industry.created_by || 'System'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(industry.created_at).toLocaleDateString('nb-NO')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(industry)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Rediger
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handleApprove(industry.id)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Godkjenn
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleReject(industry.id)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Avvis
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Approved Industries */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">
            Godkjente bransjer ({approvedIndustries.length})
          </h3>
        </div>
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Navn</TableHead>
                <TableHead>Språk</TableHead>
                <TableHead className="text-right">Handlinger</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedIndustries.map((industry) => (
                <TableRow key={industry.id}>
                  <TableCell className="font-medium">
                    {getIndustryDisplayName(industry)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {industry.name_no && <Badge variant="outline">NO</Badge>}
                      {industry.name_sma && <Badge variant="outline">SMA</Badge>}
                      {industry.name_sju && <Badge variant="outline">SJU</Badge>}
                      {industry.name_sje && <Badge variant="outline">SJE</Badge>}
                      {industry.name_smj && <Badge variant="outline">SMJ</Badge>}
                      {industry.name_se && <Badge variant="outline">SE</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(industry)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Rediger
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Modal */}
      {selectedIndustry && (
        <EditIndustryModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          industry={selectedIndustry}
          onUpdated={fetchIndustries}
        />
      )}
    </div>
  )
}

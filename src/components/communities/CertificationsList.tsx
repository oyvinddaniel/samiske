'use client'

import { useEffect, useState } from 'react'
import { Award, AlertCircle, CheckCircle, FileText, Loader2 } from 'lucide-react'
import {
  getCertifications,
  isCertificationExpired,
  isCertificationExpiringSoon,
  formatCertificationDate,
  type Certification
} from '@/lib/certifications'
import Link from 'next/link'

interface CertificationsListProps {
  communityId: string
}

export function CertificationsList({ communityId }: CertificationsListProps) {
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCertifications = async () => {
      const data = await getCertifications(communityId)
      setCertifications(data)
      setLoading(false)
    }

    fetchCertifications()
  }, [communityId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (certifications.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <Award className="w-5 h-5" />
        Sertifiseringer og kompetanse
      </h3>

      <div className="grid gap-3">
        {certifications.map((cert) => {
          const expired = isCertificationExpired(cert)
          const expiringSoon = isCertificationExpiringSoon(cert)

          return (
            <div
              key={cert.id}
              className={`border rounded-lg p-4 space-y-2 ${
                expired ? 'border-red-200 bg-red-50' :
                expiringSoon ? 'border-yellow-200 bg-yellow-50' :
                'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{cert.name}</h4>
                    {cert.is_verified && (
                      <span title="Verifisert">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </span>
                    )}
                  </div>

                  {cert.issuer && (
                    <p className="text-sm text-gray-600 mt-1">
                      Utstedt av: {cert.issuer}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-2">
                    {cert.issued_date && (
                      <span>Utstedt: {formatCertificationDate(cert.issued_date)}</span>
                    )}
                    {cert.expires_date && (
                      <span
                        className={
                          expired ? 'text-red-600 font-medium' :
                          expiringSoon ? 'text-yellow-600 font-medium' :
                          ''
                        }
                      >
                        {expired ? 'Utløpt: ' : 'Utløper: '}
                        {formatCertificationDate(cert.expires_date)}
                      </span>
                    )}
                  </div>

                  {(expired || expiringSoon) && (
                    <div className={`flex items-center gap-2 mt-2 text-sm ${
                      expired ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      <AlertCircle className="w-4 h-4" />
                      <span>
                        {expired ? 'Denne sertifiseringen har utløpt' :
                         'Denne sertifiseringen utløper snart'}
                      </span>
                    </div>
                  )}
                </div>

                {cert.document_url && (
                  <Link
                    href={cert.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Se dokument"
                  >
                    <FileText className="w-5 h-5 text-gray-600" />
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

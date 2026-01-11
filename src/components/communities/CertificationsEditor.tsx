'use client'

import { useState, useEffect } from 'react'
import { Loader2, Plus, Trash2, Award, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  getCertifications,
  createCertification,
  updateCertification,
  deleteCertification,
  uploadCertificationDocument,
  isCertificationExpired,
  isCertificationExpiringSoon,
  formatCertificationDate,
  type Certification
} from '@/lib/certifications'
import { toast } from 'sonner'

interface CertificationsEditorProps {
  communityId: string
  onUpdated?: () => void
}

export function CertificationsEditor({ communityId, onUpdated }: CertificationsEditorProps) {
  const [loading, setLoading] = useState(true)
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Certification | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [issuer, setIssuer] = useState('')
  const [issuedDate, setIssuedDate] = useState('')
  const [expiresDate, setExpiresDate] = useState('')
  const [documentUrl, setDocumentUrl] = useState('')

  useEffect(() => {
    fetchCertifications()
  }, [communityId])

  const fetchCertifications = async () => {
    setLoading(true)
    const data = await getCertifications(communityId)
    setCertifications(data)
    setLoading(false)
  }

  const handleCreate = () => {
    setCreating(true)
    setEditing(null)
    resetForm()
  }

  const handleEdit = (cert: Certification) => {
    setEditing(cert.id)
    setCreating(false)
    setName(cert.name)
    setIssuer(cert.issuer || '')
    setIssuedDate(cert.issued_date || '')
    setExpiresDate(cert.expires_date || '')
    setDocumentUrl(cert.document_url || '')
  }

  const handleCancel = () => {
    setCreating(false)
    setEditing(null)
    resetForm()
  }

  const resetForm = () => {
    setName('')
    setIssuer('')
    setIssuedDate('')
    setExpiresDate('')
    setDocumentUrl('')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type (PDF, images, common document types)
    const validTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!validTypes.includes(file.type)) {
      toast.error('Ugyldig filtype. Vennligst last opp PDF, bilde eller Word-dokument.')
      return
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Filen er for stor (maks 10MB)')
      return
    }

    setUploading(true)
    try {
      const url = await uploadCertificationDocument(communityId, file)
      if (url) {
        setDocumentUrl(url)
        toast.success('Dokument lastet opp')
      } else {
        toast.error('Kunne ikke laste opp dokument')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Kunne ikke laste opp dokument')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Navn på sertifisering er påkrevd')
      return
    }

    // Validate dates
    if (issuedDate && expiresDate) {
      if (new Date(expiresDate) < new Date(issuedDate)) {
        toast.error('Utløpsdato kan ikke være før utstedelsesdato')
        return
      }
    }

    setSaving(true)
    try {
      if (creating) {
        const newCert = await createCertification(communityId, {
          name: name.trim(),
          issuer: issuer.trim() || undefined,
          issued_date: issuedDate || undefined,
          expires_date: expiresDate || undefined,
          document_url: documentUrl.trim() || undefined
        })

        if (newCert) {
          setCertifications([...certifications, newCert])
          toast.success('Sertifisering lagt til')
          handleCancel()
          if (onUpdated) onUpdated()
        } else {
          toast.error('Kunne ikke lagre sertifisering')
        }
      } else if (editing) {
        const success = await updateCertification(editing, {
          name: name.trim(),
          issuer: issuer.trim() || undefined,
          issued_date: issuedDate || undefined,
          expires_date: expiresDate || undefined,
          document_url: documentUrl.trim() || undefined
        })

        if (success) {
          setCertifications(certifications.map(c =>
            c.id === editing
              ? {
                  ...c,
                  name: name.trim(),
                  issuer: issuer.trim() || null,
                  issued_date: issuedDate || null,
                  expires_date: expiresDate || null,
                  document_url: documentUrl.trim() || null
                }
              : c
          ))
          toast.success('Sertifisering oppdatert')
          handleCancel()
          if (onUpdated) onUpdated()
        } else {
          toast.error('Kunne ikke oppdatere sertifisering')
        }
      }
    } catch (error) {
      console.error('Error saving certification:', error)
      toast.error('Kunne ikke lagre sertifisering')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (cert: Certification) => {
    const success = await deleteCertification(cert.id)
    if (success) {
      setCertifications(certifications.filter(c => c.id !== cert.id))
      toast.success('Sertifisering slettet')
      setDeleting(null)
      if (onUpdated) onUpdated()
    } else {
      toast.error('Kunne ikke slette sertifisering')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Award className="w-5 h-5" />
          Sertifiseringer og kompetanse
        </h3>
        <p className="text-sm text-gray-500">
          Legg til fagbrev, sertifiseringer og annen dokumentert kompetanse.
        </p>
      </div>

      {/* Existing certifications */}
      {certifications.length > 0 && (
        <div className="space-y-3">
          {certifications.map((cert) => {
            const expired = isCertificationExpired(cert)
            const expiringSoon = isCertificationExpiringSoon(cert)

            return (
              <div
                key={cert.id}
                className={`border rounded-lg p-4 space-y-3 ${
                  expired ? 'border-red-200 bg-red-50' :
                  expiringSoon ? 'border-yellow-200 bg-yellow-50' :
                  'border-gray-200'
                }`}
              >
                {editing === cert.id ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor={`name-${cert.id}`}>Navn på sertifisering</Label>
                      <Input
                        id={`name-${cert.id}`}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="F.eks. Fagbrev, ISO-sertifisering..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`issuer-${cert.id}`}>Utsteder (valgfritt)</Label>
                      <Input
                        id={`issuer-${cert.id}`}
                        value={issuer}
                        onChange={(e) => setIssuer(e.target.value)}
                        placeholder="Hvem utstedte sertifiseringen?"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`issued-${cert.id}`}>Utstedelsesdato (valgfritt)</Label>
                        <Input
                          id={`issued-${cert.id}`}
                          type="date"
                          value={issuedDate}
                          onChange={(e) => setIssuedDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`expires-${cert.id}`}>Utløpsdato (valgfritt)</Label>
                        <Input
                          id={`expires-${cert.id}`}
                          type="date"
                          value={expiresDate}
                          onChange={(e) => setExpiresDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`doc-${cert.id}`}>Dokument (valgfritt)</Label>
                      <div className="flex gap-2">
                        <Input
                          id={`doc-${cert.id}`}
                          type="file"
                          onChange={handleFileUpload}
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          disabled={uploading}
                        />
                        {uploading && <Loader2 className="w-5 h-5 animate-spin" />}
                      </div>
                      {documentUrl && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Dokument lastet opp
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={saving || uploading}>
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Lagrer...
                          </>
                        ) : (
                          'Lagre'
                        )}
                      </Button>
                      <Button variant="ghost" onClick={handleCancel}>
                        Avbryt
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
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
                        {cert.document_url && (
                          <a
                            href={cert.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
                          >
                            <FileText className="w-4 h-4" />
                            Se dokument
                          </a>
                        )}
                        {(expired || expiringSoon) && (
                          <div className={`flex items-center gap-2 mt-2 text-sm ${
                            expired ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            <AlertCircle className="w-4 h-4" />
                            <span>
                              {expired ? 'Utløpt' : 'Utløper snart'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(cert)}
                      >
                        Rediger
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleting(cert)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* New certification form */}
      {creating && (
        <div className="border-2 border-dashed rounded-lg p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-name">Navn på sertifisering</Label>
            <Input
              id="new-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="F.eks. Fagbrev, ISO-sertifisering..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-issuer">Utsteder (valgfritt)</Label>
            <Input
              id="new-issuer"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              placeholder="Hvem utstedte sertifiseringen?"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-issued">Utstedelsesdato (valgfritt)</Label>
              <Input
                id="new-issued"
                type="date"
                value={issuedDate}
                onChange={(e) => setIssuedDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-expires">Utløpsdato (valgfritt)</Label>
              <Input
                id="new-expires"
                type="date"
                value={expiresDate}
                onChange={(e) => setExpiresDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-doc">Dokument (valgfritt)</Label>
            <div className="flex gap-2">
              <Input
                id="new-doc"
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                disabled={uploading}
              />
              {uploading && <Loader2 className="w-5 h-5 animate-spin" />}
            </div>
            {documentUrl && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Dokument lastet opp
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || uploading}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Lagrer...
                </>
              ) : (
                'Lagre'
              )}
            </Button>
            <Button variant="ghost" onClick={handleCancel}>
              Avbryt
            </Button>
          </div>
        </div>
      )}

      {/* Add button */}
      {!creating && !editing && (
        <Button onClick={handleCreate} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Legg til sertifisering
        </Button>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett sertifisering?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette &quot;{deleting?.name}&quot;? Dette kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && handleDelete(deleting)}
              className="bg-red-600 hover:bg-red-700"
            >
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

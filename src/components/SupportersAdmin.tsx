import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Upload, X, Edit, Trash2, Plus, Image } from 'lucide-react'
import { blink } from '../lib/blink'
import toast from 'react-hot-toast'

interface Supporter {
  id: string
  donorName: string
  donorOrganization: string | null
  donorLogoUrl: string | null
  tierName: string
  amount: number
  status: string
  paidAt: string
  createdAt: string
}

interface SupporterForm {
  donorName: string
  donorOrganization: string
  tierName: string
  logoFile: File | null
  logoPreview: string | null
}

const SupportersAdmin = () => {
  const [supporters, setSupporters] = useState<Supporter[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSupporter, setEditingSupporter] = useState<Supporter | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<SupporterForm>({
    donorName: '',
    donorOrganization: '',
    tierName: 'Supporter',
    logoFile: null,
    logoPreview: null
  })

  const tierOptions = [
    { value: 'Champion', label: 'Champion' },
    { value: 'Advocate', label: 'Advocate' },
    { value: 'Partner', label: 'Partner' },
    { value: 'Contributor', label: 'Contributor' },
    { value: 'Supporter', label: 'Supporter' }
  ]

  useEffect(() => {
    loadSupporters()
  }, [])

  const loadSupporters = async () => {
    try {
      const donations = await blink.db.donations.list({
        where: { status: 'completed' },
        orderBy: { amount: 'desc' }
      })
      setSupporters(donations || [])
    } catch (error) {
      console.error('Failed to load supporters:', error)
      toast.error('Failed to load supporters')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Logo file must be smaller than 5MB')
      return
    }

    setForm(prev => ({ ...prev, logoFile: file }))
    const preview = URL.createObjectURL(file)
    setForm(prev => ({ ...prev, logoPreview: preview }))
  }

  const removeLogo = () => {
    if (form.logoPreview) {
      URL.revokeObjectURL(form.logoPreview)
    }
    setForm(prev => ({ ...prev, logoFile: null, logoPreview: null }))
  }

  const resetForm = () => {
    if (form.logoPreview) {
      URL.revokeObjectURL(form.logoPreview)
    }
    setForm({
      donorName: '',
      donorOrganization: '',
      tierName: 'Supporter',
      logoFile: null,
      logoPreview: null
    })
    setEditingSupporter(null)
  }

  const openEditDialog = (supporter: Supporter) => {
    setEditingSupporter(supporter)
    setForm({
      donorName: supporter.donorName,
      donorOrganization: supporter.donorOrganization || '',
      tierName: supporter.tierName,
      logoFile: null,
      logoPreview: supporter.donorLogoUrl ? (supporter.donorLogoUrl.startsWith('http') ? supporter.donorLogoUrl : `/assets/${supporter.donorLogoUrl}`) : null
    })
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.donorName.trim()) {
      toast.error('Please enter a name')
      return
    }

    setSubmitting(true)
    try {
      let logoUrl = ''
      
      // Upload new logo if provided
      if (form.logoFile) {
        const timestamp = Date.now()
        const { publicUrl } = await blink.storage.upload(
          form.logoFile,
          `supporter-logos/${timestamp}-${form.logoFile.name}`,
          { upsert: true }
        )
        logoUrl = publicUrl
      } else if (editingSupporter?.donorLogoUrl && !form.logoPreview) {
        // Logo was removed
        logoUrl = ''
      } else if (editingSupporter?.donorLogoUrl && form.logoPreview === editingSupporter.donorLogoUrl) {
        // Keep existing logo
        logoUrl = editingSupporter.donorLogoUrl
      }

      if (editingSupporter) {
        // Update existing supporter
        await blink.db.donations.update(editingSupporter.id, {
          donorName: form.donorName,
          donorOrganization: form.donorOrganization || null,
          donorLogoUrl: logoUrl || null,
          tierName: form.tierName
        })
        toast.success('Supporter updated successfully')
      } else {
        // Create new supporter entry
        await blink.db.donations.create({
          id: `supporter-${Date.now()}`,
          donorName: form.donorName,
          donorOrganization: form.donorOrganization || null,
          donorLogoUrl: logoUrl || null,
          tierName: form.tierName,
          amount: 0, // Manual entries have no amount
          amountDisplay: form.tierName,
          status: 'completed',
          paidAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        })
        toast.success('Supporter added successfully')
      }

      resetForm()
      setIsDialogOpen(false)
      await loadSupporters()
    } catch (error) {
      console.error('Failed to save supporter:', error)
      toast.error('Failed to save supporter')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteSupporter = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supporter?')) return

    try {
      await blink.db.donations.delete(id)
      toast.success('Supporter deleted successfully')
      await loadSupporters()
    } catch (error) {
      console.error('Failed to delete supporter:', error)
      toast.error('Failed to delete supporter')
    }
  }

  const getTierBadgeVariant = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'champion': return 'default'
      case 'advocate': return 'secondary' 
      case 'supporter': return 'outline'
      default: return 'outline'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Supporters Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Supporters Management</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage supporter logos and information displayed on the website
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Supporter
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingSupporter ? 'Edit Supporter' : 'Add Supporter'}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="donorName">Name *</Label>
                    <Input
                      id="donorName"
                      value={form.donorName}
                      onChange={(e) => setForm(prev => ({ ...prev, donorName: e.target.value }))}
                      placeholder="Supporter name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="donorOrganization">Organization</Label>
                    <Input
                      id="donorOrganization"
                      value={form.donorOrganization}
                      onChange={(e) => setForm(prev => ({ ...prev, donorOrganization: e.target.value }))}
                      placeholder="Organization name (optional)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tierName">Support Tier</Label>
                    <Select value={form.tierName} onValueChange={(value) => setForm(prev => ({ ...prev, tierName: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tierOptions.map(tier => (
                          <SelectItem key={tier.value} value={tier.value}>
                            {tier.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Logo</Label>
                    {form.logoPreview ? (
                      <div className="relative inline-block">
                        <img 
                          src={form.logoPreview} 
                          alt="Logo preview" 
                          className="w-32 h-20 object-contain border rounded-lg p-2 bg-white"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                          onClick={removeLogo}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-lg p-4 text-center">
                        <Image className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Upload logo (PNG, JPG, SVG)
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleLogoUpload(file)
                          }}
                          className="hidden"
                          id="logo-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('logo-upload')?.click()}
                        >
                          Choose File
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={submitting} className="flex-1">
                      {submitting ? 'Saving...' : editingSupporter ? 'Update' : 'Create'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetForm()
                        setIsDialogOpen(false)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {supporters.length === 0 ? (
            <div className="text-center py-8">
              <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No supporters yet</h3>
              <p className="text-muted-foreground mb-4">
                Add supporters to display them on your website
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Supporter
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {supporters.map((supporter) => {
                const logoSrc = supporter.donorLogoUrl ? 
                  (supporter.donorLogoUrl.startsWith('http') ? supporter.donorLogoUrl : `/assets/${supporter.donorLogoUrl}`) : 
                  null
                
                return (
                  <div key={supporter.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-16 h-12 flex-shrink-0 bg-background border rounded flex items-center justify-center">
                      {logoSrc ? (
                        <img
                          src={logoSrc}
                          alt={supporter.donorName}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement
                            img.style.display = 'none'
                          }}
                        />
                      ) : (
                        <Image className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{supporter.donorName}</h3>
                        <Badge variant={getTierBadgeVariant(supporter.tierName)}>
                          {supporter.tierName}
                        </Badge>
                      </div>
                      {supporter.donorOrganization && (
                        <p className="text-sm text-muted-foreground">{supporter.donorOrganization}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(supporter.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(supporter)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteSupporter(supporter.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default SupportersAdmin
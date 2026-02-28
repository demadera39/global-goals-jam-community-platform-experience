import React, { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import blink from '../lib/blink'
import toast from 'react-hot-toast'
import { Edit, Eye } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

interface Module {
  id: string
  moduleNumber?: string
  title?: string
  description?: string
  durationMinutes?: string
}

export default function CourseManagement() {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Module | null>(null)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadModules()
  }, [])

  const loadModules = async () => {
    setLoading(true)
    try {
      const data = await blink.db.courseModules.list({ orderBy: { moduleNumber: 'asc' } })
      setModules(data || [])
    } catch (error) {
      console.error('Failed to load modules', error)
      toast.error('Failed to load course modules')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (m: Module) => {
    setEditing({ ...m })
  }

  const handleChange = (key: keyof Module, value: string) => {
    if (!editing) return
    setEditing({ ...editing, [key]: value })
  }

  const saveEdit = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const payload: any = {
        title: editing.title || '',
        description: editing.description || '',
        durationMinutes: editing.durationMinutes || '',
      }

      if (editing.id) {
        await blink.db.courseModules.update(editing.id, payload)
        toast.success('Module updated')
      } else {
        await blink.db.courseModules.create({ ...payload, moduleNumber: editing.moduleNumber || '0' })
        toast.success('Module created')
      }

      setEditing(null)
      await loadModules()
    } catch (error) {
      console.error('Failed to save module', error)
      toast.error('Failed to save module')
    } finally {
      setSaving(false)
    }
  }

  const openPreview = () => {
    // open course dashboard in new tab for preview
    window.open(`${window.location.origin}/course/dashboard`, '_blank')
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Course Management</h2>
          <p className="text-sm text-muted-foreground">Manage courses, modules and enrollments here.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={openPreview} variant="outline">
            <Eye className="w-4 h-4 mr-2" /> Preview Course
          </Button>
          <Button onClick={() => startEdit({ id: '', moduleNumber: String(modules.length + 1), title: '', description: '', durationMinutes: '0' })}>
            <Edit className="w-4 h-4 mr-2" /> New Module
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center">Loading modules…</div>
      ) : (
        <div className="space-y-3">
          {modules.length === 0 && (
            <div className="text-sm text-muted-foreground">No modules found. Create one to get started.</div>
          )}

          {modules.map(m => (
            <div key={m.id} className="p-4 border rounded-md flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{m.moduleNumber}</Badge>
                  <div>
                    <div className="font-medium">{m.title}</div>
                    {m.description && <div className="text-sm text-muted-foreground">{m.description}</div>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link to="/course/dashboard">
                    <Eye className="w-4 h-4" />
                  </Link>
                </Button>
                <Button size="sm" onClick={() => startEdit(m)}>
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold mb-4">{editing.id ? 'Edit Module' : 'Create Module'}</h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label>Module Number</Label>
                <Input value={editing.moduleNumber} onChange={(e: any) => handleChange('moduleNumber', e.target.value)} />
              </div>
              <div>
                <Label>Title</Label>
                <Input value={editing.title} onChange={(e: any) => handleChange('title', e.target.value)} />
              </div>
              <div>
                <Label>Description</Label>
                <textarea className="w-full border rounded-md p-2" rows={4} value={editing.description} onChange={(e) => handleChange('description', e.target.value)} />
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Input value={editing.durationMinutes} onChange={(e: any) => handleChange('durationMinutes', e.target.value)} />
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button onClick={saveEdit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

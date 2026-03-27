// src/pages/admin/AdminCharities.jsx
import { useEffect, useState } from 'react'
import { getCharities, adminManageCharity } from '../../lib/supabase'
import { Plus, Edit2, Trash2, Star } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = ['Health', 'Youth & Sport', 'Mental Health', 'Environment', 'Veterans', 'Children & Families', 'Other']

const emptyForm = {
  name: '', slug: '', description: '', long_description: '',
  image_url: '', website_url: '', category: 'Health',
  is_featured: false, is_active: true,
}

// ── Field must be defined OUTSIDE the parent component ────────
// Defining it inside causes React to destroy/recreate the DOM node
// on every render, triggering "destroy is not a function" error
const Field = ({ label, name, as, type = 'text', form, setForm, ...props }) => (
  <div>
    <label className="block text-xs font-body text-white/50 mb-1.5 uppercase tracking-wide">
      {label}
    </label>
    {as === 'textarea' ? (
      <textarea
        rows={3}
        className="input-field resize-none"
        value={form[name] || ''}
        onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))}
        {...props}
      />
    ) : as === 'select' ? (
      <select
        className="input-field"
        value={form[name] || ''}
        onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))}
      >
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    ) : (
      <input
        type={type}
        className="input-field"
        value={form[name] || ''}
        onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))}
        {...props}
      />
    )}
  </div>
)

export default function AdminCharities() {
  const [charities, setCharities] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(emptyForm)
  const [saving, setSaving]       = useState(false)

  const loadCharities = async () => {
    setLoading(true)
    const { data, error } = await getCharities()
    if (error) toast.error('Failed to load charities: ' + error.message)
    setCharities(data || [])
    setLoading(false)
  }

  useEffect(() => { loadCharities() }, [])

  const openCreate = () => { setForm(emptyForm); setEditing(null); setShowForm(true) }
  const openEdit   = (c)  => { setForm({ ...c }); setEditing(c.id); setShowForm(true) }
  const closeForm  = ()   => { setShowForm(false); setEditing(null); setForm(emptyForm) }

  const autoSlug = (name) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, slug: form.slug || autoSlug(form.name) }

    const { error } = editing
      ? await adminManageCharity.update(editing, payload)
      : await adminManageCharity.create(payload)

    setSaving(false)
    if (error) { toast.error(error.message); return }

    toast.success(editing ? 'Charity updated!' : 'Charity created!')
    closeForm()
    loadCharities()
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Deactivate "${name}"?`)) return
    const { error } = await adminManageCharity.delete(id)
    if (error) { toast.error(error.message); return }
    toast.success('Charity deactivated')
    loadCharities()
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white mb-1">Charities</h1>
          <p className="font-body text-sm text-white/40">{charities.length} active charities</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Add Charity
        </button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="card-glow p-6 mb-6 animate-slide-up">
          <h3 className="font-display text-xl text-white mb-5">
            {editing ? 'Edit Charity' : 'New Charity'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <Field label="Name *"    name="name"    form={form} setForm={setForm} required placeholder="Charity name" />
            <Field label="Slug"      name="slug"    form={form} setForm={setForm} placeholder="auto-generated from name" />

            <div className="col-span-1 sm:col-span-2">
              <Field label="Short description *" name="description" as="textarea"
                     form={form} setForm={setForm} required />
            </div>

            <div className="col-span-1 sm:col-span-2">
              <Field label="Long description" name="long_description" as="textarea"
                     form={form} setForm={setForm} />
            </div>

            <Field label="Image URL"   name="image_url"   form={form} setForm={setForm} placeholder="https://…" />
            <Field label="Website URL" name="website_url" form={form} setForm={setForm} placeholder="https://…" />

            <Field label="Category" name="category" as="select" form={form} setForm={setForm} />

            <div className="flex items-center gap-3 pt-2">
              <label className="flex items-center gap-2 text-sm font-body text-white/60 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_featured || false}
                  onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))}
                />
                Featured on homepage
              </label>
            </div>

            <div className="col-span-1 sm:col-span-2 flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? 'Saving…' : editing ? 'Update Charity' : 'Create Charity'}
              </button>
              <button type="button" onClick={closeForm} className="btn-secondary px-6">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Charities list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 card-glow animate-pulse" />
          ))}
        </div>
      ) : charities.length === 0 ? (
        <div className="card-glow p-12 text-center text-white/30 font-body text-sm">
          No charities yet. Click "Add Charity" to create one.
        </div>
      ) : (
        <div className="space-y-3">
          {charities.map(c => (
            <div key={c.id} className="card-glow p-4 flex items-center gap-4">
              {c.image_url && (
                <img
                  src={c.image_url}
                  alt={c.name}
                  className="w-12 h-12 rounded-xl object-cover shrink-0"
                  onError={e => { e.target.style.display = 'none' }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-body text-white font-medium">{c.name}</span>
                  {c.is_featured && <Star size={12} className="text-gold-400" />}
                  <span className="text-xs font-body text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                    {c.category}
                  </span>
                </div>
                <div className="text-xs font-body text-white/40 mt-0.5">
                  £{(c.total_raised || 0).toLocaleString()} raised
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => openEdit(c)}
                  title="Edit"
                  className="p-2 rounded-lg text-white/30 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(c.id, c.name)}
                  title="Deactivate"
                  className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

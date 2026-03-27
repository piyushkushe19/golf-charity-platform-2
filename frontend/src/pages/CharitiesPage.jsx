// src/pages/CharitiesPage.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCharities } from '../lib/supabase'
import { Search, Heart, ArrowRight, Calendar } from 'lucide-react'

const CATEGORIES = ['All', 'Health', 'Youth & Sport', 'Mental Health', 'Environment', 'Veterans', 'Children & Families']

export default function CharitiesPage() {
  const [charities, setCharities] = useState([])
  const [filtered, setFiltered]   = useState([])
  const [search, setSearch]       = useState('')
  const [category, setCategory]   = useState('All')
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    getCharities().then(({ data }) => {
      setCharities(data || [])
      setFiltered(data || [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    let results = charities
    if (category !== 'All') results = results.filter(c => c.category === category)
    if (search)             results = results.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(results)
  }, [search, category, charities])

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 text-pink-400 text-xs font-body uppercase tracking-widest mb-4">
          <Heart size={14} className="animate-pulse-slow" /> Making a difference
        </div>
        <h1 className="font-display text-5xl text-white mb-4">Our charity partners</h1>
        <p className="font-body text-white/40 max-w-xl mx-auto">
          Every subscription sends at least 10% to the charity you choose.
          Explore our vetted partners below.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input type="text" placeholder="Search charities…"
                 className="input-field pl-9"
                 value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
                    className={`px-3 py-2 rounded-lg text-xs font-body transition-colors ${
                      category === cat
                        ? 'bg-brand-500 text-white'
                        : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                    }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card-glow h-72 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-white/30 font-body">
          No charities found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(charity => (
            <Link key={charity.id} to={`/charities/${charity.slug}`}
                  className="card-glow overflow-hidden group block">
              {/* Image */}
              {charity.image_url && (
                <div className="h-44 overflow-hidden">
                  <img src={charity.image_url} alt={charity.name}
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" />
                </div>
              )}
              <div className="p-5">
                {/* Meta */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-body text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">
                    {charity.category}
                  </span>
                  {charity.is_featured && (
                    <span className="text-xs font-body text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full">
                      ★ Featured
                    </span>
                  )}
                </div>

                <h3 className="font-display text-lg text-white mb-2">{charity.name}</h3>
                <p className="font-body text-sm text-white/50 line-clamp-2 mb-4">{charity.description}</p>

                {/* Events badge */}
                {charity.charity_events?.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-body text-white/30 mb-3">
                    <Calendar size={11} />
                    {charity.charity_events.length} upcoming event{charity.charity_events.length !== 1 ? 's' : ''}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-gold-400">
                    £{charity.total_raised?.toLocaleString()} raised
                  </span>
                  <ArrowRight size={14} className="text-white/20 group-hover:text-brand-400 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

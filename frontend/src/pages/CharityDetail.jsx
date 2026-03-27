// src/pages/CharityDetail.jsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCharity } from '../lib/supabase'
import { ArrowLeft, Calendar, Globe, Heart, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

export default function CharityDetail() {
  const { slug } = useParams()
  const [charity, setCharity] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCharity(slug).then(({ data }) => {
      setCharity(data)
      setLoading(false)
    })
  }, [slug])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!charity) return (
    <div className="min-h-screen flex items-center justify-center text-white/50 font-body">
      Charity not found.
    </div>
  )

  const upcomingEvents = charity.charity_events?.filter(e => new Date(e.event_date) >= new Date()) || []

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <Link to="/charities" className="inline-flex items-center gap-2 text-white/40 hover:text-white
                                       font-body text-sm mb-8 transition-colors">
        <ArrowLeft size={15} /> Back to charities
      </Link>

      {/* Hero image */}
      {charity.image_url && (
        <div className="h-64 md:h-80 rounded-2xl overflow-hidden mb-8">
          <img src={charity.image_url} alt={charity.name}
               className="w-full h-full object-cover opacity-80" />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-body text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">
              {charity.category}
            </span>
            {charity.is_featured && (
              <span className="text-xs font-body text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full">
                ★ Featured
              </span>
            )}
          </div>
          <h1 className="font-display text-4xl text-white mb-2">{charity.name}</h1>
          <p className="font-body text-white/50">{charity.description}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-3xl text-gold-400 font-bold">
            £{charity.total_raised?.toLocaleString()}
          </div>
          <div className="text-xs font-body text-white/30">raised via ParScore</div>
          {charity.website_url && (
            <a href={charity.website_url} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1 text-xs font-body text-brand-400 hover:underline mt-2">
              Visit website <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>

      {/* Long description */}
      {charity.long_description && (
        <div className="card-glow p-6 mb-8">
          <h2 className="font-display text-xl text-white mb-4">About {charity.name}</h2>
          <p className="font-body text-white/60 leading-relaxed text-sm">{charity.long_description}</p>
        </div>
      )}

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <div className="card-glow p-6 mb-8">
          <h2 className="font-display text-xl text-white mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-brand-400" /> Upcoming Events
          </h2>
          <div className="space-y-4">
            {upcomingEvents.map(event => (
              <div key={event.id} className="flex gap-4 p-4 bg-white/3 rounded-xl border border-white/5">
                <div className="shrink-0 w-14 h-14 rounded-xl bg-brand-500/15 flex flex-col items-center justify-center">
                  <span className="text-xs font-mono text-brand-400">
                    {format(new Date(event.event_date), 'MMM')}
                  </span>
                  <span className="font-mono text-lg font-bold text-white">
                    {format(new Date(event.event_date), 'd')}
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-white mb-1">{event.title}</h3>
                  {event.location && (
                    <p className="text-xs font-body text-white/40 mb-1">📍 {event.location}</p>
                  )}
                  {event.description && (
                    <p className="text-xs font-body text-white/50">{event.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="card-glow p-6 text-center">
        <Heart size={24} className="text-pink-400 mx-auto mb-3" />
        <h3 className="font-display text-xl text-white mb-2">Support {charity.name}</h3>
        <p className="font-body text-sm text-white/40 mb-6">
          Subscribe to ParScore and choose this charity as your monthly recipient.
          A minimum of 10% of your subscription goes directly to them.
        </p>
        <Link to="/signup" className="btn-primary">
          Subscribe & Support This Charity
        </Link>
      </div>
    </div>
  )
}

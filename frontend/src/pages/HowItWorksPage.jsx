// src/pages/HowItWorksPage.jsx
import { Link } from 'react-router-dom'
import { ArrowRight, CreditCard, Target, Heart, Trophy, Shield, RefreshCw } from 'lucide-react'

const Section = ({ icon: Icon, color, title, children }) => (
  <div className="card-glow p-8">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <h3 className="font-display text-2xl text-white mb-4">{title}</h3>
    <div className="font-body text-sm text-white/50 leading-relaxed space-y-2">
      {children}
    </div>
  </div>
)

export default function HowItWorksPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="font-display text-5xl md:text-6xl text-white mb-4">How ParScore works</h1>
        <p className="font-body text-white/40 text-lg max-w-xl mx-auto">
          A simple, transparent system designed to make every round of golf meaningful.
        </p>
      </div>

      {/* Main steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        <Section icon={CreditCard} color="bg-brand-600" title="1. Subscribe">
          <p>Choose a Monthly (£9.99) or Yearly (£99.99) plan — saving over £19 per year.</p>
          <p>Payments are processed securely through Stripe. Cancel anytime from your dashboard — no hidden fees.</p>
          <p>Your subscription unlocks full access: score tracking, draws, dashboard, and charity contributions.</p>
        </Section>

        <Section icon={Target} color="bg-blue-600" title="2. Enter your scores">
          <p>After each round, enter your Stableford score (1–45) along with the date played.</p>
          <p>The system keeps your last 5 scores. When you add a 6th, the oldest is automatically removed.</p>
          <p>Scores are displayed in reverse chronological order so your most recent rounds are always at the top.</p>
        </Section>

        <Section icon={Heart} color="bg-pink-600" title="3. Give to charity">
          <p>During signup, select a charity from our vetted directory. A minimum of 10% of your subscription goes to them every month.</p>
          <p>You can increase your charity percentage at any time from your dashboard — or donate directly, separate from your subscription.</p>
        </Section>

        <Section icon={Trophy} color="bg-gold-600" title="4. Monthly draws">
          <p>At the end of each month, 5 numbers (1–45) are drawn — either randomly or via our weighted algorithm that factors in score frequency.</p>
          <p>Your 5 scores are automatically compared to the drawn numbers. Match 3, 4, or all 5 and you win a share of that tier's prize pool.</p>
          <p>Multiple winners in the same tier split the prize equally.</p>
        </Section>

        <Section icon={Shield} color="bg-purple-600" title="5. Winner verification">
          <p>If you win, you'll need to upload a screenshot from your golf platform confirming your scores.</p>
          <p>Our team reviews submissions and approves or rejects within 48 hours.</p>
          <p>Once approved, your prize is marked as paid and tracked in your winnings dashboard.</p>
        </Section>

        <Section icon={RefreshCw} color="bg-teal-600" title="Jackpot rollover">
          <p>The 5-number match jackpot (40% of the pool) rolls over to the following month if no winner is found.</p>
          <p>This means the jackpot can accumulate over time — the more months without a 5-match, the bigger the prize.</p>
          <p>3 and 4 match prizes do NOT roll over — they are distributed fresh each month.</p>
        </Section>
      </div>

      {/* Prize table */}
      <div className="card-glow p-8 mb-12">
        <h2 className="font-display text-3xl text-white mb-6 text-center">Prize pool distribution</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 text-white/50 font-medium">Match Type</th>
                <th className="text-center py-3 text-white/50 font-medium">Pool Share</th>
                <th className="text-center py-3 text-white/50 font-medium">Rollover?</th>
                <th className="text-left py-3 text-white/50 font-medium">Example (£1,000 pool)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="py-4"><span className="prize-badge-5">5 Number Match</span></td>
                <td className="py-4 text-center font-mono text-white">40%</td>
                <td className="py-4 text-center text-gold-400">✓ Jackpot</td>
                <td className="py-4 text-white/60">£400 (split among all 5-match winners)</td>
              </tr>
              <tr>
                <td className="py-4"><span className="prize-badge-4">4 Number Match</span></td>
                <td className="py-4 text-center font-mono text-white">35%</td>
                <td className="py-4 text-center text-white/30">No</td>
                <td className="py-4 text-white/60">£350 (split among all 4-match winners)</td>
              </tr>
              <tr>
                <td className="py-4"><span className="prize-badge-3">3 Number Match</span></td>
                <td className="py-4 text-center font-mono text-white">25%</td>
                <td className="py-4 text-center text-white/30">No</td>
                <td className="py-4 text-white/60">£250 (split among all 3-match winners)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs font-body text-white/30 mt-4 text-center">
          Pool is auto-calculated from active subscriber count each month.
        </p>
      </div>

      {/* FAQ */}
      <div className="mb-16">
        <h2 className="font-display text-3xl text-white mb-8 text-center">Frequently asked questions</h2>
        <div className="space-y-4 max-w-3xl mx-auto">
          {[
            {
              q: 'Do I need to be a professional golfer?',
              a: 'Not at all. ParScore is for all levels of golfer. Stableford scoring is a common recreational format — ask your golf club if unsure.',
            },
            {
              q: 'What happens if I miss a month of scores?',
              a: 'You\'ll still be entered into the draw with whatever scores you have logged. Missing scores just means fewer numbers to match against.',
            },
            {
              q: 'How is the draw algorithm weighted?',
              a: 'In weighted mode, numbers that appear more frequently across all user scores are drawn less often — giving less common scores a greater chance of winning.',
            },
            {
              q: 'Can I change my charity after signing up?',
              a: 'Yes. You can update your selected charity and contribution percentage from your dashboard at any time.',
            },
            {
              q: 'How are winnings paid out?',
              a: 'After submitting your proof and receiving admin approval, your payout is processed manually. Payment method and timing will be communicated after approval.',
            },
          ].map(({ q, a }, i) => (
            <div key={i} className="card-glow p-5">
              <h4 className="font-display text-white text-lg mb-2">{q}</h4>
              <p className="font-body text-sm text-white/50">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <h2 className="font-display text-4xl text-white mb-4">Ready to get started?</h2>
        <p className="font-body text-white/40 mb-8">From £9.99/month. Cancel anytime.</p>
        <Link to="/signup" className="btn-primary text-lg px-10 py-4">
          Join ParScore <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  )
}

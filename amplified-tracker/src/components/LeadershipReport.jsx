import { useState, useMemo } from 'react'
import { Sparkles, Printer, Edit2, Check } from 'lucide-react'
import { LEVELS, levelColor } from '../data/rubric'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const STALL_DAYS = 30

function daysSince(dateStr) {
  const d = new Date(dateStr)
  return Math.floor((Date.now() - d) / 86400000)
}

export default function LeadershipReport({ data }) {
  const { learners = [], trendData = [] } = data
  const [narrative, setNarrative] = useState('')
  const [editingNarrative, setEditingNarrative] = useState(false)
  const [narrativeDraft, setNarrativeDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const stats = useMemo(() => {
    const total = learners.length
    const byLevel = {}
    LEVELS.forEach((l) => { byLevel[l] = 0 })
    learners.forEach((l) => { byLevel[l.currentLevel] = (byLevel[l.currentLevel] || 0) + 1 })
    const practitionerPlus = (byLevel.Practitioner || 0) + (byLevel.Leader || 0)
    const pct = total > 0 ? Math.round((practitionerPlus / total) * 100) : 0

    const stalled = learners.filter((l) => {
      if (l.currentLevel === 'Leader') return false
      const events = l.usageEvents || []
      if (events.length === 0) return true
      const lastDate = events.reduce((latest, e) => e.date > latest ? e.date : latest, events[0].date)
      return daysSince(lastDate) > STALL_DAYS
    })

    const chartData = LEVELS.map((level) => ({ level, count: byLevel[level] || 0 }))
    return { total, byLevel, practitionerPlus, pct, stalled, chartData }
  }, [learners])

  const topGaps = stats.stalled.slice(0, 3)

  const fetchNarrative = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/.netlify/functions/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'narrative',
          cohortStats: {
            total: stats.total,
            byLevel: stats.byLevel,
            practitionerPlus: stats.practitionerPlus,
            pct: stats.pct,
            stalledCount: stats.stalled.length,
            stalledNames: stats.stalled.map((l) => `${l.name} (${l.currentLevel})`),
            trendData,
          },
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Server error ${res.status}`)
      }
      const { narrative: text } = await res.json()
      setNarrative(text)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => window.print()

  const COLORS = { Explorer: '#60a5fa', Practitioner: '#C9922A', Leader: '#260F24' }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="font-bebas text-4xl text-plum tracking-wide">Leadership Report</h1>
          <p className="text-plum/60 text-sm mt-1">Cohort fluency summary for executive review</p>
        </div>
        <button onClick={handlePrint} className="btn-secondary flex items-center gap-1.5">
          <Printer className="w-4 h-4" aria-hidden="true" />
          Print / PDF
        </button>
      </div>

      {/* Printable report content */}
      <div className="bg-white rounded-2xl shadow-sm border border-cream-dark overflow-hidden">
        {/* Report header */}
        <div className="bg-plum px-8 py-6 text-cream">
          <h2 className="font-playfair text-2xl font-bold">AmplifiED AI Fluency Initiative</h2>
          <p className="text-cream/60 text-sm mt-1">
            Cohort Report · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="p-8 space-y-8">
          {/* Key numbers */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Learners', value: stats.total },
              { label: 'Practitioner or Above', value: stats.practitionerPlus },
              { label: 'Adoption Rate', value: `${stats.pct}%` },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-4 bg-cream/60 rounded-xl">
                <p className="font-bebas text-4xl text-plum">{value}</p>
                <p className="text-xs text-plum/50 uppercase tracking-widest mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Distribution chart */}
          <div>
            <h3 className="font-medium text-plum mb-3 text-sm uppercase tracking-widest">Ladder Distribution</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={stats.chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="level" tick={{ fontSize: 12, fill: '#260F24', opacity: 0.6 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#260F24', opacity: 0.6 }} />
                <Tooltip
                  contentStyle={{ fontFamily: 'DM Sans', fontSize: 12, borderColor: '#ebe3cc', borderRadius: 8 }}
                  formatter={(v) => [`${v} learners`]}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {stats.chartData.map(({ level }) => (
                    <Cell key={level} fill={COLORS[level]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Adoption gaps */}
          {topGaps.length > 0 && (
            <div>
              <h3 className="font-medium text-plum mb-3 text-sm uppercase tracking-widest">Top Adoption Gaps</h3>
              <div className="space-y-2">
                {topGaps.map((l) => (
                  <div key={l.id} className="flex items-center justify-between px-4 py-2.5 bg-amber-50 rounded-lg border border-amber-200">
                    <div>
                      <span className="text-sm font-medium text-plum">{l.name}</span>
                      <span className="text-xs text-plum/50 ml-2">{l.team}</span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${levelColor(l.currentLevel)}`}>
                      {l.currentLevel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Narrative */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-playfair text-lg font-bold text-plum">Executive Summary</h3>
              <div className="flex items-center gap-2 no-print">
                {!narrative && !loading && (
                  <button onClick={fetchNarrative} className="btn-primary flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    Generate with AI
                  </button>
                )}
                {narrative && !editingNarrative && (
                  <>
                    <button onClick={fetchNarrative} className="btn-ghost text-xs">Regenerate</button>
                    <button onClick={() => { setNarrativeDraft(narrative); setEditingNarrative(true) }} className="btn-ghost text-xs flex items-center gap-1">
                      <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Edit
                    </button>
                  </>
                )}
                {editingNarrative && (
                  <button onClick={() => { setNarrative(narrativeDraft); setEditingNarrative(false) }} className="btn-primary text-xs flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    Save
                  </button>
                )}
              </div>
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-sm text-plum/60 py-4">
                <div className="w-4 h-4 border-2 border-gold/40 border-t-gold rounded-full animate-spin" aria-hidden="true" />
                Generating executive narrative…
              </div>
            )}

            {error && (
              <div className="text-red-600 text-sm p-3 bg-red-50 rounded-lg">
                <p>{error}</p>
                <button onClick={fetchNarrative} className="btn-ghost text-xs mt-2">Try again</button>
              </div>
            )}

            {!narrative && !loading && !error && (
              <p className="text-sm text-plum/40 italic py-4">
                Click "Generate with AI" to produce a leadership-ready narrative from your cohort data.
              </p>
            )}

            {narrative && !editingNarrative && (
              <p className="text-sm leading-relaxed text-plum">{narrative}</p>
            )}

            {editingNarrative && (
              <textarea
                value={narrativeDraft}
                onChange={(e) => setNarrativeDraft(e.target.value)}
                rows={5}
                className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none leading-relaxed"
                aria-label="Edit narrative"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useMemo } from 'react'
import { AlertTriangle, TrendingUp, Users, Award } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { LEVELS, levelColor } from '../data/rubric'

const STALL_DAYS = 30

function daysSince(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now - d) / (1000 * 60 * 60 * 24))
}

function LevelBadge({ level }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${levelColor(level)}`}>
      {level}
    </span>
  )
}

export default function Dashboard({ data, onSelectLearner, onNavigateRoster }) {
  const { learners = [], trendData = [] } = data

  const stats = useMemo(() => {
    const total = learners.length
    const byLevel = { Explorer: 0, Practitioner: 0, Leader: 0 }
    learners.forEach((l) => { byLevel[l.currentLevel] = (byLevel[l.currentLevel] || 0) + 1 })
    const practitionerPlus = (byLevel.Practitioner || 0) + (byLevel.Leader || 0)
    const pct = total > 0 ? Math.round((practitionerPlus / total) * 100) : 0
    return { total, byLevel, practitionerPlus, pct }
  }, [learners])

  const stalledLearners = useMemo(() => {
    return learners.filter((l) => {
      if (l.currentLevel === 'Leader') return false
      const events = l.usageEvents || []
      if (events.length === 0) return true
      const lastDate = events.reduce((latest, e) =>
        e.date > latest ? e.date : latest, events[0].date)
      return daysSince(lastDate) > STALL_DAYS
    })
  }, [learners])

  const openInterventions = useMemo(() => {
    return learners.flatMap((l) =>
      (l.interventions || [])
        .filter((i) => i.status === 'open')
        .map((i) => ({ ...i, learnerName: l.name, learnerId: l.id }))
    )
  }, [learners])

  const trendChartData = trendData.map((d) => ({
    date: d.date.slice(5), // MM-DD
    count: d.practitionerOrAbove,
  }))

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-bebas text-4xl text-plum tracking-wide">Cohort Dashboard</h1>
        <p className="text-plum/60 text-sm mt-1">
          AmplifiED Three-Tier Fluency Ladder — {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Headline counters */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-plum/50 uppercase tracking-widest font-medium">Total Learners</p>
              <p className="font-bebas text-5xl text-plum mt-1">{stats.total}</p>
            </div>
            <div className="w-9 h-9 bg-plum/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-plum" aria-hidden="true" />
            </div>
          </div>
        </div>
        {LEVELS.map((level) => (
          <div key={level} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-plum/50 uppercase tracking-widest font-medium">{level}</p>
                <p className="font-bebas text-5xl text-plum mt-1">{stats.byLevel[level] || 0}</p>
              </div>
              <LevelBadge level={level} />
            </div>
          </div>
        ))}
      </div>

      {/* Practitioner+ rate */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-plum/50 uppercase tracking-widest font-medium">Practitioner or Above</p>
            <p className="font-bebas text-3xl text-plum">{stats.practitionerPlus} learners — {stats.pct}%</p>
          </div>
          <Award className="w-6 h-6 text-gold" aria-hidden="true" />
        </div>
        {/* Distribution bar */}
        <div className="flex rounded-full overflow-hidden h-4 bg-cream-dark gap-0.5">
          {LEVELS.map((level) => {
            const count = stats.byLevel[level] || 0
            const width = stats.total > 0 ? (count / stats.total) * 100 : 0
            const colors = {
              Explorer: 'bg-blue-400',
              Practitioner: 'bg-gold',
              Leader: 'bg-plum',
            }
            return width > 0 ? (
              <div
                key={level}
                className={`${colors[level]} h-full transition-all duration-500`}
                style={{ width: `${width}%` }}
                title={`${level}: ${count}`}
              />
            ) : null
          })}
        </div>
        <div className="flex gap-4 mt-2">
          {LEVELS.map((level) => {
            const count = stats.byLevel[level] || 0
            const dotColors = { Explorer: 'bg-blue-400', Practitioner: 'bg-gold', Leader: 'bg-plum' }
            return (
              <div key={level} className="flex items-center gap-1.5 text-xs text-plum/60">
                <div className={`w-2.5 h-2.5 rounded-full ${dotColors[level]}`} />
                {level} ({count})
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Trend chart */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-plum/50 uppercase tracking-widest font-medium">Adoption Trend</p>
              <p className="font-medium text-plum text-sm">Practitioner+ over time</p>
            </div>
            <TrendingUp className="w-5 h-5 text-gold" aria-hidden="true" />
          </div>
          {trendChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trendChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ebe3cc" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#260F24', opacity: 0.5 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#260F24', opacity: 0.5 }} />
                <Tooltip
                  contentStyle={{ fontFamily: 'DM Sans', fontSize: 12, borderColor: '#ebe3cc', borderRadius: 8 }}
                  labelFormatter={(v) => `Date: ${v}`}
                  formatter={(v) => [`${v} learners`, 'Practitioner+']}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#C9922A"
                  strokeWidth={2.5}
                  dot={{ fill: '#C9922A', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-plum/40 text-sm">
              No trend data yet
            </div>
          )}
        </div>

        {/* Adoption gaps */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-plum/50 uppercase tracking-widest font-medium">Adoption Gaps</p>
              <p className="font-medium text-plum text-sm">Stalled &gt;{STALL_DAYS} days or open interventions</p>
            </div>
            <AlertTriangle className="w-5 h-5 text-amber-500" aria-hidden="true" />
          </div>

          {stalledLearners.length === 0 && openInterventions.length === 0 ? (
            <div className="text-plum/40 text-sm text-center py-6">
              No stalled learners — great momentum!
            </div>
          ) : (
            <div className="space-y-2">
              {stalledLearners.map((l) => (
                <button
                  key={l.id}
                  onClick={() => onSelectLearner(l.id)}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200 hover:border-amber-400 transition-colors duration-200 cursor-pointer text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-plum">{l.name}</p>
                    <p className="text-xs text-plum/50">{l.team} · Stalled at {l.currentLevel}</p>
                  </div>
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" aria-hidden="true" />
                </button>
              ))}
              {openInterventions.slice(0, 3).map((iv, i) => (
                <button
                  key={i}
                  onClick={() => onSelectLearner(iv.learnerId)}
                  className="w-full flex items-start gap-2 p-3 rounded-lg bg-cream-dark border border-cream-dark hover:border-gold/40 transition-colors duration-200 cursor-pointer text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-plum">{iv.learnerName}</p>
                    <p className="text-xs text-plum/60 truncate">{iv.action}</p>
                  </div>
                  <span className="text-xs bg-gold/20 text-gold-dark px-1.5 py-0.5 rounded flex-shrink-0">Open</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

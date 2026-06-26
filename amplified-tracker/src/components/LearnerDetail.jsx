import { useState, useMemo } from 'react'
import { ArrowLeft, Sparkles, CheckCircle2, Circle, Clock, Plus, Check, X } from 'lucide-react'
import { RUBRIC, LEVELS, levelColor, levelProgress } from '../data/rubric'

const EVENT_TYPES = [
  { id: 'session_attended', label: 'Session Attended' },
  { id: 'tool_used', label: 'Tool Used' },
  { id: 'artifact_shipped', label: 'Artifact Shipped' },
  { id: 'coached', label: 'Coached' },
]

function CompetencyStatus({ status }) {
  if (status === 'demonstrated') return <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" aria-label="Demonstrated" />
  if (status === 'in_progress') return <Clock className="w-5 h-5 text-gold flex-shrink-0" aria-label="In Progress" />
  return <Circle className="w-5 h-5 text-plum/30 flex-shrink-0" aria-label="Not Started" />
}

function cycleStatus(current) {
  if (current === 'not_started') return 'in_progress'
  if (current === 'in_progress') return 'demonstrated'
  return 'not_started'
}

function recomputeLevel(competencies) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (i === 0) return 'Explorer'
    const prevLevel = LEVELS[i - 1]
    const prevComps = competencies.filter((c) => c.level === prevLevel)
    if (prevComps.length > 0 && prevComps.every((c) => c.status === 'demonstrated')) {
      return LEVELS[i]
    }
  }
  return 'Explorer'
}

function AIInterventionPanel({ learner, onAccept, onDismiss }) {
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState(null)
  const [error, setError] = useState(null)

  const fetchSuggestion = async () => {
    setLoading(true)
    setError(null)
    setSuggestion(null)
    try {
      const payload = {
        task: 'intervention',
        learner: {
          name: learner.name,
          currentLevel: learner.currentLevel,
          competencies: learner.competencies,
          recentEvents: (learner.usageEvents || []).slice(-5),
          openInterventions: (learner.interventions || []).filter((i) => i.status === 'open'),
        },
      }
      const res = await fetch('/.netlify/functions/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Server error ${res.status}`)
      }
      const data = await res.json()
      setSuggestion(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-plum/5 to-gold/5 border border-gold/20 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-gold" aria-hidden="true" />
        <span className="text-sm font-medium text-plum">AI Intervention Suggestion</span>
      </div>

      {!suggestion && !loading && (
        <button onClick={fetchSuggestion} className="btn-primary text-xs">
          Suggest Next Intervention
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-plum/60 py-2">
          <div className="w-4 h-4 border-2 border-gold/40 border-t-gold rounded-full animate-spin" aria-hidden="true" />
          Consulting AmplifiED coach…
        </div>
      )}

      {error && (
        <div className="text-red-600 text-sm">
          <p>{error}</p>
          <button onClick={fetchSuggestion} className="btn-ghost text-xs mt-2">Try again</button>
        </div>
      )}

      {suggestion && (
        <div className="space-y-3">
          <div className="bg-white rounded-lg p-3 border border-gold/20">
            <p className="text-sm font-medium text-plum">{suggestion.action}</p>
            <p className="text-xs text-plum/60 mt-1">{suggestion.rationale}</p>
            {suggestion.owner_suggestion && (
              <p className="text-xs text-gold-dark mt-1">Owner: {suggestion.owner_suggestion}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { onAccept(suggestion); setSuggestion(null) }}
              className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors duration-200 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              Accept & Add
            </button>
            <button
              onClick={() => { setSuggestion(null); onDismiss() }}
              className="flex items-center gap-1 text-xs btn-ghost"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              Dismiss
            </button>
            <button onClick={fetchSuggestion} className="text-xs btn-ghost ml-auto">
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LearnerDetail({ learner, onUpdate, onBack }) {
  const [eventNote, setEventNote] = useState('')
  const [eventType, setEventType] = useState('tool_used')
  const [interventionText, setInterventionText] = useState('')
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [showAddIntervention, setShowAddIntervention] = useState(false)

  const progress = useMemo(() =>
    LEVELS.map((level) => ({
      level,
      pct: levelProgress(learner.competencies, level),
    })), [learner.competencies])

  const handleToggleCompetency = (compId) => {
    const updated = learner.competencies.map((c) =>
      c.id === compId ? { ...c, status: cycleStatus(c.status) } : c
    )
    const newLevel = recomputeLevel(updated)
    onUpdate({ ...learner, competencies: updated, currentLevel: newLevel })
  }

  const handleAddEvent = () => {
    if (!eventNote.trim()) return
    const newEvent = { date: new Date().toISOString().slice(0, 10), type: eventType, note: eventNote.trim() }
    onUpdate({ ...learner, usageEvents: [...(learner.usageEvents || []), newEvent] })
    setEventNote('')
    setShowAddEvent(false)
  }

  const handleAddIntervention = () => {
    if (!interventionText.trim()) return
    const newIv = {
      date: new Date().toISOString().slice(0, 10),
      action: interventionText.trim(),
      owner: 'Ashley Hodges',
      status: 'open',
    }
    onUpdate({ ...learner, interventions: [...(learner.interventions || []), newIv] })
    setInterventionText('')
    setShowAddIntervention(false)
  }

  const handleAcceptAISuggestion = (suggestion) => {
    const newIv = {
      date: new Date().toISOString().slice(0, 10),
      action: suggestion.action,
      owner: suggestion.owner_suggestion || 'Ashley Hodges',
      status: 'open',
    }
    onUpdate({ ...learner, interventions: [...(learner.interventions || []), newIv] })
  }

  const handleToggleIntervention = (idx) => {
    const updated = (learner.interventions || []).map((iv, i) =>
      i === idx ? { ...iv, status: iv.status === 'open' ? 'done' : 'open' } : iv
    )
    onUpdate({ ...learner, interventions: updated })
  }

  const currentRubric = RUBRIC[learner.currentLevel]

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-plum/60 hover:text-plum text-sm cursor-pointer transition-colors duration-200">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Roster
        </button>
      </div>

      {/* Learner header */}
      <div className="bg-plum rounded-2xl p-6 text-cream">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-bebas text-4xl tracking-wide">{learner.name}</h1>
            <p className="text-cream/60 text-sm mt-1">{learner.team} · Started {learner.startDate}</p>
            {learner.notes && <p className="text-cream/70 text-sm mt-3 max-w-lg leading-relaxed">{learner.notes}</p>}
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${levelColor(learner.currentLevel)}`}>
            {learner.currentLevel}
          </span>
        </div>

        {/* Progress bars for each level */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {progress.map(({ level, pct }) => (
            <div key={level}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-cream/60">{level}</span>
                <span className="text-cream/80 font-medium">{pct}%</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold transition-all duration-500 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Competency checklist — left col */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="font-bebas text-2xl text-plum tracking-wide">Competencies</h2>
          {LEVELS.map((level) => {
            const rubric = RUBRIC[level]
            return (
              <div key={level} className="bg-white rounded-xl border border-cream-dark shadow-sm overflow-hidden">
                <div className={`px-4 py-2.5 flex items-center gap-2 ${
                  level === 'Explorer' ? 'bg-blue-50' :
                  level === 'Practitioner' ? 'bg-amber-50' : 'bg-purple-50'
                }`}>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${levelColor(level)}`}>
                    {level}
                  </span>
                  <span className="text-xs text-plum/50 flex-1">{rubric.description}</span>
                </div>
                {rubric.dimensions.map((dim) => {
                  const dimComps = learner.competencies.filter((c) => c.dimensionId === dim.id)
                  return (
                    <div key={dim.id} className="border-t border-cream-dark">
                      <p className="px-4 py-2 text-xs font-semibold text-plum/50 uppercase tracking-wider bg-cream/40">
                        {dim.name}
                      </p>
                      {dimComps.map((comp) => (
                        <button
                          key={comp.id}
                          onClick={() => handleToggleCompetency(comp.id)}
                          className="w-full flex items-start gap-3 px-4 py-3 border-t border-cream-dark/50 hover:bg-cream/60 transition-colors duration-150 cursor-pointer text-left"
                          aria-pressed={comp.status === 'demonstrated'}
                        >
                          <CompetencyStatus status={comp.status} />
                          <span className={`text-sm leading-snug ${comp.status === 'demonstrated' ? 'text-plum/50 line-through' : 'text-plum'}`}>
                            {comp.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Right col — events, interventions, AI */}
        <div className="lg:col-span-2 space-y-4">
          {/* AI suggestion */}
          <AIInterventionPanel
            learner={learner}
            onAccept={handleAcceptAISuggestion}
            onDismiss={() => {}}
          />

          {/* Usage event log */}
          <div className="bg-white rounded-xl border border-cream-dark shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-plum text-sm">Usage Events</h3>
              <button onClick={() => setShowAddEvent((s) => !s)} className="btn-ghost text-xs flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                Add
              </button>
            </div>

            {showAddEvent && (
              <div className="mb-3 space-y-2 p-3 bg-cream/60 rounded-lg">
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full border border-cream-dark rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold/40"
                  aria-label="Event type"
                >
                  {EVENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <input
                  value={eventNote}
                  onChange={(e) => setEventNote(e.target.value)}
                  placeholder="Brief note…"
                  className="w-full border border-cream-dark rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold/40"
                  aria-label="Event note"
                />
                <div className="flex gap-2">
                  <button onClick={handleAddEvent} className="btn-primary text-xs flex-1">Save</button>
                  <button onClick={() => setShowAddEvent(false)} className="btn-ghost text-xs flex-1">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-1 max-h-48 overflow-y-auto">
              {[...(learner.usageEvents || [])].reverse().map((ev, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 border-b border-cream-dark/40 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-plum truncate">{ev.note}</p>
                    <p className="text-xs text-plum/40">{ev.date} · {EVENT_TYPES.find((t) => t.id === ev.type)?.label || ev.type}</p>
                  </div>
                </div>
              ))}
              {(learner.usageEvents || []).length === 0 && (
                <p className="text-xs text-plum/40 text-center py-4">No events logged yet</p>
              )}
            </div>
          </div>

          {/* Interventions */}
          <div className="bg-white rounded-xl border border-cream-dark shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-plum text-sm">Interventions</h3>
              <button onClick={() => setShowAddIntervention((s) => !s)} className="btn-ghost text-xs flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                Add
              </button>
            </div>

            {showAddIntervention && (
              <div className="mb-3 space-y-2 p-3 bg-cream/60 rounded-lg">
                <textarea
                  value={interventionText}
                  onChange={(e) => setInterventionText(e.target.value)}
                  placeholder="Describe the intervention action…"
                  rows={2}
                  className="w-full border border-cream-dark rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none"
                  aria-label="Intervention description"
                />
                <div className="flex gap-2">
                  <button onClick={handleAddIntervention} className="btn-primary text-xs flex-1">Save</button>
                  <button onClick={() => setShowAddIntervention(false)} className="btn-ghost text-xs flex-1">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {(learner.interventions || []).map((iv, i) => (
                <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg border ${iv.status === 'done' ? 'bg-green-50 border-green-200' : 'bg-cream/60 border-cream-dark'}`}>
                  <button
                    onClick={() => handleToggleIntervention(i)}
                    className="mt-0.5 flex-shrink-0 cursor-pointer"
                    aria-label={iv.status === 'done' ? 'Mark open' : 'Mark done'}
                  >
                    {iv.status === 'done'
                      ? <CheckCircle2 className="w-4 h-4 text-green-500" aria-hidden="true" />
                      : <Circle className="w-4 h-4 text-plum/30" aria-hidden="true" />
                    }
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug ${iv.status === 'done' ? 'text-plum/40 line-through' : 'text-plum'}`}>{iv.action}</p>
                    <p className="text-xs text-plum/40 mt-0.5">{iv.date} · {iv.owner}</p>
                  </div>
                </div>
              ))}
              {(learner.interventions || []).length === 0 && (
                <p className="text-xs text-plum/40 text-center py-4">No interventions yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { Search, ChevronUp, ChevronDown, UserPlus } from 'lucide-react'
import { LEVELS, levelColor, buildAllCompetencies } from '../data/rubric'

function LevelBadge({ level }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${levelColor(level)}`}>
      {level}
    </span>
  )
}

function AddLearnerModal({ onAdd, onClose }) {
  const [form, setForm] = useState({
    name: '', team: '', currentLevel: 'Explorer', startDate: new Date().toISOString().slice(0, 10), notes: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const id = 'l-' + Date.now()
    const competencies = buildAllCompetencies()
    onAdd({ ...form, id, competencies, usageEvents: [], interventions: [] })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-plum/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 id="modal-title" className="font-bebas text-2xl text-plum tracking-wide mb-4">Add Learner</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-plum/60 mb-1" htmlFor="name">Name</label>
            <input id="name" required className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-plum/60 mb-1" htmlFor="team">Team</label>
            <input id="team" className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" value={form.team} onChange={e => setForm(f => ({ ...f, team: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-plum/60 mb-1" htmlFor="level">Starting Level</label>
            <select id="level" className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" value={form.currentLevel} onChange={e => setForm(f => ({ ...f, currentLevel: e.target.value }))}>
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-plum/60 mb-1" htmlFor="startDate">Start Date</label>
            <input id="startDate" type="date" className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-plum/60 mb-1" htmlFor="notes">Notes</label>
            <textarea id="notes" rows={2} className="w-full border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary flex-1">Add Learner</button>
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Roster({ learners, onSelectLearner, onAddLearner }) {
  const [query, setQuery] = useState('')
  const [filterLevel, setFilterLevel] = useState('All')
  const [filterTeam, setFilterTeam] = useState('All')
  const [sort, setSort] = useState({ field: 'name', dir: 'asc' })
  const [showAddModal, setShowAddModal] = useState(false)

  const teams = useMemo(() => {
    const s = new Set(learners.map((l) => l.team).filter(Boolean))
    return ['All', ...Array.from(s).sort()]
  }, [learners])

  const filtered = useMemo(() => {
    let result = learners
    if (query) result = result.filter((l) => l.name.toLowerCase().includes(query.toLowerCase()) || (l.team || '').toLowerCase().includes(query.toLowerCase()))
    if (filterLevel !== 'All') result = result.filter((l) => l.currentLevel === filterLevel)
    if (filterTeam !== 'All') result = result.filter((l) => l.team === filterTeam)
    result = [...result].sort((a, b) => {
      const va = (a[sort.field] || '').toString().toLowerCase()
      const vb = (b[sort.field] || '').toString().toLowerCase()
      return sort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })
    return result
  }, [learners, query, filterLevel, filterTeam, sort])

  const toggleSort = (field) => {
    setSort((s) => s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' })
  }

  const SortIcon = ({ field }) => {
    if (sort.field !== field) return null
    return sort.dir === 'asc' ? <ChevronUp className="w-3.5 h-3.5 inline" aria-hidden="true" /> : <ChevronDown className="w-3.5 h-3.5 inline" aria-hidden="true" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-4xl text-plum tracking-wide">Learner Roster</h1>
          <p className="text-plum/60 text-sm mt-1">{learners.length} learners tracked</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-1.5">
          <UserPlus className="w-4 h-4" aria-hidden="true" />
          Add Learner
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-plum/40" aria-hidden="true" />
          <input
            className="pl-9 pr-3 py-2 border border-cream-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 bg-white"
            placeholder="Search name or team…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search learners"
          />
        </div>
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 bg-white cursor-pointer"
          aria-label="Filter by level"
        >
          <option value="All">All Levels</option>
          {LEVELS.map((l) => <option key={l}>{l}</option>)}
        </select>
        <select
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
          className="border border-cream-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 bg-white cursor-pointer"
          aria-label="Filter by team"
        >
          {teams.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-cream-dark overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-plum text-cream text-xs uppercase tracking-widest">
              {[['name', 'Name'], ['team', 'Team'], ['currentLevel', 'Level'], ['startDate', 'Start Date']].map(([field, label]) => (
                <th
                  key={field}
                  className="px-4 py-3 text-left font-medium cursor-pointer hover:text-gold transition-colors duration-150 select-none"
                  onClick={() => toggleSort(field)}
                >
                  {label} <SortIcon field={field} />
                </th>
              ))}
              <th className="px-4 py-3 text-left font-medium">Open Actions</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-plum/40">No learners match your filters.</td>
              </tr>
            )}
            {filtered.map((l, i) => {
              const openCount = (l.interventions || []).filter((iv) => iv.status === 'open').length
              return (
                <tr
                  key={l.id}
                  className={`border-t border-cream-dark hover:bg-cream/60 transition-colors duration-150 cursor-pointer ${i % 2 === 0 ? '' : 'bg-cream/30'}`}
                  onClick={() => onSelectLearner(l.id)}
                >
                  <td className="px-4 py-3 font-medium text-plum">{l.name}</td>
                  <td className="px-4 py-3 text-plum/60">{l.team}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${levelColor(l.currentLevel)}`}>
                      {l.currentLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-plum/60">{l.startDate}</td>
                  <td className="px-4 py-3">
                    {openCount > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gold/20 text-gold-dark">
                        {openCount} open
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-gold text-xs font-medium">View →</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <AddLearnerModal onAdd={onAddLearner} onClose={() => setShowAddModal(false)} />
      )}
    </div>
  )
}

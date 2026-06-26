import { Upload, Download, LayoutDashboard, Users, BarChart3, FileText } from 'lucide-react'

export default function Nav({ view, setView, onImportSeed, onImportFile, onExport }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { id: 'roster', label: 'Roster', Icon: Users },
    { id: 'report', label: 'Leadership Report', Icon: FileText },
  ]

  return (
    <nav className="bg-plum text-cream no-print shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gold rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <span className="font-bebas text-xl tracking-wider text-cream">AmplifiED</span>
            </div>
            <div className="flex items-center gap-1">
              {navItems.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${
                    view === id
                      ? 'bg-gold/20 text-gold'
                      : 'text-cream/70 hover:text-cream hover:bg-white/10'
                  }`}
                  aria-current={view === id ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-cream/70 hover:text-cream text-xs px-2 py-1.5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors duration-200">
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              Import
              <input type="file" accept=".json" onChange={onImportFile} className="hidden" aria-label="Import cohort JSON" />
            </label>
            <button
              onClick={onExport}
              className="flex items-center gap-1.5 text-cream/70 hover:text-cream text-xs px-2 py-1.5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors duration-200"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              Export
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

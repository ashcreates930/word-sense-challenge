import { useState, useEffect, useCallback } from 'react'
import { loadData, saveData, exportData, importData } from './data/store'
import seedData from './data/seed.json'
import Dashboard from './components/Dashboard'
import Roster from './components/Roster'
import LearnerDetail from './components/LearnerDetail'
import LeadershipReport from './components/LeadershipReport'
import Nav from './components/Nav'

function App() {
  const [data, setData] = useState(null)
  const [view, setView] = useState('dashboard') // 'dashboard' | 'roster' | 'learner' | 'report'
  const [selectedLearnerId, setSelectedLearnerId] = useState(null)
  const [importError, setImportError] = useState(null)

  useEffect(() => {
    const stored = loadData()
    if (stored) {
      setData(stored)
    }
  }, [])

  const persistData = useCallback((newData) => {
    setData(newData)
    saveData(newData)
  }, [])

  const handleImportSeed = () => {
    persistData(seedData)
    setImportError(null)
  }

  const handleImportFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const imported = await importData(file)
      persistData(imported)
      setImportError(null)
    } catch (err) {
      setImportError(err.message)
    }
    e.target.value = ''
  }

  const handleExport = () => {
    if (data) exportData(data)
  }

  const handleSelectLearner = (id) => {
    setSelectedLearnerId(id)
    setView('learner')
  }

  const handleUpdateLearner = (updatedLearner) => {
    const newData = {
      ...data,
      learners: data.learners.map((l) => l.id === updatedLearner.id ? updatedLearner : l),
    }
    persistData(newData)
  }

  const handleAddLearner = (learner) => {
    const newData = { ...data, learners: [...data.learners, learner] }
    persistData(newData)
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 bg-plum rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="font-bebas text-4xl text-plum mb-2 tracking-wide">AmplifiED Fluency Tracker</h1>
          <p className="text-plum/60 mb-8 text-sm leading-relaxed">
            No cohort data loaded. Import the seed data to get started, or load a previously exported cohort file.
          </p>
          <div className="space-y-3">
            <button onClick={handleImportSeed} className="btn-primary w-full justify-center flex">
              Load Sample Cohort (Seed Data)
            </button>
            <label className="btn-secondary w-full flex justify-center cursor-pointer">
              Import Cohort JSON
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" aria-label="Import cohort JSON file" />
            </label>
          </div>
          {importError && (
            <p className="mt-4 text-red-600 text-sm">{importError}</p>
          )}
        </div>
      </div>
    )
  }

  const selectedLearner = selectedLearnerId
    ? data.learners.find((l) => l.id === selectedLearnerId)
    : null

  return (
    <div className="min-h-screen bg-cream">
      <Nav
        view={view}
        setView={setView}
        onImportSeed={handleImportSeed}
        onImportFile={handleImportFile}
        onExport={handleExport}
        importError={importError}
      />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {view === 'dashboard' && (
          <Dashboard
            data={data}
            onSelectLearner={handleSelectLearner}
            onNavigateRoster={() => setView('roster')}
          />
        )}
        {view === 'roster' && (
          <Roster
            learners={data.learners}
            onSelectLearner={handleSelectLearner}
            onAddLearner={handleAddLearner}
          />
        )}
        {view === 'learner' && selectedLearner && (
          <LearnerDetail
            learner={selectedLearner}
            onUpdate={handleUpdateLearner}
            onBack={() => setView('roster')}
          />
        )}
        {view === 'report' && (
          <LeadershipReport data={data} />
        )}
      </main>
    </div>
  )
}

export default App

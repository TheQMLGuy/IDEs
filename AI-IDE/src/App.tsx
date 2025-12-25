import { useState, useRef } from 'react'
import { Monitor, Server, Play, Database, ChevronRight, Activity, Search } from 'lucide-react'
import CodeEditor from './components/editor/CodeEditor'
import FileExplorer from './components/common/FileExplorer'
import Terminal from './components/common/Terminal'
import './App.css'

type ComputeMode = 'local' | 'colab'

interface KaggleDataset {
  id: string
  name: string
  size: string
  url: string
}

function App() {
  const [computeMode, setComputeMode] = useState<ComputeMode>('local')
  const [editorCode, setEditorCode] = useState<string>(`# Welcome to AI IDE
# Search for a Kaggle dataset and click it to generate loading code!

import pandas as pd
import kaggle

# Your code here...
`)
  const [currentFile, setCurrentFile] = useState<string | null>(null)

  // Resizable panels
  const [explorerWidth, setExplorerWidth] = useState(250)
  const [dataPanelWidth, setDataPanelWidth] = useState(300)
  const [dataPanelOpen, setDataPanelOpen] = useState(true)

  // Kaggle Search
  const [kaggleQuery, setKaggleQuery] = useState('')
  const [kaggleResults, setKaggleResults] = useState<KaggleDataset[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchStatus, setSearchStatus] = useState('')

  const editorRef = useRef<HTMLDivElement>(null)

  const handleFileSelect = (path: string, content: string) => {
    setCurrentFile(path)
    setEditorCode(content)
  }

  const handleModeChange = (mode: ComputeMode) => {
    setComputeMode(mode)
    window.appControl.setMode(mode)
  }

  const handleRunCode = async () => {
    let filePath = currentFile
    if (!filePath) {
      filePath = 'temp_script.py'
      await window.fileSystem.saveFile(filePath, editorCode)
    } else {
      await window.fileSystem.saveFile(filePath, editorCode)
    }

    // Check dependencies - only install if actually missing
    const depResult = await window.analysis.checkDeps(filePath)
    if (depResult.missing && depResult.missing.length > 0) {
      const packages = depResult.missing.join(' ')
      window.terminal.send(`pip install -q ${packages} && python "${filePath}"\n`)
    } else {
      window.terminal.send(`python "${filePath}"\n`)
    }
  }



  const handleKaggleSearch = async () => {
    if (!kaggleQuery.trim()) return
    setIsSearching(true)
    setSearchStatus('Searching...')
    setKaggleResults([])

    try {
      const result = await window.kaggle.search(kaggleQuery)
      if (result.error) {
        setSearchStatus('Error: ' + result.error)
      } else if (result.data && result.data.length > 0) {
        setKaggleResults(result.data)
        setSearchStatus(`Found ${result.data.length} datasets`)
      } else {
        setSearchStatus('No datasets found.')
      }
    } catch (e) {
      setSearchStatus('Error: ' + String(e))
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectDataset = (dataset: KaggleDataset) => {
    // Generate clean code with progress indicators
    const code = `import pandas as pd
from kaggle.api.kaggle_api_extended import KaggleApi
import os, glob

print("🔄 Connecting to Kaggle...")
api = KaggleApi()
api.authenticate()

print("⬇️  Downloading ${dataset.name}...")
api.dataset_download_files("${dataset.id}", path="./data", unzip=True)

print("📊 Loading data...")
csv_files = glob.glob("./data/*.csv")
df = pd.read_csv(csv_files[0]) if csv_files else None

if df is not None:
    print(f"✅ Loaded: {csv_files[0]} ({df.shape[0]} rows, {df.shape[1]} cols)")
    print("\\n" + "="*50)
    print(df.head(10))
else:
    print("❌ No CSV files found")
`
    setEditorCode(code)
    setSearchStatus(`✓ Code ready`)
  }


  // Resize handlers
  const startResizeExplorer = (e: React.MouseEvent) => {
    const startX = e.clientX
    const startWidth = explorerWidth
    const onMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX
      setExplorerWidth(Math.max(150, Math.min(400, startWidth + diff)))
    }
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const startResizeDataPanel = (e: React.MouseEvent) => {
    const startX = e.clientX
    const startWidth = dataPanelWidth
    const onMouseMove = (moveEvent: MouseEvent) => {
      const diff = startX - moveEvent.clientX
      setDataPanelWidth(Math.max(200, Math.min(500, startWidth + diff)))
    }
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div className="app-container" style={{ display: 'flex', width: '100%', height: '100%', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ height: '50px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 1rem', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Activity size={24} color="var(--accent-primary)" />
          <h1 style={{ fontSize: '1rem', fontWeight: 600 }}>AI IDE</h1>
          {currentFile && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>— {currentFile.split(/[\\/]/).pop()}</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Run Button */}
          <button
            onClick={handleRunCode}
            style={{
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: 'white',
              padding: '6px 16px',
              borderRadius: '6px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
            }}
          >
            <Play size={16} fill="white" />
            Run
          </button>

          {/* Compute Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-primary)', padding: '4px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => handleModeChange('local')}
              style={{
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                background: computeMode === 'local' ? 'var(--bg-tertiary)' : 'transparent',
                color: computeMode === 'local' ? 'var(--text-primary)' : 'var(--text-secondary)'
              }}
            >
              <Monitor size={14} style={{ marginRight: '6px' }} />
              Local
            </button>
            <button
              onClick={() => handleModeChange('colab')}
              style={{
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                background: computeMode === 'colab' ? 'var(--bg-tertiary)' : 'transparent',
                color: computeMode === 'colab' ? 'var(--text-primary)' : 'var(--text-secondary)'
              }}
            >
              <Server size={14} style={{ marginRight: '6px' }} />
              Colab
            </button>
          </div>

          {/* Data Panel Toggle */}
          <button onClick={() => setDataPanelOpen(!dataPanelOpen)} style={{ color: dataPanelOpen ? 'var(--accent-primary)' : 'var(--text-secondary)' }} title="Toggle Data Panel">
            <Database size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {computeMode === 'colab' ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ textAlign: 'center' }}>
              <Server size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>Google Colab Environment</p>
              <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Loading Colab...</p>
            </div>
          </div>
        ) : (
          <>
            {/* File Explorer */}
            <div style={{ width: `${explorerWidth}px`, borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <FileExplorer onFileSelect={handleFileSelect} />
            </div>
            {/* Resize Handle */}
            <div
              onMouseDown={startResizeExplorer}
              style={{ width: '4px', cursor: 'col-resize', background: 'transparent' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            />

            {/* Editor + Terminal */}
            <div ref={editorRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <CodeEditor
                  key={currentFile || 'default'}
                  initialValue={editorCode}
                  onChange={(val) => setEditorCode(val || '')}
                />
              </div>
              <div style={{ height: '200px', borderTop: '1px solid var(--border-color)', background: '#0f1117' }}>
                <Terminal />
              </div>
            </div>

            {/* Data Panel */}
            {dataPanelOpen && (
              <>
                <div
                  onMouseDown={startResizeDataPanel}
                  style={{ width: '4px', cursor: 'col-resize', background: 'transparent' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                />
                <div style={{ width: `${dataPanelWidth}px`, borderLeft: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', padding: '1rem', flexShrink: 0, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Database size={16} color="var(--accent-primary)" />
                      Kaggle Datasets
                    </h3>
                    <button onClick={() => setDataPanelOpen(false)} style={{ color: 'var(--text-secondary)' }}>
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Search */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Search datasets..."
                        value={kaggleQuery}
                        onChange={(e) => setKaggleQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleKaggleSearch()}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          color: 'var(--text-primary)',
                          fontSize: '0.8rem'
                        }}
                      />
                      <button
                        onClick={handleKaggleSearch}
                        disabled={isSearching}
                        style={{
                          padding: '8px 12px',
                          background: 'var(--accent-primary)',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '0.8rem'
                        }}
                      >
                        <Search size={14} />
                      </button>
                    </div>
                    {searchStatus && <p style={{ fontSize: '0.7rem', color: searchStatus.startsWith('Error') ? '#ef4444' : 'var(--text-secondary)', marginTop: '0.5rem' }}>{searchStatus}</p>}
                  </div>

                  {/* Results */}
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Click a dataset to generate code</p>
                    {kaggleResults.length === 0 ? (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Search for a dataset above</p>
                    ) : (
                      kaggleResults.map((ds) => (
                        <div
                          key={ds.id}
                          onClick={() => handleSelectDataset(ds)}
                          style={{
                            padding: '10px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '6px',
                            marginBottom: '0.5rem',
                            cursor: 'pointer',
                            border: '1px solid var(--border-color)',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent-primary)'
                            e.currentTarget.style.background = 'var(--bg-secondary)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-color)'
                            e.currentTarget.style.background = 'var(--bg-tertiary)'
                          }}
                        >
                          <div style={{ fontWeight: 500, fontSize: '0.8rem', marginBottom: '4px' }}>{ds.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{ds.id}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App

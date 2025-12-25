import React, { useState } from 'react'
import { Database, Plus, Search, FileSpreadsheet, BarChart2, Activity, Loader } from 'lucide-react'

interface Dataset {
    id: string
    name: string
    source: 'kaggle' | 'local'
    size: string
    rows?: number
    columns?: number
    path?: string
}

const DataHub: React.FC = () => {
    const [datasets, setDatasets] = useState<Dataset[]>([
        { id: '1', name: 'titanic.csv', source: 'kaggle', size: '60KB', rows: 891, columns: 12 }
    ])
    const [importUrl, setImportUrl] = useState('')
    const [analyzing, setAnalyzing] = useState(false)
    const [importing, setImporting] = useState(false)
    const [recommendation, setRecommendation] = useState<string | null>(null)
    const [statusMsg, setStatusMsg] = useState('')

    const handleImport = async () => {
        if (!importUrl) return
        setImporting(true)
        setStatusMsg('Searching Kaggle...')

        try {
            // 1. Search
            const searchResult = await window.kaggle.search(importUrl)
            if (searchResult.error) {
                setStatusMsg('Error: ' + searchResult.error)
                setImporting(false)
                return
            }

            if (!searchResult.data || searchResult.data.length === 0) {
                setStatusMsg('No datasets found.')
                setImporting(false)
                return
            }

            // 2. Download first result for simplicity
            const target = searchResult.data[0]
            setStatusMsg(`Downloading ${target.ref}...`)

            const downloadPath = 'datasets'
            const dlResult = await window.kaggle.download(target.ref, downloadPath)

            if (dlResult.error) {
                setStatusMsg('Download Error: ' + dlResult.error)
            } else {
                setStatusMsg('Download Complete!')
                const newDataset: Dataset = {
                    id: target.ref,
                    name: target.title,
                    source: 'kaggle',
                    size: target.size,
                    path: downloadPath
                }
                setDatasets(prev => [...prev, newDataset])
            }

        } catch (e) {
            setStatusMsg('Import failed: ' + String(e))
        } finally {
            setImporting(false)
        }
    }

    return (
        <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem', color: 'var(--text-primary)' }}>
            {/* Header */}
            <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Database color="var(--accent-primary)" />
                    Data Hub
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    Import datasets from Kaggle or local files, analyze distributions, and get model recommendations.
                </p>
            </div>

            {/* Import Section */}
            <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Import Dataset</h3>
                <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                placeholder="Enter Kaggle Dataset (e.g. titanic)"
                                value={importUrl}
                                onChange={(e) => setImportUrl(e.target.value)}
                                disabled={importing}
                                style={{
                                    width: '100%',
                                    padding: '10px 10px 10px 36px',
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    color: 'var(--text-primary)',
                                    outline: 'none'
                                }}
                            />
                        </div>
                        <button
                            onClick={handleImport}
                            disabled={importing}
                            style={{
                                background: 'var(--accent-primary)',
                                color: 'white',
                                padding: '0 1.5rem',
                                borderRadius: '6px',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                opacity: importing ? 0.7 : 1
                            }}
                        >
                            {importing ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                            {importing ? 'Importing...' : 'Import'}
                        </button>
                    </div>
                    {statusMsg && <div style={{ fontSize: '0.8rem', color: statusMsg.startsWith('Error') ? 'red' : 'green' }}>{statusMsg}</div>}
                </div>
            </div>

            {/* Dataset List */}
            <div style={{ flex: 1, display: 'flex', gap: '2rem' }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Active Datasets</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {datasets.map(ds => (
                            <div key={ds.id} style={{
                                background: 'var(--bg-tertiary)',
                                padding: '1rem',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <FileSpreadsheet size={24} color="var(--accent-secondary)" />
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{ds.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {ds.rows ? `${ds.rows} rows • ` : ''}
                                            {ds.columns ? `${ds.columns} cols • ` : ''}
                                            {ds.size}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        if (ds.path) {
                                            setAnalyzing(true)
                                            window.analysis.recommend(ds.path).then((res: any) => {
                                                setAnalyzing(false)
                                                if (res.error) setRecommendation('Error: ' + res.error)
                                                else setRecommendation(res.recommendation)
                                            })
                                        } else {
                                            setRecommendation('Error: Dataset path unknown (mocked dataset?)')
                                        }
                                    }}
                                    disabled={analyzing}
                                    style={{
                                        padding: '8px 12px',
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--accent-primary)',
                                        color: 'var(--accent-primary)',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        opacity: analyzing ? 0.7 : 1
                                    }}
                                >
                                    {analyzing ? (
                                        <>Running...</>
                                    ) : (
                                        <>
                                            <BarChart2 size={14} />
                                            Analyze & Recommend
                                        </>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Analysis Result */}
                <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={18} color="var(--accent-primary)" />
                        Model Recommender
                    </h3>

                    {recommendation ? (
                        <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '6px', borderLeft: '4px solid var(--accent-primary)' }}>
                            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--accent-secondary)' }}>Recommendation</h4>
                            <p style={{ lineHeight: '1.5' }}>{recommendation}</p>
                        </div>
                    ) : (
                        <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', marginTop: '2rem' }}>
                            Select a dataset and click "Analyze" to see model recommendations.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default DataHub

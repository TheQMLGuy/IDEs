import React, { useState } from 'react'
import { Folder, File, FolderPlus } from 'lucide-react'

interface FileEntry {
    name: string
    isDirectory: boolean
    path: string
}

interface FileExplorerProps {
    onFileSelect: (path: string, content: string) => void
}

const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect }) => {
    const [rootPath, setRootPath] = useState<string | null>(null)
    const [files, setFiles] = useState<FileEntry[]>([])

    const handleOpenFolder = async () => {
        const path = await window.fileSystem.selectDirectory()
        if (path) {
            setRootPath(path)
            loadDir(path)
        }
    }

    const loadDir = async (path: string) => {
        try {
            const entries = await window.fileSystem.readDir(path)
            setFiles(entries.sort((a, b) => {
                if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name)
                return a.isDirectory ? -1 : 1
            }))
        } catch (e) {
            console.error("Error reading dir", e)
        }
    }

    const handleFileClick = async (entry: FileEntry) => {
        if (entry.isDirectory) {
            // Simple navigation: drill down
            // loadDir(entry.path) // Optional: allow drilling down?
            // For now, keep it simple
        } else {
            const content = await window.fileSystem.readFile(entry.path)
            onFileSelect(entry.path, content)
        }
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)' }}>
            <div style={{ padding: '10px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>EXPLORER</span>
                <button onClick={handleOpenFolder} title="Open Folder" style={{ color: 'var(--text-secondary)', hover: { color: 'var(--text-primary)' } } as any}>
                    <FolderPlus size={16} />
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
                {!rootPath && (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        <p style={{ marginBottom: '10px' }}>No folder opened.</p>
                        <button
                            onClick={handleOpenFolder}
                            style={{ background: 'var(--accent-primary)', color: 'white', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8rem' }}
                        >
                            Open Folder
                        </button>
                    </div>
                )}

                {files.map(file => (
                    <div
                        key={file.path}
                        onClick={() => handleFileClick(file)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 16px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        {file.isDirectory ? <Folder size={14} color="var(--accent-secondary)" /> : <File size={14} color="var(--text-secondary)" />}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default FileExplorer

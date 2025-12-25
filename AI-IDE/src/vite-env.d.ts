/// <reference types="vite/client" />

interface FileSystemAPI {
    selectDirectory: () => Promise<string | null>
    readDir: (path: string) => Promise<Array<{ name: string; isDirectory: boolean; path: string }>>
    readFile: (path: string) => Promise<string>
    saveFile: (path: string, content: string) => Promise<{ success?: boolean; error?: string }>
}

interface Window {
    fileSystem: FileSystemAPI
    terminal: {
        init: () => void
        send: (data: string) => void
        onData: (callback: (data: string) => void) => () => void
    }
    appControl: {
        setMode: (mode: 'local' | 'colab') => void
    }
    kaggle: {
        search: (query: string) => Promise<any>
        download: (id: string, path: string) => Promise<any>
    }
    analysis: {
        recommend: (path: string) => Promise<any>
        checkDeps: (path: string) => Promise<{ missing?: string[], error?: string }>
    }
}

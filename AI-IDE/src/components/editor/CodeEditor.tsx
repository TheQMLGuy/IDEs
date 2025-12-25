import React from 'react'
import Editor from '@monaco-editor/react'

interface CodeEditorProps {
    initialValue?: string
    language?: string
    onChange?: (value: string | undefined) => void
    theme?: 'vs-dark' | 'light'
}

const CodeEditor: React.FC<CodeEditorProps> = ({
    initialValue = '# Write your code here',
    language = 'python',
    onChange,
    theme = 'vs-dark'
}) => {
    return (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <Editor
                height="100%"
                defaultLanguage={language}
                defaultValue={initialValue}
                theme={theme}
                onChange={onChange}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16 },
                    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace"
                }}
            />
        </div>
    )
}

export default CodeEditor

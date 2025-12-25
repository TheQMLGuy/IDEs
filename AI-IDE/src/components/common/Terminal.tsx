import React, { useEffect, useRef } from 'react'
import { Terminal as XTerminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'

const Terminal: React.FC = () => {
    const terminalRef = useRef<HTMLDivElement>(null)
    const xtermRef = useRef<XTerminal | null>(null)

    useEffect(() => {
        if (!terminalRef.current) return

        // Clean, simple terminal - PyCharm inspired
        const term = new XTerminal({
            cursorBlink: true,
            cursorStyle: 'bar',
            theme: {
                background: '#1e1f22',
                foreground: '#a9b7c6',
                cursor: '#a9b7c6',
                cursorAccent: '#1e1f22',
                selectionBackground: '#214283',
                black: '#1e1f22',
                red: '#cf6679',
                green: '#6a8759',
                yellow: '#bbb529',
                blue: '#6897bb',
                magenta: '#9876aa',
                cyan: '#299999',
                white: '#a9b7c6',
                brightBlack: '#555555',
                brightRed: '#ff6b6b',
                brightGreen: '#98c379',
                brightYellow: '#e5c07b',
                brightBlue: '#82aaff',
                brightMagenta: '#c678dd',
                brightCyan: '#56b6c2',
                brightWhite: '#ffffff'
            },
            fontFamily: "'JetBrains Mono', 'Consolas', monospace",
            fontSize: 13,
            lineHeight: 1.3,
            scrollback: 1000,
        })

        const fitAddon = new FitAddon()
        term.loadAddon(fitAddon)
        term.open(terminalRef.current)
        fitAddon.fit()
        xtermRef.current = term

        // Init backend
        window.terminal.init()

        // Handle input
        term.onData(data => {
            window.terminal.send(data)
        })

        // Handle output
        const cleanup = window.terminal.onData((data) => {
            term.write(data)
        })

        // Resize observer
        const resizeObserver = new ResizeObserver(() => {
            fitAddon.fit()
        })
        resizeObserver.observe(terminalRef.current)

        return () => {
            term.dispose()
            cleanup()
            resizeObserver.disconnect()
        }
    }, [])

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: '#1e1f22'
        }}>
            {/* Simple header bar */}
            <div style={{
                height: '32px',
                background: '#2b2d30',
                borderBottom: '1px solid #323232',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                fontSize: '13px',
                color: '#a9b7c6',
                fontFamily: "'Inter', -apple-system, sans-serif"
            }}>
                <span style={{ opacity: 0.8 }}>Output</span>
            </div>
            <div
                ref={terminalRef}
                style={{
                    flex: 1,
                    padding: '8px 4px',
                    overflow: 'hidden'
                }}
            />
        </div>
    )
}

export default Terminal

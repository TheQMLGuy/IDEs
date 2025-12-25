// Mock APIs for web environment (when Electron is not available)

interface MockDataset {
    id: string;
    name: string;
    path: string;
}

const mockDatasets: MockDataset[] = [];

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && window.fileSystem !== undefined;

if (!isElectron) {
    console.log('[Web Mode] Initializing mock APIs...');

    // Mock FileSystem API
    (window as any).fileSystem = {
        selectDirectory: async () => {
            return '/mock/project/folder';
        },
        readDir: async (path: string) => {
            return [
                { name: 'main.py', isDirectory: false, path: path + '/main.py' },
                { name: 'data', isDirectory: true, path: path + '/data' },
                { name: 'README.md', isDirectory: false, path: path + '/README.md' },
            ];
        },
        readFile: async (path: string) => {
            if (path.endsWith('.py')) {
                return `# ${path}\nimport pandas as pd\n\nprint("Hello from ${path}")`;
            }
            return `# Mock content for ${path}`;
        },
        saveFile: async (path: string, content: string) => {
            console.log(`[Mock] Saved ${path}:`, content.substring(0, 100));
            return { success: true };
        }
    };

    // Mock Terminal API
    let terminalCallback: ((data: string) => void) | null = null;
    (window as any).terminal = {
        init: () => {
            console.log('[Mock] Terminal initialized');
            setTimeout(() => {
                terminalCallback?.('$ [Web Mock Terminal Ready]\r\n');
            }, 100);
        },
        send: (data: string) => {
            console.log('[Mock] Terminal input:', data);
            setTimeout(() => {
                if (data.includes('pip install')) {
                    terminalCallback?.(`Installing packages: ${data.replace('pip install ', '').trim()}...\r\n`);
                    setTimeout(() => {
                        terminalCallback?.('Successfully installed!\r\n$ ');
                    }, 500);
                } else if (data.includes('python')) {
                    terminalCallback?.(`Running: ${data}`);
                    setTimeout(() => {
                        terminalCallback?.('Hello World!\r\n$ ');
                    }, 300);
                } else {
                    terminalCallback?.(`$ ${data}`);
                }
            }, 100);
        },
        onData: (callback: (data: string) => void) => {
            terminalCallback = callback;
            return () => { terminalCallback = null; };
        }
    };

    // Mock AppControl API
    (window as any).appControl = {
        setMode: (mode: string) => {
            console.log('[Mock] Mode changed to:', mode);
        }
    };

    // Mock Kaggle API
    (window as any).kaggle = {
        search: async (query: string) => {
            console.log('[Mock] Kaggle search:', query);
            return {
                success: true,
                data: [
                    { id: 'dataset/titanic', name: 'Titanic Dataset', size: '60KB', ref: 'dataset/titanic' },
                    { id: 'dataset/iris', name: 'Iris Dataset', size: '5KB', ref: 'dataset/iris' },
                ]
            };
        },
        download: async (id: string, path: string) => {
            console.log('[Mock] Kaggle download:', id, 'to', path);
            return { success: true, message: `Downloaded ${id} to ${path}` };
        }
    };

    // Mock Analysis API
    (window as any).analysis = {
        recommend: async (path: string) => {
            console.log('[Mock] Analysis for:', path);
            return {
                success: true,
                recommendation: 'Based on the data, we recommend using Random Forest or XGBoost for classification.'
            };
        },
        checkDeps: async (path: string) => {
            console.log('[Mock] Checking deps for:', path);
            // Simulate finding sklearn as missing
            return { missing: ['scikit-learn'] };
        }
    };

    console.log('[Web Mode] Mock APIs ready!');
}

export { };

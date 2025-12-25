"""
Dependency Checker for AI IDE.
Parses Python code for imports and checks if they're installed.
Returns a list of packages to install.
"""
import sys
import json
import ast
import importlib.util

# Mapping of import names to pip package names
IMPORT_TO_PACKAGE = {
    "sklearn": "scikit-learn",
    "cv2": "opencv-python",
    "PIL": "Pillow",
    "yaml": "PyYAML",
    "bs4": "beautifulsoup4",
}

def get_imports(code: str) -> set:
    """Extract all import names from Python code."""
    imports = set()
    try:
        tree = ast.parse(code)
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.add(alias.name.split('.')[0])
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imports.add(node.module.split('.')[0])
    except SyntaxError:
        pass  # Ignore syntax errors in code
    return imports

def check_installed(module_name: str) -> bool:
    """Check if a module is installed."""
    spec = importlib.util.find_spec(module_name)
    return spec is not None

def get_pip_name(import_name: str) -> str:
    """Convert import name to pip package name."""
    return IMPORT_TO_PACKAGE.get(import_name, import_name)

def main(code: str):
    imports = get_imports(code)
    missing = []
    
    # Filter out standard library modules
    stdlib = {'os', 'sys', 'json', 'math', 'random', 'datetime', 'time', 're', 'collections', 
              'itertools', 'functools', 'typing', 'pathlib', 'subprocess', 'threading', 'multiprocessing',
              'io', 'string', 'copy', 'pickle', 'csv', 'xml', 'html', 'http', 'urllib', 'socket',
              'asyncio', 'logging', 'unittest', 'argparse', 'shutil', 'glob', 'tempfile', 'zipfile',
              'hashlib', 'base64', 'struct', 'array', 'queue', 'enum', 'dataclasses', 'abc', 'contextlib',
              'warnings', 'traceback', 'inspect', 'dis', 'ast', 'platform', 'ctypes', 'signal', 'gc'}
    
    for imp in imports:
        if imp in stdlib:
            continue
        if not check_installed(imp):
            missing.append(get_pip_name(imp))
    
    return {"missing": missing}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
        sys.exit(1)
    
    file_path = sys.argv[1]
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            code = f.read()
        result = main(code)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

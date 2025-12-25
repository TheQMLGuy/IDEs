import ast
import subprocess
import sys
import importlib.util

class AutoInstaller:
    @staticmethod
    def install_missing_modules(code):
        """
        Parses the code to find top-level imports and installs them if they are missing.
        """
        try:
            modules = AutoInstaller._get_imported_modules(code)
            for module_name in modules:
                if not AutoInstaller._is_module_installed(module_name):
                    print(f"[AutoInstall] Module '{module_name}' not found. Attempting to install...")
                    try:
                        # Run pip to install the module
                        subprocess.check_call([sys.executable, "-m", "pip", "install", module_name])
                        print(f"[AutoInstall] Successfully installed '{module_name}'.")
                    except subprocess.CalledProcessError as e:
                        print(f"[AutoInstall] Failed to install '{module_name}': {e}")
        except Exception as e:
            print(f"Auto-install scan failed: {e}")

    @staticmethod
    def _is_module_installed(module_name):
        """Checks if a module can be found by the import system."""
        return importlib.util.find_spec(module_name) is not None

    @staticmethod
    def _get_imported_modules(code):
        """Parses the code using AST to find all imported modules."""
        modules = set()
        try:
            tree = ast.parse(code)
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        modules.add(alias.name.split('.')[0])
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        modules.add(node.module.split('.')[0])
        except SyntaxError:
            pass # Ignore errors while user is typing
        return modules
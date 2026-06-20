import sys
import os
import re

def bump_version():
    if len(sys.argv) < 2:
        print("Usage: python scripts/bump_version.py <new_version>")
        sys.exit(1)
        
    raw_version = sys.argv[1].strip()
    # Normalize version: strip leading 'v'
    if raw_version.startswith('v'):
        raw_version = raw_version[1:]
        
    # Validate semantic version format (X.Y.Z)
    semver_pattern = re.compile(r'^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?(?:\+[a-zA-Z0-9.]+)?$')
    if not semver_pattern.match(raw_version):
        print(f"Error: '{sys.argv[1]}' is not a valid Semantic Version (e.g. 1.2.0, 0.1.0-alpha.1)")
        sys.exit(1)
        
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(script_dir)
    
    # 1. Update VERSION file
    version_file = os.path.join(root_dir, "VERSION")
    with open(version_file, "w", encoding="utf-8") as f:
        f.write(raw_version + "\n")
    print(f"Updated VERSION to: {raw_version}")
    
    # 2. Update backend/pyproject.toml
    backend_toml = os.path.join(root_dir, "backend", "pyproject.toml")
    if os.path.exists(backend_toml):
        with open(backend_toml, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Look for version = "..." under [project]
        new_content, count = re.subn(
            r'(^version\s*=\s*")[^"]+(")',
            rf'\g<1>{raw_version}\g<2>',
            content,
            flags=re.MULTILINE
        )
        if count > 0:
            with open(backend_toml, "w", encoding="utf-8", newline="\n") as f:
                f.write(new_content)
            print(f"Updated backend/pyproject.toml to: {raw_version}")
        else:
            print("Warning: Could not find version key in backend/pyproject.toml")
            
    # 3. Update frontend/package.json
    frontend_json = os.path.join(root_dir, "frontend", "package.json")
    if os.path.exists(frontend_json):
        with open(frontend_json, "r", encoding="utf-8") as f:
            content = f.read()
            
        new_content, count = re.subn(
            r'("version"\s*:\s*")[^"]+(")',
            rf'\g<1>{raw_version}\g<2>',
            content
        )
        if count > 0:
            with open(frontend_json, "w", encoding="utf-8", newline="\n") as f:
                f.write(new_content)
            print(f"Updated frontend/package.json to: {raw_version}")
        else:
            print("Warning: Could not find version key in frontend/package.json")

if __name__ == "__main__":
    bump_version()

#!/usr/bin/env python3
"""
Script to fix all motion components by replacing them with m components
"""

import os
import re
from pathlib import Path

def fix_motion_components(directory):
    """Fix all motion components in TypeScript/React files"""
    fixed_files = []
    
    # File extensions to check
    extensions = ['.tsx', '.ts', '.jsx', '.js']
    
    for root, dirs, files in os.walk(directory):
        # Skip node_modules and .next directories
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.next', '.git']]
        
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    original_content = content
                    
                    # Fix import statements
                    content = re.sub(
                        r'import\s*{\s*([^}]*?)motion([^}]*?)}\s*from\s*[\'"]framer-motion[\'"]',
                        r'import { \1m\2} from \'framer-motion\'',
                        content
                    )
                    
                    # Fix JSX motion components
                    content = re.sub(r'<motion\.', '<m.', content)
                    content = re.sub(r'</motion\.', '</m.', content)
                    
                    # Fix motion. usage
                    content = re.sub(r'\bmotion\.', 'm.', content)
                    
                    if content != original_content:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(content)
                        fixed_files.append(file_path)
                        print(f"Fixed: {file_path}")
                        
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")
    
    return fixed_files

def main():
    web_dir = "apps/web"
    if not os.path.exists(web_dir):
        print(f"Directory {web_dir} not found")
        return
    
    print("Fixing all motion components...")
    fixed_files = fix_motion_components(web_dir)
    
    if fixed_files:
        print(f"\n✅ Fixed {len(fixed_files)} files:")
        for file_path in fixed_files:
            print(f"  - {file_path}")
    else:
        print("✅ No files needed fixing!")

if __name__ == "__main__":
    main()
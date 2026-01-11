#!/usr/bin/env python3
"""
Script to verify that all motion components have been replaced with m components
"""

import os
import re
from pathlib import Path

def find_motion_components(directory):
    """Find any remaining motion components in TypeScript/React files"""
    motion_files = []
    
    # Patterns to search for
    patterns = [
        r'<motion\.',  # JSX motion components
        r'motion\s*\.',  # motion. usage
        r'import.*motion.*from.*framer-motion',  # motion imports
    ]
    
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
                        
                    for i, pattern in enumerate(patterns):
                        matches = re.findall(pattern, content, re.IGNORECASE)
                        if matches:
                            motion_files.append({
                                'file': file_path,
                                'pattern': pattern,
                                'matches': matches,
                                'line_numbers': []
                            })
                            
                            # Find line numbers
                            lines = content.split('\n')
                            for line_num, line in enumerate(lines, 1):
                                if re.search(pattern, line, re.IGNORECASE):
                                    motion_files[-1]['line_numbers'].append(line_num)
                                    
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")
    
    return motion_files

def main():
    web_dir = "apps/web"
    if not os.path.exists(web_dir):
        print(f"Directory {web_dir} not found")
        return
    
    print("Searching for remaining motion components...")
    motion_files = find_motion_components(web_dir)
    
    if not motion_files:
        print("✅ No motion components found! All components appear to be using 'm' correctly.")
    else:
        print(f"❌ Found {len(motion_files)} files with motion components:")
        for item in motion_files:
            print(f"\nFile: {item['file']}")
            print(f"Pattern: {item['pattern']}")
            print(f"Lines: {item['line_numbers']}")
            print(f"Matches: {item['matches']}")

if __name__ == "__main__":
    main()
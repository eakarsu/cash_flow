#!/usr/bin/env python3
"""
Aider Chat Output Parser - Fixed Version
Parses aider chat output and creates individual files in proper directory structure.
"""

import os
import re
import sys
from pathlib import Path

class AiderOutputParser:
    def __init__(self, input_file):
        self.input_file = input_file
        self.files_created = []
        
    def parse_and_create_files(self):
        """Parse the aider output and create individual files"""
        try:
            with open(self.input_file, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # Extract files using manual patterns
            file_sections = self.extract_manual_files(content)
            
            for file_path, file_content in file_sections:
                self.create_file(file_path, file_content)
            
            print(f"\n✅ Successfully created {len(self.files_created)} files:")
            for file_path in sorted(self.files_created):
                print(f"   📄 {file_path}")
                
        except FileNotFoundError:
            print(f"❌ Error: File '{self.input_file}' not found")
            return False
        except Exception as e:
            print(f"❌ Error parsing file: {e}")
            return False
            
        return True
    
    def extract_manual_files(self, content):
        """Extract files from aider SEARCH/REPLACE blocks"""
        manual_files = []
        
        # Look for SEARCH/REPLACE blocks which is the actual format in your files.txt
        search_replace_pattern = r'<<<<<<< SEARCH\n=======\n(.*?)\n>>>>>>> REPLACE'
        matches = re.findall(search_replace_pattern, content, re.DOTALL)
        print(f"📊 Found {len(matches)} SEARCH/REPLACE blocks")
        
        # Extract content from SEARCH/REPLACE blocks and determine file names
        for i, match_content in enumerate(matches):
            if match_content.strip():
                file_path, file_content = self.determine_file_info(match_content, i)
                if file_path and file_content:
                    manual_files.append((file_path, file_content))
                    print(f"📄 Found: {file_path}")
        
        return manual_files
    
    def determine_file_info(self, content, index):
        """Determine file path and content based on content analysis"""
        content = content.strip()
        
        # Check for specific file patterns
        if '"name":' in content and '"dependencies":' in content and '"scripts":' in content:
            return 'package.json', content
            
        elif 'module.exports' in content and 'tailwindcss' in content:
            return 'tailwind.config.js', content
            
        elif '@tailwind base' in content and '@tailwind components' in content:
            return 'src/index.css', content
            
        elif 'export interface Transaction' in content:
            return 'src/types/index.ts', content
            
        elif 'parseCSV' in content and 'Papa.parse' in content:
            return 'src/utils/csvParser.ts', content
            
        elif 'calculateCashFlowSummary' in content and 'generate13WeekForecast' in content:
            return 'src/utils/calculations.ts', content
            
        elif 'useLocalStorage' in content and 'useState' in content and 'useEffect' in content:
            return 'src/hooks/useLocalStorage.ts', content
            
        elif 'DollarSign' in content and 'Upload' in content and 'Download' in content:
            return 'src/components/Layout/Header.tsx', content
            
        elif 'CashInflowsWidget' in content and 'TrendingUp' in content:
            return 'src/components/Dashboard/CashInflowsWidget.tsx', content
            
        elif 'CashOutflowsWidget' in content and 'TrendingDown' in content:
            return 'src/components/Dashboard/CashOutflowsWidget.tsx', content
            
        elif 'CashRunwayWidget' in content and 'Clock' in content:
            return 'src/components/Dashboard/CashRunwayWidget.tsx', content
            
        elif 'CashForecastWidget' in content and 'Calendar' in content:
            return 'src/components/Dashboard/CashForecastWidget.tsx', content
            
        elif 'TransactionList' in content and 'Edit2' in content and 'Trash2' in content:
            return 'src/components/TransactionManager/TransactionList.tsx', content
            
        elif 'TransactionForm' in content and 'onSave' in content and 'onCancel' in content:
            return 'src/components/TransactionManager/TransactionForm.tsx', content
            
        elif 'function App()' in content and 'useState' in content and 'useLocalStorage' in content:
            return 'src/App.tsx', content
            
        elif 'ReactDOM.createRoot' in content and "getElementById('root')" in content:
            return 'src/index.tsx', content
            
        elif 'autoprefixer' in content and 'postcss' in content:
            return 'postcss.config.js', content
            
        elif '<!DOCTYPE html>' in content and '<title>Cash Flow Manager</title>' in content:
            return 'public/index.html', content
            
        elif 'node_modules/' in content and '.DS_Store' in content:
            return '.gitignore', content
            
        elif '# Cash Flow Management Application' in content and '## Features' in content:
            return 'README.md', content
            
        elif 'Transaction date,Transaction ID' in content and 'TXN100000' in content:
            return 'sample-data.csv', content
            
        else:
            # Create a descriptive filename based on content
            if 'React' in content and ('tsx' in content or 'jsx' in content):
                return f'src/components/Component_{index}.tsx', content
            elif 'function' in content or 'const' in content:
                return f'src/utils/utility_{index}.ts', content
            else:
                return f'extracted_file_{index}.txt', content
    
    def create_file(self, file_path, content):
        """Create a file with the given content"""
        try:
            # Create directory structure if needed
            directory = os.path.dirname(file_path)
            if directory:
                Path(directory).mkdir(parents=True, exist_ok=True)
            
            # Write file content
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(content)
            
            self.files_created.append(file_path)
            print(f"✅ Created: {file_path}")
            
        except Exception as e:
            print(f"❌ Error creating {file_path}: {e}")
    
    def create_project_structure(self):
        """Create the basic project directory structure"""
        directories = [
            'src',
            'src/components',
            'src/components/Dashboard',
            'src/components/Layout',
            'src/components/TransactionManager',
            'src/hooks',
            'src/types',
            'src/utils',
            'public'
        ]
        
        for directory in directories:
            Path(directory).mkdir(parents=True, exist_ok=True)
        
        print("📁 Created project directory structure")

def main():
    """Main function"""
    if len(sys.argv) != 2:
        print("Usage: python run.py <input_file>")
        print("Example: python run.py files.txt")
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    if not os.path.exists(input_file):
        print(f"❌ Error: Input file '{input_file}' does not exist")
        sys.exit(1)
    
    print("🚀 Starting Aider Chat Output Parser")
    print("=" * 50)
    
    parser = AiderOutputParser(input_file)
    
    # Create project structure
    parser.create_project_structure()
    
    # Parse and create files
    success = parser.parse_and_create_files()
    
    if success:
        print("\n" + "=" * 50)
        print("🎉 Project files created successfully!")
        print("\nNext steps:")
        print("1. cd into the project directory")
        print("2. Run: npm install")
        print("3. Run: npm start")
        print("4. Open http://localhost:3000 in your browser")
        
        # Create a quick setup script
        setup_script = """#!/bin/bash
echo "Setting up Cash Flow Manager..."
npm install
echo "Setup complete! Run 'npm start' to launch the application."
"""
        with open('setup.sh', 'w') as f:
            f.write(setup_script)
        os.chmod('setup.sh', 0o755)
        print("5. Or run: ./setup.sh")
        
    else:
        print("\n❌ Failed to parse aider output")
        sys.exit(1)

if __name__ == "__main__":
    main()


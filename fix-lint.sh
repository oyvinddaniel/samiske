#!/bin/bash
# Auto-fix ESLint issues (keeps img elements as requested)

cd /Users/oyvind/Library/CloudStorage/Dropbox/HD\ Øyvind/Obsidian/AI\ Code\ Projects/Samisk/samiske

# Run ESLint with --fix to auto-fix what it can
npx eslint --fix src/ --ext .ts,.tsx

echo "ESLint auto-fix complete"

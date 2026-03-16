#!/bin/bash

# Secret Scanner: Prevents service_role or other admin keys from leaking into the bundle.
# This should be run as part of the build process.

echo "🔍 Scanning for sensitive patterns in src/..."

# Patterns to look for
PATTERNS=(
    "service_role"
    "SUPABASE_SERVICE_ROLE"
    "secret_key"
    "sb_admin"
)

FOUND_SENSITIVE=0

for pattern in "${PATTERNS[@]}"; do
    if grep -rEi "$pattern" src/ --exclude-dir=node_modules --exclude-dir=.git; then
        echo "❌ DANGER: Sensitive pattern '$pattern' found in source code!"
        FOUND_SENSITIVE=1
    fi
done

if [ $FOUND_SENSITIVE -eq 1 ]; then
    echo "🚨 Security Check Failed: Admin secrets detected in source. Build aborted."
    exit 1
else
    echo "✅ No sensitive patterns found in src/."
fi

# Also scan .env files just in case
if grep -rEi "VITE_.*SERVICE_ROLE" .env* 2>/dev/null; then
    echo "❌ DANGER: VITE_ variable with SERVICE_ROLE found in .env files!"
    exit 1
fi

echo "🚀 Security Check Passed."
exit 0

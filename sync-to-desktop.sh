#!/bin/bash
# Syncs the latest project files to ~/Desktop/supplychain
# Run from anywhere: bash ~/Desktop/supplychain/sync-to-desktop.sh

SRC="$HOME/Library/Application Support/Claude/local-agent-mode-sessions/8934546b-3747-4723-8800-f6df2128bbb8/16d4e846-127a-4f84-8996-cc9498683a41/local_b8630259-0e8a-4df9-a97f-bd524e0937ae/outputs/supplychain"
DEST="$HOME/Desktop/supplychain"

echo "🔄 Syncing from Claude workspace to Desktop..."

rsync -av --exclude='node_modules' --exclude='.next' --exclude='dist' \
  --exclude='*.log' --exclude='uploads/' \
  "$SRC/" "$DEST/"

# Fix the supplier layout issue
cd "$DEST/frontend/src/app/supplier" 2>/dev/null && {
  if [ -d "layout.tsx" ]; then
    echo "🔧 Fixing supplier layout.tsx..."
    rm -rf layout.tsx
    if [ -f "RENAME_ME_layout.tsx" ]; then
      mv RENAME_ME_layout.tsx layout.tsx
      echo "✅ layout.tsx fixed"
    else
      cat > layout.tsx << 'EOF'
import { AppShell } from '../../components/layout/AppShell';

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  return <AppShell allowedRoles={['SUPPLIER_ADMIN', 'SUPPLIER_STAFF']}>{children}</AppShell>;
}
EOF
      echo "✅ layout.tsx created"
    fi
  fi
}

echo ""
echo "✅ Sync complete!"
echo ""
echo "Next steps:"
echo "  cd ~/Desktop/supplychain"
echo "  cp .env.example .env   # then set your JWT secrets"
echo "  docker compose up postgres redis -d"
echo "  cd backend && npm install && npx prisma migrate dev --name init && npm run prisma:seed && npm run dev"
echo "  cd ../frontend && npm install && npm run dev"

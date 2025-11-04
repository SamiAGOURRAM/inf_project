#!/bin/bash

echo "🔍 Vérification de la configuration INF Platform 2.0"
echo "=================================================="
echo ""

# Check .env.local exists
if [ -f "frontend/.env.local" ]; then
    echo "✅ fichier .env.local existe"
    
    # Check if it has the placeholder values
    if grep -q "your-project" frontend/.env.local; then
        echo "⚠️  .env.local contient encore les valeurs placeholder"
        echo "   → Remplacez par vos vraies credentials Supabase"
    else
        echo "✅ .env.local semble configuré"
    fi
else
    echo "❌ .env.local manquant"
    echo "   → Copiez .env.example vers .env.local"
fi

echo ""

# Check migrations exist
echo "📁 Migrations SQL:"
if [ -f "supabase/migrations/20251101000001_initial_schema.sql" ]; then
    lines=$(wc -l < supabase/migrations/20251101000001_initial_schema.sql)
    echo "   ✅ Migration 1: $lines lignes"
else
    echo "   ❌ Migration 1 manquante"
fi

if [ -f "supabase/migrations/20251101000002_core_functions.sql" ]; then
    lines=$(wc -l < supabase/migrations/20251101000002_core_functions.sql)
    echo "   ✅ Migration 2: $lines lignes"
else
    echo "   ❌ Migration 2 manquante"
fi

echo ""

# Check Next.js version
echo "📦 Versions:"
cd frontend
next_version=$(npm list next | grep next@ | head -1 | sed 's/.*next@//' | sed 's/ .*//')
echo "   Next.js: $next_version"

echo ""
echo "=================================================="
echo "📖 Pour continuer, lisez: INSTRUCTIONS_SUPABASE.txt"
echo "=================================================="

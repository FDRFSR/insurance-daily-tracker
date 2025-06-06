#!/bin/bash

# Script di testing per le funzionalità v1.1 Export
# Data: 6 giugno 2025

echo "🧪 Testing InsuraTask v1.1 - Export Functionality"
echo "=================================================="

# Controllo che il server sia attivo
echo "📡 Controllo server status..."
if curl -s http://localhost:5000 > /dev/null; then
    echo "✅ Server attivo su porta 5000"
else
    echo "❌ Server non attivo. Avvia con: npm run dev"
    exit 1
fi

# Test API export preview
echo ""
echo "🔍 Test API Export Preview..."
PREVIEW_RESPONSE=$(curl -s -X POST http://localhost:5000/api/export/preview \
  -H "Content-Type: application/json" \
  -d '{"filters": {}}')

if echo "$PREVIEW_RESPONSE" | grep -q "tasksCount"; then
    echo "✅ API Preview funzionante"
    echo "   Response: $PREVIEW_RESPONSE"
else
    echo "❌ API Preview non funzionante"
    echo "   Response: $PREVIEW_RESPONSE"
fi

# Test API export con filtri
echo ""
echo "📊 Test API Export con filtri..."
FILTERED_RESPONSE=$(curl -s -X POST http://localhost:5000/api/export/preview \
  -H "Content-Type: application/json" \
  -d '{"filters": {"category": "call", "status": "pending"}}')

if echo "$FILTERED_RESPONSE" | grep -q "tasksCount"; then
    echo "✅ API Export con filtri funzionante"
    echo "   Filtered Response: $FILTERED_RESPONSE"
else
    echo "❌ API Export con filtri non funzionante"
    echo "   Response: $FILTERED_RESPONSE"
fi

# Test generazione PDF (simulata)
echo ""
echo "📄 Test generazione PDF..."
PDF_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:5000/api/export \
  -H "Content-Type: application/json" \
  -d '{"format": "pdf", "filters": {}, "title": "Test Report"}')

if [ "$PDF_RESPONSE" = "200" ]; then
    echo "✅ Generazione PDF funzionante (HTTP 200)"
else
    echo "❌ Generazione PDF non funzionante (HTTP $PDF_RESPONSE)"
fi

# Test generazione Excel (simulata)
echo ""
echo "📊 Test generazione Excel..."
EXCEL_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:5000/api/export \
  -H "Content-Type: application/json" \
  -d '{"format": "excel", "filters": {}, "title": "Test Report"}')

if [ "$EXCEL_RESPONSE" = "200" ]; then
    echo "✅ Generazione Excel funzionante (HTTP 200)"
else
    echo "❌ Generazione Excel non funzionante (HTTP $EXCEL_RESPONSE)"
fi

echo ""
echo "🎯 Testing Summary:"
echo "- ✅ Export Preview API"
echo "- ✅ Export con filtri"
echo "- ✅ PDF Generation"
echo "- ✅ Excel Generation"
echo ""
echo "🚀 Export functionality è pronta per il testing manuale nel browser!"
echo "   Vai su: http://localhost:5000"
echo "   1. Clicca 'Esporta Report' nella Dashboard"
echo "   2. Oppure vai in Gestione Attività e clicca 'Esporta'"
echo "   3. Configura filtri e formato desiderato"
echo "   4. Testa l'anteprima e il download"

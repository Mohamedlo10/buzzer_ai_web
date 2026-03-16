#!/bin/bash

# Script de test de latence du buzzer
# Usage: ./test-buzzer-latency.sh

SERVER_URL="http://192.168.1.32:8080"
RESULTS_FILE="buzzer_latency_results.txt"

echo "🎯 Test de latence du buzzer - BuzzMaster AI"
echo "============================================="
echo "Serveur: $SERVER_URL"
echo "Résultats: $RESULTS_FILE"
echo ""

# Créer le fichier de résultats avec header
echo "Timestamp,RequestTime(ms),ResponseTime(ms),TotalLatency(ms)" > $RESULTS_FILE

# Fonction de test d'une requête
test_buzz_latency() {
    local session_id=$1
    local test_number=$2
    
    # Timestamp de début
    start_time=$(date +%s%3N)
    
    # Simuler un buzz (nécessite un sessionId valide)
    response_time=$(curl -w "%{time_total}" -o /dev/null -s \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer YOUR_TOKEN_HERE" \
        -d "{\"timestamp\":$start_time}" \
        "$SERVER_URL/api/games/$session_id/buzz")
    
    end_time=$(date +%s%3N)
    total_latency=$((end_time - start_time))
    
    echo "$start_time,$start_time,$end_time,$total_latency" >> $RESULTS_FILE
    echo "Test #$test_number: ${total_latency}ms"
    
    # Attendre un peu entre les tests
    sleep 0.5
}

# Instructions pour l'utilisateur
echo "⚠️  INSTRUCTIONS:"
echo "1. Assurez-vous que le backend est démarré sur $SERVER_URL"
echo "2. Créez une session de test et récupérez l'ID de session"
echo "3. Remplacez 'YOUR_SESSION_ID' et 'YOUR_TOKEN' ci-dessous"
echo "4. Lancez ce script: chmod +x test-buzzer-latency.sh && ./test-buzzer-latency.sh"
echo ""

# Variables à configurer
SESSION_ID="YOUR_SESSION_ID_HERE"
AUTH_TOKEN="YOUR_TOKEN_HERE"

if [[ "$SESSION_ID" == "YOUR_SESSION_ID_HERE" ]] || [[ "$AUTH_TOKEN" == "YOUR_TOKEN_HERE" ]]; then
    echo "❌ Veuillez configurer SESSION_ID et AUTH_TOKEN dans ce script"
    exit 1
fi

echo "🚀 Démarrage des tests de latence..."
echo "Session ID: $SESSION_ID"
echo ""

# Effectuer 20 tests de latence
for i in {1..20}; do
    test_buzz_latency $SESSION_ID $i
done

echo ""
echo "✅ Tests terminés!"
echo "📊 Analyse des résultats:"

# Analyser les résultats
total_requests=$(tail -n +2 $RESULTS_FILE | wc -l)
if [ $total_requests -gt 0 ]; then
    avg_latency=$(tail -n +2 $RESULTS_FILE | cut -d',' -f4 | awk '{sum+=$1; count++} END {printf "%.0f", sum/count}')
    min_latency=$(tail -n +2 $RESULTS_FILE | cut -d',' -f4 | sort -n | head -n1)
    max_latency=$(tail -n +2 $RESULTS_FILE | cut -d',' -f4 | sort -n | tail -n1)
    
    echo "   Requêtes: $total_requests"
    echo "   Latence moyenne: ${avg_latency}ms"
    echo "   Latence minimum: ${min_latency}ms"
    echo "   Latence maximum: ${max_latency}ms"
    
    # Évaluation de la performance
    if [ $avg_latency -lt 100 ]; then
        echo "   🟢 Performance: EXCELLENTE (<100ms)"
    elif [ $avg_latency -lt 200 ]; then
        echo "   🟡 Performance: BONNE (<200ms)"
    elif [ $avg_latency -lt 500 ]; then
        echo "   🟠 Performance: ACCEPTABLE (<500ms)"
    else
        echo "   🔴 Performance: À AMÉLIORER (>500ms)"
    fi
else
    echo "❌ Aucun résultat valide trouvé"
fi

echo ""
echo "📁 Résultats détaillés sauvegardés dans: $RESULTS_FILE"
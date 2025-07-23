#!/bin/bash

# Find all unique heat numbers in the TSV
heats=$(awk -F'\t' 'NR>1 && $2 != "" {print $2}' "data/UDGP 2025-01 レースデータ - Race 1 Results.tsv" | sort -n | uniq)

echo "Found heats: $heats"
echo ""

for heat in $heats; do
    echo "========== Sending Heat $heat =========="
    node send-heat.js $heat
    echo ""
    sleep 2  # Wait 2 seconds between requests
done

echo "All heats sent!"
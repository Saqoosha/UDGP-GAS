const fs = require('fs');

// Get heat number from command line argument
const heatNumber = process.argv[2] || '1';

// Parse TSV
const tsvData = fs.readFileSync('data/UDGP 2025-01 レースデータ - Race 1 Results.tsv', 'utf8');
const lines = tsvData.split('\n').filter(line => line.trim() !== '');
const headers = lines[0].split('\t');

// Find all rows for the specified heat
const heatData = [];
let round = '';
let startTime = '';

for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    if (cols[1] === heatNumber) {
        round = cols[0];
        startTime = cols[2];
        
        // Extract lap times (HS column + lap columns)
        const laps = [];
        
        // Add headshot time (column 9) as first lap
        if (cols[9] && cols[9].trim() !== '' && !isNaN(parseFloat(cols[9]))) {
            laps.push(parseFloat(cols[9]));
        }
        
        // Add remaining lap times (starting from column 10)
        for (let j = 10; j < cols.length; j++) {
            if (cols[j] && cols[j].trim() !== '' && !isNaN(parseFloat(cols[j]))) {
                laps.push(parseFloat(cols[j]));
            }
        }
        
        // Note pilots with no laps but still include them
        if (laps.length === 0) {
            console.log(`  ⚠️  ${cols[3]} has 0 laps`);
        }
        
        heatData.push({
            pilot: cols[3],
            position: parseInt(cols[4]) - 1, // Convert to 0-based
            time: parseFloat(cols[6]),
            laps: laps
        });
    }
}

if (heatData.length === 0) {
    console.error(`No data found for Heat ${heatNumber}`);
    process.exit(1);
}

// Create POST data
const postData = {
    action: "save",
    mode: "udgp-race",
    class: `Race 1-${round}`, // Race 1, Round X
    heat: `Heat ${heatNumber}`,
    start: new Date(`2025-01-01 ${startTime}`).getTime(),
    results: heatData
};

console.log(`Sending Heat ${heatNumber} with ${heatData.length} pilots:`);
heatData.forEach(p => console.log(`  - ${p.pilot}: ${p.laps.length} laps, ${p.time}s`));
console.log();

// GAS Web App URL
const url = 'https://script.google.com/macros/s/AKfycbxHf7yPcRd31x4Ge_LfZi-c9y7mm8XraXBAWFJPp6wxmhBbk-uUdh5fTDobo7XtY68b/exec';

// Send POST request
fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData),
    redirect: 'follow'
})
.then(response => response.json())
.then(data => {
    console.log('Response from server:', data);
    if (data.success) {
        console.log(`✅ Heat ${heatNumber} successfully posted!`);
    } else {
        console.log(`❌ Failed to post Heat ${heatNumber}`);
    }
})
.catch(error => {
    console.error('Error:', error);
});
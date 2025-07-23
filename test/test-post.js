const fs = require('fs');

// Parse TSV and extract first heat data
const tsvData = fs.readFileSync('data/UDGP 2025-01 レースデータ - Race 1 Results.tsv', 'utf8');
const lines = tsvData.split('\n');
const headers = lines[0].split('\t');

// Parse Heat 1 data (rows 1-4, skipping header)
const heat1Data = [];
for (let i = 1; i <= 4; i++) {
    const cols = lines[i].split('\t');
    if (cols[1] !== '1') break; // Only Heat 1
    
    // Extract lap times (starting from column 10)
    const laps = [];
    for (let j = 10; j < cols.length; j++) {
        if (cols[j] && cols[j].trim() !== '') {
            laps.push(parseFloat(cols[j]));
        }
    }
    
    heat1Data.push({
        pilot: cols[3],
        position: parseInt(cols[4]) - 1, // Convert to 0-based
        time: parseFloat(cols[6]),
        laps: laps
    });
}

// Create POST data
const postData = {
    action: "save", // This will also increment the current heat
    mode: "udgp-race",
    class: "Race 1-1",
    heat: "Heat 1",
    start: new Date('2025-01-01 09:17:48').getTime(), // Using a specific date for testing
    results: heat1Data
};

console.log('POST data to send:');
console.log(JSON.stringify(postData, null, 2));

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
    console.log('\nResponse from server:');
    console.log(data);
})
.catch(error => {
    console.error('Error:', error);
});
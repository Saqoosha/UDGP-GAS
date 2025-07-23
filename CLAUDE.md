# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Google Apps Script (GAS) project for managing drone racing events, specifically for UDGP (drone racing) competitions. The system handles:
- Heat generation and scheduling for multiple race rounds
- Race result tracking and ranking calculation
- Tournament bracket management for double elimination format
- Real-time data collection via web API endpoints

## Development Commands

Since this is a Google Apps Script project using clasp, here are the essential commands:

```bash
# Push code to Google Apps Script
clasp push

# Pull code from Google Apps Script  
clasp pull

# Open the script in Google Apps Script editor
clasp open

# View logs from Google Apps Script
clasp logs

# Deploy the web app
clasp deploy
```

**Note**: There are no test commands configured in package.json. The project uses Biome for linting and formatting.

## Code Architecture

### Google Sheets Integration
The system operates on a Google Spreadsheet with the following sheets:
- `参加パイロット` (Pilots) - List of participating pilots
- `組み合わせ / タイムスケジュール` (Heat List) - Heat assignments and schedule
- `Race 1 Results` - Raw race data for Race 1
- `Race 2 Results` - Raw race data for Race 2  
- `Race 2 Tournament` - Double elimination tournament bracket
- `data` - Key-value storage for configuration
- `Race 1 Results（ラウンド別）` - Race 1 results by round
- `Race 1 Results（総合）` - Race 1 overall rankings

### Core Components

1. **Main.ts** - Entry point with:
   - `doGet()` - Returns heat list as JSON
   - `doPost()` - Receives race results and updates sheets
   - `onEdit()` - Triggers result calculations on sheet edits

2. **InitHeats.ts** - Heat generation logic:
   - `InitHeats()` - Main function to generate all heats for the event
   - `generateHeats()` - Algorithm to distribute pilots across heats
   - Handles 3 or 4 channel configurations with optimal pilot distribution

3. **Race1.ts** - Race 1 (qualifying) logic:
   - `calcRace1Result()` - Calculates rankings based on laps and time
   - Supports multiple rounds with heat reassignment
   - Uses lap count as primary ranking, time as tiebreaker

4. **KVS.ts** - Key-value storage using the data sheet:
   - Configuration parameters like number of channels, rounds, current heat
   - Caching layer using Google's CacheService

5. **Data Models**:
   - `RaceRecord` - Individual pilot's race performance
   - `RoundRecord` - Processed round results with rankings

### Race Modes

The system supports two race formats:
1. **Race 1** - Multi-round qualifying format where pilots are re-seeded each round
2. **Race 2** - Double elimination tournament bracket

### Important Implementation Details

- The project uses TypeScript with Google Apps Script type definitions
- Biome is configured for code formatting (4 spaces, 120 line width)
- Sheet row/column indices are 1-based (Google Sheets convention)
- Locking mechanism (`LockService`) prevents concurrent modifications
- Results are automatically calculated when data is edited
- The web app is configured for anonymous access (`ANYONE_ANONYMOUS`)

## Common Development Tasks

When modifying the heat generation algorithm, focus on:
- [@src/InitHeats.ts](src/InitHeats.ts) - `generateHeats()` function handles pilot distribution
- Channel configurations are stored in KVS: 3 channels (5705, 5740, 5800) or 4 channels (5705, 5733, 5785, 5805)

When working with race results:
- [@src/Race1.ts](src/Race1.ts) - Contains all Race 1 result processing logic
- Results are ranked by: 1) lap count (descending), 2) total time (ascending)
- Penalty laps are handled by the `penalty` boolean field

For API integration:
- [@src/Main.ts](src/Main.ts) - `doPost()` handles incoming race data
- Expected format: `{ mode: "udgp-race", class: "Race 1-1", heat: "Heat 1", start: timestamp, results: [...] }`
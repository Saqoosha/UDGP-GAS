# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Google Apps Script (GAS) project for managing drone racing events, specifically for UDGP (drone racing) competitions. The system handles:
- Heat generation and scheduling for multiple race rounds
- Race result tracking and ranking calculation
- Tournament bracket management for double elimination format
- Real-time data collection via web API endpoints

## Development Commands

```bash
# Build TypeScript to JavaScript
npm run build

# Build and push to Google Apps Script
npm run push

# Build, push, and deploy
npm run deploy

# Manual commands
clasp push              # Push dist/ files to GAS
clasp open-script       # Open in GAS editor
clasp tail-logs        # View real-time logs
clasp create-deployment # Create new deployment (DO NOT USE - see deployment section)
clasp list-deployments  # List all deployments
```

**Important**: Modern clasp (3.0+) requires manual TypeScript compilation. The project builds to `dist/` directory.

## Deployment Management

**CRITICAL**: Always update the existing deployment. NEVER create new deployments.

### Production Deployment ID
- **AKfycbxHf7yPcRd31x4Ge_LfZi-c9y7mm8XraXBAWFJPp6wxmhBbk-uUdh5fTDobo7XtY68b**

### Deployment Workflow
```bash
# 1. Build and push code
npm run push

# 2. Update the existing deployment (DO NOT create new deployment)
clasp deploy -i AKfycbxHf7yPcRd31x4Ge_LfZi-c9y7mm8XraXBAWFJPp6wxmhBbk-uUdh5fTDobo7XtY68b -d "Description of changes"

# 3. Verify deployment status
clasp deployments
```

### Why This Matters
- External systems depend on this specific deployment ID
- Creating new deployments will break existing integrations
- Always update the existing deployment to maintain consistency

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
   - **Important**: Results sheet now includes start time in column C

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
- TypeScript compiles to ES2020 with no module system (GAS requirement)
- Built files go to `dist/` directory, source files in `src/`

## Common Development Tasks

When modifying the heat generation algorithm, focus on:
- [@src/InitHeats.ts](src/InitHeats.ts) - `generateHeats()` function handles pilot distribution
- Channel configurations are stored in KVS: 3 channels (5705, 5740, 5800) or 4 channels (5695, 5725, 5790, 5820)

When working with race results:
- [@src/Race1.ts](src/Race1.ts) - Contains all Race 1 result processing logic
- Results are ranked by: 1) lap count (descending), 2) total time (ascending)
- Penalty laps are handled by the `penalty` boolean field

For API integration:
- [@src/Main.ts](src/Main.ts) - `doPost()` handles incoming race data
- Expected format: `{ mode: "udgp-race", class: "Race 1-1", heat: "Heat 1", start: timestamp, results: [...] }`

### Race 1 Results Sheet Column Layout

After recent updates, the Race 1 Results sheet uses the following columns:
- A: Round number
- B: Heat number  
- C: Race start time (Japanese time format)
- D: Pilot name
- E: Position
- F: Lap count
- G: Total time
- H: Penalty flag
- I: Result laps (calculated)
- J+: Individual lap times
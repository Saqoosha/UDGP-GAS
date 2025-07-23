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

### TypeScript Bundle Architecture

**CRITICAL**: All TypeScript source files are compiled into a single `bundle.js` file to avoid Google Apps Script file loading order issues. This eliminates "SheetService is not defined" and similar errors.

Key architectural components:
- **App.ts** - Global namespace that initializes all services
- **Service Classes** - SheetService, HeatGenerator, RaceResultProcessor, BatchUpdater
- **Constants** - Centralized configuration in Constants.ts
- **Type Safety** - Comprehensive TypeScript interfaces in DataModels.ts

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

1. **App.ts** - Global application namespace:
   - Lazy initialization of all services and sheet references
   - Single point of access for all components
   - Prevents initialization order issues

2. **Main.ts** - Entry point with:
   - `doGet()` - Returns heat list as JSON
   - `doPost()` - Receives race results and updates sheets
   - `onEdit()` - Triggers result calculations on sheet edits

3. **Service Classes**:
   - **SheetService** - Centralized sheet access and column definitions
   - **HeatGenerator** - Configurable heat generation algorithms
   - **RaceResultProcessor** - Result calculation and ranking logic
   - **BatchUpdater** - Optimized batch operations for Google Sheets API

4. **InitHeats.ts** - Heat generation logic:
   - Uses HeatGenerator service for pilot distribution
   - Handles 3 or 4 channel configurations with optimal pilot distribution

5. **Race1.ts** - Race 1 (qualifying) logic:
   - Uses RaceResultProcessor for calculations
   - Supports multiple rounds with heat reassignment
   - Uses lap count as primary ranking, time as tiebreaker
   - **Important**: Inline border addition for performance

6. **KVS.ts** - Key-value storage using the data sheet:
   - Configuration parameters with Constants.ts
   - Caching layer using Google's CacheService

7. **Data Models**:
   - `DataModels.ts` - TypeScript interfaces for type safety
   - `RoundRecord.ts` - Processed round results with rankings

### Race Modes

The system supports two race formats:
1. **Race 1** - Multi-round qualifying format where pilots are re-seeded each round
2. **Race 2** - Double elimination tournament bracket

### Important Implementation Details

- **TypeScript Bundle**: All source files compile into single `bundle.js` to avoid loading order issues
- **tsconfig.json**: Uses `"outFile": "./dist/bundle.js"` for bundling
- Biome is configured for code formatting (4 spaces, 120 line width)
- Sheet row/column indices are 1-based (Google Sheets convention)
- Locking mechanism (`LockService`) prevents concurrent modifications
- Results are automatically calculated when data is edited
- The web app is configured for anonymous access (`ANYONE_ANONYMOUS`)
- TypeScript compiles to ES2020 with no module system (GAS requirement)
- Built files go to `dist/` directory, source files in `src/`
- **Performance**: Borders added inline during data insertion, not post-processing
- **Time Format**: Display as `h:mm:ss` only (not full datetime)

## Common Development Tasks

### Fixing TypeScript Loading Issues
If you encounter "SheetService is not defined" or similar errors:
1. Run `npm run build` to regenerate the bundle
2. Run `npm run push` to upload to GAS
3. The bundle approach ensures all dependencies load in correct order

### Modifying Heat Generation
- [@src/HeatGenerator.ts](src/HeatGenerator.ts) - Service class for heat generation algorithms
- [@src/InitHeats.ts](src/InitHeats.ts) - Uses HeatGenerator.generate() for pilot distribution
- Channel configurations: 3 channels (5705, 5740, 5800) or 4 channels (5695, 5725, 5790, 5820)

### Working with Race Results
- [@src/Race1.ts](src/Race1.ts) - Uses RaceResultProcessor service
- [@src/RaceResultProcessor.ts](src/RaceResultProcessor.ts) - Core ranking logic
- Results ranked by: 1) lap count (descending), 2) total time (ascending)
- Borders added inline during data insertion for performance

### API Integration
- [@src/Main.ts](src/Main.ts) - `doPost()` handles incoming race data
- Expected format: `{ mode: "udgp-race", class: "Race 1-1", heat: "Heat 1", start: timestamp, results: [...] }`
- Uses SheetService.COLUMNS for consistent column references

### Testing
Test scripts in `test/` directory:
- `send-heat.js` - Send individual heat data
- `send-all-heats.sh` - Batch send all heats
- Run from project root: `node test/send-heat.js 1`

### Race 1 Results Sheet Column Layout

Column definitions are centralized in SheetService.COLUMNS.RACE1_RESULTS:
- A: Round number (ROUND)
- B: Heat number (HEAT)
- C: Race start time (START_TIME) - displays as h:mm:ss
- D: Pilot name (PILOT)
- E: Position (POSITION)
- F: Lap count (LAP_COUNT)
- G: Total time (TOTAL_TIME)
- H: Penalty flag (PENALTY)
- I: Result laps (RESULT_LAPS) - calculated
- J+: Individual lap times (LAP_TIMES_START)
# UDGP-GAS - AI Agent Guide

Google Apps Script system for UDGP drone racing event management.

> **Note**: For user-facing documentation, see [README.md](README.md)

## Quick Reference

- **Language**: TypeScript → bundled to single `bundle.js`
- **Runtime**: Google Apps Script (V8)
- **Package Manager**: pnpm
- **Deployment**: clasp CLI
- **Formatter**: Biome (4 spaces, 120 char width)

## Directory Structure

```text
UDGP-GAS/
├── src/
│   ├── appsscript.json      # GAS manifest (timezone, permissions)
│   ├── App.ts               # Global namespace, lazy service initialization
│   ├── Main.ts              # Entry points: doGet(), doPost(), onEdit()
│   ├── Constants.ts         # Centralized configuration values
│   ├── DataModels.ts        # TypeScript interfaces
│   ├── SheetService.ts      # Spreadsheet access layer, column definitions
│   ├── KVS.ts               # Key-value storage (data sheet + CacheService)
│   ├── InitHeats.ts         # Heat generation orchestration
│   ├── HeatGenerator.ts     # Heat generation algorithms
│   ├── Race1.ts             # Qualifying race logic (multi-round)
│   ├── Race2.ts             # Tournament race logic (double elimination)
│   ├── RaceResultProcessor.ts  # Ranking calculation
│   ├── RoundRecord.ts       # Round results data class
│   └── BatchUpdater.ts      # Optimized batch sheet operations
├── dist/
│   ├── bundle.js            # Compiled TypeScript (generated)
│   └── appsscript.json      # Copied from src/
├── test/
│   ├── send-heat.js         # Send single heat data
│   ├── send-all-heats.sh    # Batch send all heats
│   └── test-post.js         # API testing
├── data/
│   └── *.tsv                # Sample race data
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── biome.json
├── .clasp.json              # clasp project config (gitignored)
└── README.md
```

## Development Commands

```bash
# Install dependencies
pnpm install

# Build TypeScript to dist/bundle.js
pnpm run build

# Build and push to GAS
pnpm run push

# Build, push, and deploy
pnpm run deploy

# Manual clasp commands
clasp push              # Push dist/ to GAS
clasp open              # Open GAS editor in browser
clasp logs --tail       # Real-time log streaming
clasp deployments       # List all deployments
```

## Deployment

### ⚠️ CRITICAL: Always Update Existing Deployment

**NEVER create new deployments.** External systems (RotorHazard) depend on the fixed deployment ID.

**Production Deployment ID:**
```
AKfycbxHf7yPcRd31x4Ge_LfZi-c9y7mm8XraXBAWFJPp6wxmhBbk-uUdh5fTDobo7XtY68b
```

### Deployment Workflow

```bash
# 1. Build and push code
pnpm run push

# 2. Update existing deployment (NOT create new)
clasp deploy -i AKfycbxHf7yPcRd31x4Ge_LfZi-c9y7mm8XraXBAWFJPp6wxmhBbk-uUdh5fTDobo7XtY68b -d "Description"

# 3. Verify
clasp deployments
```

### Endpoint URLs

- **Web App**: `https://script.google.com/macros/s/AKfycbxHf7yPcRd31x4Ge_LfZi-c9y7mm8XraXBAWFJPp6wxmhBbk-uUdh5fTDobo7XtY68b/exec`
- Access: Anonymous (ANYONE_ANONYMOUS)

## Architecture

### TypeScript Bundle Strategy

**All source files compile into a single `bundle.js`** to avoid GAS file loading order issues.

```
tsconfig.json: "outFile": "./dist/bundle.js"
```

This eliminates "SheetService is not defined" and similar runtime errors caused by GAS's unpredictable file evaluation order.

### Google Sheets Structure

| Sheet Name | Purpose |
|------------|---------|
| `参加パイロット` | Pilot list with channel assignments |
| `組み合わせ / タイムスケジュール` | Heat assignments and schedule |
| `Race 1 Results` | Raw qualifying race data |
| `Race 1 Results（ラウンド別）` | Results by round |
| `Race 1 Results（総合）` | Overall qualifying rankings |
| `Race 2 Tournament` | Double elimination bracket |
| `Race 2 Results` | Raw tournament race data |
| `data` | Key-value configuration storage |
| `Log` | API request logging |

### Core Components

| File | Responsibility |
|------|----------------|
| `App.ts` | Global namespace with lazy-initialized services |
| `Main.ts` | Web API handlers (`doGet`, `doPost`, `onEdit`) |
| `SheetService.ts` | Centralized sheet access, column index constants |
| `HeatGenerator.ts` | Pilot distribution algorithms |
| `RaceResultProcessor.ts` | Lap count + time ranking logic |
| `KVS.ts` | Configuration with CacheService caching |

### Race Modes

| Mode | Description |
|------|-------------|
| **Race 1** | Multi-round qualifying; pilots re-seeded each round |
| **Race 2** | Double elimination tournament bracket |

### Channel Configurations

| Channels | Frequencies |
|----------|-------------|
| 3-channel | E1 5705, F1 5740, F4 5800 |
| 4-channel | R2 5695, A8 5725, B4 5790, F5 5820 |

## API Reference

### GET /exec

Returns heat list for race timing system.

**Response:**
```json
{
  "data": [
    {
      "round": "Race 1-1",
      "heat": "1",
      "pilots": ["Pilot1", "Pilot2", "Pilot3", ""]
    }
  ]
}
```

### POST /exec

Receives race results from timing system.

**Request:**
```json
{
  "mode": "udgp-race",
  "class": "Race 1-1",
  "heat": "Heat 1",
  "start": 1234567890000,
  "action": "save",
  "results": [
    {
      "pilot": "PilotName",
      "position": 0,
      "time": 240.5,
      "laps": [1.5, 15.2, 15.1, 15.3]
    }
  ]
}
```

**Response:**
```json
{ "success": true }
```

## Key Implementation Details

### Column Indices

All column references use 1-based indexing (Google Sheets convention).
Column constants are centralized in `SheetService.COLUMNS`:

```typescript
SheetService.COLUMNS.RACE1_RESULTS = {
  ROUND: 1,         // A
  HEAT: 2,          // B
  START_TIME: 3,    // C
  PILOT: 4,         // D
  POSITION: 5,      // E
  LAP_COUNT: 6,     // F
  TOTAL_TIME: 7,    // G
  PENALTY: 8,       // H
  RESULT_LAPS: 9,   // I (calculated)
  LAP_TIMES_START: 10  // J+
}
```

### Ranking Logic

1. **Primary**: Lap count (descending)
2. **Secondary**: Total time (ascending)
3. Penalty (-2 laps) applied via `RESULT_LAPS` formula

### Performance Optimizations

- Borders added inline during data insertion (not post-processing)
- Time displayed as `h:mm:ss` only (not full datetime)
- LockService prevents concurrent modifications
- BatchUpdater for efficient bulk operations

## Common Development Tasks

### Fixing "SheetService is not defined"

```bash
pnpm run build   # Regenerate bundle
pnpm run push    # Upload to GAS
```

### Modifying Heat Generation

1. Edit `src/HeatGenerator.ts` for algorithm changes
2. Edit `src/InitHeats.ts` for orchestration
3. Run `InitHeats()` function from GAS editor

### Working with Race Results

1. `src/RaceResultProcessor.ts` - Core ranking logic
2. `src/Race1.ts` - Qualifying format
3. `src/Race2.ts` - Tournament format

### Testing API

```bash
# Send single heat
node test/send-heat.js 1

# Send all heats from TSV
./test/send-all-heats.sh
```

### View Logs

```bash
clasp logs --tail
```

## Configuration (data sheet)

| Key | Description |
|-----|-------------|
| `num channels` | 3 or 4 |
| `num rounds of race 1` | Number of qualifying rounds |
| `current heat` | Current heat number |
| `race mode` | "Race 1" or "Race 2" |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "SheetService is not defined" | Run `pnpm run build && pnpm run push` |
| API returns 403 | Check deployment access is "ANYONE_ANONYMOUS" |
| Results not updating | Check `onEdit` trigger is installed |
| Heats not generating | Verify pilots in `参加パイロット` sheet |

## Integration with RotorHazard

This GAS system is the legacy backend. The newer system uses:
- **rh_udgp_sync** plugin → sends data to Cloudflare Workers
- See `/home/udgp/rh-data/plugins/rh_udgp_sync/AGENTS.md`

The GAS endpoint can still receive race data directly from RotorHazard via POST requests.

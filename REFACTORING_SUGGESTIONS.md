# Refactoring Suggestions for UDGP-GAS

## Summary of Key Improvements

### 1. **Centralized Configuration**
- Created `SheetService.ts` to centralize sheet access and column definitions
- Eliminates magic numbers and string literals scattered throughout code
- Makes column changes easier to manage

### 2. **Simplified Heat Generation**
- Created `HeatGenerator.ts` with clearer logic and configuration-driven approach
- Removed nested switch statements
- Made channel configurations and adjustments more maintainable

### 3. **Separated Concerns**
- Created `RaceResultProcessor.ts` to handle result calculations
- Separated data access from business logic
- Made ranking rules explicit and configurable

## Additional Refactoring Recommendations

### 4. **Replace Global Variables in Main.ts**
```typescript
// Before
const ss = SpreadsheetApp.getActiveSpreadsheet();
const pilotsSheet = ss.getSheetByName("参加パイロット");
// ... etc

// After - use SheetService
const sheets = SheetService.getInstance();
const pilotsSheet = sheets.getPilotsSheet();
```

### 5. **Extract Constants**
```typescript
// Create Constants.ts
export const RACE_CONSTANTS = {
    RACE_TIME: 240,      // 4 minutes
    GRACE_PERIOD: 10,    // 10 seconds
    CRASH_PROBABILITY: 0.05,
    
    RACE_MODES: {
        RACE_1: "Race 1",
        RACE_2: "Race 2"
    },
    
    TIME_FORMAT: {
        LOCALE: "ja-JP",
        DATE_FORMAT: "yyyy/mm/dd h:mm:ss"
    }
};
```

### 6. **Improve Error Handling**
```typescript
// Add validation and error handling
function doPost(e: GoogleAppsScript.Events.DoPost) {
    try {
        const data = validateAndParsePostData(e);
        const result = processRaceData(data);
        return createSuccessResponse(result);
    } catch (error) {
        logError(error, e);
        return createErrorResponse(error.message);
    }
}

function validateAndParsePostData(e: GoogleAppsScript.Events.DoPost): RaceData {
    if (!e.postData?.contents) {
        throw new Error("No post data received");
    }
    
    const data = JSON.parse(e.postData.contents);
    
    if (!data.mode || !data.heat || !data.results) {
        throw new Error("Invalid race data format");
    }
    
    return data;
}
```

### 7. **Batch Sheet Operations**
```typescript
// Instead of multiple getRange().setValue() calls
class BatchUpdater {
    private updates: Array<{range: string, values: any[][]}> = [];
    
    add(range: string, values: any[][]): void {
        this.updates.push({range, values});
    }
    
    execute(sheet: GoogleAppsScript.Spreadsheet.Sheet): void {
        // Group adjacent ranges for efficiency
        this.updates.forEach(update => {
            sheet.getRange(update.range).setValues(update.values);
        });
        SpreadsheetApp.flush(); // Single flush at end
    }
}
```

### 8. **Type Safety Improvements**
```typescript
// Define all interfaces
interface HeatAssignment {
    round: string;
    heatNumber: number;
    pilots: string[];
    startTime?: Date;
}

interface RaceConfiguration {
    numChannels: 3 | 4;
    numRounds: number;
    heatsPerRound: number;
    currentHeat: number;
}

// Use enums for fixed values
enum RaceMode {
    RACE_1 = "Race 1",
    RACE_2 = "Race 2"
}

enum ChannelConfig {
    THREE_CHANNEL = 3,
    FOUR_CHANNEL = 4
}
```

### 9. **Simplify Complex Functions**
```typescript
// Break down calcRace1Result() into smaller functions
class Race1Calculator {
    calculate(): void {
        const lock = this.acquireLock();
        try {
            const rawResults = this.fetchRawResults();
            const roundResults = this.processRounds(rawResults);
            const overallResults = this.calculateOverallRanking(roundResults);
            this.updateSheets(roundResults, overallResults);
        } finally {
            lock.releaseLock();
        }
    }
    
    private processRounds(rawResults: RaceData[]): Map<number, ProcessedResult[]> {
        // Process each round separately
    }
    
    private calculateOverallRanking(roundResults: Map<number, ProcessedResult[]>): ProcessedResult[] {
        // Calculate overall ranking
    }
}
```

### 10. **Improve Function Names**
```typescript
// More descriptive names
// Before: _setHeats()
// After: populateHeatSchedule()

// Before: findOrAddRow()
// After: findExistingRowOrCreateNew()

// Before: addOrUpdateResult()
// After: upsertRaceResult()
```

### 11. **Extract Formula Generation**
```typescript
class FormulaBuilder {
    static timeIncrement(baseCell: string, incrementCell: string): string {
        return `=${baseCell}+time(0,${incrementCell},0)`;
    }
    
    static previousCellOffset(offset: number = -1): string {
        return `R[${offset}]C[0]`;
    }
    
    static durationInMinutes(startCell: string, endCell: string): string {
        return `=IF(ISBLANK(${endCell}), "", (${endCell}-${startCell})*1440)`;
    }
}
```

### 12. **Add Data Access Layer**
```typescript
// Create repository pattern for data access
class RaceResultRepository {
    private sheet: GoogleAppsScript.Spreadsheet.Sheet;
    
    constructor(sheet: GoogleAppsScript.Spreadsheet.Sheet) {
        this.sheet = sheet;
    }
    
    findByHeatAndPilot(heat: number, pilot: string): RaceData | null {
        // Implement search logic
    }
    
    save(result: RaceData): void {
        // Implement save logic
    }
    
    getAll(): RaceData[] {
        // Implement fetch all logic
    }
}
```

## Implementation Priority

1. **High Priority** (Immediate impact, low effort):
   - Extract SheetService for centralized access
   - Define constants and column mappings
   - Add basic error handling

2. **Medium Priority** (Good improvement, moderate effort):
   - Simplify heat generation logic
   - Extract result processing logic
   - Improve type definitions

3. **Low Priority** (Nice to have, higher effort):
   - Full repository pattern implementation
   - Complete formula builder
   - Comprehensive error handling system

## Benefits of Refactoring

1. **Maintainability**: Easier to understand and modify code
2. **Testability**: Smaller, focused functions are easier to test
3. **Performance**: Batch operations reduce API calls
4. **Type Safety**: Fewer runtime errors with proper typing
5. **Reusability**: Extracted utilities can be used across the project
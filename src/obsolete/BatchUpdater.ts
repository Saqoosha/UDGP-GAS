// Batch updater for optimizing Google Sheets operations
interface BatchUpdate {
    range: GoogleAppsScript.Spreadsheet.Range;
    values?: any[][];
    formats?: GoogleAppsScript.Spreadsheet.TextStyle[][];
    backgrounds?: string[][];
    fontColors?: string[][];
    horizontalAlignments?: ("left" | "center" | "normal" | "right")[][];
    formulas?: string[][];
    numberFormats?: string[][];
}

interface RangeUpdate {
    range: string;
    values?: any[][];
    formulas?: string[][];
    format?: {
        background?: string;
        fontColor?: string;
        horizontalAlignment?: string;
        numberFormat?: string;
        textStyle?: GoogleAppsScript.Spreadsheet.TextStyle;
    };
}

class BatchUpdater {
    private updates: BatchUpdate[] = [];
    private sheet: GoogleAppsScript.Spreadsheet.Sheet;
    
    constructor(sheet: GoogleAppsScript.Spreadsheet.Sheet) {
        this.sheet = sheet;
    }
    
    // Add values to be updated
    addValues(range: string, values: any[][]): BatchUpdater {
        const rangeObj = this.sheet.getRange(range);
        this.updates.push({ range: rangeObj, values });
        return this;
    }
    
    // Add formulas to be updated
    addFormulas(range: string, formulas: string[][]): BatchUpdater {
        const rangeObj = this.sheet.getRange(range);
        this.updates.push({ range: rangeObj, formulas });
        return this;
    }
    
    // Add formatting to be updated
    addFormat(range: string, format: {
        background?: string;
        fontColor?: string;
        horizontalAlignment?: string;
        numberFormat?: string;
    }): BatchUpdater {
        const rangeObj = this.sheet.getRange(range);
        const update: BatchUpdate = { range: rangeObj };
        
        if (format.background) {
            const rows = rangeObj.getNumRows();
            const cols = rangeObj.getNumColumns();
            update.backgrounds = Array(rows).fill(null).map(() => Array(cols).fill(format.background));
        }
        
        if (format.fontColor) {
            const rows = rangeObj.getNumRows();
            const cols = rangeObj.getNumColumns();
            update.fontColors = Array(rows).fill(null).map(() => Array(cols).fill(format.fontColor));
        }
        
        if (format.horizontalAlignment) {
            const rows = rangeObj.getNumRows();
            const cols = rangeObj.getNumColumns();
            update.horizontalAlignments = Array(rows).fill(null).map(() => 
                Array(cols).fill(format.horizontalAlignment as "left" | "center" | "normal" | "right")
            );
        }
        
        if (format.numberFormat) {
            update.numberFormats = [[format.numberFormat]];
        }
        
        this.updates.push(update);
        return this;
    }
    
    // Clear content and formatting
    addClear(range: string, options?: {
        content?: boolean;
        format?: boolean;
    }): BatchUpdater {
        const rangeObj = this.sheet.getRange(range);
        const update: BatchUpdate = { range: rangeObj };
        
        if (options?.content !== false) {
            // Clear content by default
            const rows = rangeObj.getNumRows();
            const cols = rangeObj.getNumColumns();
            update.values = Array(rows).fill(null).map(() => Array(cols).fill(""));
        }
        
        if (options?.format) {
            const rows = rangeObj.getNumRows();
            const cols = rangeObj.getNumColumns();
            update.backgrounds = Array(rows).fill(null).map(() => Array(cols).fill(null));
            update.fontColors = Array(rows).fill(null).map(() => Array(cols).fill(null));
        }
        
        this.updates.push(update);
        return this;
    }
    
    // Execute all batched updates
    execute(): void {
        if (this.updates.length === 0) return;
        
        // Group updates by type for efficiency
        this.updates.forEach(update => {
            if (update.values) {
                update.range.setValues(update.values);
            }
            if (update.formulas) {
                update.range.setFormulas(update.formulas);
            }
            if (update.backgrounds) {
                update.range.setBackgrounds(update.backgrounds);
            }
            if (update.fontColors) {
                update.range.setFontColors(update.fontColors);
            }
            if (update.horizontalAlignments) {
                update.range.setHorizontalAlignments(update.horizontalAlignments);
            }
            if (update.numberFormats) {
                update.range.setNumberFormats(update.numberFormats);
            }
        });
        
        // Single flush at the end
        SpreadsheetApp.flush();
        
        // Clear updates after execution
        this.updates = [];
    }
    
    // Static method for simple batch updates
    static batchUpdate(sheet: GoogleAppsScript.Spreadsheet.Sheet, updates: RangeUpdate[]): void {
        const batcher = new BatchUpdater(sheet);
        
        updates.forEach(update => {
            if (update.values) {
                batcher.addValues(update.range, update.values);
            }
            if (update.formulas) {
                batcher.addFormulas(update.range, update.formulas);
            }
            if (update.format) {
                batcher.addFormat(update.range, update.format);
            }
        });
        
        batcher.execute();
    }
}
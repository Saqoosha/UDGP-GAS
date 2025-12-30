// Centralized sheet access and configuration
class SheetService {
    private static instance: SheetService;
    private ss: GoogleAppsScript.Spreadsheet.Spreadsheet;
    
    // Sheet name constants
    static readonly SHEETS = {
        PILOTS: "参加パイロット",
        HEAT_LIST: "組み合わせ / タイムスケジュール",
        LOG: "Log"
    };
    
    // Column indices for better readability
    static readonly COLUMNS = {
        HEAT_LIST: {
            RACE: 1,
            HEAT_NUMBER: 2,
            TIME: 3,
            START_TIME: 4,
            ACTUAL_TIME: 5,
            DURATION: 6,
            PILOTS_START: 7
        }
    };
    
    private constructor() {
        this.ss = SpreadsheetApp.getActiveSpreadsheet();
    }
    
    static getInstance(): SheetService {
        if (!SheetService.instance) {
            SheetService.instance = new SheetService();
        }
        return SheetService.instance;
    }
    
    getHeatListSheet() {
        return this.ss.getSheetByName(SheetService.SHEETS.HEAT_LIST);
    }

    getPilotsSheet() {
        return this.ss.getSheetByName(SheetService.SHEETS.PILOTS);
    }

    getLogSheet() {
        return this.ss.getSheetByName(SheetService.SHEETS.LOG);
    }
}

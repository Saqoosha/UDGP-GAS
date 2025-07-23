// Centralized sheet access and configuration
class SheetService {
    private static instance: SheetService;
    private ss: GoogleAppsScript.Spreadsheet.Spreadsheet;
    
    // Sheet name constants
    static readonly SHEETS = {
        PILOTS: "参加パイロット",
        HEAT_LIST: "組み合わせ / タイムスケジュール",
        RACE1_RESULTS: "Race 1 Results",
        RACE2_RESULTS: "Race 2 Results",
        TOURNAMENT: "Race 2 Tournament",
        DATA: "data",
        RACE1_ROUND: "Race 1 Results（ラウンド別）",
        RACE1_TOTAL: "Race 1 Results（総合）",
        LOG: "Log"
    };
    
    // Column indices for better readability
    static readonly COLUMNS = {
        RACE1_RESULTS: {
            ROUND: 1,
            HEAT: 2,
            START_TIME: 3,
            PILOT: 4,
            POSITION: 5,
            LAPS: 6,
            TIME: 7,
            PENALTY: 8,
            RESULT_LAPS: 9,
            LAP_TIMES_START: 10
        },
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
    
    getPilotsSheet() {
        return this.ss.getSheetByName(SheetService.SHEETS.PILOTS);
    }
    
    getHeatListSheet() {
        return this.ss.getSheetByName(SheetService.SHEETS.HEAT_LIST);
    }
    
    getRace1ResultSheet() {
        return this.ss.getSheetByName(SheetService.SHEETS.RACE1_RESULTS);
    }
    
    getRace2ResultSheet() {
        return this.ss.getSheetByName(SheetService.SHEETS.RACE2_RESULTS);
    }
    
    getTournamentSheet() {
        return this.ss.getSheetByName(SheetService.SHEETS.TOURNAMENT);
    }
    
    getDataSheet() {
        return this.ss.getSheetByName(SheetService.SHEETS.DATA);
    }
    
    getRace1RoundSheet() {
        return this.ss.getSheetByName(SheetService.SHEETS.RACE1_ROUND);
    }
    
    getRace1TotalSheet() {
        return this.ss.getSheetByName(SheetService.SHEETS.RACE1_TOTAL);
    }
    
    getLogSheet() {
        return this.ss.getSheetByName(SheetService.SHEETS.LOG);
    }
}
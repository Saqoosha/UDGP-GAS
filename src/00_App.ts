// Global application namespace - loads first
const App = {
    // Services
    sheets: null as SheetService | null,
    
    // Sheet references
    pilotsSheet: null as GoogleAppsScript.Spreadsheet.Sheet | null,
    heatListSheet: null as GoogleAppsScript.Spreadsheet.Sheet | null,
    race1ResultSheet: null as GoogleAppsScript.Spreadsheet.Sheet | null,
    race2ResultSheet: null as GoogleAppsScript.Spreadsheet.Sheet | null,
    tournamentSheet: null as GoogleAppsScript.Spreadsheet.Sheet | null,
    dataSheet: null as GoogleAppsScript.Spreadsheet.Sheet | null,
    
    // Initialize all services and sheets
    init(): void {
        if (!this.sheets) {
            this.sheets = SheetService.getInstance();
            this.pilotsSheet = this.sheets.getPilotsSheet();
            this.heatListSheet = this.sheets.getHeatListSheet();
            this.race1ResultSheet = this.sheets.getRace1ResultSheet();
            this.race2ResultSheet = this.sheets.getRace2ResultSheet();
            this.tournamentSheet = this.sheets.getTournamentSheet();
            this.dataSheet = this.sheets.getDataSheet();
        }
    },
    
    // Get sheets service
    getSheets(): SheetService {
        this.init();
        return this.sheets!;
    },
    
    // Get specific sheets
    getPilotsSheet(): GoogleAppsScript.Spreadsheet.Sheet {
        this.init();
        return this.pilotsSheet!;
    },
    
    getHeatListSheet(): GoogleAppsScript.Spreadsheet.Sheet {
        this.init();
        return this.heatListSheet!;
    },
    
    getRace1ResultSheet(): GoogleAppsScript.Spreadsheet.Sheet {
        this.init();
        return this.race1ResultSheet!;
    },
    
    getRace2ResultSheet(): GoogleAppsScript.Spreadsheet.Sheet {
        this.init();
        return this.race2ResultSheet!;
    },
    
    getTournamentSheet(): GoogleAppsScript.Spreadsheet.Sheet {
        this.init();
        return this.tournamentSheet!;
    },
    
    getDataSheet(): GoogleAppsScript.Spreadsheet.Sheet {
        this.init();
        return this.dataSheet!;
    }
};
// Global application namespace - loads first
const App = {
    sheets: null as SheetService | null,

    heatListSheet: null as GoogleAppsScript.Spreadsheet.Sheet | null,
    pilotsSheet: null as GoogleAppsScript.Spreadsheet.Sheet | null,
    logSheet: null as GoogleAppsScript.Spreadsheet.Sheet | null,

    init(): void {
        if (!this.sheets) {
            this.sheets = SheetService.getInstance();
            this.heatListSheet = this.sheets.getHeatListSheet();
            this.pilotsSheet = this.sheets.getPilotsSheet();
            this.logSheet = this.sheets.getLogSheet();
        }
    },

    getSheets(): SheetService {
        this.init();
        return this.sheets!;
    },

    getHeatListSheet(): GoogleAppsScript.Spreadsheet.Sheet {
        this.init();
        return this.heatListSheet!;
    },

    getPilotsSheet(): GoogleAppsScript.Spreadsheet.Sheet {
        this.init();
        return this.pilotsSheet!;
    },

    getLogSheet(): GoogleAppsScript.Spreadsheet.Sheet {
        this.init();
        return this.logSheet!;
    }
};

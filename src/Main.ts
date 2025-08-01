// Main.ts - Core application functions
// All sheet access goes through App global

function findLastIndex<T>(arr: T[], predicate: (val: T) => boolean): number {
    let lastIndex = -1;
    for (let i = arr.length - 1; i >= 0; i--) {
        if (predicate(arr[i])) {
            lastIndex = i;
            break;
        }
    }
    return lastIndex;
}

function onEdit(e: GoogleAppsScript.Events.SheetsOnEdit) {
    switch (e.range.getSheet().getName()) {
        case SheetService.SHEETS.RACE1_RESULTS:
            calcRace1Result();
            break;
        // case SheetService.SHEETS.RACE2_RESULTS:
        //     calcRace2Result();
        //     break;
    }
}

function doGet(e: GoogleAppsScript.Events.DoGet) {
    const data = getHeatList();
    return ContentService.createTextOutput(JSON.stringify({ data: data })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e: GoogleAppsScript.Events.DoPost) {
    try {
        console.log("doPost started");
        logRequest(e);
        const data = validateAndParsePostData(e);
        console.log("Data validated:", JSON.stringify(data));
        const result = processRaceData(data);
        console.log("Data processed successfully");
        return createSuccessResponse(result);
    } catch (error) {
        console.error("Error in doPost:", error);
        return createErrorResponse(error.message);
    }
}

function validateAndParsePostData(e: GoogleAppsScript.Events.DoPost): PostData {
    if (!e.postData?.contents) {
        throw new Error("No post data received");
    }
    
    const data = JSON.parse(e.postData.contents) as PostData;
    
    if (!data.mode || !data.heat || !data.results) {
        throw new Error("Invalid race data format");
    }
    
    return data;
}

function processRaceData(data: PostData): ApiResponse {
    if (data.mode !== "udgp-race") {
        throw new Error(`Unknown mode: ${data.mode}`);
    }
    
    const heatNumber = Number.parseInt(data.heat.replace(/[^\d]/g, ""), 10);
    console.log("Processing heat number:", heatNumber);
    setHeatStartTime(heatNumber, data.start);
    
    const raceMode = data.class.split("-")[0];
    console.log("Race mode:", raceMode);
    
    switch (raceMode) {
        case RACE_CONSTANTS.RACE_MODES.RACE_1: {
            const roundNumber = Number.parseInt(data.class.split("-")[1]);
            console.log("Round number:", roundNumber, "Results count:", data.results.length);
            const race1ResultSheet = App.getRace1ResultSheet();
            console.log("Got Race1 sheet, calling addOrUpdateResult");
            addOrUpdateResult(race1ResultSheet, roundNumber, heatNumber, data.start, data.results);
            console.log("addOrUpdateResult completed, calling calcRace1Result");
            calcRace1Result();
            console.log("calcRace1Result completed");
            break;
        }
        case RACE_CONSTANTS.RACE_MODES.RACE_2: {
            addOrUpdateResult(App.getRace2ResultSheet(), 1, heatNumber, data.start, data.results);
            break;
        }
        default:
            throw new Error(`Unknown race mode: ${raceMode}`);
    }
    
    if (data.action === "save") {
        console.log("Incrementing heat to:", heatNumber + 1);
        setCurrentHeat(heatNumber + 1);
    }
    
    return { success: true };
}

function createSuccessResponse(result: ApiResponse): GoogleAppsScript.Content.TextOutput {
    const output = ContentService.createTextOutput(JSON.stringify(result));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
}

function createErrorResponse(error: string): GoogleAppsScript.Content.TextOutput {
    const output = ContentService.createTextOutput(JSON.stringify({ success: false, error }));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
}

function logRequest(e: GoogleAppsScript.Events.DoPost): void {
    const logSheet = App.getSheets().getLogSheet();
    logSheet.getRange("1:1").insertCells(SpreadsheetApp.Dimension.ROWS);
    logSheet.getRange(1, 1).setValue(new Date().toLocaleString(RACE_CONSTANTS.TIME_FORMAT.LOCALE));
    logSheet.getRange(1, 2).setValue(e);
    logSheet.getRange(1, 3).setValue(e.postData?.contents || "");
    SpreadsheetApp.flush();
}

function setHeatStartTime(heatNumber: number, timestamp: number) {
    const row = findRowIndexByHeatNumber(heatNumber);
    if (row === -1) {
        console.log("setHeatStartTime: row not found", heatNumber);
        return;
    }
    const t = new Date(timestamp);
    const heatListSheet = App.getHeatListSheet();
    heatListSheet.getRange(row, SheetService.COLUMNS.HEAT_LIST.START_TIME).setValue(t);
    heatListSheet.getRange(row, SheetService.COLUMNS.HEAT_LIST.ACTUAL_TIME).setValue(formatTimestampToTimeString(timestamp));
}

function findRowIndexByHeatNumber(heatNumber: number): number {
    const heatListSheet = App.getHeatListSheet();
    const columnBValues = heatListSheet.getRange("B:B").getValues();
    
    for (let i = 0; i < columnBValues.length; i++) {
        if (Number.parseInt(columnBValues[i][0]) === heatNumber) {
            return i + 1; // Sheet rows are 1-indexed
        }
    }
    
    return -1;
}

function formatTimestampToTimeString(timestamp: number | string): string {
    const t = new Date(timestamp);
    const hours = String(t.getHours()).padStart(2, "0");
    const minutes = String(t.getMinutes()).padStart(2, "0");
    const seconds = String(t.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
}
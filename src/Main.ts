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
    const type = e.parameter?.type;

    if (type === 'pilots') {
        const data = getPilotList();
        return ContentService.createTextOutput(JSON.stringify({ data })).setMimeType(ContentService.MimeType.JSON);
    }

    if (type === 'round1') {
        const data = getRound1Heats();
        return ContentService.createTextOutput(JSON.stringify({ data })).setMimeType(ContentService.MimeType.JSON);
    }

    // Default: return heat list
    const data = getHeatList();
    return ContentService.createTextOutput(JSON.stringify({ data })).setMimeType(ContentService.MimeType.JSON);
}

function getPilotList(): { name: string; discord_id: string }[] {
    const sheet = App.getPilotsSheet();
    const values = sheet.getRange("C2:D").getValues(); // Column C: Pilot Name, Column D: Discord ID
    return values
        .filter(row => row[0] !== "")
        .map(row => ({ name: String(row[0]), discord_id: String(row[1] || "") }));
}

function doPost(e: GoogleAppsScript.Events.DoPost) {
    try {
        console.log("doPost started");
        logRequest(e);

        if (!e.postData?.contents) {
            throw new Error("No post data received");
        }

        const data = JSON.parse(e.postData.contents) as any;
        console.log("Data received:", JSON.stringify(data));

        // Route by action field
        if (data.action === "set_start_time") {
            const result = handleSetStartTime(data);
            return createSuccessResponse(result);
        }

        if (data.action === "update_heats") {
            const result = handleUpdateHeats(data);
            return createSuccessResponse(result);
        }

        // Legacy: process race data
        const validatedData = validateAndParsePostData(e);
        console.log("Data validated:", JSON.stringify(validatedData));
        const result = processRaceData(validatedData);
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

function handleSetStartTime(data: { heat: number; start: number }): ApiResponse {
    console.log("handleSetStartTime called with:", JSON.stringify(data));
    if (!data.heat || !data.start) {
        throw new Error("Missing heat or start time");
    }
    setHeatStartTime(data.heat, data.start);
    console.log("handleSetStartTime completed successfully");
    return { success: true };
}

function handleUpdateHeats(data: { class: string; heats: Array<{ heat: string; pilots: string[] }> }): ApiResponse {
    if (!data.class || !data.heats) {
        throw new Error("Missing class or heats data");
    }

    const heatListSheet = App.getHeatListSheet();
    const cols = SheetService.COLUMNS.HEAT_LIST;

    // Update heat assignments in sheet
    for (const heatData of data.heats) {
        const heatNumberMatch = heatData.heat.match(/(\d+)/);
        if (!heatNumberMatch) {
            console.log(`Could not extract heat number from "${heatData.heat}"`);
            continue;
        }

        const heatNumber = Number.parseInt(heatNumberMatch[1], 10);
        const row = findRowIndexByHeatNumber(heatNumber);
        if (row === -1) {
            console.log(`Heat ${heatNumber} not found in sheet`);
            continue;
        }

        // Update pilot assignments (columns G, H, I, J)
        const pilotValues = heatData.pilots.slice(0, 4); // Max 4 pilots
        while (pilotValues.length < 4) {
            pilotValues.push("");
        }
        heatListSheet.getRange(row, cols.PILOTS_START, 1, 4).setValues([pilotValues]);
    }

    SpreadsheetApp.flush();
    return { success: true };
}

function setHeatStartTime(heatNumber: number, timestamp: number) {
    console.log(`setHeatStartTime: Looking for heat ${heatNumber}, timestamp ${timestamp}`);
    const row = findRowIndexByHeatNumber(heatNumber);
    if (row === -1) {
        console.log(`setHeatStartTime: row not found for heat ${heatNumber}`);
        return;
    }
    console.log(`setHeatStartTime: Found row ${row} for heat ${heatNumber}`);
    const t = new Date(timestamp);
    const heatListSheet = App.getHeatListSheet();
    const timeString = formatTimestampToTimeString(timestamp);
    console.log(`setHeatStartTime: Writing to row ${row}, START_TIME column ${SheetService.COLUMNS.HEAT_LIST.START_TIME}, ACTUAL_TIME column ${SheetService.COLUMNS.HEAT_LIST.ACTUAL_TIME}`);
    console.log(`setHeatStartTime: Date object: ${t}, Time string: ${timeString}`);
    heatListSheet.getRange(row, SheetService.COLUMNS.HEAT_LIST.START_TIME).setValue(t);
    heatListSheet.getRange(row, SheetService.COLUMNS.HEAT_LIST.ACTUAL_TIME).setValue(timeString);
    SpreadsheetApp.flush();
    console.log(`setHeatStartTime: Successfully wrote start time for heat ${heatNumber}`);
}

function findRowIndexByHeatNumber(heatNumber: number): number {
    const heatListSheet = App.getHeatListSheet();
    const columnBValues = heatListSheet.getRange("B:B").getValues();
    console.log(`findRowIndexByHeatNumber: Looking for heat ${heatNumber}, checking ${columnBValues.length} rows`);

    for (let i = 0; i < columnBValues.length; i++) {
        const cellValue = columnBValues[i][0];
        const parsedValue = Number.parseInt(cellValue);
        if (parsedValue === heatNumber) {
            console.log(`findRowIndexByHeatNumber: Found heat ${heatNumber} at row ${i + 1} (cell value: ${cellValue})`);
            return i + 1; // Sheet rows are 1-indexed
        }
    }

    console.log(`findRowIndexByHeatNumber: Heat ${heatNumber} not found. Sample values: ${columnBValues.slice(0, 10).map((v, idx) => `Row ${idx + 1}: ${v[0]}`).join(", ")}`);
    return -1;
}

function formatTimestampToTimeString(timestamp: number | string): string {
    const t = new Date(timestamp);
    const hours = String(t.getHours()).padStart(2, "0");
    const minutes = String(t.getMinutes()).padStart(2, "0");
    const seconds = String(t.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
}

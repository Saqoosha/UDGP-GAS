// Main.ts - Core entry points (simplified for current plugin usage)
// All sheet access goes through the App global.

type ApiResponse = { success: boolean; error?: string };
type HeatAssignment = { round: string; heat: string; pilots: string[] };
type UpdateHeatsPayload = { action: "update_heats"; class: string; heats: Array<{ heat: string; pilots: string[] }> };
type SetStartTimePayload = { action: "set_start_time"; heat: number; start: number };
type PostPayload = UpdateHeatsPayload | SetStartTimePayload;

function doPost(e: GoogleAppsScript.Events.DoPost) {
    try {
        logRequest(e);

        const payload = parsePostPayload(e);
        if (payload.action === "set_start_time") {
            return createSuccessResponse(handleSetStartTime(payload));
        }
        if (payload.action === "update_heats") {
            return createSuccessResponse(handleUpdateHeats(payload));
        }

        throw new Error("Unsupported action");
    } catch (error) {
        console.error("Error in doPost:", error);
        return createErrorResponse(error instanceof Error ? error.message : String(error));
    }
}

function doGet(e: GoogleAppsScript.Events.DoGet) {
    const type = e.parameter?.type;

    if (type === "pilots") {
        const data = getPilotList();
        return ContentService.createTextOutput(JSON.stringify({ data })).setMimeType(ContentService.MimeType.JSON);
    }

    if (type === "round1") {
        const data = getRound1Heats();
        return ContentService.createTextOutput(JSON.stringify({ data })).setMimeType(ContentService.MimeType.JSON);
    }

    const data = getHeatList();
    return ContentService.createTextOutput(JSON.stringify({ data })).setMimeType(ContentService.MimeType.JSON);
}

function parsePostPayload(e: GoogleAppsScript.Events.DoPost): PostPayload {
    if (!e.postData?.contents) {
        throw new Error("No post data received");
    }

    const data = JSON.parse(e.postData.contents) as { action?: string };
    if (!data.action) {
        throw new Error("Missing action field");
    }
    if (data.action === "set_start_time") {
        return data as SetStartTimePayload;
    }
    if (data.action === "update_heats") {
        return data as UpdateHeatsPayload;
    }
    throw new Error(`Unsupported action: ${data.action}`);
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
    const logSheet = App.getLogSheet();
    logSheet.getRange("1:1").insertCells(SpreadsheetApp.Dimension.ROWS);
    logSheet.getRange(1, 1).setValue(new Date().toISOString());
    logSheet.getRange(1, 2).setValue(e);
    logSheet.getRange(1, 3).setValue(e.postData?.contents || "");
    SpreadsheetApp.flush();
}

function handleSetStartTime(data: SetStartTimePayload): ApiResponse {
    if (!data.heat || !data.start) {
        throw new Error("Missing heat or start time");
    }
    setHeatStartTime(data.heat, data.start);
    return { success: true };
}

function handleUpdateHeats(data: UpdateHeatsPayload): ApiResponse {
    if (!data.class || !data.heats) {
        throw new Error("Missing class or heats data");
    }

    const heatListSheet = App.getHeatListSheet();
    const cols = SheetService.COLUMNS.HEAT_LIST;

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

        const pilotValues = heatData.pilots.slice(0, 4);
        while (pilotValues.length < 4) {
            pilotValues.push("");
        }
        heatListSheet.getRange(row, cols.PILOTS_START, 1, 4).setValues([pilotValues]);
    }

    SpreadsheetApp.flush();
    return { success: true };
}

function getPilotList(): { name: string; discord_id: string }[] {
    const sheet = App.getPilotsSheet();
    const values = sheet.getRange("C2:D").getValues();
    return values
        .filter((row) => row[0] !== "")
        .map((row) => ({ name: String(row[0]), discord_id: String(row[1] || "") }));
}

function getRound1Heats(): HeatAssignment[] {
    const allHeats = getHeatList();
    return allHeats.filter((heat) => {
        const isRound1 = heat.round === "Race 1-1";
        const hasPilots = heat.pilots.some((pilot) => pilot && pilot.trim() !== "");
        return isRound1 && hasPilots;
    });
}

function getHeatList(): HeatAssignment[] {
    try {
        const heatListSheet = App.getHeatListSheet();
        const numChannels = getNumChannelsFromHeader(heatListSheet);
        const range = heatListSheet.getRange("A2:J");
        const values = range.getValues();
        let previousRace = "";

        return values
            .filter(([_, heat]) => heat && !Number.isNaN(heat))
            .map((row) => {
                const race = row[0] ? row[0].toString() : previousRace;
                const heat = row[1].toString();
                const pilots = row.slice(6, 6 + numChannels).map((pilot) => pilot.toString());
                if (row[0]) previousRace = race;
                return { round: race, heat, pilots };
            });
    } catch (error) {
        console.error("Error fetching heat list: ", error);
        return [];
    }
}

function getNumChannelsFromHeader(sheet: GoogleAppsScript.Spreadsheet.Sheet): number {
    const header = sheet.getRange(1, SheetService.COLUMNS.HEAT_LIST.PILOTS_START, 1, 4).getValues()[0];
    const nonEmpty = header.filter((value) => value !== "").length;
    return nonEmpty > 0 ? nonEmpty : 4;
}

function setHeatStartTime(heatNumber: number, timestamp: number) {
    const row = findRowIndexByHeatNumber(heatNumber);
    if (row === -1) {
        console.log(`setHeatStartTime: row not found for heat ${heatNumber}`);
        return;
    }

    const heatListSheet = App.getHeatListSheet();
    heatListSheet.getRange(row, SheetService.COLUMNS.HEAT_LIST.START_TIME).setValue(new Date(timestamp));
    heatListSheet.getRange(row, SheetService.COLUMNS.HEAT_LIST.ACTUAL_TIME).setValue(formatTimestampToTimeString(timestamp));
    SpreadsheetApp.flush();
}

function findRowIndexByHeatNumber(heatNumber: number): number {
    const heatListSheet = App.getHeatListSheet();
    const columnBValues = heatListSheet.getRange("B:B").getValues();

    for (let i = 0; i < columnBValues.length; i++) {
        const cellValue = columnBValues[i][0];
        const parsedValue = Number.parseInt(cellValue);
        if (parsedValue === heatNumber) {
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

function findOrAddRow(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    heatNumber: number,
    pilotName: string,
): [number, "found" | "added"] {
    const cols = SheetService.COLUMNS.RACE1_RESULTS;
    const values = sheet.getRange("B:D").getValues();

    // Search for existing row
    for (let i = 0; i < values.length; i++) {
        const row = values[i];
        if (Number.parseInt(row[0]) === heatNumber && row[2] === pilotName) {
            return [i + 1, "found"]; // Sheet rows are 1-indexed
        }
    }

    // Find empty row
    for (let i = 0; i < values.length; i++) {
        const [rowId] = values[i];
        if (rowId === "") {
            return [i + 1, "added"]; // Sheet rows are 1-indexed
        }
    }

    // Add new row if not found
    return [values.length + 1, "added"];
}

function addOrUpdateResult(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    roundNumber: number,
    heatNumber: number,
    startTimestamp: number,
    records: RaceRecord[],
) {
    console.log("addOrUpdateResult started - Heat:", heatNumber, "Records:", records.length);
    const cols = SheetService.COLUMNS.RACE1_RESULTS;
    console.log("Got columns from SheetService:", cols);
    const sorted = records.sort((a, b) => a.position - b.position);
    const startStr = new Date(startTimestamp).toLocaleString(RACE_CONSTANTS.TIME_FORMAT.LOCALE);
    console.log("Sheet info - MaxRows:", sheet.getMaxRows(), "LastRow:", sheet.getLastRow());
    
    for (let i = 0; i < sorted.length; i++) {
        const record = sorted[i];
        const { pilot, position, laps, time } = record;
        console.log(`Processing pilot: ${pilot}, position: ${position}, laps: ${laps.length}`);
        const [row, foundOrAdded] = findOrAddRow(sheet, heatNumber, pilot);
        console.log(`Row ${row} - ${foundOrAdded}`);
        
        // Check if this is the first pilot of a new heat (not the first heat overall)
        if (i === 0 && row > 2) {
            // Get the heat number from the previous row
            const prevHeat = sheet.getRange(row - 1, cols.HEAT).getValue();
            if (prevHeat && prevHeat !== heatNumber) {
                // Add top border to this row
                sheet.getRange(row, 1, 1, sheet.getMaxColumns())
                    .setBorder(true, null, null, null, null, null, "#c6c6c6", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
            }
        }
        
        const lapCount = laps.length > 0 ? laps.length - 1 : 0; // Handle 0 laps case
        const value = [roundNumber, heatNumber, startStr, pilot, position + 1, lapCount, time];
        sheet.getRange(row, cols.ROUND, 1, value.length).setValues([value]);
        
        // Only write lap times if there are any
        if (laps.length > 0) {
            sheet.getRange(row, cols.LAP_TIMES_START, 1, laps.length).setValues([laps]);
        }
    }
    
    // Set start time column format (only if there are rows)
    const maxRows = sheet.getMaxRows();
    if (maxRows > 1) {
        sheet.getRange(2, cols.START_TIME, maxRows - 1, 1)
            .setNumberFormat(RACE_CONSTANTS.TIME_FORMAT.DATE_FORMAT);
    }
    
    SpreadsheetApp.flush();
}

function calcRace1Result() {
    const lock = LockService.getDocumentLock();
    lock.waitLock(RACE_CONSTANTS.LOCK_TIMEOUT);

    const race1ResultSheet = App.getRace1ResultSheet();
    const race1TotalSheet = App.getSheets().getRace1TotalSheet();

    const race1Result: { [key: string]: RoundRecord[] } = {};
    const addRoundResult = (round: number, records: RoundRecord[]) => {
        for (const record of records) {
            if (!Object.hasOwn(race1Result, record.pilot)) {
                race1Result[record.pilot] = [];
            }
            race1Result[record.pilot][round - 1] = record;
        }
    };

    let currentRound = 1;
    let roundData: { [key: string]: RoundRecord } = {};
    let prevRoundData: RoundRecord[];
    
    for (const row of race1ResultSheet
        .getRange(2, 1, race1ResultSheet.getMaxRows(), race1ResultSheet.getMaxColumns())
        .getValues()) {
        if (row[0] === "") {
            break;
        }
        const record = new RoundRecord(row);
        if (record.round !== currentRound) {
            prevRoundData = calcRoundRank(currentRound, roundData, prevRoundData);
            addRoundResult(currentRound, prevRoundData);
            setRace1NextRoundHeatsByLaps(currentRound + 1, prevRoundData);
            currentRound = record.round;
            roundData = {};
        }
        roundData[record.pilot] = record;
    }
    prevRoundData = calcRoundRank(currentRound, roundData, prevRoundData);
    addRoundResult(currentRound, prevRoundData);
    if (currentRound < getNumRoundForRace1()) {
        setRace1NextRoundHeatsByLaps(currentRound + 1, prevRoundData);
    }

    const sortedQualiResult = Object.keys(race1Result)
        .map((pilot) => {
            const total = addPilotResultsForRace1(pilot, race1Result[pilot]);
            return { pilot, heatCount: race1Result[pilot].length, ...total };
        })
        .sort((a, b) => {
            if (a.totalLaps === b.totalLaps) {
                return a.totalTime - b.totalTime;
            }
            return b.totalLaps - a.totalLaps;
        });

    race1TotalSheet.getRange("A2:E").clearContent();
    sortedQualiResult.forEach((result, index) => {
        const row = index + 2;
        race1TotalSheet
            .getRange(`A${row}:E${row}`)
            .setValues([[index + 1, result.pilot, result.heatCount, result.totalLaps, result.totalTime]]);
    });

    SpreadsheetApp.flush();
    lock.releaseLock();
}

function calcRoundRank(
    roundIndex: number,
    roundRecords: { [key: string]: RoundRecord },
    prevRoundRecords: RoundRecord[],
) {
    const race1RoundSheet = App.getSheets().getRace1RoundSheet();
    
    const sortedByLaps = Object.values(roundRecords).sort((a, b) => {
        if (a.resultLaps === b.resultLaps) {
            return a.time - b.time;
        }
        return b.resultLaps - a.resultLaps;
    });
    const sortedByFastest = Object.values(roundRecords).sort((a, b) => a.fastestLapTime - b.fastestLapTime);
    
    if (roundIndex === 1) {
        race1RoundSheet
            .getRange(3, 1, 18, 5)
            .clearContent()
            .setFontColor(null)
            .setBackground(null)
            .setBorder(null, null, null, null, false, false);
        for (let i = 0; i < sortedByLaps.length; i++) {
            const record = sortedByLaps[i];
            record.isValid = true;
            race1RoundSheet.getRange(3 + i, 1, 1, 4).setValues([[i + 1, record.pilot, record.resultLaps, record.time]]);
        }
        race1RoundSheet
            .getRange(22, 1, 18, 4)
            .clearContent();
        race1RoundSheet
            .getRange(22, 1, sortedByFastest.length, 4)
            .setValues(
                sortedByFastest.map((record, index) => [
                    index + 1,
                    record.pilot,
                    "",
                    record.fastestLapTime === Number.POSITIVE_INFINITY ? "" : record.fastestLapTime,
                ]),
            );
    } else {
        const column = 6 + (roundIndex - 2) * 5;
        race1RoundSheet
            .getRange(3, column, 18, 5)
            .clearContent()
            .setFontColor(null)
            .setBackground(null)
            .setBorder(null, null, null, null, false, false);
        for (let i = 0; i < sortedByLaps.length; i++) {
            const record = sortedByLaps[i];
            race1RoundSheet.getRange(3 + i, column, 1, 4).setValues([[i + 1, record.pilot, record.resultLaps, record.time]]);
            record.isValid = true;
        }
        race1RoundSheet
            .getRange(22, column, 18, 4)
            .clearContent();
        race1RoundSheet
            .getRange(22, column, sortedByFastest.length, 4)
            .setValues(sortedByFastest.map((record, index) => [index + 1, record.pilot, "", record.fastestLapTime]));
    }
    return sortedByLaps;
}

function addPilotResultsForRace1(pilot: string, records: RoundRecord[]) {
    let totalLaps = 0;
    let totalTime = 0;
    for (let i = 0; i < records.length; i++) {
        const record = records[i];
        if (record) {
            if (record.isValid) {
                totalLaps += record.resultLaps;
            } else {
                totalLaps += Math.floor(record.resultLaps / 2);
            }
            totalTime += record.time;
        }
    }
    return { totalLaps, totalTime };
}

function setRace1NextRoundHeatsByFastest(nextRound: number, prevRoundResults: RoundRecord[]) {
    const pilots = prevRoundResults
        .slice()
        .sort((a, b) => a.fastestLapTime - b.fastestLapTime)
        .map((record) => record.pilot);
    setRace1Heats(nextRound, pilots);
}

function setRace1NextRoundHeatsByLaps(nextRound: number, prevRoundResults: RoundRecord[]) {
    const pilots = prevRoundResults.slice().map((record) => record.pilot);
    setRace1Heats(nextRound, pilots);
}

function setRace1Heats(round: number, pilots: string[]) {
    const heatListSheet = App.getHeatListSheet();
    const heats = HeatGenerator.generate(pilots, getNumChannels());
    const numRows = getHeatsPerRound(1) + 1;
    heatListSheet.getRange(
        2 + (round - 1) * numRows, 
        SheetService.COLUMNS.HEAT_LIST.PILOTS_START, 
        heats.length, 
        heats[0].length
    ).setValues(heats);
}

function clearRace1RawResult() {
    const race1ResultSheet = App.getRace1ResultSheet();
    const cols = SheetService.COLUMNS.RACE1_RESULTS;
    
    race1ResultSheet.getRange("A2:AK").clearContent();
    
    // Clear all borders (especially horizontal borders)
    race1ResultSheet.getRange("A2:AK").setBorder(false, false, false, false, false, false);
    
    race1ResultSheet.getRange("H2:H").setValue(false);
    race1ResultSheet.getRange("I2:I").setValue(SHEET_FORMULAS.RESULT_LAPS);
}

function clearRace1RoundResult() {
    const race1RoundSheet = App.getSheets().getRace1RoundSheet();
    
    race1RoundSheet
        .getRange(3, 1, 18, race1RoundSheet.getMaxColumns())
        .clearContent()
        .setFontColor(null)
        .setBackground(null)
        .setBorder(null, null, null, null, null, false);
    race1RoundSheet
        .getRange(22, 1, 18, race1RoundSheet.getMaxColumns())
        .clearContent()
        .setFontColor(null)
        .setBackground(null)
        .setBorder(null, null, null, null, null, false);
}

function clearRace1TotalResult() {
    const race1TotalSheet = App.getSheets().getRace1TotalSheet();
    race1TotalSheet.getRange("A2:E").clearContent();
}

function clearRace1AllResults() {
    clearRace1RawResult();
    clearRace1RoundResult();
    clearRace1TotalResult();
}

// Removed setBordersForHeats function - borders are now added inline during data insertion

function createDummyRaceData(
    pilot: string,
    position: number,
): {
    pilot: string;
    position: number;
    time: number;
    laps: number[];
} {
    const RACE_TIME = RACE_CONSTANTS.RACE_TIME;
    const GRACE_PERIOD = RACE_CONSTANTS.GRACE_PERIOD;

    const baseHeadshotTime = 1.5 + Math.random();
    const baseLapTime = 15 + Math.random() * 5; // typical lap time around 15-17 seconds

    const laps: number[] = [baseHeadshotTime];
    let totalTime = baseHeadshotTime;

    // Simulate crash possibility
    const willCrash = Math.random() < RACE_CONSTANTS.CRASH_PROBABILITY;
    const crashTime = willCrash ? RACE_TIME * (0.3 + Math.random() * 0.7) : RACE_TIME + GRACE_PERIOD;

    // Add laps until we exceed race time
    while (totalTime < crashTime) {
        const nextLapTime = baseLapTime + (Math.random() - 0.5) * 2; // ±1 second variation
        if (totalTime + nextLapTime > crashTime) {
            break;
        }
        laps.push(nextLapTime);
        totalTime += nextLapTime;
    }

    return {
        pilot,
        position,
        time: totalTime,
        laps,
    };
}

function sendDummyResult() {
    const heatListSheet = App.getHeatListSheet();
    const heat = getCurrentHeat();
    const cols = SheetService.COLUMNS.HEAT_LIST;

    const values = heatListSheet.getRange("A:B").getValues();
    let race = "";
    let rowIndex = 0;
    for (let i = 0; i < values.length; i++) {
        const row = values[i];
        if (row[0]) {
            race = row[0];
        }
        if (Number.parseInt(row[1]) === heat) {
            rowIndex = i + 1;
            break;
        }
    }

    const pilots = heatListSheet.getRange(rowIndex, cols.PILOTS_START, 1, 3).getValues()[0];

    const unsortedResults = pilots
        .map((pilot) => createDummyRaceData(pilot, 0))
        .filter((result) => result.pilot !== "");

    const results = unsortedResults
        .sort((a, b) => {
            const aLaps = a.laps.length;
            const bLaps = b.laps.length;
            // First compare lap count (descending)
            if (aLaps !== bLaps) {
                return bLaps - aLaps;
            }
            // If lap counts are equal, compare total time (ascending)
            return a.time - b.time;
        })
        .map((result, index) => ({
            ...result,
            position: index,
        }));

    const data = {
        action: "save",
        mode: "udgp-race",
        class: race,
        heat: `Heat ${heat}`,
        start: new Date().getTime(),
        results,
    };

    console.log(JSON.stringify(data, null, 2));

    const url =
        "https://script.google.com/macros/s/AKfycbwbjcRAt-5Iwb5vSBuEIiq_Z8gLmzRvHtdKYAF953QYUoeEUmxMgqi0xuvm_PFa8Tyk/exec";

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: "post",
        payload: JSON.stringify(data),
    };
    const start = new Date().getTime();
    const response = UrlFetchApp.fetch(url, options);
    const end = new Date().getTime();
    Logger.log(`start: ${start}, end: ${end}, diff: ${end - start}`);
    const content = response.getContentText();
    Logger.log(content);
}
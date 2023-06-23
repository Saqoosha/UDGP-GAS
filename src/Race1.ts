const NUM_ROUND_RACE1 = 6;

function addRace1Result(pilot: string, time: number, laps: number[]) {
    var lock = LockService.getDocumentLock();
    lock.waitLock(20000);

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 1 Results");
    const row = sheet.getRange("A:A").getValues().findLastIndex(row => row[0] != "") + 2;
    const heat = getCurrentRound();
    const value = [heat, new Date().toLocaleString('ja-JP'), pilot, laps.length - 1, time];
    sheet.getRange(row, 1, 1, value.length).setValues([value]);
    sheet.getRange(row, 9, 1, laps.length).setValues([laps]);

    SpreadsheetApp.flush();
    lock.releaseLock();
}

function calcRace1Result() {
    const lock = LockService.getDocumentLock();
    lock.waitLock(20000);

    const race1Result: { [key: string]: RoundRecord[]; } = {};
    const addRoundResult = (round: number, records: RoundRecord[]) => {
        for (let record of records) {
            if (!race1Result.hasOwnProperty(record.pilot)) {
                race1Result[record.pilot] = [];
            }
            race1Result[record.pilot][round - 1] = record;
        }
    };

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 1 Results");
    let currentRound = 1;
    let roundData: { [key: string]: RoundRecord; } = {};
    let prevRoundData: RoundRecord[];
    for (let row of sheet.getRange(2, 1, sheet.getMaxRows(), sheet.getMaxColumns()).getValues()) {
        if (row[0] == "") { break; }
        const record = new RoundRecord(row);
        if (record.round != currentRound) {
            prevRoundData = calcRoundRank(currentRound, roundData, prevRoundData);
            addRoundResult(currentRound, prevRoundData);
            setRace1NextRoundHeats(currentRound + 1, prevRoundData);
            currentRound = record.round;
            roundData = {};
        }
        roundData[record.pilot] = record;
    }
    prevRoundData = calcRoundRank(currentRound, roundData, prevRoundData);
    addRoundResult(currentRound, prevRoundData);
    if (currentRound < NUM_ROUND_RACE1) {
        setRace1NextRoundHeats(currentRound + 1, prevRoundData);
    }

    const sheet2 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 1 Results（人別）");
    const style = SpreadsheetApp.newTextStyle().setBold(false).build();
    sheet2.getRange("A2:H200").clearContent().setTextStyle(style).setFontColor("black").setBackground(null);
    sheet2.getRange("B:B").setNumberFormat("yyyy/mm/dd hh:mm:ss");

    const sortedQualiResult = Object.keys(race1Result).map((pilot) => {
        const total = addPilotResultsForRace1(pilot, race1Result[pilot]);
        return { pilot, heatCount: race1Result[pilot].length, ...total };
    }).sort((a, b) => {
        if (a.totalLaps == b.totalLaps) {
            return a.totalTime - b.totalTime;
        }
        return b.totalLaps - a.totalLaps;
    });

    const sheet3 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 1 Results（総合）");
    sheet3.getRange("A2:F50").clearContent();
    sortedQualiResult.forEach((result, index) => {
        const row = index + 2;
        sheet3.getRange(`A${row}:E${row}`).setValues([
            [index + 1, result.pilot, result.heatCount, result.totalLaps, result.totalTime],
        ]);
    });

    SpreadsheetApp.flush();
    lock.releaseLock();
}

function calcRoundRank(roundIndex: number, roundRecords: { [key: string]: RoundRecord; }, prevRoundRecords: RoundRecord[]) {
    const sortedByLaps = Object.values(roundRecords).sort((a, b) => {
        if (a.resultLaps == b.resultLaps) {
            return a.time - b.time;
        }
        return b.resultLaps - a.resultLaps;
    });
    const sortedByFastest = Object.values(roundRecords).sort((a, b) => a.fastestLapTime - b.fastestLapTime);
    const current5thLap = sortedByLaps.length > 4 ? sortedByLaps[4].resultLaps : 0;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 1 Results（ラウンド別）");
    if (roundIndex == 1) {
        sheet.getRange(3, 1, 18, 5).clearContent().setFontColor(null).setBackground(null).setBorder(null, null, null, null, false, false);
        for (let i = 0; i < sortedByLaps.length; i++) {
            const record = sortedByLaps[i];
            record.isValid = true;
            sheet.getRange(3 + i, 1, 1, 4).setValues([[i + 1, record.pilot, record.resultLaps, record.time]]);
            sheet.getRange(3 + i, 3, 1, 2).setBackground("#b8f9b5");
        }
        const t = findLastIndex(sortedByLaps, data => data.resultLaps == current5thLap);
        if (t >= 0) {
            sheet.getRange(3 + t, 1, 1, 5).setBorder(null, null, true, null, null, null, "#93c47c", SpreadsheetApp.BorderStyle.SOLID_THICK);
        }
        sheet.getRange(22, 1, 18, 4).clearContent();
        sheet.getRange(22, 1, sortedByFastest.length, 4).setValues(sortedByFastest.map((record, index) => [index + 1, record.pilot, "", record.fastestLapTime === Infinity ? "" : record.fastestLapTime]));
    } else {
        const column = 6 + (roundIndex - 2) * 6;
        sheet.getRange(3, column, 18, 6).clearContent().setFontColor(null).setBackground(null).setBorder(null, null, null, null, false, false);
        const prev5thLap = prevRoundRecords.length > 4 ? prevRoundRecords[4].resultLaps : 0;
        for (let i = 0; i < sortedByLaps.length; i++) {
            const record = sortedByLaps[i];
            const prevRank = prevRoundRecords.findIndex(row => row.pilot == record.pilot);
            const prevLap = prevRank >= 0 ? prevRoundRecords[prevRank].resultLaps : -1;
            sheet.getRange(3 + i, column, 1, 5).setValues([[i + 1, record.pilot, prevLap < 0 ? '-' : prevLap, record.resultLaps, record.time]]);
            if (prevLap >= prev5thLap) {
                record.isValid = record.resultLaps >= prevLap;
                sheet.getRange(3 + i, column + 2).setBackground("#fff862");
            } else {
                record.isValid = true;
                sheet.getRange(3 + i, column + 2).setFontColor("#BBBBBB");
            }
            sheet.getRange(3 + i, column + 3, 1, 2).setBackground(record.isValid ? "#b8f9b5" : "#ff92b0");
        }
        const t = findLastIndex(sortedByLaps, data => data.resultLaps == current5thLap);
        if (t >= 0) {
            sheet.getRange(3 + t, column, 1, 6).setBorder(null, null, true, null, null, null, "#93c47c", SpreadsheetApp.BorderStyle.SOLID_THICK);
        }
        sheet.getRange(22, column, 18, 5).clearContent();
        sheet.getRange(22, column, sortedByFastest.length, 5).setValues(sortedByFastest.map((record, index) => [index + 1, record.pilot, "", "", record.fastestLapTime]));
    }
    return sortedByLaps;
}

function addPilotResultsForRace1(pilot: string, records: RoundRecord[]) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 1 Results（人別）");
    let row = sheet.getRange("B:B").getValues().findIndex(row => row[0] == "") + 1;

    let totalLaps = 0;
    let totalTime = 0;
    for (let i = 0; i < records.length; i++) {
        const record = records[i];
        if (record) {
            const penalty = [];
            if (record.penaltyNoReturn) penalty.push("未帰還");
            if (record.penaltyLowVoltage) penalty.push("低電圧");
            sheet.getRange(row, 1, 1, 8).setValues([[
                record.round,
                record.datetime || "-",
                record.pilot,
                record.flightLaps,
                record.time,
                penalty.join(", "),
                record.resultLaps,
                record.isValid ? "✅" : "❌"
            ]])
                .setFontColor(record.isValid ? "black" : "#b7b7b7")
                .setBackground(record.isValid ? "white" : "#efefef");
            if (record.isValid) {
                totalLaps += record.resultLaps;
            } else {
                totalLaps += Math.floor(record.resultLaps / 2);
            }
            totalTime += record.time;
        } else {
            sheet.getRange(row, 1, 1, 8).setValues([[i + 1, "記録なし", '', '', '', '', '', '']])
                .setFontColor("#b7b7b7")
                .setBackground("#efefef");
        }
        row++;
    }
    const style = SpreadsheetApp.newTextStyle().setBold(true).build();
    sheet.getRange(`A${row}:H${row}`).setBackground("#dcfbff").setTextStyle(style);
    sheet.getRange(`B${row}:H${row + 1}`).setValues([
        ['Total', pilot, '', totalTime, '', totalLaps, ''],
        ['-', '', '', '', '', '', ''],
    ]);
    return { totalLaps, totalTime };
}

function setRace1NextRoundHeats(nextRound: number, prevRoundResults: RoundRecord[]) {
    const pilots = prevRoundResults.sort((a, b) => a.fastestLapTime - b.fastestLapTime).map(record => record.pilot);
    const heats = pilots.reduce((acc, pilot, i) => {
        const index = Math.floor(i / 3);
        if (!acc[index]) {
            acc[index] = [];
        }
        acc[index].push(pilot);
        return acc;
    }, []);
    const lastHeat = heats[heats.length - 1];
    switch (lastHeat.length) {
        case 1:
            lastHeat.unshift(heats[heats.length - 2].pop() as string);
            lastHeat.push("");
            heats[heats.length - 2].push("");
            break;
        case 2:
            lastHeat.push("");
            break;
    }
    const numRows = getHeatsPerRound(1) + 1;
    heatListSheet.getRange(2 + (nextRound - 1) * numRows, 4, heats.length, 3).setValues(heats);
}

function clearRace1RoundResult() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 1 Results（ラウンド別）");
    sheet.getRange("A3:AC20").clearContent().setFontColor(null).setBackground(null).setBorder(null, null, null, null, null, false);
    sheet.getRange("A22:AC39").clearContent().setFontColor(null).setBackground(null).setBorder(null, null, null, null, null, false);
}

function clearRace1PilotResult() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 1 Results（人別）");
    const style = SpreadsheetApp.newTextStyle().setBold(false).build();
    sheet.getRange("A2:H200").clearContent().setTextStyle(style).setFontColor("black").setBackground(null);
    sheet.getRange("B:B").setNumberFormat("yyyy/mm/dd hh:mm:ss");
}

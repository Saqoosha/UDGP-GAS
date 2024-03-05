function findOrAddRow(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    id: string,
    pilotName: string,
): [number, "found" | "added"] {
    // 全ての値を取得
    const values = sheet.getRange("A:D").getValues();

    // IDとPilotNameで一致するrowを検索
    // for (let i = 0; i < values.length; i++) {
    //     const [rowId, , , rowPilotName] = values[i];
    //     if (rowId === id && rowPilotName === pilotName) {
    //         return [i + 1, "found"]; // rowインデックスは1から始まるため
    //     }
    // }

    // IDが未設定のrowを探す
    for (let i = 0; i < values.length; i++) {
        const [rowId] = values[i];
        if (rowId === "") {
            return [i + 1, "added"]; // rowインデックスは1から始まるため
        }
    }

    // 見つからない場合は新しいrowを追加
    return [values.length + 1, "added"];
}

function addOrUpdateRace1Result(
    id: string,
    start: number,
    pilot: string,
    position: number,
    time: number,
    laps: number[],
) {
    const lock = LockService.getDocumentLock();
    lock.waitLock(20000);

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 1 Results");
    const [row, foundOrAdded] = findOrAddRow(sheet, id, pilot);
    const round = getCurrentRound();
    const heat = getCurrentHeat();
    const startStr = new Date(start).toLocaleString("ja-JP");
    const value = [id, round, heat, startStr, pilot, position + 1, laps.length - 1, time];
    sheet.getRange(row, 1, 1, value.length).setValues([value]);
    sheet.getRange(row, 11, 1, laps.length).setValues([
        laps.map((lap, index) => {
            if (lap === 0) {
                return "-";
            }
            if (index > 0 && laps[index - 1] === 0) {
                // return `(${lap.toFixed(2)})`;
                return "-";
            }
            return lap;
        }),
    ]);
    sheet.getRange(row, 4).setNumberFormat("H:mm:ss");

    SpreadsheetApp.flush();
    lock.releaseLock();

    return foundOrAdded;
}

function calcRace1Result() {
    const lock = LockService.getDocumentLock();
    lock.waitLock(20000);

    const race1Result: { [key: string]: RoundRecord[] } = {};
    const addRoundResult = (round: number, records: RoundRecord[]) => {
        for (const record of records) {
            if (!Object.hasOwn(race1Result, record.pilot)) {
                race1Result[record.pilot] = [];
            }
            race1Result[record.pilot][round - 1] = record;
        }
    };

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 1 Results");
    let currentRound = 1;
    let roundData: { [key: string]: RoundRecord } = {};
    let prevRoundData: RoundRecord[];
    for (const row of sheet.getRange(2, 2, sheet.getMaxRows(), sheet.getMaxColumns()).getValues()) {
        if (row[0] === "") {
            break;
        }
        const record = new RoundRecord(row);
        if (record.round !== currentRound) {
            prevRoundData = calcRoundRank(currentRound, roundData, prevRoundData);
            addRoundResult(currentRound, prevRoundData);
            // setRace1NextRoundHeatsByFastest(currentRound + 1, prevRoundData);
            setRace1NextRoundHeatsByLaps(currentRound + 1, prevRoundData);
            currentRound = record.round;
            roundData = {};
        }
        roundData[record.pilot] = record;
    }
    prevRoundData = calcRoundRank(currentRound, roundData, prevRoundData);
    addRoundResult(currentRound, prevRoundData);
    if (currentRound < getNumRoundForRace1()) {
        // setRace1NextRoundHeatsByFastest(currentRound + 1, prevRoundData);
        setRace1NextRoundHeatsByLaps(currentRound + 1, prevRoundData);
    }

    const sheet2 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 1 Results（人別）");
    const style = SpreadsheetApp.newTextStyle().setBold(false).build();
    sheet2.getRange("A2:H").clearContent().setTextStyle(style).setFontColor("black").setBackground(null);
    sheet2.getRange("B:B").setNumberFormat("yyyy/mm/dd hh:mm:ss");

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

    const sheet3 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 1 Results（総合）");
    sheet3.getRange("A2:E").clearContent();
    sortedQualiResult.forEach((result, index) => {
        const row = index + 2;
        sheet3
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
    const sortedByLaps = Object.values(roundRecords).sort((a, b) => {
        if (a.resultLaps === b.resultLaps) {
            return a.time - b.time;
        }
        return b.resultLaps - a.resultLaps;
    });
    const sortedByFastest = Object.values(roundRecords).sort((a, b) => a.fastestLapTime - b.fastestLapTime);
    const current5thLap = sortedByLaps.length > 4 ? sortedByLaps[4].resultLaps : 0;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 1 Results（ラウンド別）");
    if (roundIndex === 1) {
        sheet
            .getRange(3, 1, 18, 5)
            .clearContent()
            .setFontColor(null)
            .setBackground(null)
            .setBorder(null, null, null, null, false, false);
        for (let i = 0; i < sortedByLaps.length; i++) {
            const record = sortedByLaps[i];
            record.isValid = true;
            sheet.getRange(3 + i, 1, 1, 4).setValues([[i + 1, record.pilot, record.resultLaps, record.time]]);
            sheet.getRange(3 + i, 3, 1, 2).setBackground("#b8f9b5");
        }
        const t = findLastIndex(sortedByLaps, (data) => data.resultLaps === current5thLap);
        if (t >= 0) {
            sheet
                .getRange(3 + t, 1, 1, 5)
                .setBorder(null, null, true, null, null, null, "#93c47c", SpreadsheetApp.BorderStyle.SOLID_THICK);
        }
        sheet.getRange(22, 1, 18, 4).clearContent();
        sheet
            .getRange(22, 1, sortedByFastest.length, 4)
            .setValues(
                sortedByFastest.map((record, index) => [
                    index + 1,
                    record.pilot,
                    "",
                    record.fastestLapTime === Infinity ? "" : record.fastestLapTime,
                ]),
            );
    } else {
        const column = 6 + (roundIndex - 2) * 6;
        sheet
            .getRange(3, column, 18, 6)
            .clearContent()
            .setFontColor(null)
            .setBackground(null)
            .setBorder(null, null, null, null, false, false);
        const prev5thLap = prevRoundRecords.length > 4 ? prevRoundRecords[4].resultLaps : 0;
        for (let i = 0; i < sortedByLaps.length; i++) {
            const record = sortedByLaps[i];
            const prevRank = prevRoundRecords.findIndex((row) => row.pilot === record.pilot);
            const prevLap = prevRank >= 0 ? prevRoundRecords[prevRank].resultLaps : -1;
            sheet
                .getRange(3 + i, column, 1, 5)
                .setValues([[i + 1, record.pilot, prevLap < 0 ? "-" : prevLap, record.resultLaps, record.time]]);
            if (prevLap >= prev5thLap) {
                record.isValid = record.resultLaps >= prevLap;
                sheet.getRange(3 + i, column + 2).setBackground("#fff862");
            } else {
                record.isValid = true;
                sheet.getRange(3 + i, column + 2).setFontColor("#BBBBBB");
            }
            sheet.getRange(3 + i, column + 3, 1, 2).setBackground(record.isValid ? "#b8f9b5" : "#ff92b0");
        }
        const t = findLastIndex(sortedByLaps, (data) => data.resultLaps === current5thLap);
        if (t >= 0) {
            sheet
                .getRange(3 + t, column, 1, 6)
                .setBorder(null, null, true, null, null, null, "#93c47c", SpreadsheetApp.BorderStyle.SOLID_THICK);
        }
        sheet.getRange(22, column, 18, 5).clearContent();
        sheet
            .getRange(22, column, sortedByFastest.length, 5)
            .setValues(
                sortedByFastest.map((record, index) => [index + 1, record.pilot, "", "", record.fastestLapTime]),
            );
    }
    return sortedByLaps;
}

function addPilotResultsForRace1(pilot: string, records: RoundRecord[]) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 1 Results（人別）");
    let row =
        sheet
            .getRange("B:B")
            .getValues()
            .findIndex((row) => row[0] === "") + 1;

    let totalLaps = 0;
    let totalTime = 0;
    for (let i = 0; i < records.length; i++) {
        const record = records[i];
        if (record) {
            const penalty = [];
            if (record.penalty) penalty.push("❌");
            sheet
                .getRange(row, 1, 1, 8)
                .setValues([
                    [
                        record.round,
                        record.datetime || "-",
                        record.pilot,
                        record.flightLaps,
                        record.time,
                        penalty.join(", "),
                        record.resultLaps,
                        record.isValid ? "✅" : "❌",
                    ],
                ])
                .setFontColor(record.isValid ? "black" : "#b7b7b7")
                .setBackground(record.isValid ? "white" : "#efefef");
            if (record.isValid) {
                totalLaps += record.resultLaps;
            } else {
                totalLaps += Math.floor(record.resultLaps / 2);
            }
            totalTime += record.time;
        } else {
            sheet
                .getRange(row, 1, 1, 8)
                .setValues([[i + 1, "記録なし", "", "", "", "", "", ""]])
                .setFontColor("#b7b7b7")
                .setBackground("#efefef");
        }
        row++;
    }
    const style = SpreadsheetApp.newTextStyle().setBold(true).build();
    sheet.getRange(`A${row}:H${row}`).setBackground("#dcfbff").setTextStyle(style);
    sheet.getRange(`B${row}:H${row + 1}`).setValues([
        ["Total", pilot, "", totalTime, "", totalLaps, ""],
        ["-", "", "", "", "", "", ""],
    ]);
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
    const heats = generateHeats(pilots, getNumChannels());
    const numRows = getHeatsPerRound(1) + 1;
    heatListSheet.getRange(2 + (round - 1) * numRows, 7, heats.length, heats[0].length).setValues(heats);
}

function clearRace1RawResult() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 1 Results");
    sheet.getRange("A2:H").clearContent();
    sheet.getRange("I2:I").setValue(false);
    sheet.getRange("J2:J").setValue("=IF(I2=TRUE, G2-2, G2)");
    sheet.getRange("K2:AK").clearContent();
}

function clearRace1RoundResult() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 1 Results（ラウンド別）");
    sheet
        .getRange(3, 1, 18, sheet.getMaxColumns())
        .clearContent()
        .setFontColor(null)
        .setBackground(null)
        .setBorder(null, null, null, null, null, false);
    sheet
        .getRange(22, 1, 18, sheet.getMaxColumns())
        .clearContent()
        .setFontColor(null)
        .setBackground(null)
        .setBorder(null, null, null, null, null, false);
}

function clearRace1PilotResult() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 1 Results（人別）");
    const style = SpreadsheetApp.newTextStyle().setBold(false).build();
    sheet.getRange("A2:H").clearContent().setTextStyle(style).setFontColor("black").setBackground(null);
    sheet.getRange("B:B").setNumberFormat("yyyy/mm/dd hh:mm:ss");
}

function clearRace1TotalResult() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 1 Results（総合）");
    sheet.getRange("A2:E").clearContent();
}

function clearRace1AllResults() {
    clearRace1RawResult();
    clearRace1PilotResult();
    clearRace1RoundResult();
    clearRace1TotalResult();
}

function sendDummyResult() {
    const date = new Date();
    const generateId = () => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        const milliseconds = String(date.getMilliseconds()).padStart(3, "0");
        return `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
    };

    const heat = getCurrentHeat();
    const row = findRowIndexByHeatNumber(heat);
    const pilots = heatListSheet.getRange(row, 7, 1, 3).getValues()[0];
    console.log({ heat, row, pilots });

    const data = {
        id: generateId(),
        mode: "udgp-race",
        start: date.getTime(),
        results: [
            {
                pilot: pilots[0],
                position: 0,
                time: 62 + Math.random(),
                laps: [1.723, 29.5, 30.977],
            },
            {
                pilot: pilots[1],
                position: 1,
                time: 64 + Math.random(),
                laps: [2.234, 29.543, 31.053],
            },
            {
                pilot: pilots[2],
                position: 3,
                time: 66 + Math.random(),
                laps: [3.433, 29.56, 31.205],
            },
        ],
    };

    const url =
        "https://script.google.com/macros/s/AKfycbxDxX9w3id9vP5mFTglSVQ7REkMlPgZ-Jo4Z_zsgruQJ-bBR3y8E6CaAqEgtxeZphatEA/exec";

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: "post",
        payload: JSON.stringify(data),
    };
    const response = UrlFetchApp.fetch(url, options);
    const content = response.getContentText();
    Logger.log(content);
}

const race2ResultSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 2 Results");

/*
function setRace2Heats() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 1 Results（総合）");
    const pilots = sheet
        .getRange(2, 2, sheet.getMaxRows(), 1)
        .getValues()
        .map((row) => row[0])
        .filter((pilot) => pilot !== "");
    _setRace2Heats(1, pilots);
}

function _setRace2Heats(round: number, pilots: string[]) {
    const numChannels = getNumChannels();
    const heats = pilots.reduce((acc: string[][], pilot: string, i: number) => {
        const index = Math.floor(i / (numChannels - 1));
        if (!acc[index]) {
            acc[index] = [];
        }
        acc[index].push(pilot);
        return acc;
    }, []);
    const lastHeat = heats[heats.length - 1];
    if (lastHeat.length === 1) {
        heats.pop();
        heats[heats.length - 1].push(lastHeat[0]);
    }
    const row = 2 + (getHeatsPerRound(1) + 1) * getNumRoundForRace1() + (getHeatsPerRound(2) + 1) * (round - 1);
    heatListSheet.getRange(row, 4, heats.length, numChannels).setValues(
        heats.reverse().map((row) => {
            while (row.length < numChannels) {
                row.push("");
            }
            return row;
        }),
    );
}
*/

function addRace2Results(id: string, start: number, data: RaceRecord[]) {
    const currentRound = getCurrentRound(); // 1 based
    const currentHeat = getCurrentHeat(); // 1 based

    const lock = LockService.getDocumentLock();
    lock.waitLock(20000);

    const sorted = data.sort((a, b) => a.position - b.position);

    sorted.forEach((row, i) => {
        _addRace2Result(id, currentRound, currentHeat, start, row.pilot, row.position, row.time, row.laps);
    });

    /*
    const resultSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 2 Results（総合）");
    const heatIndexInRound =
        currentHeat - getHeatsPerRound(1) * getNumRoundForRace1() - getHeatsPerRound(2) * (currentRound - 1) - 1; // 0 based

    if (heatIndexInRound < getHeatsPerRound(2) - 1) {
        // current heat is not the last heat of the round
        // set next heat's last pilot from the current heat's 1st pilot
        const nextHeat = currentHeat + 1;
        const row =
            heatListSheet
                .getRange(1, 2, heatListSheet.getMaxRows(), 1)
                .getValues()
                .findIndex((row) => row[0] === nextHeat) + 1;
        heatListSheet.getRange(row, 3 + getNumChannels(), 1, 1).setValue(sorted[0].pilot);

        // set total rank
        const r = 3 + getNumChannels() + (getHeatsPerRound(2) - 2 - heatIndexInRound) * (getNumChannels() - 1);
        const c = 2 + (currentRound - 1) * 5;
        resultSheet
            .getRange(r, c, sorted.length - 1, 3)
            .setValues(sorted.slice(1).map((row) => [row.pilot, row.laps.length, row.time]));
    } else {
        // set total rank
        resultSheet
            .getRange(3, 2 + (currentRound - 1) * 5, sorted.length, 3)
            .setValues(sorted.map((row) => [row.pilot, row.laps.length, row.time]));
        if (currentRound < getNumRoundForRace2()) {
            const totalRanking = resultSheet
                .getRange(3, 2, 15, 1)
                .getValues()
                .map((row) => row[0])
                .filter((pilot) => pilot !== "");
            _setRace2Heats(currentRound + 1, totalRanking);
            incrementRound();
        }
    }
    */

    incrementHeat();

    SpreadsheetApp.flush();
    lock.releaseLock();
}

function _addRace2Result(id: string, round: number, heat: number, start: number, pilot: string, position: number, time: number, laps: number[]) {
    const row = race2ResultSheet
        .getRange("A:A")
        .getValues()
        .findLastIndex((row) => row[0] !== "") + 2;
    const value = [id, round, heat, new Date(start).toLocaleString("ja-JP"), pilot, position + 1, laps.length - 1, time];
    race2ResultSheet.getRange(row, 1, 1, value.length).setValues([value]);
    race2ResultSheet.getRange(row, 11, 1, laps.length).setValues([laps]);
    race2ResultSheet.getRange(row, 4).setNumberFormat("H:mm:ss");
}

/*
function _calcRace2Result() {
    const heat = getCurrentHeat();

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 2 Results");
    const data = sheet
        .getRange(2, 1, sheet.getMaxRows(), sheet.getMaxColumns())
        .getValues()
        .filter((row) => parseInt(row[0]) === heat)
        .map((row) => {
            return {
                pilot: row[2],
                position: 0,
                time: row[4],
                laps: row
                    .slice(6)
                    .map(Number)
                    .filter((x) => !Number.isNaN(x) && x > 0),
            } as RaceRecord;
        })
        .sort((a, b) => {
            const an = a.laps.length;
            const bn = b.laps.length;
            if (an > 0 && bn > 0 && an === bn) {
                return a.time - b.time;
            }
            return bn - an;
        });
    data.forEach((result, index) => {
        result.position = index;
    });
    // console.log({ data });
    addRace2Results(data);
}

function clearRace2RawResult() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 2 Results");
    sheet.getRange("A2:E").clearContent();
    sheet.getRange("F2:F").setValue(false);
    sheet.getRange("G2:G").setValue("=IF(F2=TRUE, D2-2, D2)");
    sheet.getRange("H2:AH").clearContent();
}

function clearRace2TotalResult() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 2 Results（総合）");
    for (let i = 0; i < 3; i++) {
        sheet.getRange(3, 2 + i * 5, sheet.getMaxRows(), 3).clearContent();
    }
}
*/

const NUM_ROUND_RACE2 = 2;

function setRace2Heats() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 1 Results（総合）");
    const pilots = sheet.getRange(2, 2, sheet.getMaxRows(), 1).getValues().map(row => row[0]).filter(pilot => pilot != "");
    _setRace2Heats(1, pilots);
}

function _setRace2Heats(round: number, pilots: string[]) {
    const heats = pilots.reduce((acc: string[][], pilot: string, i: number) => {
        const index = Math.floor(i / 3);
        if (!acc[index]) {
            acc[index] = [];
        }
        acc[index].push(pilot);
        return acc;
    }, []);
    const lastHeat = heats[heats.length - 1];
    if (lastHeat.length == 1) {
        heats.pop();
        heats[heats.length - 1].push(lastHeat[0]);
    }
    const row = 2 + (getHeatsPerRound(1) + 1) * NUM_ROUND_RACE1 + (getHeatsPerRound(2) + 1) * (round - 1);
    heatListSheet.getRange(row, 4, heats.length, 4).setValues(heats.reverse().map(row => {
        while (row.length < 4) { row.push(""); }
        return row;
    }));
}

function addRace2Results(data: RaceRecord[]) {
    const currentRound = getCurrentRound(); // 1 based
    const currentHeat = getCurrentHeat(); // 1 based

    var lock = LockService.getDocumentLock();
    lock.waitLock(20000);

    const sorted = data.sort((a, b) => a.position - b.position);

    sorted.forEach((row, i) => {
        _addRace2Result(row.pilot, row.time, row.laps);
    });

    const resultSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 2 Results（総合）");
    const heatIndexInRound = currentHeat - getHeatsPerRound(1) * NUM_ROUND_RACE1 - getHeatsPerRound(2) * (currentRound - 1) - 1; // 0 based

    if (heatIndexInRound < getHeatsPerRound(2) - 1) { // current heat is not the last heat of the round
        // set next heat's 4th pilot from the current heat's 1st pilot
        const nextHeat = currentHeat + 1;
        const row = heatListSheet.getRange(1, 2, heatListSheet.getMaxRows(), 1).getValues().findIndex(row => row[0] == nextHeat) + 1;
        heatListSheet.getRange(row, 7, 1, 1).setValue(sorted[0].pilot);

        // set total rank
        const r = 2 + getValueForKey("num pilots") - heatIndexInRound * 3;
        const c = 2 + (currentRound - 1) * 5;
        resultSheet.getRange(r, c, sorted.length - 1, 3)
            .setValues(sorted.slice(1).map(row => [row.pilot, row.laps.length, row.time]));
    } else {
        // set total rank
        resultSheet.getRange(3, 2 + (currentRound - 1) * 5, 3, 3).setValues(sorted.map(row => [row.pilot, row.laps.length, row.time]));
        if (currentRound < NUM_ROUND_RACE2) {
            const totalRanking = resultSheet.getRange(3, 2, 15, 1).getValues().map(row => row[0]).filter(pilot => pilot != "");
            _setRace2Heats(currentRound + 1, totalRanking);
            incrementRound();
        }
    }

    incrementHeat();

    SpreadsheetApp.flush();
    lock.releaseLock();
}

function _addRace2Result(pilot: string, time: number, laps: number[]) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 2 Results");
    const row = sheet.getRange("A:A").getValues().findLastIndex(row => row[0] != "") + 2;
    const heat = getCurrentHeat();
    const value = [heat, new Date().toLocaleString('ja-JP'), pilot, laps.length - 1, time];
    sheet.getRange(row, 1, 1, value.length).setValues([value]);
    sheet.getRange(row, 9, 1, laps.length).setValues([laps]);
}

function _calcRace2Result() {
    const heat = getCurrentHeat();

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 2 Results");
    const data = sheet.getRange(2, 1, sheet.getMaxRows(), sheet.getMaxColumns()).getValues()
        .filter(row => parseInt(row[0]) === heat)
        .map(row => {
            return {
                pilot: row[2],
                position: 0,
                time: row[4],
                laps: row.slice(7).map(Number).filter(x => !isNaN(x) && x > 0),
            } as RaceRecord;
        })
        .sort((a, b) => {
            const an = a.laps.length;
            const bn = b.laps.length;
            if (an > 0 && bn > 0 && an == bn) {
                return a.time - b.time;
            }
            return bn - an;
        });
    data.forEach((result, index) => { result.position = index; });
    // console.log({ data });
    addRace2Results(data);
}

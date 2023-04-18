function setRace2Heats() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Race 1 Results（総合）");
    const pilots = sheet.getRange(2, 2, sheet.getMaxRows(), 1).getValues().map(row => row[0]).filter(pilot => pilot != "");
    _setRace2Heats(1, pilots);
}

function _setRace2Heats(round: number, pilots: string[]) {
    const heats = pilots.reduce((acc: string[][], pilot: string, i: number) => {
        const index = Math.floor(i / 2);
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
    heatListSheet.getRange(32 + (round - 1) * 8, 4, heats.length, 3).setValues(heats.reverse().map(row => {
        while (row.length < 3) { row.push(""); }
        return row;
    }));
}

function addRace2Results(data: RaceRecord[]) {
    const sorted = data.sort((a, b) => a.position - b.position);
    const nextHeat = getCurrentHeat() + 1;// incrementHeat();
    const row = heatListSheet.getRange(1, 2, heatListSheet.getMaxRows(), 1).getValues().findIndex(row => row[0] == nextHeat) + 1;
    console.log({ nextHeat, row });
    heatListSheet.getRange(row, 6, 1, 1).setValue(sorted[0].pilot);
    incrementHeat();
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
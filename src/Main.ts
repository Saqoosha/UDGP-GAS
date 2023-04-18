const pilotsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("参加パイロット");
const heatListSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("組み合わせ / タイムスケジュール");

function setRound1Heats() {
    const range = pilotsSheet.getRange("A2:A");
    const pilots = range.getValues().filter((v) => v[0] !== "").map((v) => v[0] as string);

    const CHANNEL_NAMES = ["E1 5705", "F1 5740", "F4 5800"];
    const channels = pilots.map((pilot, i) => CHANNEL_NAMES[i % 3]);
    pilotsSheet.getRange(2, 2, channels.length, 1).setValues(channels.map((channel) => [channel]));

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
    heatListSheet.getRange(2, 4, heats.length, 3).setValues(heats);
}

function getCurrentRound() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("data");
    const value = sheet.getRange("B2").getValue();
    return parseInt(value) || '?';
}

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

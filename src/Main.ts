const dataSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("data");

function getCurrentRound() {
    const value = dataSheet.getRange("B2").getValue();
    return parseInt(value) || 0;
}

function getCurrentHeat() {
    const value = dataSheet.getRange("B3").getValue();
    return parseInt(value) || 0;
}

function incrementHeat() {
    const currentHeat = getCurrentHeat();
    dataSheet.getRange("B3").setValue(currentHeat + 1);
    return currentHeat + 1;
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

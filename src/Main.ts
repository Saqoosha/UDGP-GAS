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

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

function onEdit(e: GoogleAppsScript.Events.SheetsOnEdit) {
    switch (e.range.getSheet().getName()) {
        case "Race 1 Results":
            calcRace1Result();
            break;
        // case "Race 2 Results":
        //     calcRace2Result();
        //     break;
    }
}

function doPost(e: GoogleAppsScript.Events.DoPost) {
    // log
    {
        var lock = LockService.getDocumentLock();
        lock.waitLock(20000);

        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Log");
        sheet.getRange("1:1").insertCells(SpreadsheetApp.Dimension.ROWS);
        sheet.getRange(1, 1).setValue((new Date).toLocaleString('ja-JP'));
        sheet.getRange(1, 2).setValue(e);
        sheet.getRange(1, 3).setValue(e.postData.contents);

        SpreadsheetApp.flush();
        lock.releaseLock();
    }

    const data = JSON.parse(e.postData.contents);
    console.log(data);

    let isSuccess = false;

    switch (data.mode) {
        case "udgp-quali":
            addRace1Result(data.pilot, data.time, data.laps);
            calcRace1Result();
            isSuccess = true;
            break;
        case "udgp-race":
            addRace2Results(data.results);
            isSuccess = true;
            break;
    }

    const output = ContentService.createTextOutput(JSON.stringify({ success: isSuccess }));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
}

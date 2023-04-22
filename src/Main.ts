const dataSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("data");

function getRaceMode() {
    const mode = dataSheet.getRange("B1").getValue();
    return mode;
}

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
        // case "udgp-quali":
        //     addRace1Result(data.pilot, data.time, data.laps);
        //     calcRace1Result();
        //     isSuccess = true;
        //     break;
        case "udgp-race":
            switch (getRaceMode()) {
                case "Race 1":
                    data.results
                        .sort((a: any, b: any) => a.position - b.position)
                        .forEach((result: any) => addRace1Result(result.pilot, result.time, result.laps));
                    calcRace1Result();
                    incrementHeat();
                    isSuccess = true;
                    break;
                case "Race 2":
                    addRace2Results(data.results);
                    break;
            }
            isSuccess = true;
            break;
    }

    const output = ContentService.createTextOutput(JSON.stringify({ success: isSuccess }));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
}

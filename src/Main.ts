const ss = SpreadsheetApp.getActiveSpreadsheet();
const pilotsSheet = ss.getSheetByName("参加パイロット");
const heatListSheet = ss.getSheetByName("組み合わせ / タイムスケジュール");
const race1ResultSheet = ss.getSheetByName("Race 1 Results");
const race2ResultSheet = ss.getSheetByName("Race 2 Results");
const tournamentSheet = ss.getSheetByName("Race 2 Tournament");
const dataSheet = ss.getSheetByName("data");

interface RaceResult {
    position: number;
    pilot: string;
    time: number;
    laps: number[];
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

function doGet(e: GoogleAppsScript.Events.DoGet) {
    const data = getHeatList();
    return ContentService.createTextOutput(JSON.stringify({ data: data })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e: GoogleAppsScript.Events.DoPost) {
    // log
    {
        const lock = LockService.getDocumentLock();
        lock.waitLock(20000);

        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Log");
        sheet.getRange("1:1").insertCells(SpreadsheetApp.Dimension.ROWS);
        sheet.getRange(1, 1).setValue(new Date().toLocaleString("ja-JP"));
        sheet.getRange(1, 2).setValue(e);
        sheet.getRange(1, 3).setValue(e.postData.contents);

        SpreadsheetApp.flush();
        lock.releaseLock();
    }

    const data = JSON.parse(e.postData.contents);
    console.log(data);

    let isSuccess = false;

    if (data.mode === "udgp-race") {
        try {
            const heatNumber = Number.parseInt(data.heat.replace(/[^\d]/g, ""), 10);
            setHeatStartTime(heatNumber, data.start);

            const raceMode = data.class.split("-")[0];
            switch (raceMode) {
                case "Race 1": {
                    const roundNumber = Number.parseInt(data.class.split("-")[1]);
                    addOrUpdateResult(race1ResultSheet, roundNumber, heatNumber, data.results);
                    calcRace1Result();
                    break;
                }
                case "Race 2": {
                    addOrUpdateResult(race2ResultSheet, 1, heatNumber, data.results);
                    break;
                }
            }

            if (data.action === "save") {
                setCurrentHeat(heatNumber + 1);
            }

            isSuccess = true;
        } catch (e) {
            console.log(e);
        }
    }

    const output = ContentService.createTextOutput(JSON.stringify({ success: isSuccess }));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
}

function setHeatStartTime(heatNumber: number, timestamp: number) {
    const row = findRowIndexByHeatNumber(heatNumber);
    if (row === -1) {
        console.log("setHeatStartTime: row not found", heatNumber);
        return;
    }
    const t = new Date(timestamp);
    heatListSheet.getRange(row, 4).setValue(t);
    heatListSheet.getRange(row, 5).setValue(formatTimestampToTimeString(timestamp));
}

/**
 * B列で特定の値を検索し、最初に見つかった行のインデックスを返す。
 * @param {string} heatNumber - 検索する値。
 * @return {number} - 見つかった行のインデックス。見つからなければ-1。
 */
function findRowIndexByHeatNumber(heatNumber: number): number {
    const columnBValues = heatListSheet.getRange("B:B").getValues(); // B列の全ての値を取得
    let rowIndex = -1; // 初期値は見つからなかった場合の-1

    // B列をループして値を検索
    for (let i = 0; i < columnBValues.length; i++) {
        if (Number.parseInt(columnBValues[i][0]) === heatNumber) {
            // [i][0]は、i行目のB列の値
            rowIndex = i + 1; // スプレッドシートの行は1から始まるので+1
            break; // 最初に見つかった行でループを終了
        }
    }

    return rowIndex;
}

function formatTimestampToTimeString(timestamp: number | string): string {
    // Dateオブジェクトを生成
    const t = new Date(timestamp);

    // 時間、分、秒を取得し、2桁になるようにフォーマット
    const hours = String(t.getHours()).padStart(2, "0");
    const minutes = String(t.getMinutes()).padStart(2, "0");
    const seconds = String(t.getSeconds()).padStart(2, "0");

    // HH:MM:SS形式の文字列を作成
    return `${hours}:${minutes}:${seconds}`;
}

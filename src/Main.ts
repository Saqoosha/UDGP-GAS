const ss = SpreadsheetApp.getActiveSpreadsheet();
const pilotsSheet = ss.getSheetByName("参加パイロット");
const heatListSheet = ss.getSheetByName("組み合わせ / タイムスケジュール");
const tournamentSheet = ss.getSheetByName("Race 2 Tournament");
const dataSheet = ss.getSheetByName("data");

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

    switch (data.mode) {
        case "udgp-race":
            switch (getRaceMode()) {
                case "Race 1": {
                    setHeatStartTime(data.start);
                    interface RaceResult {
                        position: number;
                        pilot: string;
                        time: number;
                        laps: number[];
                    }
                    const stats = (data.results as RaceResult[])
                        .sort((a, b) => a.position - b.position)
                        .map((result) => addOrUpdateRace1Result(data.id, data.start, result.pilot, result.time, result.laps));
                    console.log(stats);
                    calcRace1Result();
                    if (stats[0] === "added") {
                        const nextHeat = incrementHeat();
                        if (nextHeat % getHeatsPerRound(1) === 1) {
                            const nextRound = incrementRound();
                            if (nextRound > getNumRoundForRace1()) {
                                setRaceMode("Race 2");
                                setCurrentRound(1);
                            }
                        }
                    }
                    isSuccess = true;
                    break;
                }
                case "Race 2":
                    addRace2Results(data.id, data.start, data.results);
                    break;
            }
            isSuccess = true;
            break;
    }

    const output = ContentService.createTextOutput(JSON.stringify({ success: isSuccess }));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
}

function setHeatStartTime(timestamp: number) {
    const heat = getCurrentHeat();
    const row = findRowIndexByHeatNumber(heat);
    if (row === -1) {
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
function findRowIndexByHeatNumber(heatNumber) {
    var columnBValues = heatListSheet.getRange("B:B").getValues(); // B列の全ての値を取得
    var rowIndex = -1; // 初期値は見つからなかった場合の-1

    // B列をループして値を検索
    for (var i = 0; i < columnBValues.length; i++) {
        if (columnBValues[i][0] === heatNumber) { // [i][0]は、i行目のB列の値
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
    const hours = String(t.getHours()).padStart(2, '0');
    const minutes = String(t.getMinutes()).padStart(2, '0');
    const seconds = String(t.getSeconds()).padStart(2, '0');

    // HH:MM:SS形式の文字列を作成
    return `${hours}:${minutes}:${seconds}`;
}

/**
 * 指定された範囲内で検索キーに一致する行を見つけ、その行の特定の列の値を返す。
 *
 * @param {Array[]} rangeValues - 検索する範囲の値（例: C2:D5の値）。
 * @param {string} searchKey - 検索するキー（例: B26の値）。
 * @return {string} 検索に一致した行の特定の列の値または空文字列。
 */
function PILOT_LOOKUP(rangeValues, searchKey) {
    // 指定された範囲で検索キーに一致する行を見つける
    for (let i = 0; i < rangeValues.length; i++) {
        if (rangeValues[i][1] == searchKey) { // 2列目（順位など）が検索キーに一致するかチェック
            return rangeValues[i][0]; // 1列目（名前など）の値を返す
        }
    }

    // 一致する値が見つからない場合は空文字列を返す
    return "";
}

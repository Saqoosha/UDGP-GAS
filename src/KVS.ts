function getValueForKey(key: string) {
    var data = dataSheet.getRange(1, 1, dataSheet.getLastRow(), 2).getValues();
    for (var i = 0; i < data.length; i++) {
        if (data[i][0] === key) {
            return data[i][1];
        }
    }
    return null;
}

function setValueForKey(key: string, value: any): void {
    var data = dataSheet.getRange(1, 1, dataSheet.getLastRow(), 2).getValues();
    for (let i = 0; i < data.length; i++) {
        if (data[i][0] === key) {
            dataSheet.getRange(i + 1, 2).setValue(value);
            return;
        }
    }
    dataSheet.appendRow([key, value]);
}

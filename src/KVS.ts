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

//

function getRaceMode() {
    return getValueForKey("race mode");
}

function setRaceMode(mode: string) {
    setValueForKey("race mode", mode);
}

function getCurrentRound() {
    return parseInt(getValueForKey("current round")) || 0;
}

function setCurrentRound(num: number) {
    setValueForKey("current round", num);
}

function incrementRound() {
    const nextRound = getCurrentRound() + 1;
    setCurrentRound(nextRound);
    return nextRound;
}

function getCurrentHeat() {
    return parseInt(getValueForKey("current heat")) || 0;
}

function setCurrentHeat(num: number) {
    setValueForKey("current heat", num);
}

function incrementHeat() {
    const nextHeat = getCurrentHeat() + 1;
    setCurrentHeat(nextHeat);
    return nextHeat;
}

function getHeatsPerRound(round: number) {
    return parseInt(getValueForKey("heats per round " + round)) || 0;
}

function setHeatsPerRound(round: number, num: number) {
    setValueForKey("heats per round " + round, num);
}

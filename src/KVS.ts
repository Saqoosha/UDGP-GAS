function getValueForKey(key: string) {
    const cache = CacheService.getScriptCache();
    const cached = cache.get(key);
    if (cached != null) {
        return cached;
    }
    const data = dataSheet.getRange(1, 1, dataSheet.getLastRow(), 2).getValues();
    for (let i = 0; i < data.length; i++) {
        if (data[i][0] === key) {
            cache.put(key, data[i][1].toString(), 20);
            return data[i][1];
        }
    }
    return null;
}

function setValueForKey(key: string, value: string | number): void {
    const cache = CacheService.getScriptCache();
    const data = dataSheet.getRange(1, 1, dataSheet.getLastRow(), 2).getValues();
    for (let i = 0; i < data.length; i++) {
        if (data[i][0] === key) {
            dataSheet.getRange(i + 1, 2).setValue(value);
            cache.put(key, value.toString(), 20);
            return;
        }
    }
    dataSheet.appendRow([key, value]);
    cache.put(key, value.toString(), 20);
}

//

function getNumChannels() {
    return Number.parseInt(getValueForKey("num channels")) || 4;
}

function getNumRoundForRace1() {
    return Number.parseInt(getValueForKey("num rounds of race 1")) || 0;
}

function getNumRoundForRace2() {
    return Number.parseInt(getValueForKey("num rounds of race 2")) || 0;
}

function getHeatsPerRound(round: number) {
    return Number.parseInt(getValueForKey(`heats per round ${round}`)) || 0;
}

function setHeatsPerRound(round: number, num: number) {
    setValueForKey(`heats per round ${round}`, num);
}

function getRaceMode() {
    return getValueForKey("race mode");
}

function setRaceMode(mode: string) {
    setValueForKey("race mode", mode);
}

function getCurrentRound() {
    return Number.parseInt(getValueForKey("current round")) || 0;
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
    return Number.parseInt(getValueForKey("current heat")) || 0;
}

function setCurrentHeat(num: number) {
    setValueForKey("current heat", num);
}

function incrementHeat() {
    const nextHeat = getCurrentHeat() + 1;
    setCurrentHeat(nextHeat);
    return nextHeat;
}

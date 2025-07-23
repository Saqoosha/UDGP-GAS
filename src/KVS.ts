// Key-Value Store configuration
const KVS_CONSTANTS = {
    CACHE_DURATION: 20, // seconds
    DEFAULT_NUM_CHANNELS: 4,
    DEFAULT_NUM_ROUNDS: 0,
    DEFAULT_CURRENT_HEAT: 0,
    DEFAULT_CURRENT_ROUND: 0,
    
    KEYS: {
        NUM_CHANNELS: "num channels",
        NUM_ROUNDS_RACE1: "num rounds of race 1",
        NUM_ROUNDS_RACE2: "num rounds of race 2",
        HEATS_PER_ROUND: "heats per round",
        RACE_MODE: "race mode",
        CURRENT_ROUND: "current round",
        CURRENT_HEAT: "current heat",
        NUM_PILOTS: "num pilots"
    }
};

function getValueForKey(key: string) {
    const cache = CacheService.getScriptCache();
    const cached = cache.get(key);
    if (cached != null) {
        return cached;
    }
    
    const sheets = SheetService.getInstance();
    const dataSheet = sheets.getDataSheet();
    const data = dataSheet.getRange(1, 1, dataSheet.getLastRow(), 2).getValues();
    
    for (let i = 0; i < data.length; i++) {
        if (data[i][0] === key) {
            cache.put(key, data[i][1].toString(), KVS_CONSTANTS.CACHE_DURATION);
            return data[i][1];
        }
    }
    return null;
}

function setValueForKey(key: string, value: string | number): void {
    const cache = CacheService.getScriptCache();
    const sheets = SheetService.getInstance();
    const dataSheet = sheets.getDataSheet();
    const data = dataSheet.getRange(1, 1, dataSheet.getLastRow(), 2).getValues();
    
    for (let i = 0; i < data.length; i++) {
        if (data[i][0] === key) {
            dataSheet.getRange(i + 1, 2).setValue(value);
            cache.put(key, value.toString(), KVS_CONSTANTS.CACHE_DURATION);
            return;
        }
    }
    dataSheet.appendRow([key, value]);
    cache.put(key, value.toString(), KVS_CONSTANTS.CACHE_DURATION);
}

// Configuration getters and setters

function getNumChannels() {
    return Number.parseInt(getValueForKey(KVS_CONSTANTS.KEYS.NUM_CHANNELS)) || KVS_CONSTANTS.DEFAULT_NUM_CHANNELS;
}

function getNumRoundForRace1() {
    return Number.parseInt(getValueForKey(KVS_CONSTANTS.KEYS.NUM_ROUNDS_RACE1)) || KVS_CONSTANTS.DEFAULT_NUM_ROUNDS;
}

function getNumRoundForRace2() {
    return Number.parseInt(getValueForKey(KVS_CONSTANTS.KEYS.NUM_ROUNDS_RACE2)) || KVS_CONSTANTS.DEFAULT_NUM_ROUNDS;
}

function getHeatsPerRound(round: number) {
    return Number.parseInt(getValueForKey(`${KVS_CONSTANTS.KEYS.HEATS_PER_ROUND} ${round}`)) || 0;
}

function setHeatsPerRound(round: number, num: number) {
    setValueForKey(`${KVS_CONSTANTS.KEYS.HEATS_PER_ROUND} ${round}`, num);
}

function getRaceMode() {
    return getValueForKey(KVS_CONSTANTS.KEYS.RACE_MODE);
}

function setRaceMode(mode: string) {
    setValueForKey(KVS_CONSTANTS.KEYS.RACE_MODE, mode);
}

function getCurrentRound() {
    return Number.parseInt(getValueForKey(KVS_CONSTANTS.KEYS.CURRENT_ROUND)) || KVS_CONSTANTS.DEFAULT_CURRENT_ROUND;
}

function setCurrentRound(num: number) {
    setValueForKey(KVS_CONSTANTS.KEYS.CURRENT_ROUND, num);
}

function incrementRound() {
    const nextRound = getCurrentRound() + 1;
    setCurrentRound(nextRound);
    return nextRound;
}

function getCurrentHeat() {
    return Number.parseInt(getValueForKey(KVS_CONSTANTS.KEYS.CURRENT_HEAT)) || KVS_CONSTANTS.DEFAULT_CURRENT_HEAT;
}

function setCurrentHeat(num: number) {
    setValueForKey(KVS_CONSTANTS.KEYS.CURRENT_HEAT, num);
}

function incrementHeat() {
    const nextHeat = getCurrentHeat() + 1;
    setCurrentHeat(nextHeat);
    return nextHeat;
}
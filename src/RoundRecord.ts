class RoundRecord {
    round: number;
    datetime: string;
    pilot: string;
    flightLaps: number;
    time: number;
    penalty: boolean;
    resultLaps: number;
    isValid: boolean;
    fastestLapTime: number;

    constructor(rawData: string[]) {
        this.round = Number(rawData[0]);
        this.datetime = rawData[1];
        this.pilot = rawData[2];
        this.flightLaps = Number(rawData[3]);
        this.time = Number(rawData[4]);
        this.penalty = Boolean(rawData[5]);
        this.resultLaps = Number(rawData[6]);
        const laps = rawData
            .slice(7)
            .map(Number)
            .filter((x) => !Number.isNaN(x) && x > 0);
        this.fastestLapTime = Math.min(...laps.slice(1));
        this.isValid = false;
    }
}

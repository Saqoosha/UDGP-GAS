class RoundRecord {
    round: number;
    heat: number;
    datetime: string;
    pilot: string;
    position: number;
    flightLaps: number;
    time: number;
    penalty: boolean;
    resultLaps: number;
    isValid: boolean;
    fastestLapTime: number;

    constructor(rawData: string[]) {
        this.round = Number(rawData[0]);
        this.heat = Number(rawData[1]);
        this.datetime = rawData[2];
        this.pilot = rawData[3];
        this.position = Number(rawData[4]);
        this.flightLaps = Number(rawData[5]);
        this.time = Number(rawData[6]);
        this.penalty = Boolean(rawData[7]);
        this.resultLaps = Number(rawData[8]);
        const laps = rawData
            .slice(9)
            .map(Number)
            .filter((x) => !Number.isNaN(x) && x > 0);
        this.fastestLapTime = Math.min(...laps.slice(1));
        this.isValid = false;
    }
}

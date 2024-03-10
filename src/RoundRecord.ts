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
        this.pilot = rawData[2];
        this.position = Number(rawData[3]);
        this.flightLaps = Number(rawData[4]);
        this.time = Number(rawData[5]);
        this.penalty = Boolean(rawData[6]);
        this.resultLaps = Number(rawData[7]);
        const laps = rawData
            .slice(8)
            .map(Number)
            .filter((x) => !Number.isNaN(x) && x > 0);
        this.fastestLapTime = Math.min(...laps.slice(1));
        this.isValid = false;
    }
}

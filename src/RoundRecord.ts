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
        // Using array indices based on SheetService.COLUMNS.RACE1_RESULTS
        // Indices are 0-based while columns are 1-based
        this.round = Number(rawData[0]);          // Column A (ROUND)
        this.heat = Number(rawData[1]);           // Column B (HEAT)
        this.datetime = rawData[2];               // Column C (START_TIME)
        this.pilot = rawData[3];                  // Column D (PILOT)
        this.position = Number(rawData[4]);       // Column E (POSITION)
        this.flightLaps = Number(rawData[5]);     // Column F (LAPS)
        this.time = Number(rawData[6]);           // Column G (TIME)
        this.penalty = Boolean(rawData[7]);       // Column H (PENALTY)
        this.resultLaps = Number(rawData[8]);     // Column I (RESULT_LAPS)
        
        // Lap times start from column J (LAP_TIMES_START)
        const laps = rawData
            .slice(SheetService.COLUMNS.RACE1_RESULTS.LAP_TIMES_START - 1)
            .map(Number)
            .filter((x) => !Number.isNaN(x) && x > 0);
        this.fastestLapTime = laps.length > 1 ? Math.min(...laps.slice(1)) : Number.POSITIVE_INFINITY;
        this.isValid = false;
    }
}

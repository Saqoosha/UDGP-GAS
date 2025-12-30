// Data models and interfaces for UDGP-GAS

interface RaceResult {
    position: number;
    pilot: string;
    time: number;
    laps: number[];
}

interface HeatAssignment {
    round: string;
    heat: string;
    heatNumber?: number;
    pilots: string[];
    startTime?: Date;
}

interface RaceConfiguration {
    numChannels: 3 | 4;
    numRounds: number;
    heatsPerRound: number;
    currentHeat: number;
}

interface RaceData {
    mode: string;
    class: string;
    heat: string;
    start: number;
    results: RaceResult[];
    action?: string;
}

interface ProcessedResult {
    pilot: string;
    totalLaps: number;
    totalTime: number;
    isValid: boolean;
    rank?: number;
    heatCount?: number;
}

interface RoundResult {
    round: number;
    heat: number;
    pilot: string;
    position: number;
    laps: number;
    time: number;
    penalty: boolean;
    resultLaps: number;
    fastestLapTime: number;
    isValid?: boolean;
}

interface PostData {
    mode: string;
    class: string;
    heat: string;
    start: number;
    results: RaceResult[];
    action?: string;
}

interface ApiResponse {
    success: boolean;
    error?: string;
    data?: any;
}
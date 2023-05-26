class RoundRecord {
  round: number;
  datetime: string;
  pilot: string;
  flightLaps: number;
  time: number;
  penaltyNoReturn: boolean;
  penaltyLowVoltage: boolean;
  resultLaps: number;
  isValid: boolean;
  fastestLapTime: number;

  constructor(rawData: string[]) {
    this.round = Number(rawData[0]);
    this.datetime = rawData[1];
    this.pilot = rawData[2];
    this.flightLaps = Number(rawData[3]);
    this.time = Number(rawData[4]);
    this.penaltyNoReturn = Boolean(rawData[5]);
    this.penaltyLowVoltage = Boolean(rawData[6]);
    this.resultLaps = Number(rawData[7]);
    const laps = rawData.slice(8).map(Number).filter(x => !isNaN(x) && x > 0);
    this.fastestLapTime = Math.min(...laps.slice(1));
    this.isValid = false;
  }
}

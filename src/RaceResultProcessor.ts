// Separate concerns for race result processing
// Using ProcessedResult interface from DataModels.ts

class RaceResultProcessor {
    // Ranking criteria constants
    private static readonly RANKING_RULES = {
        PRIMARY: 'LAPS_DESC',   // More laps is better
        SECONDARY: 'TIME_ASC'    // Less time is better
    };
    
    static processRoundResults(records: RoundRecord[]): ProcessedResult[] {
        return records
            .map(record => this.processRecord(record))
            .sort(this.compareResults);
    }
    
    private static processRecord(record: RoundRecord): ProcessedResult {
        return {
            pilot: record.pilot,
            totalLaps: record.resultLaps,
            totalTime: record.time,
            isValid: record.isValid || true
        };
    }
    
    private static compareResults(a: ProcessedResult, b: ProcessedResult): number {
        // Primary: Compare by lap count (descending)
        if (a.totalLaps !== b.totalLaps) {
            return b.totalLaps - a.totalLaps;
        }
        // Secondary: Compare by time (ascending)
        return a.totalTime - b.totalTime;
    }
    
    static calculateOverallRanking(pilotResults: Map<string, ProcessedResult[]>): ProcessedResult[] {
        const overallResults: ProcessedResult[] = [];
        
        pilotResults.forEach((results, pilot) => {
            const totalLaps = results.reduce((sum, r) => sum + (r.isValid ? r.totalLaps : Math.floor(r.totalLaps / 2)), 0);
            const totalTime = results.reduce((sum, r) => sum + r.totalTime, 0);
            
            overallResults.push({
                pilot,
                totalLaps,
                totalTime,
                isValid: true
            });
        });
        
        return overallResults.sort(this.compareResults);
    }
}
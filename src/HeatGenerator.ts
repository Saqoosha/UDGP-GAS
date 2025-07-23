// Simplified heat generation with clearer logic
class HeatGenerator {
    private static readonly CHANNEL_CONFIGS = {
        3: {
            channels: ["E1 5705", "F1 5740", "F4 5800", ""],
            adjustments: {
                1: (heats: string[][]) => {
                    // Move 1 pilot from second-to-last heat to make 2-2
                    const lastHeat = heats[heats.length - 1];
                    const secondLastHeat = heats[heats.length - 2];
                    lastHeat.unshift(secondLastHeat.pop() as string);
                }
            }
        },
        4: {
            channels: ["R2 5695", "A8 5725", "B4 5790", "F5 5820"],
            adjustments: {
                1: (heats: string[][]) => {
                    // Redistribute to make last 3 heats have 3 pilots each
                    const lastHeat = heats[heats.length - 1];
                    const secondLastHeat = heats[heats.length - 2];
                    const thirdLastHeat = heats[heats.length - 3];
                    
                    secondLastHeat.unshift(thirdLastHeat.pop() as string);
                    lastHeat.unshift(secondLastHeat.pop() as string);
                    lastHeat.unshift(secondLastHeat.pop() as string);
                },
                2: (heats: string[][]) => {
                    // Move 1 pilot to make 3-3
                    const lastHeat = heats[heats.length - 1];
                    const secondLastHeat = heats[heats.length - 2];
                    lastHeat.unshift(secondLastHeat.pop() as string);
                }
            }
        }
    };
    
    static generate(pilots: string[], numChannels: number): string[][] {
        // Initial distribution
        const heats = this.distributeIntoHeats(pilots, numChannels);
        
        // Apply adjustments based on last heat size
        this.applyLastHeatAdjustments(heats, numChannels);
        
        // Ensure all heats have correct column count
        this.padHeatsWithEmptySlots(heats, numChannels);
        
        return heats;
    }
    
    private static distributeIntoHeats(pilots: string[], numChannels: number): string[][] {
        const heats: string[][] = [];
        
        pilots.forEach((pilot, index) => {
            const heatIndex = Math.floor(index / numChannels);
            if (!heats[heatIndex]) {
                heats[heatIndex] = [];
            }
            heats[heatIndex].push(pilot);
        });
        
        return heats;
    }
    
    private static applyLastHeatAdjustments(heats: string[][], numChannels: number): void {
        if (heats.length === 0) return;
        
        const lastHeatSize = heats[heats.length - 1].length;
        const config = this.CHANNEL_CONFIGS[numChannels];
        
        if (config?.adjustments[lastHeatSize]) {
            config.adjustments[lastHeatSize](heats);
        }
    }
    
    private static padHeatsWithEmptySlots(heats: string[][], numChannels: number): void {
        heats.forEach(heat => {
            while (heat.length < numChannels) {
                heat.push("");
            }
        });
    }
    
    static getChannelNames(numChannels: number): string[] {
        return this.CHANNEL_CONFIGS[numChannels]?.channels || [];
    }
}
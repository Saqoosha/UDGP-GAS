// Centralized constants for the UDGP-GAS application
const RACE_CONSTANTS = {
    RACE_TIME: 240,              // 4 minutes in seconds
    GRACE_PERIOD: 10,            // 10 seconds grace period
    CRASH_PROBABILITY: 0.05,     // 5% chance of crash in simulation
    
    RACE_MODES: {
        RACE_1: "Race 1",
        RACE_2: "Race 2"
    },
    
    TIME_FORMAT: {
        LOCALE: "ja-JP",
        DATE_FORMAT: "h:mm:ss"
    },
    
    LOCK_TIMEOUT: 20000,         // 20 seconds lock timeout
    
    API_RESPONSE: {
        SUCCESS: "success",
        ERROR: "error"
    }
};

const CHANNEL_CONFIGS = {
    3: {
        channels: ["E1 5705", "F1 5740", "F4 5800", ""],
        frequencies: [5705, 5740, 5800]
    },
    4: {
        channels: ["R2 5695", "A8 5725", "B4 5790", "F5 5820"],
        frequencies: [5695, 5725, 5790, 5820]
    }
};

const SHEET_FORMULAS = {
    TIME_INCREMENT: "=R[-1]C[0]+time(0,R2C14,0)",
    TIME_INCREMENT_WITH_INTERVAL: "=R[-2]C[0]+time(0,R3C14,0)",
    DURATION_MINUTES: '=IF(ISBLANK(R[0]C[-1]), "", (R[0]C[-1]-R[0]C[-3])*1440)',
    RESULT_LAPS: "=IF(H2=TRUE, F2-2, F2)"
};

enum RaceMode {
    RACE_1 = "Race 1",
    RACE_2 = "Race 2"
}

enum ChannelConfig {
    THREE_CHANNEL = 3,
    FOUR_CHANNEL = 4
}
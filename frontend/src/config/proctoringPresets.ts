export interface PerformanceSettings {
    gazeYawThreshold: number;
    faceScoreThreshold: number;
    audioRMSThreshold: number;
    violationCooldownMs: number;
}

export interface ProctoringConfig {
    enableTabLock: boolean;
    enableFullscreen: boolean;
    enableInputLock: boolean;
    enableFaceDetection: boolean;
    enableVoiceDetection: boolean;
    enableGazeTracking: boolean;
    violationThreshold: number;
    performanceSettings: PerformanceSettings;
}

export const PROCTORING_PRESETS: Record<'relaxed' | 'standard' | 'strict', ProctoringConfig> = {
    relaxed: {
        enableTabLock: false,
        enableFullscreen: false,
        enableInputLock: false,
        enableFaceDetection: true,
        enableVoiceDetection: false,
        enableGazeTracking: false,
        violationThreshold: 10,
        performanceSettings: {
            gazeYawThreshold: 60,
            faceScoreThreshold: 0.3,
            audioRMSThreshold: 0.03,
            violationCooldownMs: 30000
        }
    },
    standard: {
        enableTabLock: true,
        enableFullscreen: true,
        enableInputLock: true,
        enableFaceDetection: true,
        enableVoiceDetection: true,
        enableGazeTracking: false,
        violationThreshold: 5,
        performanceSettings: {
            gazeYawThreshold: 40,
            faceScoreThreshold: 0.45,
            audioRMSThreshold: 0.01,
            violationCooldownMs: 15000
        }
    },
    strict: {
        enableTabLock: true,
        enableFullscreen: true,
        enableInputLock: true,
        enableFaceDetection: true,
        enableVoiceDetection: true,
        enableGazeTracking: true,
        violationThreshold: 3,
        performanceSettings: {
            gazeYawThreshold: 25,
            faceScoreThreshold: 0.6,
            audioRMSThreshold: 0.005,
            violationCooldownMs: 10000
        }
    }
};

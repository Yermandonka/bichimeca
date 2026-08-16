/**
 * Versioned learner-progress model.
 *
 * Progress preservation is a P0 product requirement: every persisted dataset
 * carries `schemaVersion`, updates are immutable, and destructive operations
 * (overwrite baseline, duplicate sessions) are impossible by construction.
 * Browser storage lives behind a separate adapter; this module is pure.
 */

export const CURRENT_SCHEMA_VERSION = 1;

export const DEFAULT_LEARNER_NAME = "Estrella";
export const DEFAULT_NICKNAME = "bichi";

export interface LearnerProfile {
  name: string;
  nickname: string | null;
  createdAt: string;
}

export interface Settings {
  soundEnabled: boolean;
  reducedMotion: boolean;
  dailyGoalMinutes: number;
}

export interface BaselineRecord {
  recordedAt: string;
  ppm: number;
  accuracy: number;
  errors: number;
  consistency: number | null;
}

export interface KeyStatRecord {
  attempts: number;
  correct: number;
  errors: number;
  latencyEwmaMs: number | null;
  accuracyEwma: number | null;
  lastPracticedAt: string | null;
}

export interface SessionRecord {
  id: string;
  completedAt: string;
  lessonId: string;
  exerciseType: string;
  durationMs: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  errors: number;
  accuracy: number | null;
  ppm: number;
  rawPpm: number;
  consistency: number | null;
  xp: number;
}

export interface ProgressData {
  schemaVersion: number;
  profile: LearnerProfile;
  settings: Settings;
  sessions: SessionRecord[];
  keyStats: Record<string, KeyStatRecord>;
  baseline: BaselineRecord | null;
  totalXp: number;
}

export function createEmptyProgress(nowIso: string): ProgressData {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    profile: {
      name: DEFAULT_LEARNER_NAME,
      nickname: DEFAULT_NICKNAME,
      createdAt: nowIso,
    },
    settings: {
      soundEnabled: true,
      reducedMotion: false,
      dailyGoalMinutes: 5,
    },
    sessions: [],
    keyStats: {},
    baseline: null,
    totalXp: 0,
  };
}

/** Appends a completed session; duplicate ids are a hard error. */
export function appendSession(
  progress: ProgressData,
  session: SessionRecord,
): ProgressData {
  if (progress.sessions.some((existing) => existing.id === session.id)) {
    throw new Error(`Sesión duplicada: ${session.id}`);
  }
  return {
    ...progress,
    sessions: [...progress.sessions, session],
    totalXp: progress.totalXp + session.xp,
  };
}

/**
 * Stores the initial baseline. An existing baseline is never overwritten;
 * it can only change through an explicit full progress reset.
 */
export function recordBaseline(
  progress: ProgressData,
  baseline: BaselineRecord,
): ProgressData {
  if (progress.baseline !== null) return progress;
  return { ...progress, baseline };
}

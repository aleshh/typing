import { defaultConfig, type AppConfig } from './config';
import type { CharStats, SessionResult } from './types';

const LS_KEYS = {
  results: 'typing.results',
  charStats: 'typing.charStats',
  config: 'typing.config',
} as const;

export function getConfig(): AppConfig {
  const raw = localStorage.getItem(LS_KEYS.config);
  if (!raw) return defaultConfig;
  try {
    return { ...defaultConfig, ...JSON.parse(raw) } as AppConfig;
  } catch {
    return defaultConfig;
  }
}

export function saveConfig(cfg: AppConfig) {
  localStorage.setItem(LS_KEYS.config, JSON.stringify(cfg));
}

export function getResults(): SessionResult[] {
  const raw = localStorage.getItem(LS_KEYS.results);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SessionResult[];
  } catch {
    return [];
  }
}

export function pushResult(result: SessionResult) {
  const list = getResults();
  list.unshift(result);
  localStorage.setItem(LS_KEYS.results, JSON.stringify(list.slice(0, 100)));
}

export function getCharStats(): CharStats {
  const raw = localStorage.getItem(LS_KEYS.charStats);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as CharStats;
  } catch {
    return {};
  }
}

export function mergeCharStats(delta: CharStats) {
  const stats = getCharStats();
  for (const [ch, d] of Object.entries(delta)) {
    const cur = stats[ch] || { attempts: 0, errors: 0 };
    stats[ch] = { attempts: cur.attempts + d.attempts, errors: cur.errors + d.errors };
  }
  localStorage.setItem(LS_KEYS.charStats, JSON.stringify(stats));
}

export function selectTopTrouble(stats: CharStats, minAttempts = 5, limit = 10) {
  const rows = Object.entries(stats)
    .filter(([_, v]) => v.attempts >= minAttempts)
    .map(([char, v]) => ({ char, errorRate: v.attempts ? v.errors / v.attempts : 0, attempts: v.attempts }))
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, limit);
  return rows;
}


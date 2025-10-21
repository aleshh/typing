import { useEffect, useMemo, useRef, useState } from 'react';
import { getCharStats, getConfig, mergeCharStats, pushResult, selectTopTrouble } from '../store';
import { generateSnippet } from '../generator';
import type { CharStats, SessionResult } from '../types';

type Props = {
  onFinish: (resultId: string) => void;
  onCancel: () => void;
};

export default function TypingScreen({ onFinish, onCancel }: Props) {
  const cfg = getConfig();
  const target = useMemo(() => generateSnippet(cfg), [cfg.sprintLength, cfg.emphasizeTrouble]);
  const [typed, setTyped] = useState<string>('');
  const [errors, setErrors] = useState<number>(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [paused, setPaused] = useState(false);
  const charAttempts = useRef<CharStats>({});

  const idx = typed.length;
  const correct = typed.split('').filter((c, i) => c === target[i]).length;
  const attempts = typed.length;
  const elapsedMs = startedAt ? (Date.now() - startedAt) : 0;
  const minutes = Math.max(1 / 60_000, elapsedMs / 60_000);
  const grossWPM = attempts / 5 / minutes;
  const netWPM = Math.max(0, (attempts - errors) / 5 / minutes);
  const accuracy = attempts ? correct / attempts : 1;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (done || paused) return;
      if (!startedAt) setStartedAt(Date.now());
      const k = e.key;
      if (k === 'Escape') {
        setPaused(p => !p);
        return;
      }
      if (k === 'Backspace') {
        e.preventDefault();
        setTyped(prev => {
          if (prev.length === 0) return prev;
          const lastIndex = prev.length - 1;
          const lastTyped = prev[lastIndex];
          const wasError = lastTyped !== target[lastIndex];
          if (wasError) setErrors(n => Math.max(0, n - 1));
          const at = charAttempts.current[lastTyped] || { attempts: 0, errors: 0 };
          if (at.attempts > 0) {
            at.attempts -= 1;
            if (wasError && at.errors > 0) at.errors -= 1;
            charAttempts.current[lastTyped] = at;
          }
          return prev.slice(0, -1);
        });
        return;
      }
      if (k.length === 1 || k === 'Enter' || k === 'Tab' || k === ' ') {
        e.preventDefault();
        const ch = k === 'Enter' ? '\n' : k === 'Tab' ? '\t' : k;
        const isError = ch !== target[idx];
        setTyped((s) => s + ch);
        setErrors((n) => n + (isError ? 1 : 0));
        // record attempts per char
        const at = charAttempts.current[ch] || { attempts: 0, errors: 0 };
        at.attempts += 1;
        if (isError) at.errors += 1;
        charAttempts.current[ch] = at;
        if (idx + 1 >= target.length) {
          setDone(true);
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [idx, done, paused, startedAt, target]);

  useEffect(() => {
    if (!done) return;
    const durationMs = startedAt ? Date.now() - startedAt : 0;
    const id = crypto.randomUUID();
    const perChar = charAttempts.current;
    mergeCharStats(perChar);
    const res: SessionResult = {
      id,
      timestamp: Date.now(),
      durationMs,
      length: target.length,
      attempts,
      correct,
      errors,
      grossWPM,
      netWPM,
      accuracy,
      topTrouble: selectTopTrouble(perChar),
    };
    pushResult(res);
    onFinish(id);
  }, [done]);

  const displayTokens = useMemo(() => {
    const tokens: { ch: string; cls: string }[] = [];
    for (let i = 0; i < target.length; i++) {
      const ch = target[i];
      const typedCh = typed[i];
      let cls = 'upcoming';
      if (i < typed.length) cls = typedCh === ch ? 'correct' : 'error';
      if (i === typed.length) cls = 'current';
      tokens.push({ ch: ch === ' ' ? '·' : ch === '\n' ? '↵\n' : ch, cls });
    }
    return tokens;
  }, [target, typed]);

  return (
    <div className="container">
      <div className="toolbar">
        <button className="btn" onClick={onCancel}>← Menu</button>
        <div className="hud">
          <span>WPM: <strong>{Math.round(netWPM)}</strong></span>
          <span>Accuracy: <strong>{Math.round(accuracy * 100)}%</strong></span>
          <span>Errors: <strong>{errors}</strong></span>
          <span>Time: <strong>{Math.floor(elapsedMs / 1000)}s</strong></span>
        </div>
        <button className="btn" onClick={() => setPaused(p => !p)}>{paused ? 'Resume' : 'Pause'}</button>
      </div>
      <div className={`card typing ${paused ? 'paused' : ''}`}>
        <div className="progress"><div className="bar" style={{ width: `${(idx / target.length) * 100}%` }} /></div>
        <pre className="snippet" aria-label="typing area">
          {displayTokens.map((t, i) => (
            <span key={i} className={t.cls}>{t.ch}</span>
          ))}
        </pre>
        {paused && <div className="overlay">Paused — press Esc to resume</div>}
      </div>
      <p className="hint">Type the characters exactly as shown. Backspace deletes the last character. Press Esc to pause.</p>
    </div>
  );
}

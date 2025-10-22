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

  const displayLines = useMemo(() => {
    const lines: { target: { ch: string; cls: string }[]; echo: { ch: string; cls: string }[] }[] = [];
    let offset = 0;
    const rawLines = target.split('\n');
    for (const raw of rawLines) {
      const tChars: { ch: string; cls: string }[] = [];
      const eChars: { ch: string; cls: string }[] = [];
      for (let j = 0; j < raw.length; j++) {
        const pos = offset + j;
        const ch = raw[j];
        const typedCh = typed[pos];
        let cls = 'upcoming';
        // Keep the caret indicator on target line but move red/green to echo line
        if (pos === typed.length) cls = 'current';
        tChars.push({ ch: ch === ' ' ? '·' : ch, cls });
        if (pos < typed.length) {
          const ech = typedCh === ' ' ? '·' : typedCh === '\n' ? '' : typedCh;
          const eCls = typedCh === ch ? 'echo-correct' : 'echo-error';
          if (ech) eChars.push({ ch: ech, cls: eCls });
        }
      }
      // Add caret on echo line for the current position within this line
      if (typed.length >= offset && typed.length <= offset + raw.length) {
        eChars.push({ ch: '▏', cls: 'echo-current' });
      }
      lines.push({ target: tChars, echo: eChars });
      offset += raw.length + 1; // account for the newline
    }
    return lines;
  }, [target, typed]);

  const currentChar = target[idx];
  const numberKeyMap: Record<string, string> = {
    '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0',
  };
  const hintNum = numberKeyMap[currentChar];

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
      <div className="card hintbox" aria-live="polite">
        <strong>Hint:</strong>{' '}
        <span className="hintkey" aria-hidden={hintNum ? 'false' : 'true'}>
          {hintNum ? currentChar : '\u00A0'}
        </span>
        {hintNum ? (
          <span className="hinttext"> is typed with Shift + <kbd>{hintNum}</kbd></span>
        ) : (
          <span className="hinttext hintplaceholder">—</span>
        )}
      </div>
      <div className={`card typing ${paused ? 'paused' : ''}`}>
        <div className="progress"><div className="bar" style={{ width: `${(idx / target.length) * 100}%` }} /></div>
        <pre className="snippet" aria-label="typing area">
          {displayLines.map((ln, i) => (
            <span key={`l-${i}`}>
              {ln.target.map((t, j) => (
                <span key={`t-${i}-${j}`} className={t.cls}>{t.ch}</span>
              ))}
              {'\n'}
              {ln.echo.length > 0 ? (
                ln.echo.map((e, j) => (
                  <span key={`e-${i}-${j}`} className={`echo ${e.cls}`}>{e.ch}</span>
                ))
              ) : null}
              {'\n'}
            </span>
          ))}
        </pre>
        {paused && <div className="overlay">Paused — press Esc to resume</div>}
      </div>
      <p className="hint">Type the characters exactly as shown. Backspace deletes the last character. Press Esc to pause.</p>
    </div>
  );
}

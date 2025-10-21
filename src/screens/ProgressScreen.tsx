import { getCharStats, selectTopTrouble } from '../store';
import type { SessionResult } from '../types';

export default function ProgressScreen({ lastResultId, results, onStart, onHome }: {
  lastResultId: string | null;
  results: SessionResult[];
  onStart: () => void;
  onHome: () => void;
}) {
  const stats = getCharStats();
  const worst = selectTopTrouble(stats, 5, 8);

  return (
    <div className="container">
      <h2>Progress</h2>
      <div className="grid two">
        <div className="card">
          <h3>Recent Sprints</h3>
          {results.length === 0 ? (
            <p>No results yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th><th>Net WPM</th><th>Accuracy</th><th>Len</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className={r.id === lastResultId ? 'highlight' : ''}>
                    <td>{new Date(r.timestamp).toLocaleString()}</td>
                    <td>{Math.round(r.netWPM)}</td>
                    <td>{Math.round(r.accuracy * 100)}%</td>
                    <td>{r.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card">
          <h3>Trouble Characters</h3>
          {worst.length === 0 ? (
            <p>Keep typing to collect stats.</p>
          ) : (
            <ul className="trouble">
              {worst.map((w) => (
                <li key={w.char}>
                  <code className="ch">{w.char === ' ' ? 'space' : w.char}</code>
                  <span>{Math.round(w.errorRate * 100)}% errors</span>
                  <small>({w.attempts} tries)</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="actions">
        <button className="btn" onClick={onHome}>← Menu</button>
        <button className="btn primary" onClick={onStart}>Start Another Sprint</button>
      </div>
    </div>
  );
}


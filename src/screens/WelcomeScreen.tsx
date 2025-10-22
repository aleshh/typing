import { useEffect, useState } from 'react';
import { defaultConfig, type AppConfig } from '../config';
import { getConfig, saveConfig } from '../store';

export default function WelcomeScreen({ onStart, onProgress }: { onStart: () => void; onProgress: () => void }) {
  const [cfg, setCfg] = useState<AppConfig>(getConfig());

  useEffect(() => {
    saveConfig(cfg);
  }, [cfg]);

  return (
    <div className="container">
      <h1 className="title">Typing Sprints</h1>
      <p className="subtitle">Practice numbers and symbols with code-like snippets.</p>

      <div className="card">
        <h2>Quick Start</h2>
        <div className="row">
          <input
            id="sprintLength"
            type="number"
            min={200}
            max={3000}
            value={cfg.sprintLength}
            onChange={(e) => setCfg({ ...cfg, sprintLength: Number(e.target.value) })}
          />
          <label htmlFor="sprintLength">Sprint length (chars)</label>
        </div>
        <div className="row">
          <input
            id="emphasizeTrouble"
            type="checkbox"
            checked={cfg.emphasizeTrouble}
            onChange={(e) => setCfg({ ...cfg, emphasizeTrouble: e.target.checked })}
          />
          <label htmlFor="emphasizeTrouble">Emphasize trouble chars</label>
        </div>
        <div className="row">
          <div className="range">
            <input
              id="numberLine"
              type="range"
              min={1}
              max={8}
              step={1}
              value={cfg.numberLineEmphasis ?? 4}
              onChange={(e) => setCfg({ ...cfg, numberLineEmphasis: Number(e.target.value) })}
            />
            <span className="range-val">{cfg.numberLineEmphasis ?? 4}×</span>
          </div>
          <label htmlFor="numberLine">Number-row emphasis</label>
        </div>

        <div className="grid two">
          <button className="btn primary" onClick={onStart}>Start Sprint</button>
          <button className="btn" onClick={onProgress}>View Progress</button>
        </div>
      </div>

      <div className="card">
        <h3>Tips</h3>
        <ul className="tips">
          <li>Keep eyes on screen; trust muscle memory.</li>
          <li>Use relaxed posture; minimize hand movement.</li>
          <li>Accuracy first, speed follows.</li>
        </ul>
        <button className="btn subtle" onClick={() => setCfg(defaultConfig)}>Reset Settings</button>
      </div>
    </div>
  );
}

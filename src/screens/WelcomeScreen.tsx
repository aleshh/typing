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
          <label>Sprint length (chars)</label>
          <input
            type="number"
            min={200}
            max={3000}
            value={cfg.sprintLength}
            onChange={(e) => setCfg({ ...cfg, sprintLength: Number(e.target.value) })}
          />
        </div>
        <div className="row">
          <label>Emphasize trouble chars</label>
          <input
            type="checkbox"
            checked={cfg.emphasizeTrouble}
            onChange={(e) => setCfg({ ...cfg, emphasizeTrouble: e.target.checked })}
          />
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


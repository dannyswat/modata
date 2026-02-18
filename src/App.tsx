import React, { useState } from 'react';
import DemoModal from './components/DemoModal';
import './App.css';

const App: React.FC = () => {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="app landing">
      {/* ── Hero ── */}
      <div className="landing-hero">
        <div className="landing-badge">Open Source · MIT License</div>

        <h1 className="landing-title">
          <span className="landing-title-mo">mod</span>
          <span className="landing-title-data">ata</span>
        </h1>

        <p className="landing-tagline">
          A visual data-modelling canvas for React.
          <br />
          Design entities, fields, and relationships with a drag-and-drop interface.
        </p>

        <div className="landing-actions">
          <button
            className="btn-demo"
            onClick={() => setDemoOpen(true)}
          >
            ▶ Try the Demo
          </button>
          <a
            className="btn-secondary"
            href="https://github.com/dannyswat/modata"
            target="_blank"
            rel="noreferrer"
          >
            GitHub →
          </a>
        </div>

        <ul className="landing-features">
          <li>⚡ Drag-and-drop entity builder</li>
          <li>🔗 Visual relationship mapping</li>
          <li>💾 Export JSON / PNG / SVG</li>
          <li>🔌 Embeddable React component</li>
        </ul>
      </div>

      {/* ── Demo curtain ── */}
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
};

export default App;

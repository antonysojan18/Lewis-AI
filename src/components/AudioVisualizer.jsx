import React from 'react';

export default function AudioVisualizer({ isActive = false, label = "Speaking...", color = "#34d399" }) {
  if (!isActive) return null;

  return (
    <div className="audio-visualizer-wrap" style={{ '--vis-color': color }}>
      <div className="audio-wave-bars">
        <span className="wave-bar bar-1" />
        <span className="wave-bar bar-2" />
        <span className="wave-bar bar-3" />
        <span className="wave-bar bar-4" />
        <span className="wave-bar bar-5" />
        <span className="wave-bar bar-6" />
        <span className="wave-bar bar-7" />
        <span className="wave-bar bar-8" />
      </div>
      {label && <span className="audio-wave-label">{label}</span>}
    </div>
  );
}

import React from 'react';
import heroScene from '../../assets/hero-provenance-scene.svg';

export function MotionShowcase() {
  return (
    <div className="motion-showcase" aria-label="Model provenance visual reel">
      <img
        src={heroScene}
        alt="Illustrated workstation scene showing model training, provenance verification, and audit workflow."
        className="motion-showcase-poster"
      />

      <div className="motion-showcase-overlay">
        <div className="motion-showcase-badge">Demo Motion</div>
        <div className="motion-showcase-orbit motion-showcase-orbit-one" />
        <div className="motion-showcase-orbit motion-showcase-orbit-two" />
        <div className="motion-showcase-scanline" />
        <div className="motion-showcase-pulses">
          <span />
          <span />
          <span />
        </div>
        <div className="motion-showcase-footer">
          <div>
            <p className="motion-showcase-title">AI Model Provenance Workflow</p>
            <p className="motion-showcase-copy">{'training -> hashing -> proof -> IPFS -> chain verification'}</p>
          </div>
          <div className="motion-showcase-timeline">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}

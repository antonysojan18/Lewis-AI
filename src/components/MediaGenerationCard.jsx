import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Video, Image as ImageIcon, CheckCircle2, Download, ExternalLink } from "lucide-react";

const IMAGE_STEPS = [
  "Sampling latent space...",
  "Denoising diffusion steps...",
  "Enhancing high-frequency details...",
  "Applying color grading...",
];

const VIDEO_STEPS = [
  "Interpolating temporal latent frames...",
  "Solving motion consistency vectors...",
  "Rendering cinematic lighting...",
  "Finalizing high-FPS pass...",
];

export default function MediaGenerationCard({ type = "image", prompt, mediaUrl }) {
  const steps = type === "video" ? VIDEO_STEPS : IMAGE_STEPS;
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  // Cycle through realistic status checkpoints every 1.8s while loading
  useEffect(() => {
    if (mediaUrl) return;
    const interval = setInterval(() => {
      setCurrentStepIdx((prev) => (prev + 1) % steps.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [mediaUrl, steps.length]);

  return (
    <div className="media-gen-card">
      {/* Header Info */}
      <div className="media-gen-header">
        <div className="media-gen-type">
          {type === "video" ? <Video size={16} /> : <ImageIcon size={16} />}
          <span>{type} Generation</span>
        </div>
        {!mediaUrl ? (
          <span className="media-gen-status-badge synthesizing">
            <span className="ping-dot" />
            SYNTHESIZING
          </span>
        ) : (
          <span className="media-gen-status-badge ready">
            <CheckCircle2 size={14} />
            READY
          </span>
        )}
      </div>

      {/* Media Viewport */}
      <div className="media-gen-viewport">
        <AnimatePresence mode="wait">
          {!mediaUrl ? (
            /* --- GENERATION / RENDERING ANIMATION --- */
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="media-gen-loader"
            >
              {/* Pulsing Latent Energy Rings */}
              <div className="latent-ring-wrapper">
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  className="latent-ring ring-outer"
                />
                <motion.div
                  animate={{ rotate: -360, scale: [1.1, 0.95, 1.1] }}
                  transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                  className="latent-ring ring-inner"
                />
                <div className="latent-center-core">
                  <Sparkles size={20} className="sparkle-pulse" />
                </div>
              </div>

              {/* Shimmering Scanline Wipe */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                className="scanline-wipe"
              />

              {/* Dynamic Status Text */}
              <motion.p
                key={currentStepIdx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
                className="step-text"
              >
                {steps[currentStepIdx]}
              </motion.p>
              <span className="pipeline-subtext">Lewis diffusion pipeline running</span>
            </motion.div>
          ) : (
            /* --- RENDERED FINAL MEDIA --- */
            <motion.div
              key="output"
              initial={{ opacity: 0, scale: 1.04, filter: "blur(12px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="media-rendered-container"
            >
              {type === "video" ? (
                <video
                  src={mediaUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                  className="media-output-asset"
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt={prompt || "Generated media"}
                  className="media-output-asset"
                  loading="lazy"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Prompt Caption & Quick Actions */}
      <div className="media-gen-footer">
        <p className="media-prompt-caption">
          "{prompt}"
        </p>
        {mediaUrl && (
          <div className="media-actions">
            <a 
              href={mediaUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="media-action-btn"
              title="Open full resolution"
            >
              <ExternalLink size={13} />
              <span>Full View</span>
            </a>
            <a 
              href={mediaUrl} 
              download={`lewis-${type}-${Date.now()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="media-action-btn"
              title="Download asset"
            >
              <Download size={13} />
              <span>Save</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

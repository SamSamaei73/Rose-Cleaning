"use client";

import { useId, useState } from "react";
import { CleanerCanvas } from "./cleaner-canvas";
import { Pause, Play } from "lucide-react";
import styles from "./auth-experience.module.css";

/** A real 3D companion in the original reserved space outside the form. */
export function CleaningCompanion() {
  const id = useId().replaceAll(":", "");
  const [paused, setPaused] = useState(false);
  return (
    <div className={styles.scene} data-paused={paused} data-cleaning-scene>
      <div
        id={`${id}-animation`}
        className={styles.sceneArtwork}
        aria-hidden="true"
      >
        <div className={styles.window}>
          <span />
          <span />
          <span />
        </div>
        <div className={styles.sunlight} />
        <svg className={styles.plant} viewBox="0 0 120 210" focusable="false">
          <path
            d="M60 159C58 122 59 82 66 35M60 121L34 82M60 100L86 65M60 143L87 112"
            fill="none"
            stroke="#75826b"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M66 70C44 52 48 27 69 16C82 40 79 58 66 70Z"
            fill="#8d9b81"
          />
          <path
            d="M52 109C24 107 14 85 17 68C43 71 56 88 52 109Z"
            fill="#657a62"
          />
          <path
            d="M62 93C64 66 83 49 103 52C101 77 84 94 62 93Z"
            fill="#a2ae93"
          />
          <path
            d="M62 137C68 114 90 102 107 110C100 131 84 141 62 137Z"
            fill="#788c70"
          />
          <path d="M37 153H85L79 198Q60 208 43 198Z" fill="#c48d71" />
          <path d="M37 153H85L83 166H39Z" fill="#dba98b" />
          <path
            d="M48 174L51 195M60 174V198M72 174L69 195"
            stroke="#b77b60"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <div className={styles.floor} />
        <CleanerCanvas paused={paused} variant="companion" />
      </div>
      <div className={styles.sceneCaption}>
        <span>A little care, in motion.</span>
        <button
          type="button"
          className={styles.motionToggle}
          aria-controls={`${id}-animation`}
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
        >
          {paused ? (
            <Play size={14} aria-hidden="true" />
          ) : (
            <Pause size={14} aria-hidden="true" />
          )}
          {paused ? "Play animation" : "Pause animation"}
        </button>
      </div>
    </div>
  );
}

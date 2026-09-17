import React from "react";

const FAR =
  "M0 320 L0 190 L120 120 L215 175 L330 90 L440 165 L560 105 L690 180 L800 120 L925 185 L1040 130 L1165 195 L1280 140 L1380 185 L1440 150 L1440 320 Z";

const MID =
  "M0 320 L0 230 C120 190 200 260 320 245 C450 228 520 175 660 200 C790 222 860 275 990 258 C1120 240 1200 195 1320 215 C1380 225 1410 240 1440 232 L1440 320 Z";

const NEAR =
  "M0 320 L0 272 C140 250 260 292 400 285 C560 277 640 250 800 262 C960 274 1060 300 1220 288 C1320 280 1390 268 1440 274 L1440 320 Z";

export const PlanScene: React.FC = () => (
  <div data-gc="plan.plan-scene.div" aria-hidden className="plan-scene">
    <span data-gc="plan.plan-scene.span" className="plan-scene-stars" />

    <svg data-gc="plan.plan-scene.svg" className="plan-scene-band h-[46vh]" viewBox="0 0 1440 320" preserveAspectRatio="none">
      <path data-gc="plan.plan-scene.path" className="plan-scene-far" d={FAR} />
    </svg>

    <svg data-gc="plan.plan-scene.svg--2" className="plan-scene-band h-[32vh]" viewBox="0 0 1440 320" preserveAspectRatio="none">
      <path data-gc="plan.plan-scene.path--2" className="plan-scene-mid" d={MID} />
    </svg>

    <svg data-gc="plan.plan-scene.svg--3" className="plan-scene-band h-[20vh]" viewBox="0 0 1440 320" preserveAspectRatio="none">
      <path data-gc="plan.plan-scene.path--3" className="plan-scene-near" d={NEAR} />
    </svg>
  </div>
);

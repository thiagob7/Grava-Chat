import * as React from "react";

export const DesenhoDaSeta: React.FC = () => (
  <>
    <polygon points="0,-2 30,-2 30,0 15,10 0,0" className="fill-surface-4" />
    <path
      d="M0,0 15,10 30,0"
      fill="none"
      strokeWidth={1}
      vectorEffect="non-scaling-stroke"
      className="stroke-line"
    />
  </>
);

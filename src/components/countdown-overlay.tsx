// components/CountdownOverlay.tsx

import React from "react";

interface CountdownOverlayProps {
  count: number;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({
  count,
}) => (
  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div className="text-6xl font-bold text-white">{count}</div>
  </div>
);

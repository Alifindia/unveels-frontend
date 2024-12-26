// components/ErrorOverlay.tsx

import React from "react";

interface ErrorOverlayProps {
  message: string;
}

export const ErrorOverlay: React.FC<ErrorOverlayProps> = ({ message }) => (
  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <p className="text-lg text-white">{message}</p>
  </div>
);

// components/ToggleCameraButton.tsx

import React from "react";

interface ToggleCameraButtonProps {
  onClick: () => void;
}

export const ToggleCameraButton: React.FC<ToggleCameraButtonProps> = ({
  onClick,
}) => (
  <button
    onClick={onClick}
    className="absolute bottom-4 right-4 rounded bg-blue-500 p-3 text-white shadow-lg transition duration-300 hover:bg-blue-600"
  >
    Flip Camera
  </button>
);

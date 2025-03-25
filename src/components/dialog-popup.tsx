import React, { useState } from "react";

interface DialogPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  positiveButtonText?: string;
  negativeButtonText?: string;
}

const DialogPopup: React.FC<DialogPopupProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  positiveButtonText = "Confirm",
  negativeButtonText = "Cancel",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative mx-4 w-full max-w-md rounded-3xl bg-[#00000033] p-6 shadow-xl backdrop-blur-md">
        <div className="mb-6 text-center">
          <h2 className="font-medium text-white">{title}</h2>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="relative rounded-lg px-6 py-2 font-medium text-white transition-all hover:bg-yellow-600/10"
            style={{
              color: "white",
            }}
          >
            <span
              className="absolute inset-0 rounded-lg"
              style={{
                background: "linear-gradient(to right, #CA9C43, #92702D)",
                padding: "2px",
                borderRadius: "8px",
                WebkitMask:
                  "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                zIndex: "-1",
              }}
            ></span>
            {negativeButtonText}
          </button>

          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="rounded-lg bg-yellow-600 px-8 py-3 font-medium text-white transition-all hover:bg-yellow-700"
            style={{
              background: "linear-gradient(to right, #CA9C43, #92702D)",
              color: "white",
            }}
          >
            {positiveButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DialogPopup;

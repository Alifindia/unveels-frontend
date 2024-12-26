import React, { createContext, useState, useContext, ReactNode } from "react";

interface InferenceContextProps {
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  inferenceError: string | null;
  setInferenceError: React.Dispatch<React.SetStateAction<string | null>>;
  isInferenceRunning: boolean;
  setIsInferenceRunning: React.Dispatch<React.SetStateAction<boolean>>;
  isInferenceFinished: boolean;
  setIsInferenceFinished: React.Dispatch<React.SetStateAction<boolean>>;
}

const InferenceContext = createContext<InferenceContextProps | undefined>(
  undefined,
);

export const InferenceProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [inferenceError, setInferenceError] = useState<string | null>(null);
  const [isInferenceRunning, setIsInferenceRunning] = useState<boolean>(false);
  const [isInferenceFinished, setIsInferenceFinished] =
    useState<boolean>(false);

  return (
    <InferenceContext.Provider
      value={{
        isLoading,
        setIsLoading,
        inferenceError,
        setInferenceError,
        isInferenceRunning,
        setIsInferenceRunning,
        isInferenceFinished,
        setIsInferenceFinished,
      }}
    >
      {children}
    </InferenceContext.Provider>
  );
};

export const useInferenceContext = () => {
  const context = useContext(InferenceContext);
  if (!context) {
    throw new Error(
      "useInferenceContext must be used within an InferenceProvider",
    );
  }
  return context;
};

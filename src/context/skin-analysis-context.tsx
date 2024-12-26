// MakeupContext.tsx
import React, { createContext, ReactNode, useContext, useState } from "react";
import { SkinAnalysisItem } from "../types/skinAnalysisItem";
import { SkinAnalysisResult } from "../types/skinAnalysisResult";
import { skinAnalysisDataItem } from "../utils/constants";

interface SkinAnalysisContextProps {
  tab: string;
  setTab: (tab: string) => void;

  view: "face" | "problems" | "results";
  setView: (view: "face" | "problems" | "results") => void;

  skinAnalysisData: SkinAnalysisItem[];
  setSkinAnalysisData: React.Dispatch<React.SetStateAction<SkinAnalysisItem[]>>;

  skinAnalysisResult: SkinAnalysisResult[];
  setSkinAnalysisResult: React.Dispatch<
    React.SetStateAction<SkinAnalysisResult[]>
  >;

  getScoresByLabel: (label: string) => number[];

  getTotalScoreByLabel: (label: string) => number;

  calculateSkinHealthScore: () => number;

  calculateAverageSkinProblemsScore: () => number;
  calculateAverageSkinConditionScore: () => number;
}

const SkinAnalysisContext = createContext<SkinAnalysisContextProps | undefined>(
  undefined,
);

interface SkinAnalysisProviderProps {
  children: ReactNode;
}

export const SkinAnalysisProvider: React.FC<SkinAnalysisProviderProps> = ({
  children,
}) => {
  const [tab, setTab] = useState<string>("acne");
  const [view, setView] = useState<"face" | "problems" | "results">("face");
  const [skinAnalysisData, setSkinAnalysisData] =
    useState<SkinAnalysisItem[]>(skinAnalysisDataItem);

  const [skinAnalysisResult, setSkinAnalysisResult] = useState<
    SkinAnalysisResult[]
  >([]);

  const calculateAverageSkinProblemsScore = (): number => {
    const skinProblemsLabels = [
      "texture",
      "dark circle",
      "eyebag",
      "wrinkles",
      "pores",
      "spots",
      "acne",
    ];
    const scores = skinProblemsLabels.map((label) => {
      const labelScores = skinAnalysisResult
        .filter((item) => item.label.toLowerCase() === label)
        .map((item) => item.score);
      return labelScores.length > 0
        ? labelScores.reduce((total, score) => total + score, 0) /
            labelScores.length
        : 0;
    });

    const averageScore =
      scores.reduce((total, score) => total + score, 0) /
      skinProblemsLabels.length;
    return Math.round(averageScore);
  };

  // Fungsi untuk menghitung rata-rata Detected Skin Condition berdasarkan label tertentu
  const calculateAverageSkinConditionScore = (): number => {
    const skinConditionLabels = [
      "firmness",
      "droopy eyelid upper",
      "droopy eyelid lower",
      "moistures",
      "oily",
      "redness",
      "radiance",
    ];
    const scores = skinConditionLabels.map((label) => {
      const labelScores = skinAnalysisResult
        .filter((item) => item.label.toLowerCase() === label)
        .map((item) => item.score);
      return labelScores.length > 0
        ? labelScores.reduce((total, score) => total + score, 0) /
            labelScores.length
        : 0;
    });

    const averageScore =
      scores.reduce((total, score) => total + score, 0) /
      skinConditionLabels.length;
    return Math.round(averageScore);
  };

  const getScoresByLabel = (label: string): number[] => {
    console.log(label);

    return skinAnalysisResult
      .filter((item) => item.label.toLowerCase() === label.toLowerCase())
      .map((item) => item.score);
  };

  const getTotalScoreByLabel = (label: string): number => {
    const scores = skinAnalysisResult
      .filter((item) => item.label.toLowerCase() === label.toLowerCase())
      .map((item) => item.score);

    if (scores.length === 0) return 0;

    const averageScore =
      scores.reduce((total, score) => total + score, 0) / scores.length;

    return Math.round((averageScore / 100) * 100);
  };

  const calculateSkinHealthScore = (): number => {
    const scores = skinAnalysisResult.map((item) => item.score);
    if (scores.length === 0) return 0;

    const averageScore =
      scores.reduce((total, score) => total + score, 0) / scores.length;
    return Math.round(averageScore);
  };

  return (
    <SkinAnalysisContext.Provider
      value={{
        tab,
        setTab,

        view,
        setView,

        skinAnalysisData,
        setSkinAnalysisData,

        getScoresByLabel,

        getTotalScoreByLabel,

        calculateSkinHealthScore,

        calculateAverageSkinConditionScore,
        calculateAverageSkinProblemsScore,

        skinAnalysisResult,
        setSkinAnalysisResult,
      }}
    >
      {children}
    </SkinAnalysisContext.Provider>
  );
};

export const useSkinAnalysis = () => {
  const context = useContext(SkinAnalysisContext);
  if (!context) {
    throw new Error(
      "useSkinAnalysis must be used within a SkinAnalysisProvider",
    );
  }
  return context;
};

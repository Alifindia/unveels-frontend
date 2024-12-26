import React, { createContext, useContext, useState } from "react";

// Define the context type
interface FilterContextType {
  selectedFormation: string;
  setSelectedFormation: (value: string) => void;
  selectedBrand: string;
  setSelectedBrand: (value: string) => void;
  selectedCountry: string;
  setSelectedCountry: (value: string) => void;
  selectedSizeOne: string;
  setSelectedSizeOne: (value: string) => void;
  selectedSizeTwo: string;
  setSelectedSizeTwo: (value: string) => void;
  minPrice: number;
  setMinPrice: (value: number) => void;
  maxPrice: number;
  setMaxPrice: (value: number) => void;
  sort: boolean;
  setSort: (value: boolean) => void;
}

// Create the context with a default value
const FilterContext = createContext<FilterContextType | undefined>(undefined);

// Create a custom hook to use the context
export const useFilterContext = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilterContext must be used within a FilterProvider");
  }
  return context;
};

// Create a provider component
export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedSizeOne, setSelectedSizeOne] = useState<string>("");
  const [selectedSizeTwo, setSelectedSizeTwo] = useState<string>("");
  const [selectedFormation, setSelectedFormation] = useState<string>("");
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [sort, setSort] = useState<boolean>(false);

  return (
    <FilterContext.Provider
      value={{
        selectedFormation,
        setSelectedFormation,
        selectedBrand,
        setSelectedBrand,
        selectedCountry,
        setSelectedCountry,
        selectedSizeOne,
        setSelectedSizeOne,
        selectedSizeTwo,
        setSelectedSizeTwo,
        minPrice,
        setMinPrice,
        maxPrice,
        setMaxPrice,
        sort,
        setSort,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

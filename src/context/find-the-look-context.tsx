import React, { createContext, useState, useContext, useReducer } from "react";
import { Product } from "../api/shared";
import { FindTheLookItems } from "../types/findTheLookItems";

interface FindThelookContextType {
  findTheLookItems: FindTheLookItems[] | null;
  setFindTheLookItems: (FindTheLookItems: FindTheLookItems[] | null) => void;
  tab: string | null;
  setTab: (tab: string | null) => void;
  section: string | null;
  setSection: (section: string | null) => void;
  addFindTheLookItem: (item: FindTheLookItems) => void;
  selectedItems: {
    items: Product[];
  };
  dispatch: React.Dispatch<Action>;
  view: "face" | "single_category" | "recommendations" | "all_categories";
  setView: React.Dispatch<
    React.SetStateAction<
      "face" | "single_category" | "recommendations" | "all_categories"
    >
  >;
}

// Create the context
const FindTheLookContext = createContext<FindThelookContextType | undefined>(
  undefined,
);

type Action =
  | { type: "add"; payload: Product }
  | { type: "remove"; payload: Product }
  | { type: "reset" };

function cartReducer(
  state: {
    items: Product[];
  },
  action: Action,
) {
  switch (action.type) {
    case "add":
      // Check if the item is already selected
      if (state.items.find((item) => item.id === action.payload.id)) {
        return state;
      }

      return {
        items: [...state.items, action.payload],
      };
    case "remove":
      return {
        items: state.items.filter((item) => item.id !== action.payload.id),
      };
    case "reset":
      return {
        items: [],
      };
    default:
      return state;
  }
}

// Create a provider component
export function FindTheLookProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  //   Make a cart reducer with `useReducer`
  const [cart, dispatch] = useReducer(cartReducer, {
    items: [],
  });

  const [view, setView] = useState<FindThelookContextType["view"]>("face");
  const [findTheLookItems, setFindTheLookItems] = useState<
    FindTheLookItems[] | null
  >(null);

  const addFindTheLookItem = (item: FindTheLookItems) => {
    setFindTheLookItems((prevItems) => [...(prevItems || []), item]);
  };

  const [tab, setTab] = useState<string | null>(null);
  const [section, setSection] = useState<string | null>(null);

  return (
    <FindTheLookContext.Provider
      value={{
        tab,
        setTab,
        section,
        setSection,
        findTheLookItems,
        setFindTheLookItems,
        addFindTheLookItem,
        selectedItems: cart,
        dispatch,
        view,
        setView,
      }}
    >
      {children}
    </FindTheLookContext.Provider>
  );
}

// Custom hook to use the context
export function useFindTheLookContext() {
  const context = useContext(FindTheLookContext);
  if (context === undefined) {
    throw new Error(
      "useFindTheLookContext must be used within a FindTheLookProvider",
    );
  }
  return context;
}

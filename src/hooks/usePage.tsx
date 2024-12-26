import React, { ReactNode, useState, useContext, createContext } from "react";

const defaultPage = "virtual-try-on" as const;

const pages = [
  "skin-tone-finder",
  "personality-finder",
  "skin-analysis",
  "face-analyzer",
  "personality-finder-web",
  "virtual-try-on",
] as const;

export type Page = (typeof pages)[number] | null;

interface PageContextType {
  page: Page;
  setPage: (page: Page) => void;
}

const PageContext = createContext<PageContextType | undefined>(undefined);

export const PageProvider = ({ children }: { children: ReactNode }) => {
  const [page, setPage] = useState<Page>(defaultPage);

  return (
    <PageContext.Provider value={{ page, setPage }}>
      {children}
    </PageContext.Provider>
  );
};

export const usePage = (): PageContextType => {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error("usePage must be used within a PageProvider");
  }
  return context;
};

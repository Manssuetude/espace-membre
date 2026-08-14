import { createContext, useContext, useState, ReactNode } from "react";

interface PageTitleContextType {
  title: string | null;
  subtitle: string | null;
  setPageTitle: (title: string | null, subtitle: string | null) => void;
}

const PageTitleContext = createContext<PageTitleContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with its provider, splitting would ripple across many import sites
export const usePageTitle = () => {
  const context = useContext(PageTitleContext);
  if (!context) {
    throw new Error("usePageTitle must be used within a PageTitleProvider");
  }
  return context;
};

interface PageTitleProviderProps {
  children: ReactNode;
}

export const PageTitleProvider = ({ children }: PageTitleProviderProps) => {
  const [title, setTitle] = useState<string | null>(null);
  const [subtitle, setSubtitle] = useState<string | null>(null);

  const setPageTitle = (newTitle: string | null, newSubtitle: string | null) => {
    setTitle(newTitle);
    setSubtitle(newSubtitle);
  };

  return <PageTitleContext.Provider value={{ title, subtitle, setPageTitle }}>{children}</PageTitleContext.Provider>;
};

import { createContext, useContext } from "react";

export interface ActivityRecord {
  type: string;
  id: string;
  status?: string;
  createdBy?: string;
  createdDate?: string;
  completion?: number;
}

export interface PanelContextType {
  activePanel: "ai" | "activity" | null;
  setActivePanel: (panel: "ai" | "activity" | null) => void;
  activeRecord: ActivityRecord | null;
  openActivity: (record: ActivityRecord) => void;
  closeActivity: () => void;
}

export const PanelContext = createContext<PanelContextType | undefined>(undefined);

export function useActivity() {
  const context = useContext(PanelContext);
  if (!context) {
    throw new Error("useActivity must be used within a PanelProvider");
  }
  return context;
}

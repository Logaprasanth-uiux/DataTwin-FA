import { createContext } from "react";

export interface ActivityRecord {
  type: string;
  id: string;
  name: string;
  status: string;
  createdBy: string;
  createdDate: string;
}

export const ActivityContext = createContext<(record: ActivityRecord | null) => void>(() => {});
export const AuthContext = createContext<{ onLogout: () => void }>({ onLogout: () => {} });

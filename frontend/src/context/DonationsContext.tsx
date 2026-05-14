import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadDonationsFromStorage, syncDonationState, donations } from "../lib/app-data";

type DonationsApi = {
  version: number;
  bump: () => void;
};

const DonationsContext = createContext<DonationsApi | null>(null);

export function DonationsProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const value = useMemo(() => {
    void version;
    return { version, bump };
  }, [version, bump]);

  useEffect(() => {
    loadDonationsFromStorage();
    syncDonationState();
    bump();
  }, [bump]);

  return <DonationsContext.Provider value={value}>{children}</DonationsContext.Provider>;
}

export function useDonationsRefresh(): DonationsApi {
  const v = useContext(DonationsContext);
  if (!v) throw new Error("useDonationsRefresh outside DonationsProvider");
  return v;
}

export function useDonationsList(): typeof donations {
  const { version } = useDonationsRefresh();
  void version;
  return donations;
}

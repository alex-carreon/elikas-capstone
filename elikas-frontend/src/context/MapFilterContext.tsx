import { createContext, useContext, useState } from "react";

type MapFilterContextType = {
  showPaths: boolean;
  setShowPaths: (val: boolean) => void;
};

const MapFilterContext = createContext<MapFilterContextType | null>(null);

export function MapFilterProvider({ children }: { children: React.ReactNode }) {
  const [showPaths, setShowPaths] = useState(true);

  return (
    <MapFilterContext.Provider value={{ showPaths, setShowPaths }}>
      {children}
    </MapFilterContext.Provider>
  );
}

export const useMapFilterContext = () => {
  const context = useContext(MapFilterContext);
  if (!context)
    throw new Error("useMapFilterContext must be inside MapFilterProvider");
  return context;
};

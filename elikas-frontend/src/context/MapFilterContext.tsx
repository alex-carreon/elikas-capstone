import { createContext, useContext, useState } from "react";

type MapFilterContextType = {
  showPaths: boolean;
  setShowPaths: (val: boolean) => void;
  allPins: boolean;
  setAllPins: (val: boolean) => void;
  showGovPins: boolean;
  setShowGovPins: (val: boolean) => void;
  showOtherPins: boolean;
  setShowOtherPins: (val: boolean) => void;
};

const MapFilterContext = createContext<MapFilterContextType | null>(null);

export function MapFilterProvider({ children }: { children: React.ReactNode }) {
  const [showPaths, setShowPaths] = useState(true);
  const [allPins, setAllPins] = useState(true);
  const [showGovPins, setShowGovPins] = useState(true);
  const [showOtherPins, setShowOtherPins] = useState(true);

  return (
    <MapFilterContext.Provider
      value={{
        showPaths,
        setShowPaths,
        allPins,
        setAllPins,
        showGovPins,
        setShowGovPins,
        showOtherPins,
        setShowOtherPins,
      }}
    >
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

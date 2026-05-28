import MapComp from "@/components/Map";
import "leaflet/dist/leaflet.css";
import Filter from "@/components/Filter";
import { useState } from "react";
import { MapFilterProvider } from "@/context/MapFilterContext";

function Map() {
  return (
    <div className="flex justify-center pt-13 w-full">
      <div className="max-w-md w-full">
        <MapFilterProvider>
          {/* <div className="fixed w-full max-w-md"> */}
          <Filter />
          {/* </div> */}
          <MapComp />
        </MapFilterProvider>
      </div>
    </div>
  );
}

export default Map;

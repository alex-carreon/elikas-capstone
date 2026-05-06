import MapComp from "./components/Map";
import ButtonComp from "./components/Button";
import "leaflet/dist/leaflet.css";
import { Routing } from "@/lib/mapUtils";
import DrawerComp from "./components/Drawer";
import { useState } from "react";

function Map() {
  return (
    <div className="flex justify-center pt-18">
      <MapComp />
    </div>
  );
}

export default Map;

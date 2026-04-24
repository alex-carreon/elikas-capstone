import MapComp from "./components/Map";
import ButtonComp from "./components/Button";
import "leaflet/dist/leaflet.css";
import { Routing } from "@/lib/mapUtils";

function Map() {
  return (
    <div className="flex justify-center pt-18">
      {/* <DrawerComp /> */}
      <MapComp />
    </div>
  );
}

export default Map;

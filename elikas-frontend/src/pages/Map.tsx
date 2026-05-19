import MapComp from "@/components/Map";
import "leaflet/dist/leaflet.css";
import Filter from "@/components/Filter";

function Map() {
  return (
    <div className="flex justify-center pt-18">
      <div className="max-w-md w-full ">
        {/* <div className="fixed w-full max-w-md"> */}
        <Filter />
        {/* </div> */}
        <MapComp />
      </div>
    </div>
  );
}

export default Map;

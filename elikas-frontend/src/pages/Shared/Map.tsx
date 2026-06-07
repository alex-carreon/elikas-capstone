import MapComp from "@/components/Map";
import "leaflet/dist/leaflet.css";
import Filter from "@/components/Filter";
import { MapContainer } from "react-leaflet";
import { type LatLngBoundsExpression } from "leaflet";
import { useRef, useState } from "react";
import { Map as LeafletMap } from "leaflet";
import { useUserContext } from "@/context/AuthContext";
import ButtonComp from "@/components/Button";
import CurrentLocation from "@/assets/Map/currentLocation.svg?react";

function Map() {
  const [locationFound, setLocationFound] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showNearestRouteTrigger, setShowNearestRouteTrigger] = useState(0);

  const philippinesBounds: LatLngBoundsExpression = [
    [4.5, 116.0], // southwest corner
    [21.5, 127.0], // northeast corner
  ];

  const mapRef = useRef<LeafletMap | null>(null);

  const handleNearestRoute = () => {
    if (locationFound) {
      // setShowNearestRoute(true);
      // setShowRoute(false);
      // setSelectedPin(null);
      // setOpenFromRoute(true);
      setShowNearestRouteTrigger((prev) => prev + 1);
    } else console.log("Location not found");
  };

  let authorized = false;
  let admin = false;
  const { role } = useUserContext();

  if (role) {
    authorized = true;
  }

  if (role === "admin") {
    admin = true;
  }

  return (
    <div className="flex justify-center pt-13 w-full">
      <div className="max-w-md w-full">
        <MapContainer
          id="Map_Container"
          style={{ height: "94vh", width: "100%" }}
          maxBounds={philippinesBounds}
          maxBoundsViscosity={1.0}
          minZoom={6}
          ref={mapRef}
        >
          <MapComp
            onLocationFound={setLocationFound}
            showLocation={showLocation}
            nearestRouteTrigger={showNearestRouteTrigger}
          />
        </MapContainer>
        {/* <div className="fixed w-full max-w-md"> */}
        <div
          className="absolute top-0 left-0 w-full pointer-events-none z-[1000]"
          style={{ height: "94vh" }}
        >
          <div className="flex justify-center pt-13">
            <div className="max-w-md w-full pointer-events-auto">
              <Filter />
            </div>
          </div>
        </div>
        <div className="fixed bottom-0 left-0 w-full flex justify-center items-center pointer-events-none">
          <div className="flex flex-col w-full max-w-md items-center justify-center mb-8 pointer-events-auto">
            <CurrentLocation
              className="w-14 h-14 self-end m-4 drop-shadow-xl"
              onClick={() => setShowLocation((prev) => !prev)}
            />
            {!admin && (
              <ButtonComp
                text="Find Evac Center"
                variant="important"
                id="Map_NearestRouteBtn"
                onClick={handleNearestRoute}
                widthSize="90%"
                heightSize="50px"
              />
            )}
          </div>
        </div>
      </div>
    </div>
    //     </div>
    //   </div>
    // </div>
  );
}

export default Map;

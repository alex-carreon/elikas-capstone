import { useRef, useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap, CircleMarker } from "react-leaflet";
import "leaflet-routing-machine";
import ButtonComp from "./Button";
import {
  Routing,
  PinMarking,
  FlyToLocation,
  RoadMapping,
  NearestRouting,
  MapClickHandler,
  SensorMarking,
} from "@/lib/mapUtils";
import DrawerComp from "./Drawer";
import MarkerClusterGroup from "react-leaflet-cluster";
import {
  divIcon,
  point,
  type LocationEvent,
  LatLng,
  type LatLngBoundsExpression,
} from "leaflet";
import CurrentLocation from "@/assets/Map/currentLocation.svg?react";
import AlertDialogue from "./AlertDialogue";
import { createPortal } from "react-dom";
import { useUserContext } from "@/context/AuthContext";

// let locationFound = false;

function LocationMarker({
  flyToLocation,
  locationFound,
}: {
  flyToLocation: boolean;
  locationFound: (found: boolean) => void;
}) {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [showDialogue, setShowDialogue] = useState(true);
  // const [hasLocated, setHasLocated] = useState(false);
  const map = useMap();

  const hasLocated = useRef(false);

  // Auto find location
  useEffect(() => {
    if (hasLocated.current === true) return;

    // Locate user, zooms into location, how much zoom
    map.locate({ watch: true, setView: true, maxZoom: 50 });

    // For rendering the marker
    // e contains lat and long
    // If it's the first time, map.flyTo flies to the specific location
    const onLocationFound = (e: LocationEvent) => {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
      hasLocated.current = true;
      locationFound(true);
    };

    // listens when to trigger onLocationFound

    map.on("locationfound", onLocationFound);

    // clean up - switches event off
    return () => {
      map.off("locationfound", onLocationFound);
    };
  }, [map]);

  // find location on click
  useEffect(() => {
    if (flyToLocation && position) {
      map.flyTo(position, map.getZoom());
      console.log("hasLocated3: ", hasLocated);
    }
  }, [flyToLocation, position, map]);

  //Replace null with alertDialogue to prompt user to open location
  return position === null ? null : (
    <CircleMarker
      center={position}
      radius={8}
      pathOptions={{
        color: "white",
        fillColor: "#569FFF",
        fillOpacity: 1,
        weight: 2,
      }}
    ></CircleMarker>
  );
}

function Map() {
  const [showNearestRoute, setShowNearestRoute] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [open, setOpen] = useState(false);
  const [openFromRoute, setOpenFromRoute] = useState(false);
  const [selectedPin, setSelectedPin] = useState(null);
  // const [position, setPosition] = useState(null);
  const [flyTrigger, setFlyTrigger] = useState(0);
  const [newPin, setNewPin] = useState(false);
  const [clickedLoc, setClickedLoc] = useState<[number, number] | null>(null);
  const [showLocation, setShowLocation] = useState(false);
  const [locationFound, setLocationFound] = useState(false);
  const [isSensor, setIsSensor] = useState(false);

  const philippinesBounds: LatLngBoundsExpression = [
    [4.5, 116.0], // southwest corner
    [21.5, 127.0], // northeast corner
  ];

  let authorized = false;
  const { role } = useUserContext();

  if (role) {
    authorized = true;
  }

  // Have pin's type to be needed information from db
  const handlePinClick = (pin) => {
    setSelectedPin(pin);
    setOpen(true);
    setFlyTrigger((prev) => prev + 1);
    setShowNearestRoute(false);
    setShowRoute(false);
    setOpenFromRoute(false);

    const isExisting = !!pin.id;
    setNewPin(!isExisting);

    if (isExisting) {
      setClickedLoc(null);
    }
    setIsSensor(false);
  };

  const handleSensorClick = (pin) => {
    setSelectedPin(pin);
    setOpen(true);
    setFlyTrigger((prev) => prev + 1);
    setShowNearestRoute(false);
    setShowRoute(false);
    setOpenFromRoute(false);
    setClickedLoc(null);

    const sensor = !!pin.id;
    setIsSensor(sensor);

    if (sensor) {
      setClickedLoc(null);
    }
    setNewPin(false);
  };

  const handlePressRoute = () => {
    if (locationFound) {
      setShowRoute(true);
      setOpenFromRoute(true);
    } else console.log("Location not found");
  };

  const handleNearestRoute = () => {
    if (locationFound) {
      setShowNearestRoute(true);
      setShowRoute(false);
      setSelectedPin(null);
      setOpenFromRoute(true);
    } else console.log("Location not found");
  };

  const handleDrawerClose = (isOpen: boolean) => {
    setOpen(isOpen);

    if (!isOpen) {
      setShowRoute(false);
      setShowNearestRoute(false);
      setSelectedPin(null);
      setOpenFromRoute(false);
      setClickedLoc(null);
    }
  };

  // Open drawer on pin click
  useEffect(() => {
    console.log("selectedPin changed:", selectedPin);
    console.log("openFromRoute:", openFromRoute);
    if (selectedPin && openFromRoute) {
      setOpen(true);
      setOpenFromRoute(false);
    }
  }, [selectedPin, openFromRoute]);

  const createClusterCustomIcon = (cluster: any) => {
    return divIcon({
      html: `<div style="background-color: #5F80AA; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 14px;">${cluster.getChildCount()}</div>`,
      className: "cluster-marker",
      iconSize: point(40, 40, true),
    });
  };

  return (
    <>
      {!locationFound &&
        createPortal(
          <AlertDialogue onClose={() => setLocationFound(true)} />,
          document.body,
        )}
      <div
        className="w-full max-w-md pointer-events-auto"
        style={{ height: "90vh" }}
      >
        <MapContainer
          id="Map_Container"
          style={{ height: "90vh", width: "100%" }}
          maxBounds={philippinesBounds}
          maxBoundsViscosity={1.0}
          minZoom={6}
        >
          {authorized ? (
            <MapClickHandler
              onPinClick={handlePinClick}
              setClickedLoc={setClickedLoc}
              clickedLoc={clickedLoc}
            />
          ) : null}
          <TileLayer
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* <Routing /> */}
          <PinMarking onPinClick={handlePinClick} />
          <SensorMarking onPinClick={handleSensorClick} />
          <LocationMarker
            flyToLocation={showLocation}
            locationFound={setLocationFound}
          />
          <FlyToLocation position={selectedPin} flyTrigger={flyTrigger} />
          <MarkerClusterGroup
            iconCreateFunction={createClusterCustomIcon}
            maxClusterRadius={50}
            chunkedLoading
          >
            <RoadMapping
              position={[
                [14.563073993490859, 120.99483862617527],
                [14.564512191308419, 120.99417612053263],
              ]}
            />
            <RoadMapping
              position={[
                [14.565561313458806, 120.99694416069873],
                [14.565961485258084, 120.9979076376789],
              ]}
            />
          </MarkerClusterGroup>
          {showNearestRoute && (
            <NearestRouting onPinSelected={setSelectedPin} />
          )}
          {showRoute && !showNearestRoute && selectedPin && (
            <Routing onPinSelected={setSelectedPin} selectedPin={selectedPin} />
          )}{" "}
        </MapContainer>
        <DrawerComp
          open={open}
          onOpenChange={handleDrawerClose}
          selectedPin={selectedPin}
          onFindRoute={handlePressRoute}
          newPin={newPin}
          isSensor={isSensor}
        />
        <div className="fixed bottom-0 left-0 w-full flex justify-center items-center">
          <div className="flex flex-col w-full max-w-md items-center justify-center mb-8">
            <CurrentLocation
              className="w-14 h-14 self-end m-4 drop-shadow-xl"
              onClick={() => setShowLocation((prev) => !prev)}
            />
            <ButtonComp
              text="Find Evac Center"
              variant="important"
              id="Map_NearestRouteBtn"
              onClick={handleNearestRoute}
              widthSize="90%"
              heightSize="50px"
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default Map;

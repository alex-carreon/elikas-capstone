import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap, Circle } from "react-leaflet";
import "leaflet-routing-machine";
import ButtonComp from "./Button";
import {
  Routing,
  PinMarking,
  FlyToLocation,
  RoadMapping,
} from "@/lib/mapUtils";
import DrawerComp from "./Drawer";
import MarkerClusterGroup from "react-leaflet-cluster";
import { divIcon, point } from "leaflet";

function LocationMarker() {
  const [position, setPosition] = useState(null);
  const map = useMap();

  useEffect(() => {
    map.locate({ setView: true, maxZoom: 50 });

    const onLocationFound = (e) => {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    };

    map.on("locationfound", onLocationFound);

    return () => {
      map.off("locationfound", onLocationFound);
    };
  }, [map]);

  return position === null ? (
    position
  ) : (
    <Circle
      center={position}
      radius={5}
      pathOptions={{ color: "white", fillColor: "#569FFF", fillOpacity: 10 }}
    ></Circle>
  );
}

function Map() {
  const [showRoute, setShowRoute] = useState(false);
  const [open, setOpen] = useState(false);
  const [openFromRoute, setOpenFromRoute] = useState(false);
  const [selectedPin, setSelectedPin] = useState(null);
  const [position, setPosition] = useState(null);
  const [flyTrigger, setFlyTrigger] = useState(0);

  const handlePinClick = (pin) => {
    setSelectedPin(pin);
    setOpen(true);
    setPosition(pin);
    setFlyTrigger((prev) => prev + 1);
  };

  const handlePressRoute = () => {
    setShowRoute(true);
    setSelectedPin(null);
    setOpenFromRoute(true);
    console.log("selectedPin after route:", selectedPin);
  };

  const handleDrawerClose = (isOpen) => {
    setOpen(isOpen);

    if (!isOpen) {
      setShowRoute(false);
      setSelectedPin(null);
    }
  };

  useEffect(() => {
    console.log("selectedPin changed:", selectedPin);
    console.log("openFromRoute:", openFromRoute);
    if (selectedPin && openFromRoute) {
      setOpen(true);
      setOpenFromRoute(false);
    }
  }, [selectedPin, openFromRoute]);

  const createClusterCustomIcon = (cluster) => {
    return divIcon({
      html: `<div style="background-color: #5F80AA; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 14px;">${cluster.getChildCount()}</div>`,
      className: "cluster-marker",
      iconSize: point(40, 40, true),
    });
  };

  return (
    <div
      className="w-full max-w-md pointer-events-auto"
      style={{ height: "90vh" }}
    >
      <MapContainer style={{ height: "90vh", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* <Routing /> */}
        <PinMarking onPinClick={handlePinClick} />
        <LocationMarker />
        <FlyToLocation position={position} flyTrigger={flyTrigger} />

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

        {showRoute && <Routing onPinSelected={setSelectedPin} />}
      </MapContainer>
      <DrawerComp
        open={open}
        onOpenChange={handleDrawerClose}
        selectedPin={selectedPin}
      />
      <div className="fixed bottom-0 left-0 w-full flex justify-center mb-8">
        <ButtonComp
          text="Find Evac Center"
          variant="important"
          id="Map-Drawer"
          onClick={handlePressRoute}
        />
      </div>
    </div>
  );
}

export default Map;

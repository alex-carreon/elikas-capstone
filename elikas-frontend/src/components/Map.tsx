import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  Circle,
  Polyline,
} from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet-routing-machine";
import FloodIcon from "@/assets/Map/FloodIcon.svg?react";
import { renderToString } from "react-dom/server";
import ButtonComp from "./Button";
import { Routing, PinMarking, FlyToLocation, pins } from "@/lib/mapUtils";
import DrawerComp from "./Drawer";

interface PolylineProps {
  position: [number, number][];
}

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

function getMidpoint(positions: [number, number][]): [number, number] {
  const avgLat = positions.reduce((sum, p) => sum + p[0], 0) / positions.length;
  const avgLng = positions.reduce((sum, p) => sum + p[1], 0) / positions.length;
  return [avgLat, avgLng];
}

function RoadMapping({ position }: PolylineProps) {
  const midpoint = getMidpoint(position);

  const icon = divIcon({
    html: renderToString(<FloodIcon width={36} height={36} />),
    className: "",
    iconAnchor: [12, 12],
  });
  return (
    <>
      <Polyline positions={position} weight={6} />
      <Marker position={midpoint} icon={icon} />
    </>
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

  return (
    <div className="w-full max-w-md" style={{ height: "90vh" }}>
      <MapContainer style={{ height: "90vh", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* <Routing /> */}
        <PinMarking onPinClick={handlePinClick} />
        <LocationMarker />
        <FlyToLocation position={position} flyTrigger={flyTrigger} />
        <RoadMapping
          position={[
            [14.565561313458806, 120.99694416069873],
            [14.565961485258084, 120.9979076376789],
          ]}
        />
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

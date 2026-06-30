import { useRef, useEffect, useState, type SetStateAction } from "react";
import { TileLayer, useMap, CircleMarker } from "react-leaflet";
import "leaflet-routing-machine";
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
import { divIcon, point, type LocationEvent, LatLng } from "leaflet";
import AlertDialogue from "./AlertDialogue";
import { createPortal } from "react-dom";
import { useUserContext } from "@/context/AuthContext";
import { toast } from "sonner";

interface MapProps {
  onLocationFound: (found: boolean) => void;
  showLocation: boolean;
  nearestRouteTrigger: number;
  setRoute: React.Dispatch<SetStateAction<boolean>>;
  setNearestRoute: React.Dispatch<SetStateAction<boolean>>;
  clearRoute: boolean;
}

function Map({
  onLocationFound,
  showLocation,
  nearestRouteTrigger,
  setRoute,
  setNearestRoute,
  clearRoute,
}: MapProps) {
  const [showNearestRoute, setShowNearestRoute] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [open, setOpen] = useState(false);
  const [openFromRoute, setOpenFromRoute] = useState(false);
  const [selectedPin, setSelectedPin] = useState(null);
  // const [position, setPosition] = useState(null);
  const [flyTrigger, setFlyTrigger] = useState(0);
  const [newPin, setNewPin] = useState(false);
  const [clickedLoc, setClickedLoc] = useState<
    [number, number] | undefined | null
  >(null);
  // const [showLocation, setShowLocation] = useState(false);
  const [locationFound, setLocationFound] = useState(false);
  const [isSensor, setIsSensor] = useState(false);
  const [isHazard, setIsHazard] = useState(false);
  const [userPosition, setUserPosition] = useState<LatLng | null>(null);
  const [position, setPosition] = useState<LatLng | null>(null);
  // const [showDialogue, setShowDialogue] = useState(true);
  const [locateStatus, setLocateStatus] = useState<
    "pending" | "found" | "error"
  >("pending");

  const map = useMap();
  const hasLocated = useRef(false);

  let authorized = false;
  const { role } = useUserContext();

  if (role) {
    authorized = true;
  }

  // Auto find location
  useEffect(() => {
    if (hasLocated.current === true) return;

    // Locate user, zooms into location, how much zoom
    map.locate({ watch: false, setView: true, maxZoom: 50 });

    // For rendering the marker
    // e contains lat and long
    // If it's the first time, map.flyTo flies to the specific location
    const onLocationFoundHandler = (e: LocationEvent) => {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
      hasLocated.current = true;
      setLocateStatus("found");
      onLocationFound(true);
      setUserPosition(e.latlng);
    };

    const onLocationError = () => {
      onLocationFound(false);
      setLocateStatus("error");
    };

    // listens when to trigger onLocationFound

    map.on("locationfound", onLocationFoundHandler);
    map.on("locationerror", onLocationError);

    // clean up - switches event off
    return () => {
      map.off("locationfound", onLocationFoundHandler);
      map.off("locationerror", onLocationError);
    };
  }, []);

  // Fly to user's location on button click
  useEffect(() => {
    if (showLocation && position) {
      setTimeout(() => {
        map.flyTo(position, 18);
      }, 0);
    }
  }, [showLocation, position, map]);

  // find location on click
  useEffect(() => {
    if (nearestRouteTrigger === 0) return;

    setShowNearestRoute(true);
    setNearestRoute(true);
    setShowRoute(false);
    setRoute(false);
    setOpenFromRoute(false);
    setIsSensor(false);
    setIsHazard(false);
    setNewPin(false);
  }, [nearestRouteTrigger]);

  const handlePinClick = (pin: any) => {
    const normalizedPin = pin.coordinates
      ? { ...pin, lat: pin.coordinates[0], long: pin.coordinates[1] }
      : pin;

    setSelectedPin(normalizedPin);
    setOpen(true);
    setFlyTrigger((prev) => prev + 1);
    setShowNearestRoute(false);
    setShowRoute(false);
    setOpenFromRoute(false);
    setLocationFound(true);
    setRoute(false);
    setNearestRoute(false);

    const isExisting = !!pin.id;
    setNewPin(!isExisting);

    if (isExisting) {
      setClickedLoc(null);
    }
    setIsSensor(false);
    setIsHazard(false);
  };

  const handleSensorClick = (pin: any) => {
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
    setIsHazard(false);
  };

  const handleHazardClick = (pin: any, midpoint: [number, number]) => {
    const normalizedPin = {
      ...pin,
      lat: midpoint[0],
      long: midpoint[1],
      routePoints: pin.path,
    };

    setSelectedPin({ ...normalizedPin, midpoint });
    setOpen(true);
    setFlyTrigger((prev) => prev + 1);
    setShowNearestRoute(false);
    setShowRoute(false);
    setOpenFromRoute(false);
    setClickedLoc(null);

    const hazard = !!pin.id;
    setIsHazard(hazard);

    if (hazard) {
      setClickedLoc(null);
    }
    setNewPin(false);
    setIsSensor(false);
  };

  const handlePressRoute = () => {
    if (locationFound) {
      setShowRoute(true);
      setRoute(true);
      setNearestRoute(false);
      setOpenFromRoute(true);
      toast("Routing...");
    } else
      toast.error("Trouble Routing. Please check your location or refresh.");
  };

  const handleClearRoute = () => {
    setShowRoute(false);
    setRoute(false);
    setShowNearestRoute(false);
    setNearestRoute(false);
    setSelectedPin(null);
  };

  const handleDrawerClose = (isOpen: boolean) => {
    setOpen(isOpen);

    if (!isOpen) {
      setOpenFromRoute(false);
      setClickedLoc(null);
    }
  };

  // Open drawer on pin click
  useEffect(() => {
    if (selectedPin && openFromRoute) {
      setOpen(true);
      setOpenFromRoute(false);
    }
  }, [selectedPin, openFromRoute]);

  useEffect(() => {
    if (showRoute || showNearestRoute) {
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 100);
    }
  }, [showRoute, showNearestRoute]);

  useEffect(() => {
    if (clearRoute) {
      handleClearRoute();
    }
  }, [clearRoute]);

  const createClusterCustomIcon = (cluster: any) => {
    return divIcon({
      html: `<div style="background-color: #5F80AA; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 14px;">${cluster.getChildCount()}</div>`,
      className: "cluster-marker",
      iconSize: point(40, 40, true),
    });
  };

  return (
    <>
      {locateStatus === "error" &&
        createPortal(
          <AlertDialogue
            open={true}
            title="Turn on your Location/GPS"
            description="Location/GPS is required to view routes. Turn it on in Settings, then refresh or reopen the app."
            buttonText="Got it!"
            onClick={() => setLocateStatus("found")}
            onClose={() => setLocateStatus("found")}
            contentId="Map_DialogContent"
            closeId="Map_DialogClose"
            actionId="Map_DialogAction"
          />,
          document.body,
        )}
      {/* Adding a pin */}
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
      {position && (
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
      )}
      {/* View and Click Pins */}
      <PinMarking onPinClick={handlePinClick} />
      <SensorMarking onPinClick={handleSensorClick} />
      <RoadMapping onPinClick={handleHazardClick} />

      {/* Bubble map function */}
      <MarkerClusterGroup
        iconCreateFunction={createClusterCustomIcon}
        maxClusterRadius={50}
        chunkedLoading
      ></MarkerClusterGroup>

      {/* Fly to that location */}
      <FlyToLocation position={selectedPin} flyTrigger={flyTrigger} />

      {/* <Routing /> */}
      {showNearestRoute && (
        <NearestRouting
          onPinSelected={(pin: any) => {
            setSelectedPin(pin);
            setOpen(true);
          }}
          userPosition={userPosition}
          showNearestRoute={showNearestRoute}
          nearestRouteTrigger={nearestRouteTrigger}
        />
      )}
      {showRoute && !showNearestRoute && selectedPin && (
        <Routing
          onPinSelected={setSelectedPin}
          selectedPin={selectedPin}
          userPosition={userPosition}
        />
      )}

      {/* Drawer for pins */}
      <DrawerComp
        open={open}
        onOpenChange={handleDrawerClose}
        selectedEvacPin={selectedPin}
        selectedFloodPin={selectedPin}
        selectedSensorPin={selectedPin}
        onFindRoute={handlePressRoute}
        newPin={newPin}
        isSensor={isSensor}
        isHazard={isHazard}
      />
    </>
  );
}

export default Map;

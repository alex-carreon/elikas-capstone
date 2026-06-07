import { Fragment, useEffect, useRef, useState } from "react";
import { useMap, Marker, Polyline } from "react-leaflet";
import leaflet, { point } from "leaflet";
import { LatLng, divIcon } from "leaflet";
import "leaflet-routing-machine";
import colors from "@/constants/colors";
import PinIcon from "@/assets/Map/Pins.svg?react";
import SensorIcon from "@/components/sensorIcon";
import { renderToString } from "react-dom/server";
import MarkerClusterGroup from "react-leaflet-cluster";
import FloodIcon from "@/assets/Map/FloodIcon.svg?react";
import BlankPin from "@/assets/Map/BlankPin.svg?react";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import { toast } from "sonner";
import api from "@/api";
import { useMapFilterContext } from "@/context/MapFilterContext";
import { type Dispatch, type SetStateAction } from "react";

type EvacPin = {
  id: number;
  lat: number;
  lng: number;
  own_pins: boolean;
};

type FloodLevel = {
  id: number;
  level_name: string;
};

type FloodPath = {
  id: number;
  is_expired: boolean;
  is_deactivated: boolean;
  level: FloodLevel;
  path: [number, number][];
};

type Sensors = {
  id: number;
  name: string;
  location: [number, number];
  waterLevel: any | null;
  lastOnline: any | null;
  currentStatus: string;
};

export const sensorPins = [
  {
    id: 1,
    name: "Test Sensor",
    lat: 14.564622906838178,
    long: 120.99761278890365,
  },
];

let evacPinData: EvacPin[] = [];
// let brgyPins: EvacPin[] = [];
// let myPins: EvacPin[] = [];
// let indivPins: EvacPin[] = [];

const getBrgyPins = async ({
  setBrgyPins,
}: {
  setBrgyPins?: Dispatch<SetStateAction<EvacPin[]>>;
}) => {
  try {
    const BrgyResponse = await api.get("/pins?role=govop");
    const brgyPins = await BrgyResponse.data.pins;
    setBrgyPins?.(brgyPins);
  } catch (err: string | any) {
    Error(err.message || "An error occurred");
  }
};

const getAllIndivPins = async ({
  setIndivPins,
}: {
  setIndivPins?: Dispatch<SetStateAction<EvacPin[]>>;
}) => {
  try {
    const BrgyResponse = await api.get("/pins?role=indiv");
    const indivPins = await BrgyResponse.data.pins;
    setIndivPins?.(indivPins);
  } catch (err: string | any) {
    Error(err.message || "An error occurred");
  }
};

const getMyPins = async ({
  setOwnPins,
}: {
  setOwnPins?: Dispatch<SetStateAction<EvacPin[]>>;
}) => {
  try {
    const IndivResponse = await api.get("evacpins/users/coords");
    const myPins = await IndivResponse.data.pins;

    setOwnPins?.(myPins);
  } catch (err: any) {
    console.log(err.response);
  }
};

const getEvacPins = async ({
  setEvacPins,
}: {
  setEvacPins?: Dispatch<SetStateAction<EvacPin[]>>;
}) => {
  try {
    const GenResponse = await api.get("/pins");
    evacPinData = await GenResponse.data.pins;
    setEvacPins?.(evacPinData);
  } catch (err: string | any) {
    Error(err.message || "An error occurred");
  }
};

let sensorData: Sensors[];
const getSensors = async ({
  setSensors,
}: {
  setSensors: Dispatch<SetStateAction<Sensors[]>>;
}) => {
  try {
    const response = await api.get("/public/sensors");
    sensorData = await response.data;
    setSensors(sensorData);
  } catch (error) {
    console.log(error);
  }
};

function getNearestWaypoint(
  userLatLng: LatLng,
  waypoints: EvacPin[],
): EvacPin | null {
  if (!waypoints.length) return null;
  let nearest: EvacPin | null = null;
  let minDist = Infinity;

  waypoints.forEach((point: any) => {
    console.log(point.lat);
    console.log(point.long);
    const dist = userLatLng.distanceTo(leaflet.latLng(point.lat, point.lng));
    if (dist < minDist) {
      minDist = dist;
      nearest = point;
    }
  });

  console.log("nearest", nearest);
  return nearest;
}

export function NearestRouting({
  onPinSelected,
  userPosition,
  showNearestRoute,
}: {
  onPinSelected: any;
  userPosition: LatLng | null;
  showNearestRoute: boolean;
}) {
  const [points, setPoints] = useState<[number, number][]>([]);
  const [evacPins, setEvacPins] = useState<EvacPin[]>([]);

  useEffect(() => {
    getEvacPins({ setEvacPins });
  }, []);

  console.log("Before useEffect");

  //   For Routing
  useEffect(() => {
    console.log("After useEffect");
    console.log("evacPins", evacPins);
    if (!userPosition || !evacPins) return;
    console.log("user position", userPosition);
    console.log("evacPins", evacPins);

    const nearest = getNearestWaypoint(userPosition, evacPins);
    if (!nearest) return;
    onPinSelected(nearest);
    console.log(nearest);

    const getRoutes = async () => {
      try {
        const destination = [nearest.lng, nearest.lat];
        const user = [userPosition.lng, userPosition.lat];

        console.log("destination", destination);
        console.log("user", user);
        const response = await fetch(
          `http://brouter:17777/brouter?lonlats=${user}|${destination}&profile=trekking&format=geojson`,
          { method: "GET" },
        );

        if (!response) {
          console.error("Fetch failed");
          toast.error("Failed to find route");
          return;
        } else toast.success("Found you a route!");

        const data = await response.json();
        const points: [number, number][] =
          data.features[0].geometry.coordinates.map(
            ([lon, lat]: [number, number]) => [lat, lon],
          );
        setPoints(points);
      } catch (err: any) {
        console.log(err.message);
      }
    };

    getRoutes();
  }, [showNearestRoute, evacPins]);

  return <Polyline positions={points} weight={6} color="#5F80AA" />;
}

export function Routing({
  onPinSelected,
  selectedPin,
  userPosition,
}: {
  onPinSelected: any;
  selectedPin: any;
  userPosition: LatLng | null; // add this
}) {
  const [points, setPoints] = useState<[number, number][]>([]);

  //   For Routing
  useEffect(() => {
    if (!userPosition || !selectedPin) return;

    const matchedPin = selectedPin;

    if (matchedPin) {
      onPinSelected(matchedPin);
    }

    const getRoutes = async () => {
      try {
        const destination = [selectedPin.lng, selectedPin.lat];
        const user = [userPosition.lng, userPosition.lat];

        const response = await fetch(
          `http://brouter:17777/brouter?lonlats=${user}|${destination}&profile=trekking&format=geojson`,
          { method: "GET" },
        );

        if (!response.ok) {
          console.error("Fetch failed");
          return;
        }

        const data = await response.json();
        const points: [number, number][] =
          data.features[0].geometry.coordinates.map(
            ([lon, lat]: [number, number]) => [lat, lon],
          );
        setPoints(points);
      } catch (err: any) {
        console.log(err.message);
      }
    };

    getRoutes();
  }, [userPosition, selectedPin]);

  return <Polyline positions={points} weight={6} color="#5F80AA" />;
}

// Add properties based on the pin info from db
export function PinMarking({ onPinClick }: { onPinClick: (pin: any) => void }) {
  const [evacPins, setEvacPins] = useState<EvacPin[]>([]);
  const [brgyPins, setBrgyPins] = useState<EvacPin[]>([]);
  const [myPins, setMyPins] = useState<EvacPin[]>([]);
  const [indivPins, setIndivPins] = useState<EvacPin[]>([]);

  const { showGovPins, showOtherPins } = useMapFilterContext();

  const createClusterCustomIcon = (cluster: any) => {
    return divIcon({
      html: `<div style="background-color: #FFA011; color: ${colors.heading}; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 14px;">${cluster.getChildCount()}</div>`,
      className: "cluster-marker",
      iconSize: point(40, 40, true),
      iconAnchor: [25, 50],
    });
  };

  const icon = divIcon({
    html: renderToString(<PinIcon width={50} height={50} />),
    className: "",
    iconAnchor: [12, 12],
  });

  // const showBrgyPins = showGovPins ? brgyPins : null;
  // const showUserPins = showOtherPins ? indivPins : myPins;

  useEffect(() => {
    getBrgyPins({ setBrgyPins });
    getEvacPins({ setEvacPins });
    getMyPins({ setOwnPins: setMyPins });
    getAllIndivPins({ setIndivPins });
  }, []);

  useEffect(() => {
    console.log("myPins", myPins);
    // console.log("indivPins", allIndivPins);
    console.log("brgyPins", brgyPins);
    console.log("showGovPins", showGovPins);
    console.log("showOtherPins", showOtherPins);
  }, [brgyPins, myPins]);

  return (
    <MarkerClusterGroup
      iconCreateFunction={createClusterCustomIcon}
      maxClusterRadius={50}
      chunkedLoading
      id="Map_MarkerBubble"
    >
      {showGovPins &&
        brgyPins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.lat, pin.lng]}
            icon={icon}
            eventHandlers={{ click: () => onPinClick(pin) }}
          />
        ))}

      {showOtherPins
        ? indivPins.map((pin) => (
            <Marker
              key={pin.id}
              position={[pin.lat, pin.lng]}
              icon={icon}
              eventHandlers={{ click: () => onPinClick(pin) }}
            />
          ))
        : myPins.map((pin) => (
            <Marker
              key={pin.id}
              position={[pin.lat, pin.lng]}
              icon={icon}
              eventHandlers={{ click: () => onPinClick(pin) }}
            />
          ))}
    </MarkerClusterGroup>
  );
}

// ensor logic here
export function SensorMarking({
  onPinClick,
}: {
  onPinClick: (pin: any) => void;
}) {
  const [sensors, setSensors] = useState<Sensors[]>([]);

  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  const colorSensor = {
    yellow: "#F3C217",
    orange: "#E6793B",
    red: "#B22B42",
    purple: "#6E4998",
    green: "#318631",
    inactive: "#C7C7C7",
  };

  const getColor = (status: string | null | undefined): string => {
    if (status === null) return colorSensor.inactive;

    if (status == "red") {
      return colorSensor.red;
    } else if (status == "orange") {
      return colorSensor.orange;
    } else if (status == "yellow") {
      return colorSensor.yellow;
    } else return colorSensor.green;
  };

  const sensorIcon = (color: string) =>
    divIcon({
      html: renderToString(<SensorIcon color={color} width={30} height={30} />),
      className: "",
      iconAnchor: [30, 30],
      iconSize: [15, 30],
    });

  useEffect(() => {
    getSensors({ setSensors });
  }, []);

  useEffect(() => {
    map.on("zoomend", () => setZoom(map.getZoom()));
    return () => {
      map.off("zoomend");
    };
  }, [map]);

  if (zoom < 12) return null;

  return sensors.map((pin) => (
    <Marker
      key={pin.id}
      position={[pin.location[0], pin.location[1]]}
      icon={sensorIcon(getColor(pin.currentStatus))}
      eventHandlers={{ click: () => onPinClick(pin) }}
    />
  ));
}

// When someone clicks, it zooms
export function FlyToLocation({
  position,
  flyTrigger,
}: {
  position: any;
  flyTrigger: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      let coords: [number, number];

      if (position.routePoints?.length > 0) {
        coords = getMidpoint(position.routePoints as [number, number][]);
      } else {
        coords = [position.lat, position.long];
      }

      console.log("position", position);
      console.log("coords", coords);

      if (coords[0] === undefined || coords[1] === undefined) return;

      map.flyTo(coords, 18);
    }
  }, [flyTrigger]);
  return null;
}

export function getMidpoint(positions: [number, number][]): [number, number] {
  if (positions.length === 0) return [0, 0];
  if (positions.length === 1) return positions[0];

  // const avgLat = positions.reduce((sum, p) => sum + p[0], 0) / positions.length;
  // const avgLng = positions.reduce((sum, p) => sum + p[1], 0) / positions.length;

  const midIndex = Math.floor(positions.length / 2);
  // return [avgLat, avgLng];
  return positions[midIndex];
}

interface RoadMappingProps {
  showPaths?: boolean;
  onPinClick?: (pin: any, midpoint: [number, number]) => void;
}

function RouterHazard({
  lonlats,
  profile,
}: {
  lonlats: string;
  profile: string;
}) {
  const [points, setPoints] = useState<[number, number][]>([]);

  useEffect(() => {
    const getRoutes = async () => {
      try {
        const response = await fetch(
          `http://brouter:17777/brouter?lonlats=${lonlats}&profile=${profile}&format=geojson`,
          { method: "GET" },
        );

        if (!response.ok) {
          console.error("BRouter request failed:", response.status);
          return null; // or return a fallback
        }

        const data = await response.json();
        const points: [number, number][] =
          data.features[0].geometry.coordinates.map(
            ([lon, lat]: [Number, number]) => [lat, lon],
          );
        setPoints(points);
      } catch (err: any) {
        console.log(err.response.data.message);
      }
    };

    getRoutes();
  }, [lonlats, profile]);

  if (!points.length) return null;

  return <Polyline positions={points} weight={6} color="#5F80AA" />;
}

export function RoadMapping({ onPinClick }: RoadMappingProps) {
  const [floodPaths, setFloodPaths] = useState<FloodPath[]>([]);
  const { showPaths } = useMapFilterContext();

  const createClusterCustomIcon = (cluster: any) => {
    return divIcon({
      html: `<div style="background-color: #5F80AA; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 14px;">${cluster.getChildCount()}</div>`,
      className: "cluster-marker",
      iconSize: point(40, 40, true),
      iconAnchor: [25, 50],
    });
  };

  const icon = divIcon({
    html: renderToString(<FloodIcon width={36} height={36} />),
    className: "",
    iconAnchor: [18, 20],
  });

  let floodData;

  const getFloodPaths = async () => {
    try {
      const response = await api.get("/flood-paths");

      floodData = await response.data.flood_paths;
      setFloodPaths(floodData);
    } catch (err: string | any) {
      Error(err.message || "An error occurred");
    }
  };

  useEffect(() => {
    getFloodPaths();
  }, []);

  return (
    <>
      <MarkerClusterGroup
        iconCreateFunction={createClusterCustomIcon}
        maxClusterRadius={50}
        chunkedLoading
        id="Map_MarkerBubble"
      >
        {showPaths &&
          floodPaths.map((pin) => {
            const midpoint = getMidpoint(pin.path);
            const lonlats = pin.path
              .map(([lon, lat]) => `${lat},${lon}`)
              .join("|");
            return (
              <Fragment key={pin.id}>
                <Marker
                  key={pin.id}
                  position={midpoint}
                  icon={icon}
                  eventHandlers={{
                    click: () => {
                      onPinClick && onPinClick(pin, midpoint);
                    },
                  }}
                />
                <RouterHazard lonlats={lonlats} profile="all" />
              </Fragment>
            );
          })}
      </MarkerClusterGroup>
    </>
  );
}

// Add properties based on the pin info from db
export function MapClickHandler({ onPinClick, clickedLoc, setClickedLoc }) {
  // const [clickedLoc, setClickedLoc] = useState<[number, number] | null>(null);
  const map = useMap();
  const icon = divIcon({
    html: renderToString(<BlankPin width={50} height={50} />),
    className: "",
    iconAnchor: [25, 50],
  });

  const getLocationDescription = async (lat: number, lng: number) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    );
    const data = await res.json();
    localStorage.setItem("LocDescription", data.display_name);
  };

  useEffect(() => {
    const handleClick = (e: any) => {
      const { lat, lng } = e.latlng;
      getLocationDescription(lat, lng);
      setClickedLoc([lat, lng]);
      onPinClick({ lat, long: lng });
      // parse latlng to string for it to be stored in local storage
      localStorage.setItem("clickedPin", JSON.stringify([lat, lng]));
      // localStorage.setItem("LocDescription", description.);
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map]);

  // localStorage.setItem("clickedPin", clickedLoc.JSON.stringify);

  return clickedLoc ? <Marker position={clickedLoc} icon={icon} /> : null;
}

// Calculates distance between two coordinates in meters
const haversineDistance = (
  [lat1, lng1]: [number, number],
  [lat2, lng2]: [number, number],
): number => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Checks the surroundings of a point in meters for road validation
export const snapAllPointsToRoads = async (
  points: [number, number][],
): Promise<[number, number][] | null> => {
  if (points.length < 2) return points;

  const coords = points.map(([lat, lng]) => `${lng},${lat}`).join(";");
  const radiuses = points.map(() => 3).join(";");

  try {
    const res = await fetch(
      `https://router.project-osrm.org/match/v1/driving/${coords}` +
        `?radiuses=${radiuses}&overview=full&geometries=geojson&steps=false`,
    );
    const data = await res.json();

    console.log("OSRM response:", data);
    console.log("OSRM code:", data.code);

    if (data.code !== "Ok" || !data.matchings?.length) {
      return null;
    }

    if (data.code === "NoMatch") {
      console.log("Went off-road");
      return null;
    }

    const offRoadPoints = data.tracepoints.filter((tp: any, i: number) => {
      if (tp === null) return true;
      const snappedLat = tp.location[1];
      const snappedLng = tp.location[0];
      const [origLat, origLng] = points[i];
      const dist = haversineDistance(
        [origLat, origLng],
        [snappedLat, snappedLng],
      );

      return dist > 3;
    });

    if (offRoadPoints.length > 0) {
      return points;
    }

    return points;
  } catch (err) {
    console.error("Snap error:", err);
    return null;
  }
};

// Add properties based on the pin info from db
export function FormMapClickHandler({
  onPinClick,
  clickedLoc,
  setClickedLoc,
  center,
}: {
  onPinClick: any;
  clickedLoc: any;
  setClickedLoc: any;
  center: any;
}) {
  // const [clickedLoc, setClickedLoc] = useState<[number, number] | null>(null);
  const map = useMap();

  const icon = divIcon({
    html: renderToString(<BlankPin width={50} height={50} />),
    className: "",
    iconAnchor: [25, 50],
  });

  const maxRadius = 500;

  const getDistance = (a: [number, number], b: [number, number]) => {
    const R = 6371000;
    const dLat = ((b[0] - a[0]) * Math.PI) / 180;
    const dLng = ((b[1] - a[1]) * Math.PI) / 180;
    const x =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((a[0] * Math.PI) / 180) *
        Math.cos((b[0] * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };

  useEffect(() => {
    const handleClick = (e: any) => {
      if (clickedLoc.length > 10) {
        toast("You have reached the 10 point limit.");
        return;
      }

      const { lat, lng } = e.latlng;
      const newPoint: [number, number] = [lat, lng];

      if (getDistance(center, newPoint) > maxRadius) {
        toast("Oops! You're going too far from your reported location");
        return;
      }
      setClickedLoc((prev: [number, number]) => [...prev, [lat, lng]]);
      if (onPinClick) onPinClick({ lat, long: lng });
      // parse latlng to string for it to be stored in local storage
      localStorage.setItem("clickedPinForm", JSON.stringify([lat, lng]));
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, clickedLoc]);

  // localStorage.setItem("clickedPin", clickedLoc.JSON.stringify);

  return null;
}

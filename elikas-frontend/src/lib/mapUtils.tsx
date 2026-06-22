import { Fragment, useEffect, useState } from "react";
import { useMap, Marker, Polyline } from "react-leaflet";
import leaflet, { point, type LeafletMouseEvent } from "leaflet";
import { LatLng, divIcon } from "leaflet";
import "leaflet-routing-machine";
import colors from "@/constants/colors";
import PinIcon from "@/assets/Map/Pins.svg?react";
import MyPinIcon from "@/assets/Map/MyPin.svg?react";
import SensorIcon from "@/components/sensorIcon";
import { renderToString } from "react-dom/server";
import MarkerClusterGroup from "react-leaflet-cluster";
import FloodIcon from "@/assets/Map/FloodIcon.svg?react";
import BlankPin from "@/assets/Map/BlankPin.svg?react";
import MyHazardPin from "@/assets/Map/MyHazardPins 1.svg?react";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import { toast } from "sonner";
import api from "@/api";
import { useMapFilterContext } from "@/context/MapFilterContext";
import { type Dispatch, type SetStateAction } from "react";
import { useUserContext } from "@/context/AuthContext";

const brouterBaseUrl = import.meta.env.VITE_BROUTER_BASE_URL;

type EvacPin = {
  id: number;
  lat: number;
  lng: number;
  my_pin: boolean;
};

type MyEvacPin = {
  id: number;
  lat: number;
  lng: number;
  my_pin: boolean;
  status: string;
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
  my_path: boolean;
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

const getBrgyPins = async ({
  setBrgyPins,
  signal,
}: {
  setBrgyPins?: Dispatch<SetStateAction<EvacPin[]>>;
  signal?: AbortSignal;
}) => {
  try {
    const BrgyResponse = await api.get("/pins?role=govop", { signal });
    const brgyPins = await BrgyResponse.data.pins;
    setBrgyPins?.(brgyPins);
  } catch (err: string | any) {
    Error(err.message || "An error occurred");
  }
};

const getAllIndivPins = async ({
  setIndivPins,
  signal,
}: {
  setIndivPins?: Dispatch<SetStateAction<EvacPin[]>>;
  signal?: AbortSignal;
}) => {
  try {
    const IndivResponse = await api.get("/pins?role=indiv", { signal });
    const indivPins = await IndivResponse.data.pins;
    setIndivPins?.(indivPins);
  } catch (err: string | any) {
    Error(err.message || "An error occurred");
  }
};

const getMyPins = async ({
  setOwnPins,
  signal,
}: {
  setOwnPins?: Dispatch<SetStateAction<MyEvacPin[]>>;
  signal?: AbortSignal;
}) => {
  try {
    const IndivResponse = await api.get("/pins/my-coords", { signal });
    const myPins = await IndivResponse.data.pins;

    setOwnPins?.(myPins);
  } catch (err: any) {
    console.log(err.response);
  }
};

const getEvacPins = async ({
  setEvacPins,
  signal,
}: {
  setEvacPins?: Dispatch<SetStateAction<EvacPin[]>>;
  signal?: AbortSignal;
}) => {
  try {
    const GenResponse = await api.get("/pins", { signal });
    evacPinData = await GenResponse.data.pins;
    setEvacPins?.(evacPinData);
  } catch (err: string | any) {
    Error(err.message || "An error occurred");
  }
};

let sensorData: Sensors[];
const getSensors = async ({
  setSensors,
  signal,
}: {
  setSensors: Dispatch<SetStateAction<Sensors[]>>;
  signal?: AbortSignal;
}) => {
  try {
    const response = await api.get("/public/sensors", { signal });
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
  nearestRouteTrigger,
}: {
  onPinSelected: any;
  userPosition: LatLng | null;
  showNearestRoute: boolean;
  nearestRouteTrigger: number;
}) {
  const [points, setPoints] = useState<[number, number][]>([]);
  const [evacPins, setEvacPins] = useState<EvacPin[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    try {
      getEvacPins({ setEvacPins, signal: controller.signal });
    } catch (err: any) {
      if (err.name === "CanceledError") return;
      console.log(err);
    }

    return () => controller.abort();
  }, []);

  //   For Routing
  useEffect(() => {
    if (nearestRouteTrigger === 0) return;
    if (!userPosition || !evacPins) return;
    if (!userPosition || !evacPins) return;

    const nearest = getNearestWaypoint(userPosition, evacPins);
    if (!nearest) return;
    onPinSelected(nearest);

    const getRoutes = async () => {
      try {
        const destination = [nearest.lng, nearest.lat];
        const user = [userPosition.lng, userPosition.lat];

        const response = await fetch(
          `${brouterBaseUrl}/brouter?lonlats=${user}|${destination}&profile=trekking&format=geojson`,
          { method: "GET" },
        );

        if (!response) {
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
  }, [nearestRouteTrigger, evacPins]);

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
          `${brouterBaseUrl}/brouter?lonlats=${user}|${destination}&profile=trekking&format=geojson`,
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
  const [brgyPins, setBrgyPins] = useState<EvacPin[]>([]);
  const [myPins, setMyPins] = useState<MyEvacPin[]>([]);
  const [indivPins, setIndivPins] = useState<EvacPin[]>([]);

  const { showGovPins, showOtherPins } = useMapFilterContext();
  const { user } = useUserContext();

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

  const myIcon = divIcon({
    html: renderToString(<MyPinIcon width={50} height={50} />),
    className: "",
    iconAnchor: [12, 12],
  });

  // const showBrgyPins = showGovPins ? brgyPins : null;
  // const showUserPins = showOtherPins ? indivPins : myPins;

  const getData = async () => {
    const controller = new AbortController();

    const getAll = Promise.all([
      getBrgyPins({ setBrgyPins, signal: controller.signal }),
      getAllIndivPins({ setIndivPins, signal: controller.signal }),
      ...(user
        ? [getMyPins({ setOwnPins: setMyPins, signal: controller.signal })]
        : []),
    ]);

    toast.promise(getAll, {
      loading: "Generating the pins! Hold on tight...",
      success: "Pins Generated!",
      error: "An error occurred. Please try again.",
      position: "top-center",
    });

    try {
      await getAll;
    } catch (err: any) {
      if (err.name === "CanceledError") return;
      console.log(err);
    }

    return () => controller.abort();
  };

  useEffect(() => {
    getData();
  }, []);

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
              icon={pin.my_pin ? myIcon : icon}
              eventHandlers={{ click: () => onPinClick(pin) }}
            />
          ))
        : user &&
          myPins.map((pin) => {
            if (pin.my_pin && pin.status == "active") {
              return (
                <Marker
                  key={pin.id}
                  position={[pin.lat, pin.lng]}
                  icon={myIcon}
                  eventHandlers={{ click: () => onPinClick(pin) }}
                />
              );
            }
          })}
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
    const controller = new AbortController();

    try {
      getSensors({ setSensors, signal: controller.signal });
    } catch (err: any) {
      if (err.name === "CanceledError") return;
      console.log(err);
    }

    return () => controller.abort();
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
  color,
}: {
  lonlats: string;
  profile: string;
  color: string;
}) {
  const [points, setPoints] = useState<[number, number][]>([]);

  const handleLineClick = (e: LeafletMouseEvent) => {
    leaflet.DomEvent.stopPropagation(e);
    toast.error(
      "To intersect with another road, click just past where they cross.",
    );
  };

  useEffect(() => {
    const getRoutes = async () => {
      try {
        const response = await fetch(
          `${brouterBaseUrl}/brouter?lonlats=${lonlats}&profile=${profile}&format=geojson`,
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

  return (
    <Polyline
      positions={points}
      weight={6}
      color={color}
      eventHandlers={{ click: (e: LeafletMouseEvent) => handleLineClick(e) }}
    />
  );
}

export function RoadMapping({ onPinClick }: RoadMappingProps) {
  const [floodPaths, setFloodPaths] = useState<FloodPath[]>([]);
  const { showPaths } = useMapFilterContext();

  const colorHazard = {
    lightBlue: "#52B2DA",
    darkBlue: "#578EC2",
    red: "#B22B42",
    fallback: "#C7C7C7",
  };

  const getColor = (level: number | null | undefined): string => {
    if (level === 1 || level === 2) {
      return colorHazard.lightBlue;
    } else if (level === 3 || level === 4) {
      return colorHazard.darkBlue;
    } else if (level === 5 || level === 6 || level === 7) {
      return colorHazard.red;
    } else return colorHazard.fallback;
  };

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

  const myIcon = divIcon({
    html: renderToString(<MyHazardPin width={36} height={36} />),
    className: "",
    iconAnchor: [18, 20],
  });

  let floodData;

  const getFloodPaths = async (signal?: AbortSignal) => {
    try {
      const response = await api.get("/flood-paths", { signal });

      floodData = await response.data.flood_paths;
      setFloodPaths(floodData);
    } catch (err: string | any) {
      if (err.name === "CanceledError") return;
      console.log(err);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    try {
      getFloodPaths(controller.signal);
    } catch (err: any) {
      if (err.name === "CanceledError") return;
      console.log(err);
    }

    return () => controller.abort();
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
                  icon={pin.my_path ? myIcon : icon}
                  eventHandlers={{
                    click: () => {
                      onPinClick && onPinClick(pin, midpoint);
                    },
                  }}
                />
                <RouterHazard
                  lonlats={lonlats}
                  profile="all"
                  color={getColor(pin.level.id)}
                />
              </Fragment>
            );
          })}
      </MarkerClusterGroup>
    </>
  );
}

interface MapClickHandlerProps {
  onPinClick: (coords: { lat: number; long: number }) => void | null;
  clickedLoc: [number, number] | undefined | null;
  setClickedLoc?: Dispatch<SetStateAction<[number, number] | undefined | null>>;
}

export function MapClickHandler({
  onPinClick,
  clickedLoc,
  setClickedLoc,
}: MapClickHandlerProps) {
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
      setClickedLoc?.([lat, lng]);
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

  return null;
}

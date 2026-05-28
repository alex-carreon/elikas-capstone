import { Fragment, useEffect, useRef, useState } from "react";
import { useMap, Marker, Polyline } from "react-leaflet";
import leaflet, { point, type LocationEvent } from "leaflet";
import { LatLng, divIcon } from "leaflet";
import L from "leaflet";
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
import { Trophy } from "lucide-react";
import api from "@/api";

export const pins = [
  {
    id: 1,
    name: "Atrium",
    lat: 14.565518250363224,
    long: 120.99809311129499,
  },
  {
    id: 2,
    name: "Taft Campus",
    lat: 14.563803477668346,
    long: 120.99479571081709,
  },
];

export const sensorPins = [
  {
    id: 1,
    name: "Test Sensor",
    lat: 14.564622906838178,
    long: 120.99761278890365,
  },
];

type PinType = (typeof pins)[0];

function getNearestWaypoint(
  userLatLng: LatLng,
  waypoints: typeof pins,
): PinType | null {
  let nearest: PinType | null = null;
  let minDist = Infinity;

  waypoints.forEach((point) => {
    const dist = userLatLng.distanceTo(leaflet.latLng(point.lat, point.long));
    if (dist < minDist) {
      minDist = dist;
      nearest = point;
    }
  });

  return nearest;
}

// Add properties based on the pin info from db
export function NearestRouting({
  onPinSelected,
  userPosition,
}: {
  onPinSelected: any;
  userPosition: LatLng | null; // add this
}) {
  // const [position, setPosition] = useState<LatLng | null>(null);
  const map = useMap();
  const routeControlRef = useRef<any>(null);

  useEffect(() => {
    if (!userPosition) return;

    const nearest = getNearestWaypoint(userPosition, pins);
    if (!nearest) return;

    onPinSelected?.(nearest);
    if (routeControlRef.current) {
      routeControlRef.current.remove();
    }

    routeControlRef.current = leaflet.Routing.control({
      waypoints: [
        leaflet.latLng(userPosition.lat, userPosition.lng),
        leaflet.latLng(nearest.lat, nearest.long),
      ],
      router: new leaflet.Routing.OSRMv1({
        serviceUrl: "https://router.project-osrm.org/route/v1",
      }),
      collapsible: true,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [
          {
            color: colors.heading,
            weight: 4,
          },
        ],
      },
      createMarker: function (i: number, waypoint: any) {
        if (i === 0) {
          return leaflet.marker(waypoint.latLng);
        }
        return null;
      },
    } as any).addTo(map);
    // Kulit ni typescript - as any meaning thats my styles dont bother them

    return () => {
      routeControlRef.current.remove();
    };
  }, [userPosition, map]);

  return null;
}

// Add properties based on the pin info from db
export function Routing({
  onPinSelected,
  selectedPin,
  userPosition,
}: {
  onPinSelected: any;
  selectedPin: any;
  userPosition: LatLng | null; // add this
}) {
  // const [position, setPosition] = useState<LatLng | null>(null);
  const map = useMap();
  const routeControlRef = useRef<any>(null);

  //   For Routing
  useEffect(() => {
    if (!userPosition || !selectedPin) return;

    const destination = leaflet.latLng(selectedPin.lat, selectedPin.long);

    if (routeControlRef.current) {
      (routeControlRef.current as any).remove();
      routeControlRef.current = null;
    }

    const matchedPin = selectedPin;

    if (matchedPin) {
      onPinSelected(matchedPin);
    }

    routeControlRef.current = leaflet.Routing.control({
      waypoints: [
        leaflet.latLng(userPosition.lat, userPosition.lng),
        destination,
      ],
      collapsible: true,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      lineOptions: { styles: [{ color: colors.heading, weight: 4 }] },
      createMarker: function (i: number, waypoint: any) {
        if (i === 0) {
          return leaflet.marker(waypoint.latLng);
        }
        return null;
      },
    } as any).addTo(map);

    return () => {
      if (routeControlRef.current) {
        (routeControlRef.current as any).remove();
        routeControlRef.current = null;
      }
    };
  }, [map, userPosition, selectedPin]);

  return null;
}

// Add properties based on the pin info from db
export function PinMarking({ onPinClick }: { onPinClick: (pin: any) => void }) {
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

  return (
    <MarkerClusterGroup
      iconCreateFunction={createClusterCustomIcon}
      maxClusterRadius={50}
      chunkedLoading
      id="Map_MarkerBubble"
    >
      {pins.map((pin) => (
        <Marker
          key={pin.id}
          position={[pin.lat, pin.long]}
          icon={icon}
          eventHandlers={{ click: () => onPinClick(pin) }}
        />
      ))}
    </MarkerClusterGroup>
  );
}

// Add sensor logic here
export function SensorMarking({
  onPinClick,
}: {
  onPinClick: (pin: any) => void;
}) {
  const [height, setHeight] = useState(0);
  const [color, setColor] = useState("");

  const colorSensor = {
    yellow: "#F3C217",
    orange: "#E6793B",
    red: "#B22B42",
    purple: "#6E4998",
  };

  useEffect(() => {
    setHeight(30);
  });

  useEffect(() => {
    if (height >= 40) {
      setColor(colorSensor.purple);
    } else if (height >= 30) {
      setColor(colorSensor.red);
    } else if (height >= 20) {
      setColor(colorSensor.orange);
    } else if (height >= 10) {
      setColor(colorSensor.yellow);
    }
  }, [height]);

  const sensorIcon = divIcon({
    html: renderToString(<SensorIcon color={color} width={30} height={30} />),
    className: "",
    iconAnchor: [12, 12],
    iconSize: [50, 50],
  });

  return (
    <>
      {sensorPins.map((pin) => (
        <Marker
          key={pin.id}
          position={[pin.lat, pin.long]}
          icon={sensorIcon}
          eventHandlers={{ click: () => onPinClick(pin) }}
        />
      ))}
      ;
    </>
  );
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

  const avgLat = positions.reduce((sum, p) => sum + p[0], 0) / positions.length;
  const avgLng = positions.reduce((sum, p) => sum + p[1], 0) / positions.length;

  // const midIndex = Math.floor(positions.length / 2);
  return [avgLat, avgLng];
  // return positions[midIndex];
}

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

export function RoadMapping({
  onPinClick,
}: {
  onPinClick: (pin: any, midpoint: [number, number]) => void;
}) {
  const [floodPaths, setFloodPaths] = useState<FloodPath[]>([]);

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
      {floodPaths.map((pin) => {
        const midpoint = getMidpoint(pin.path);
        return (
          <Fragment key={pin.id}>
            <Marker
              key={pin.id}
              position={midpoint}
              icon={icon}
              eventHandlers={{ click: () => onPinClick(pin, midpoint) }}
            />
            <Polyline positions={pin.path} weight={6} color="#5F80AA" />
          </Fragment>
        );
      })}
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

    console.log("OSRM response:", data); // ← check what OSRM returns
    console.log("OSRM code:", data.code);

    if (data.code !== "Ok" || !data.matchings?.length) {
      return null;
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

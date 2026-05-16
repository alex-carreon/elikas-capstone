import { useEffect, useRef, useState } from "react";
import { useMap, Marker, Polyline } from "react-leaflet";
import leaflet, { point, type LocationEvent } from "leaflet";
import { LatLng, divIcon } from "leaflet";
import "leaflet-routing-machine";
import colors from "@/constants/colors";
import PinIcon from "@/assets/Map/Pins.svg?react";
import { renderToString } from "react-dom/server";
import MarkerClusterGroup from "react-leaflet-cluster";
import FloodIcon from "@/assets/Map/FloodIcon.svg?react";
import BlankPin from "@/assets/Map/BlankPin.svg?react";

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
export function NearestRouting({ onPinSelected }) {
  const [position, setPosition] = useState<LatLng | null>(null);
  const map = useMap();
  const routeControlRef = useRef<any>(null);

  // For getting location
  useEffect(() => {
    map.locate({ setView: true, maxZoom: 50 });

    const onLocationFound = (e: LocationEvent) => {
      setPosition(e.latlng);
    };

    map.on("locationfound", onLocationFound);

    return () => {
      map.off("locationfound", onLocationFound);
    };
  }, [map]);

  useEffect(() => {
    if (!position) return;

    const nearest = getNearestWaypoint(position, pins);
    if (!nearest) return;

    onPinSelected?.(nearest);
    if (routeControlRef.current) {
      routeControlRef.current.remove();
    }

    routeControlRef.current = leaflet.Routing.control({
      waypoints: [position, leaflet.latLng(nearest.lat, nearest.long)],
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
  }, [position, map]);

  return null;
}

// Add properties based on the pin info from db
export function Routing({ onPinSelected, selectedPin }) {
  const [position, setPosition] = useState<LatLng | null>(null);
  const map = useMap();
  const routeControlRef = useRef<any>(null);

  // For getting location
  useEffect(() => {
    map.locate({ setView: true, maxZoom: 50 });

    const onLocationFound = (e: LocationEvent) => {
      setPosition(e.latlng);
    };

    map.on("locationfound", onLocationFound);

    return () => {
      map.off("locationfound", onLocationFound);
    };
  }, [map]);

  //   For Routing
  useEffect(() => {
    if (!position || !selectedPin) return;

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
      waypoints: [leaflet.latLng(position.lat, position.lng), destination],
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
  }, [map, position, selectedPin]);

  return null;
}

// Add properties based on the pin info from db
export function PinMarking({ onPinClick }) {
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
      map.flyTo([position.lat, position.long], 18);
    }
  }, [flyTrigger]);
  return null;
}

interface PolylineProps {
  position: [number, number][];
}

function getMidpoint(positions: [number, number][]): [number, number] {
  const avgLat = positions.reduce((sum, p) => sum + p[0], 0) / positions.length;
  const avgLng = positions.reduce((sum, p) => sum + p[1], 0) / positions.length;
  return [avgLat, avgLng];
}

export function RoadMapping({ position }: PolylineProps) {
  const midpoint = getMidpoint(position);

  const icon = divIcon({
    html: renderToString(<FloodIcon width={36} height={36} />),
    className: "",
    iconAnchor: [18, 20],
  });
  return (
    <>
      <Polyline positions={position} weight={6} color="#5F80AA" />
      <Marker position={midpoint} icon={icon} />
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

import { useEffect, useState } from "react";
import { useMap, Marker, Polyline } from "react-leaflet";
import leaflet, { point } from "leaflet";
import { LatLng, divIcon } from "leaflet";
import "leaflet-routing-machine";
import colors from "@/constants/colors";
import PinIcon from "@/assets/Map/Pins.svg?react";
import { renderToString } from "react-dom/server";
import MarkerClusterGroup from "react-leaflet-cluster";
import FloodIcon from "@/assets/Map/FloodIcon.svg?react";

export const pins = [
  {
    id: 1,
    name: "Atrium",
    description: "First Location",
    lat: 120.99809311129499,
    long: 14.565518250363224,
  },
  {
    id: 2,
    name: "Taft Campus",
    description: "Second Location",
    lat: 120.99487633908883,
    long: 14.56390127681799,
  },
];

export function Routing({ onPinSelected }) {
  const [position, setPosition] = useState<LatLng | null>(null);
  const map = useMap();

  // For getting location
  useEffect(() => {
    map.locate({ setView: true, maxZoom: 50 });

    const onLocationFound = (e) => {
      setPosition(e.latlng);
    };

    map.on("locationfound", onLocationFound);

    return () => {
      map.off("locationfound", onLocationFound);
    };
  }, [map]);

  //   For Routing
  useEffect(() => {
    if (!position) return;

    const destination = leaflet.latLng(pins[0].long, pins[0].lat);

    // const matchedPin = pins.find(
    //   (pin) => pin.lat === destination.lat && pin.long === destination.lng,
    // );

    const matchedPin = pins[0];

    console.log("Routing: calling onPinSelected with", matchedPin);

    if (matchedPin) {
      onPinSelected(matchedPin);
    }

    const routeControl = leaflet.Routing.control({
      waypoints: [leaflet.latLng(position.lat, position.lng), destination],
      collapsible: true,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      lineOptions: { styles: [{ color: colors.heading, weight: 4 }] },
    }).addTo(map);

    return () => map.removeControl(routeControl);
  }, [map, position]);

  return null;
}

export function PinMarking({ onPinClick }) {
  const createClusterCustomIcon = (cluster) => {
    return divIcon({
      html: `<div style="background-color: #FFA011; color: ${colors.heading}; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 14px;">${cluster.getChildCount()}</div>`,
      className: "cluster-marker",
      iconSize: point(40, 40, true),
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
          position={[pin.long, pin.lat]}
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
      map.flyTo([position.long, position.lat], 18);
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
    iconAnchor: [12, 12],
  });
  return (
    <>
      <Polyline positions={position} weight={6} color="#5F80AA" />
      <Marker position={midpoint} icon={icon} />
    </>
  );
}

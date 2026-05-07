import { useEffect, useState } from "react";
import { useMap, Marker } from "react-leaflet";
import leaflet from "leaflet";
import { LatLng, divIcon } from "leaflet";
import "leaflet-routing-machine";
import colors from "@/constants/colors";
import PinIcon from "@/assets/Map/Pins.svg?react";
import { renderToString } from "react-dom/server";

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
  const icon = divIcon({
    html: renderToString(<PinIcon width={50} height={50} />),
    className: "",
    iconAnchor: [12, 12],
  });

  return pins.map((pin) => (
    <Marker
      key={pin.id}
      position={[pin.long, pin.lat]}
      icon={icon}
      eventHandlers={{ click: () => onPinClick(pin) }}
    />
  ));
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

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Circle,
  Polyline,
} from "react-leaflet";
import leaflet from "leaflet";
import { LatLng, divIcon } from "leaflet";
import "leaflet-routing-machine";
import colors from "@/constants/colors";
import FloodIcon from "@/assets/Map/FloodIcon.svg?react";
import PinIcon from "@/assets/Map/Pins.svg?react";
import { renderToString } from "react-dom/server";

interface PinProps {
  Long: number;
  Lat: number;
}

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

function Routing() {
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

    const routeControl = leaflet.Routing.control({
      waypoints: [
        leaflet.latLng(position.lat, position.lng),
        leaflet.latLng(14.565518250363224, 120.99809311129499),
      ],
      collapsible: true,
      addWaypoints: false,
      draggableWaypoints: false,
      lineOptions: { styles: [{ color: colors.heading, weight: 4 }] },
    }).addTo(map);

    return () => map.removeControl(routeControl);
  }, [map, position]);

  return null;
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

function PinMarking({ Long, Lat }: PinProps) {
  const icon = divIcon({
    html: renderToString(<PinIcon width={50} height={50} />),
    className: "",
    iconAnchor: [12, 12],
  });

  return (
    <Marker position={[Long, Lat]} icon={icon}>
      <Popup>
        A pretty CSS3 popup. <br /> Easily customizable.
      </Popup>
    </Marker>
  );
}

function Map() {
  return (
    <div className="w-full max-w-md" style={{ height: 100 }}>
      <MapContainer style={{ height: "100vh", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Routing />
        <PinMarking Long={14.565518250363224} Lat={120.99809311129499} />
        <LocationMarker />
        <RoadMapping
          position={[
            [14.565561313458806, 120.99694416069873],
            [14.565961485258084, 120.9979076376789],
          ]}
        />
      </MapContainer>
    </div>
  );
}

export default Map;

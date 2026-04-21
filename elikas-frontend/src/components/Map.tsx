import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Circle,
} from "react-leaflet";
import leaflet from "leaflet";
import { LatLng } from "leaflet";
import "leaflet-routing-machine";
import colors from "@/constants/colors";

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

function Map() {
  return (
    <div className="w-full max-w-md" style={{ height: 100 }}>
      <MapContainer style={{ height: "100vh", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Routing />
        <Marker position={[14.56380669640196, 120.99479534109231]}>
          <Popup>
            A pretty CSS3 popup. <br /> Easily customizable.
          </Popup>
        </Marker>
        <Marker position={[14.565518250363224, 120.99809311129499]}>
          <Popup>
            A pretty CSS3 popup. <br /> Easily customizable.
          </Popup>
        </Marker>
        <LocationMarker />
      </MapContainer>
    </div>
  );
}

export default Map;

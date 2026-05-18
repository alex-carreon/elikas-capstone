import ButtonComp from "@/components/Button";
import SelectDropdown from "@/components/SelectDropdown";
import TextField from "@/components/TextField";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import colors from "@/constants/colors";
import { FormMapClickHandler, RoadMapping } from "@/lib/mapUtils";
import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useLocation } from "react-router";
import CheckBox from "@/components/CheckBox";
import { renderToString } from "react-dom/server";
import BlankPin from "@/assets/Map/BlankPin.svg?react";
import { divIcon } from "leaflet";

function HazardForm() {
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [existingHazard, setExistingHazard] = useState(false);
  const [fileName, setFileName] = useState("");
  const [imagePreview, setImagePreview] = useState<undefined | string>();
  const [brgy, setBrgy] = useState("");
  const [hazard, setHazard] = useState("");
  const [landmark, setLandmark] = useState("");
  const [floodLevel, setFloodLevel] = useState("");
  const [validCheck, setValidCheck] = useState(false);
  const [infoCheck, setInfoCheck] = useState(false);
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);

  const rawLoc = localStorage.getItem("clickedPin");
  const clickedLoc: [number, number] | null = rawLoc
    ? JSON.parse(rawLoc)
    : null;
  const center: [number, number] = clickedLoc ?? [14.5995, 120.9842];

  useEffect(() => {
    if (location.state?.from === "/History") {
      setExistingHazard(true);
    }
  }, [[location.state?.from]]);

  const icon = divIcon({
    html: renderToString(<BlankPin width={50} height={50} />),
    className: "",
    iconAnchor: [25, 50],
  });

  const fileOnChange = (e: any) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setFileName(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleClearImage = () => {
    setFileName("");

    if (inputRef.current) {
      console.log(inputRef.current);
      inputRef.current.value = "";
    }
  };

  const handleClearRoutePoints = () => {
    setRoutePoints([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Barangay", brgy);
    console.log("routePoints", routePoints);
    console.log("landmark", landmark);
    console.log("floodLevel", floodLevel);

    console.log(routePoints);

    const points = JSON.stringify(routePoints);

    // File not sure yet - localStorage.setItem("fileName", last_name);
    localStorage.setItem("Barangay", brgy);
    localStorage.setItem("routePoints", points);
    localStorage.setItem("landmark", landmark);
    localStorage.setItem("floodLevel", floodLevel);
  };

  return (
    <div className="w-full h-full flex flex-col items-center p-12 mt-8 mb-2 gap-4">
      <div>
        <p
          className="font-bold text-lg text-center"
          style={{ color: colors.heading }}
        >
          {existingHazard
            ? "Hazard Pin Details"
            : "Report Evacuation Road Status"}
        </p>
        {existingHazard ? null : (
          <p
            className="text-align italic text-sm"
            style={{ color: colors.label }}
          >
            Help others avoid blocked or unsafe routes.
          </p>
        )}
      </div>
      <form
        id="HazardPin_Form"
        onSubmit={handleSubmit}
        className="w-full flex flex-col justify-center items-center m-0"
      >
        <div className="w-full max-w-md flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <TextField
              label="Location Image*"
              inputType="file"
              id="HazardPin_PhotoField"
              onSubmit={fileOnChange}
              ref={inputRef}
            />
            {fileName && (
              <>
                <img src={imagePreview} />{" "}
                <ButtonComp
                  text="Clear"
                  variant="outline"
                  id="HazardPin_ImageClearBtn"
                  onClick={handleClearImage}
                ></ButtonComp>
              </>
            )}
          </div>
          <SelectDropdown
            value={brgy}
            onValueChange={setBrgy}
            label="Barangay*"
            placeholder="Select the location's barangay"
            id="HazardPin_BrgyField"
            onSubmit={(e) => setBrgy(e.target.value)}
            options={[
              { label: "Salapan", value: "11" },
              { label: "Batis", value: "12" },
            ]}
            isRequired
          />
          <Field>
            <FieldLabel
              className={"text-sm w-s"}
              style={{ color: colors.label }}
            >
              Chosen Location
            </FieldLabel>
            <FieldDescription>
              Press where the flood ends. This will only make a line. Add
              another if it goes a corner.
            </FieldDescription>
            <FieldLabel
              className={"text-sm w-s"}
              style={{ color: colors.label }}
            >
              Map Location
            </FieldLabel>
            <MapContainer
              center={center}
              zoom={17}
              scrollWheelZoom={false}
              style={{ height: "30vh", width: "100%" }}
              id="HazardPin_MapContainer"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={center} icon={icon} />
              <FormMapClickHandler
                onPinClick={null}
                setClickedLoc={setRoutePoints}
                clickedLoc={routePoints}
              />
              {routePoints && (
                <RoadMapping position={[center, ...routePoints]} />
              )}
            </MapContainer>
            <ButtonComp
              text="Clear"
              variant="outline"
              id="HazardPin_PinClearBtn"
              onClick={handleClearRoutePoints}
            ></ButtonComp>
          </Field>
          <TextField
            label="Nearby Landmark (optional)"
            placeholder="Enter a landmark near the hazard"
            id="HazardPin_LandmarkField"
            inputType="text"
            onSubmit={(e) => setLandmark(e.target.value)}
          ></TextField>
          <SelectDropdown
            value={floodLevel}
            onValueChange={setFloodLevel}
            label="Flood Level*"
            placeholder="Select the Flood Level"
            id="HazardPin_FloodLevelField"
            onSubmit={(e) => setFloodLevel(e.target.value)}
            options={[
              { label: "Ankle Level", value: "1" },
              { label: "Knee level", value: "2" },
            ]}
            isRequired
          />
          {existingHazard ? (
            <>
              <div className="mx-2 flex justify-evenly shrink gap-4">
                <ButtonComp
                  text="Update"
                  id="HazardPin_ClosePinBtn"
                  variant="primary"
                  heightSize="10"
                  widthSize="20"
                ></ButtonComp>
                <ButtonComp
                  text="Close"
                  id="HazardPin_ClosePinBtn"
                  variant="important"
                  widthSize="20"
                  heightSize="10"
                ></ButtonComp>
              </div>
            </>
          ) : (
            <>
              <div>
                <CheckBox
                  text="I confirm I am near this location."
                  id="HazardPin_ValidCheck"
                  checked={validCheck}
                  onCheckedChange={(val) => {
                    setValidCheck(!!val);
                  }}
                />
              </div>
              <div>
                <CheckBox
                  text="Information is accurate to the best of my knowledge."
                  id="HazardPin_InfoCheck"
                  checked={infoCheck}
                  onCheckedChange={(val) => {
                    setInfoCheck(!!val);
                  }}
                />
              </div>
              <div className="w-full max-w-md flex justify-center">
                <ButtonComp
                  text="Create Road Status"
                  variant="primary"
                  id="HazardPin_SubmitBtn"
                  isDisabled={!validCheck || !infoCheck}
                  heightSize="46px"
                />
              </div>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

export default HazardForm;

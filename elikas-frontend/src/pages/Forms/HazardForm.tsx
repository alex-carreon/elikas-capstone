import ButtonComp from "@/components/Button";
import SelectDropdown from "@/components/SelectDropdown";
import TextField from "@/components/TextField";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import colors from "@/constants/colors";
import { FormMapClickHandler } from "@/lib/mapUtils";
import { snapAllPointsToRoads } from "@/lib/mapUtils";
import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import { useLocation, useNavigate } from "react-router";
import CheckBox from "@/components/CheckBox";
import { renderToString } from "react-dom/server";
import BlankPin from "@/assets/Map/BlankPin.svg?react";
import { divIcon, latLng } from "leaflet";
import { InputGroupTextarea } from "@/components/ui/input-group";
import { toast } from "sonner";
import { formatInTimeZone } from "date-fns-tz";
import { addDays } from "date-fns";
import api from "@/api";
import { useUserContext } from "@/context/AuthContext";

function HazardForm() {
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const { token } = useUserContext();

  const [existingHazard, setExistingHazard] = useState(false);
  const [fileName, setFileName] = useState("");
  const [imagePreview, setImagePreview] = useState<undefined | string>();
  const [desc, setDesc] = useState("");
  const [hazard, setHazard] = useState("");
  const [landmark, setLandmark] = useState("");
  const [floodLevel, setFloodLevel] = useState("");
  const [validCheck, setValidCheck] = useState(false);
  const [infoCheck, setInfoCheck] = useState(false);
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [snapped, setSnapped] = useState<[number, number][]>([]);

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
    setSnapped([]);
  };

  // const getFloodLevels = async () => {
  //   try {
  //     const response = await api.get("/flood-levels", {
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });

  //     const levelData = await response.data;

  //     console.log(levelData);
  //   } catch (err: string | any) {
  //     Error(err.message || "An error occurred");
  //   }
  // };

  // useEffect(() => {
  //   getFloodLevels();
  // }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fullPath: [number, number][] = [center, ...routePoints];
      const snapped = await snapAllPointsToRoads(fullPath);

      if (!snapped) {
        toast("You went off-road. Please re-draw");
        return;
      } else if (snapped.length < 2) {
        toast("Please indicate the hazard on the map");
        return;
      } else setSnapped(snapped);

      const dateTime = formatInTimeZone(
        new Date(),
        "Asia/Manila",
        "MMMM dd, yyyy, h:mm a",
      );

      const expDate = addDays(dateTime, 7);

      const response = await api.post(
        "/flood-paths",
        {
          level_id: floodLevel,
          description: desc,
          expiry: expDate,
          path: snapped,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response) {
        console.log("Creating Path Failed");
      }

      navigate("/map");
    } catch (err: string | any) {
      Error(err.message || "An error occurred during registration");
    }
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
          <Field>
            <FieldLabel
              className={"text-sm w-s"}
              style={{ color: colors.label }}
            >
              Chosen Location
            </FieldLabel>
            <FieldDescription>
              Press on a road to make a line. Press again to make a line
              connecting to the one before. Please refrain from going off-road.
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
                center={center}
              />
              {snapped.length > 0 ? (
                <Polyline positions={snapped} weight={6} color="#5F80AA" />
              ) : (
                routePoints.length > 0 && (
                  <Polyline
                    positions={[center, ...routePoints]}
                    weight={6}
                    color="#5F80AA"
                  />
                )
              )}
            </MapContainer>
            <ButtonComp
              text="Clear"
              variant="outline"
              id="HazardPin_PinClearBtn"
              onClick={handleClearRoutePoints}
            ></ButtonComp>
          </Field>
          <Field>
            <FieldLabel
              className={"text-sm w-s"}
              style={{ color: colors.label }}
            >
              Description (Optional)
            </FieldLabel>
            <InputGroupTextarea
              className="h-10 border rounded-lg text-xs"
              id="HazardPin_DescField"
              onChange={(e) => setDesc(e.target.value)}
            />
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
              { label: "Gutter", value: "1" },
              { label: "Half Knee", value: "2" },
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

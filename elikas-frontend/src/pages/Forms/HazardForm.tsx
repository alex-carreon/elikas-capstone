import ButtonComp from "@/components/Button";
import SelectDropdown from "@/components/SelectDropdown";
import TextField from "@/components/TextField";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import colors from "@/constants/colors";
import { FormMapClickHandler, getMidpoint } from "@/lib/mapUtils";
import { snapAllPointsToRoads } from "@/lib/mapUtils";
import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import { isSession, useLocation, useNavigate, useParams } from "react-router";
import CheckBox from "@/components/CheckBox";
import { renderToString } from "react-dom/server";
import BlankPin from "@/assets/Map/BlankPin.svg?react";
import {
  divIcon,
  latLng,
  type LatLngExpression,
  type LatLngTuple,
} from "leaflet";
import { InputGroupTextarea } from "@/components/ui/input-group";
import { toast } from "sonner";
import { formatInTimeZone } from "date-fns-tz";
import { addDays } from "date-fns";
import api from "@/api";
import { useUserContext } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { differenceInDays } from "date-fns";
import FloodIcon from "@/assets/Map/FloodIcon.svg?react";
import AlertDialogue from "@/components/AlertDialogue";

type FloodLevel = {
  id: number;
  level_name: string;
};

type PostedBy = {
  id: number;
  username: string;
};

type FloodDetails = {
  id: number;
  element_id: number;
  is_expired: boolean;
  is_deactivated: boolean;
  level: FloodLevel;
  path: [number, number][];
  posted_by: PostedBy;
  description: string;
  upvotes: number;
  downvotes: number;
  last_confirmed: string;
  expiry: string;
  posted_at: string;
};

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
  const [levels, setLevels] = useState<FloodLevel[]>();
  const [loading, setLoading] = useState(true);
  const [floodDetails, setFloodDetails] = useState<FloodDetails>();
  const [daysLeft, setDaysleft] = useState(0);
  const [midpoint, setMidpoint] = useState<[number, number]>();
  const [isEditable, setIsEditable] = useState(false);
  const [hasUpdated, setHasUpdated] = useState(false);
  const [willDeactivate, setWillDeactivate] = useState(false);
  const [error, setError] = useState("");

  const { id } = useParams();

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

  const floodIcon = divIcon({
    html: renderToString(<FloodIcon width={36} height={36} />),
    className: "",
    iconAnchor: [18, 20],
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

  useEffect(() => {
    if (id) {
      const getFloodDetails = async () => {
        try {
          setHasUpdated(false);
          setLoading(true);
          const response = await api.get(`/flood-paths/${id}`);
          console.log("response", response);
          const floodDetails = await response.data.flood_path;
          console.log("Details", floodDetails);
          setFloodDetails(floodDetails);

          const midpoint = getMidpoint(floodDetails.path);
          setMidpoint(midpoint);

          const today = new Date();
          const expDate = new Date(floodDetails.expiry);

          setDaysleft(differenceInDays(expDate, today));
        } catch (err: string | any) {
          console.log(err.message || "An error occurred");
        } finally {
          setLoading(false);
        }
      };
      getFloodDetails();
    } else if (!id) {
      const getFloodLevels = async () => {
        try {
          setLoading(true);
          const response = await api.get("/flood-levels", {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          const levelData = await response.data.flood_levels;
          setLevels(levelData);
        } catch (err: string | any) {
          Error(err.message || "An error occurred");
        } finally {
          setLoading(false);
        }
      };
      getFloodLevels();
    }
  }, [hasUpdated]);

  useEffect(() => {
    if (isEditable) {
      const getFloodLevels = async () => {
        try {
          setLoading(true);
          const response = await api.get("/flood-levels", {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          const levelData = await response.data.flood_levels;
          setLevels(levelData);
        } catch (err: string | any) {
          Error(err.message || "An error occurred");
        } finally {
          setLoading(false);
        }
      };
      getFloodLevels();
    }
  }, [isEditable]);

  useEffect(() => {
    if (floodDetails) {
      setDesc(floodDetails.description);
    }
  }, [floodDetails]);

  useEffect(() => {
    if (isEditable && floodDetails) {
      setRoutePoints(floodDetails.path);
      setFloodLevel(String(floodDetails.level.id));
    }
  }, [isEditable, floodDetails]);

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
      }

      setSnapped(snapped);
      setMidpoint(getMidpoint(snapped));

      const dateTime = formatInTimeZone(
        new Date(),
        "Asia/Manila",
        "MMMM dd, yyyy, h:mm a",
      );

      if (!desc) {
        setError("This field is required.");
        return;
      }

      const expDate = addDays(dateTime, 7);

      const addPromise = new Promise(async (resolve, reject) => {
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
          reject(new Error("Please try again"));
        } else resolve(response);
      });

      toast.promise(addPromise, {
        loading: "Adding your pin to the map...",
        success: "Pin successfully added!",
        error: (err) => err?.message || "Please try again.",
        position: "top-center",
      });

      addPromise.then(() => {
        navigate("/map");
      });
    } catch (err: string | any) {
      Error(err.message || "An error occurred during registration");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const originalPath = floodDetails?.path ?? [];
      const newPoints = routePoints.slice(originalPath.length);

      const snapped =
        newPoints.length > 0 ? await snapAllPointsToRoads(routePoints) : [];

      if (!snapped) {
        toast("You went off-road. Please re-draw");
        return;
      } else if (snapped.length < 2) {
        toast("Please indicate the hazard on the map");
        return;
      } else {
        const fullPath = [...originalPath, ...snapped];
        setSnapped(fullPath);
      }

      const dateTime = formatInTimeZone(
        new Date(),
        "Asia/Manila",
        "MMMM dd, yyyy, h:mm a",
      );

      const expDate = addDays(dateTime, 7);

      const updPromise = new Promise(async (resolve, reject) => {
        const response = await api.patch(
          `/flood-paths/${id}`,
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

        console.log(response);

        if (!response) {
          reject(console.log("Creating Path Failed"));
          return;
        } else resolve(response);
      });

      toast.promise(updPromise, {
        loading: "Saving your updates...",
        success: "Pin successfully updated!",
        position: "top-center",
      });

      updPromise.then(() => {
        setIsEditable(false);
        setHasUpdated(true);
      });
    } catch (err: string | any) {
      console.log(err.message || "An error occurred");
    }
  };

  const handleDelete = async () => {
    try {
      const deacPromise = new Promise(async (resolve, reject) => {
        const response = await api.patch(`/flood-paths/${id}/deactivate`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        console.log(response);

        if (!response) {
          reject(console.log("Creating Path Failed"));
          return;
        } else resolve(response);
      });

      toast.promise(deacPromise, {
        loading: "Deleting pin...",
        success: "Pin Deleted!",
        position: "top-center",
      });

      deacPromise.then(() => {
        navigate("/History");
      });
    } catch (err) {
      console.error("Error Deactivating");
    }
  };

  return loading ? (
    <>
      <div className="w-full h-full flex flex-col items-center p-12 mt-8 mb-2 gap-4">
        <div className="flex w-full max-w-xs flex-col gap-7">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-20 bg-[#59260B]/30" />
            <Skeleton className="h-8 w-full bg-[#59260B]/30" />
          </div>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-24 bg-[#59260B]/30" />
            <Skeleton className="h-8 w-full bg-[#59260B]/30" />
          </div>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-24 bg-[#59260B]/30" />
            <Skeleton className="h-8 w-full bg-[#59260B]/30" />
          </div>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-24 bg-[#59260B]/30" />
            <Skeleton className="h-8 w-full bg-[#59260B]/30" />
          </div>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-24 bg-[#59260B]/30" />
            <Skeleton className="h-8 w-full bg-[#59260B]/30" />
          </div>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-24 bg-[#59260B]/30" />
            <Skeleton className="h-8 w-full bg-[#59260B]/30" />
          </div>
          <Skeleton className="h-8 w-24 bg-[#59260B]/30" />
        </div>
      </div>
    </>
  ) : (
    <>
      {willDeactivate && (
        <AlertDialogue
          contentId="HazardForm_DeacContent"
          closeId="HazardForm_DeacClose"
          actionId="HazardForm_DeacBtn"
          open={willDeactivate}
          title="You are about to delete this pin"
          description="Deleting this pin will remove it from the map and your history permanently."
          buttonText="Delete"
          onClose={() => {
            setWillDeactivate(false);
          }}
          onClick={handleDelete}
        />
      )}
      <div className="w-full h-full flex flex-col items-center p-12 mt-8 mb-2 gap-4">
        <div>
          <p
            className="font-bold text-lg text-center"
            style={{ color: colors.heading }}
          >
            {id
              ? "Hazard Pin Details"
              : isEditable
                ? "Hazard Pin Update"
                : "Report Evacuation Road Status"}
          </p>
          {id ? null : (
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
          onSubmit={id ? (isEditable ? handleUpdate : undefined) : handleSubmit}
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
                  <img src={imagePreview} />
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
                connecting to the one before. Please refrain from going
                off-road.
              </FieldDescription>
              <FieldLabel
                className={"text-sm w-s"}
                style={{ color: colors.label }}
              >
                Map Location
              </FieldLabel>
              <MapContainer
                center={id ? midpoint : center}
                zoom={17}
                scrollWheelZoom={false}
                style={{ height: "30vh", width: "100%" }}
                id="HazardPin_MapContainer"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {id ? (
                  <>
                    {floodDetails ? (
                      isEditable ? (
                        <>
                          <FormMapClickHandler
                            onPinClick={null}
                            setClickedLoc={setRoutePoints}
                            clickedLoc={routePoints}
                            center={floodDetails.path.at(-1)}
                          />
                          {snapped.length > 0 ? (
                            <Polyline
                              positions={snapped}
                              weight={6}
                              color="#5F80AA"
                            />
                          ) : (
                            routePoints.length > 0 && (
                              <Polyline
                                positions={routePoints}
                                weight={6}
                                color="#5F80AA"
                              />
                            )
                          )}
                        </>
                      ) : (
                        <>
                          <Marker
                            position={midpoint as LatLngExpression}
                            icon={floodIcon}
                          />
                          <Polyline
                            positions={floodDetails.path as LatLngTuple[]}
                            weight={6}
                            color="#5F80AA"
                          />
                        </>
                      )
                    ) : (
                      console.log("Can't find path")
                    )}
                  </>
                ) : (
                  <>
                    <Marker position={center} icon={icon} />
                    <FormMapClickHandler
                      onPinClick={null}
                      setClickedLoc={setRoutePoints}
                      clickedLoc={routePoints}
                      center={center}
                    />
                    {snapped.length > 0 ? (
                      <Polyline
                        positions={snapped}
                        weight={6}
                        color="#5F80AA"
                      />
                    ) : (
                      routePoints.length > 0 && (
                        <Polyline
                          positions={[center, ...routePoints]}
                          weight={6}
                          color="#5F80AA"
                        />
                      )
                    )}
                  </>
                )}
              </MapContainer>
              {(!id || isEditable) && (
                <ButtonComp
                  text="Clear"
                  variant="outline"
                  id="HazardPin_PinClearBtn"
                  onClick={handleClearRoutePoints}
                ></ButtonComp>
              )}
            </Field>
            <Field>
              <FieldLabel
                className={"text-sm w-s"}
                style={{ color: colors.label }}
              >
                Description*
              </FieldLabel>
              {(!id || isEditable) && (
                <FieldDescription>
                  A description will help users distinguish your pin. This could
                  be a nearby landmark or an address.
                </FieldDescription>
              )}
              <InputGroupTextarea
                className="h-10 border rounded-lg text-xs"
                id="HazardPin_DescField"
                onChange={(e) => setDesc(e.target.value)}
                value={desc}
                readOnly={!id || isEditable ? false : true}
              />
              <p className="text-xs text-red-500">{error}</p>
            </Field>
            {(!id || isEditable) && levels ? (
              <SelectDropdown
                value={floodLevel}
                onValueChange={setFloodLevel}
                label="Flood Level*"
                placeholder="Select the Flood Level"
                id="HazardPin_FloodLevelField"
                onSubmit={(e) => setFloodLevel(e.target.value)}
                options={levels?.map((level) => ({
                  label: level.level_name,
                  value: String(level.id),
                }))}
                isRequired={!id ? true : false}
              />
            ) : (
              <TextField
                label="Flood Level"
                inputType="text"
                id="HazardPin_FloodlevelExisting"
                value={id ? floodDetails?.level.level_name : ""}
                readonly
              />
            )}
            {id ? (
              <>
                <p className="italic" style={{ color: colors.label }}>
                  Expires in {daysLeft} days
                </p>
                <div className="mx-2 flex justify-evenly shrink gap-4">
                  {!isEditable ? (
                    <>
                      <ButtonComp
                        text="Update"
                        id="HazardPin_UpdatePinBtn"
                        variant="primary"
                        heightSize="40px"
                        widthSize="20"
                        type="button"
                        onClick={() => setIsEditable(true)}
                      ></ButtonComp>
                      <ButtonComp
                        text="Delete"
                        id="HazardPin_DeletePinBtn"
                        variant="important"
                        heightSize="40px"
                        widthSize="20"
                        type="button"
                        onClick={() => {
                          setWillDeactivate(true);
                        }}
                      ></ButtonComp>
                    </>
                  ) : (
                    <>
                      <ButtonComp
                        text="Submit"
                        id="HazardPin_SubmitUpdPinBtn"
                        variant="primary"
                        heightSize="40px"
                        widthSize="20"
                        type="submit"
                      ></ButtonComp>
                      <ButtonComp
                        text="Cancel"
                        id="HazardPin_ClosePinBtn"
                        variant="outline"
                        heightSize="40px"
                        widthSize="20"
                        type="button"
                      ></ButtonComp>
                    </>
                  )}
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
    </>
  );
}

export default HazardForm;

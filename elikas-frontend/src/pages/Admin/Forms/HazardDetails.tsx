import React, { useEffect, useState } from "react";
import FormLayout from "@/pages/Admin/Forms/FormLayout";
import FormSkeleton from "@/pages/Skeletons/FormSkeleton";
import TextField from "@/components/TextField";
import { useNavigate, useParams } from "react-router";
import api from "@/api";
import { Field, FieldLabel } from "@/components/ui/field";
import { getMidpoint } from "@/lib/mapUtils";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import FloodIcon from "@/assets/Map/FloodIcon.svg?react";
import { divIcon, type LatLngExpression, type LatLngTuple } from "leaflet";
import { renderToString } from "react-dom/server";
import { toast } from "sonner";
import SelectDropdown from "@/components/SelectDropdown";
import { handleDelete } from "@/lib/hazardUtils";

type FloodLevel = {
  id: number;
  level_name: string;
  description: string;
};

type FloodDetails = {
  id: number;
  element_id: number;
  is_expired: boolean;
  is_deactivated: boolean;
  flood_levels: FloodLevel;
  path: [number, number][];
  posted_by: string;
  description: string;
  upvotes: number;
  downvotes: number;
  last_confirmed: string;
  expiry: string;
  posted_at: string;
  media: string[];
};

function HazardDetails() {
  const [floodDetails, setFloodDetails] = useState<FloodDetails>();
  const [loading, setLoading] = useState(true);
  const [midpoint, setMidpoint] = useState<[number, number]>();
  const [isEditable, setIsEditable] = useState(false);
  const [levels, setLevels] = useState<FloodLevel[]>([]);
  const [levelId, setLevelId] = useState(0);
  const [disabled, setDisabled] = useState(false);

  const { id } = useParams();
  const navigate = useNavigate();

  const floodIcon = divIcon({
    html: renderToString(<FloodIcon width={36} height={36} />),
    className: "",
    iconAnchor: [18, 20],
  });

  const colorHazard = {
    lightBlue: "#52B2DA",
    darkBlue: "#578EC2",
    red: "#B22B42",
    fallback: "#C7C7C7",
  };

  const getColor = (level: number | null | undefined): string => {
    if (level === 8 || level === 9) {
      return colorHazard.lightBlue;
    } else if (level === 10 || level === 11) {
      return colorHazard.darkBlue;
    } else if (level === 12 || level === 13 || level === 14) {
      return colorHazard.red;
    } else return colorHazard.fallback;
  };

  const getFloodDetails = async (signal?: AbortSignal) => {
    try {
      const response = await api.get(`/flood-paths/${id}`, { signal });
      const floodDetails = await response.data.flood_path;
      console.log("Details", floodDetails);
      setFloodDetails(floodDetails);

      const midpoint = getMidpoint(floodDetails.path);
      setMidpoint(midpoint);
    } catch (err: any) {
      if (err.name === "CanceledError") return;
      console.log(err);
    }
  };

  const getFloodLevels = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const response = await api.get("/flood-levels", { signal });

      const levelData = await response.data.flood_levels;

      setLevels(levelData);
    } catch (err: any) {
      if (err.name === "CanceledError") return;
      console.log(err);
    }
  };

  const getAll = async () => {
    const controller = new AbortController();

    try {
      setLoading(true);
      setDisabled(true);

      await getFloodDetails(controller.signal);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        setLoading(false);
        setDisabled(false);
        return;
      }
      console.log(err);
    } finally {
      setLoading(false);
      setDisabled(false);
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e?.preventDefault();

    setDisabled(true);

    const response = api.patch(`/flood-paths/${id}`, {
      level_id: levelId,
    });

    toast.promise(response, {
      loading: "Saving your updates...",
      success: "Pin successfully updated!",
      position: "top-center",
    });

    response
      .then(() => {
        setIsEditable?.(false);
      })
      .catch((err: string | any) => {
        console.log(err.message || "An error occurred");
      })
      .finally(() => setDisabled(false));
  };

  const deleteHaz = () => {
    handleDelete({
      id: id,
      navigate: navigate,
      deleteNavigate: "/admin-pins",
      setDisabled: setDisabled,
    });
  };

  useEffect(() => {
    getAll();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    if (isEditable) {
      const getLevels = async () => {
        try {
          setLoading(true);
          await getFloodLevels(controller.signal);
        } catch (err: any) {
          if (err.name === "CanceledError") {
            setLoading(false);
            return;
          }
          console.log(err);
        } finally {
          setLoading(false);
        }
      };

      getLevels();
    }

    return () => controller.abort();
  }, [isEditable]);

  return (
    <>
      <FormLayout
        formTitle="Hazard Details"
        updateId="Admin_HazardUpdBtn"
        deleteId="Admin_HazardDelBtn"
        submitUpdId="Admin_HazardUpdSubmit"
        closeUpdId="Admin_HazardUpdClose"
        updateClick={() => setIsEditable(true)}
        closeUpdClick={() => setIsEditable(false)}
        formId="Admin_HazardUpdateForm"
        deleteClick={() => deleteHaz()}
        isEditable={isEditable}
        isDisabled={disabled}
        isDeactivated={floodDetails?.is_deactivated}
      >
        {loading ? (
          <div className="flex justify-center">
            <FormSkeleton />
          </div>
        ) : (
          <>
            <form
              onSubmit={handleUpdate}
              id="Admin_HazardUpdateForm"
              className="flex flex-col gap-4"
            >
              <TextField
                label="Flood Path Id"
                value={String(floodDetails?.id)}
                inputType="text"
                id="Admin_HazardId"
                readonly
              />
              <Field>
                <FieldLabel>Media</FieldLabel>
                {floodDetails?.media && floodDetails?.media.length > 0 ? (
                  floodDetails?.media.map((media) => <img src={media} />)
                ) : (
                  <p>No Media</p>
                )}
              </Field>
              <MapContainer
                center={midpoint}
                zoom={17}
                scrollWheelZoom={false}
                style={{ height: "30vh", width: "100%" }}
                id="Admin_HazardMapContainer"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
                  url={`https://api.maptiler.com/maps/base-v4/{z}/{x}/{y}.png?key=6RBKItdaX8o4QX31GhTm`}
                />
                <Marker
                  position={midpoint as LatLngExpression}
                  icon={floodIcon}
                />
                <Polyline
                  positions={floodDetails?.path as LatLngTuple[]}
                  weight={6}
                  color={getColor(floodDetails?.flood_levels.id)}
                />
              </MapContainer>
              {isEditable ? (
                <div className="w-full">
                  <SelectDropdown
                    value={String(levelId)}
                    onValueChange={(val) => setLevelId(Number(val))}
                    label="Flood Level*"
                    id="Admin_HazardLevelField"
                    onSubmit={(e) => setLevelId(Number(e.target.value))}
                    options={levels?.map((level) => ({
                      label: level.level_name,
                      value: String(level.id),
                      description: level.description,
                    }))}
                    isRequired={!id ? true : false}
                  />
                </div>
              ) : (
                <TextField
                  label="Flood Level"
                  value={String(floodDetails?.flood_levels.level_name)}
                  inputType="text"
                  id="Admin_HazardLevel"
                  readonly
                />
              )}
              <TextField
                label="Description"
                value={String(floodDetails?.description)}
                inputType="text"
                id="Admin_HazardDesc"
                readonly
              />
              <div className="flex gap-2">
                <TextField
                  label="Upvotes"
                  value={String(floodDetails?.upvotes)}
                  inputType="text"
                  id="Admin_HazardUpvotes"
                  readonly
                />
                <TextField
                  label="Downvotes"
                  value={String(floodDetails?.downvotes)}
                  inputType="text"
                  id="Admin_HazardDownvotes"
                  readonly
                />
              </div>
              <TextField
                label="Last Confirmed"
                value={String(floodDetails?.last_confirmed)}
                inputType="text"
                id="Admin_HazardLastConfirmed"
                readonly
              />
              <div className="flex flex-col gap-1">
                <TextField
                  label="Expiry Date"
                  value={String(floodDetails?.expiry)}
                  inputType="text"
                  id="Admin_HazardExpiry"
                  readonly
                />
                <p className="text-xs italic" id="Admin_HazardIsExpired">
                  Has expired: {String(floodDetails?.is_expired)}
                </p>
              </div>
              {floodDetails?.is_deactivated && (
                <div className="flex flex-col gap-1">
                  <TextField
                    label="Expiry Date"
                    value={String(floodDetails?.expiry)}
                    inputType="text"
                    id="Admin_HazardExpiry"
                    readonly
                  />
                  <p className="text-xs italic" id="Admin_HazardIsDeac">
                    Has deactivated: {String(floodDetails?.is_deactivated)}
                  </p>
                </div>
              )}
              <TextField
                label="Posted By"
                value={String(floodDetails?.posted_by)}
                inputType="text"
                id="Admin_HazardPostedBy"
                readonly
              />
              <TextField
                label="Posted On"
                value={String(floodDetails?.posted_at)}
                inputType="text"
                id="Admin_HazardPostedOn"
                readonly
              />
              <TextField
                label="Last Updated"
                value={String(floodDetails?.last_confirmed)}
                inputType="text"
                id="Admin_HazardLastUpdated"
                readonly
              />
            </form>
          </>
        )}
      </FormLayout>
    </>
  );
}

export default HazardDetails;

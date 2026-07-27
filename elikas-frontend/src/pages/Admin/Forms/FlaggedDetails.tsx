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
import colors from "@/constants/colors";
import FormDesktopSkeleton from "@/pages/Skeletons/FormDesktopSkeleton";

type floodLevel = {
  id: number;
  level_name: string;
  level_description: string;
};

type postedBy = {
  id: number;
  username: string;
};

type flagInfo = {
  type: string;
  flag_count: number;
  reasons: flagReason[];
};

type flagReason = {
  reason: string;
  flag_count: number;
  first_flagged_at: string;
};

type FlaggedFlood = {
  id: number;
  element_id: number;
  flood_level: floodLevel;
  posted_by: postedBy;
  path: [number, number][];
  description: string;
  upvotes: number;
  downvotes: number;
  last_confirmed: string;
  expiry: string;
  is_expired: boolean;
  is_deactivated: boolean;
  media: string[];
  flag_info: flagInfo;
};

function FlaggedDetails() {
  const [loading, setLoading] = useState(false);
  const [pathDetails, setPathDetails] = useState<FlaggedFlood>();
  const [midpoint, setMidpoint] = useState<[number, number]>();
  const [disabled, setDisabled] = useState(false);

  const { id } = useParams();
  const navigate = useNavigate();

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

  const floodIcon = divIcon({
    html: renderToString(<FloodIcon width={36} height={36} />),
    className: "",
    iconAnchor: [18, 20],
  });

  const getFloodDetails = async (signal?: AbortSignal) => {
    try {
      const response = await api.get(`/admin/flood-paths/flags/${id}`, {
        signal,
      });
      setPathDetails(response.data.flood_path);

      const midpoint = getMidpoint(response.data.flood_path.path);
      setMidpoint(midpoint);
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

  const ignoreFlag = (e?: React.FormEvent) => {
    e?.preventDefault();

    setDisabled(true);
    const response = api.patch(
      `/admin/flags/${pathDetails?.element_id}/approve`,
    );
    console.log(response);
    toast.promise(response, {
      loading: "Removing the flag...",
      success: "Flag removed!",
      error: (err: any) => {
        return err.response.data;
      },
      position: "top-center",
    });
    response
      .then(() => {
        navigate("/admin-pins");
      })
      .catch((err: any) => {
        console.log(err.response.data);
        toast.error(
          "An unexpected error occurred. Please wait while we try to fix this!",
        );
      })
      .finally(() => setDisabled(false));
  };

  const rejectFlag = (e?: React.FormEvent) => {
    e?.preventDefault();

    const response = api.patch(
      `/admin/flags/${pathDetails?.element_id}/reject`,
    );
    console.log(response);
    toast.promise(response, {
      loading: "Accepting the flag and deleting the post...",
      success: "Post removed!",
      error: (err: any) => {
        return err.response.data;
      },
      position: "top-center",
    });
    response
      .then(() => {
        navigate("/admin-pins");
      })
      .catch((err: any) => {
        console.log(err.response.data);
      })
      .finally(() => setDisabled(false));
  };

  useEffect(() => {
    getAll();
  }, []);

  return (
    <>
      <div className="md:hidden">
        <FormLayout
          formTitle="Flagged Hazard Details"
          updateId="Admin_FlaggedPathIgnore"
          updBtnLabel="Ignore"
          deleteBtnLabel="Remove"
          deleteId="Admin_FlaggedPathDelete"
          updateClick={(e) => ignoreFlag(e)}
          deleteClick={(e) => rejectFlag(e)}
          isDisabled={disabled}
          isDeactivated={pathDetails?.is_deactivated}
        >
          {loading ? (
            <div className="flex justify-center">
              <FormSkeleton />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                <TextField
                  label="Flag Type"
                  value={String(pathDetails?.flag_info.type)}
                  inputType="text"
                  id="Admin_FlaggedPathType"
                  readonly
                />
                <TextField
                  label="Flag Count"
                  value={String(pathDetails?.flag_info.flag_count)}
                  inputType="text"
                  id="Admin_FlaggedPathCount"
                  readonly
                />
                {pathDetails?.flag_info.reasons.map((reason) => (
                  <div className="flex gap-2">
                    <TextField
                      label="Flag Reason"
                      value={reason.reason}
                      inputType="text"
                      id="Admin_FlaggedPathReason"
                      readonly
                    />
                    <TextField
                      label="Count"
                      value={String(reason.flag_count)}
                      inputType="text"
                      id="Admin_FlaggedPathReasonCount"
                      readonly
                    />
                  </div>
                ))}

                <TextField
                  label="Flood Path Id"
                  value={String(pathDetails?.id)}
                  inputType="text"
                  id="Admin_FlaggedPathId"
                  readonly
                />
                <TextField
                  label="Element Id"
                  value={String(pathDetails?.element_id)}
                  inputType="text"
                  id="Admin_FlaggedPathElementId"
                  readonly
                />
                <Field>
                  <FieldLabel>Media</FieldLabel>
                  {pathDetails?.media && pathDetails?.media.length > 0 ? (
                    pathDetails?.media.map((media) => <img src={media} />)
                  ) : (
                    <p>No Media</p>
                  )}
                </Field>
                <MapContainer
                  center={midpoint}
                  zoom={17}
                  scrollWheelZoom={false}
                  style={{ height: "30vh", width: "100%" }}
                  id="Admin_FlaggedPathMapContainer"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
                    url={`https://api.maptiler.com/maps/base-v4/{z}/{x}/{y}.png?key=fvhZKnEDjdbWySpYqEZM`}
                  />
                  <Marker
                    position={midpoint as LatLngExpression}
                    icon={floodIcon}
                  />
                  <Polyline
                    positions={pathDetails?.path as LatLngTuple[]}
                    weight={6}
                    color={getColor(pathDetails?.flood_level.id)}
                  />
                </MapContainer>
                <TextField
                  label="Description"
                  value={String(pathDetails?.description)}
                  inputType="text"
                  id="Admin_FlaggedPathDesc"
                  readonly
                />
                <TextField
                  label="Flood Level"
                  value={String(pathDetails?.flood_level.level_name)}
                  inputType="text"
                  id="Admin_FlaggedPathLevel"
                  readonly
                />
                <TextField
                  label="Posted By"
                  value={String(pathDetails?.posted_by.username)}
                  inputType="text"
                  id="Admin_FlaggedPathPostedBy"
                  readonly
                />
                <div className="flex gap-2">
                  <TextField
                    label="Upvotes"
                    value={String(pathDetails?.upvotes)}
                    inputType="text"
                    id="Admin_FlaggedPathUpvotes"
                    readonly
                  />
                  <TextField
                    label="Downvotes"
                    value={String(pathDetails?.downvotes)}
                    inputType="text"
                    id="Admin_FlaggedPathDownvotes"
                    readonly
                  />
                </div>
                <TextField
                  label="Last Confirmed"
                  value={String(pathDetails?.last_confirmed)}
                  inputType="text"
                  id="Admin_FlaggedPathLastConfirmed"
                  readonly
                />
                <div className="flex flex-col gap-1">
                  <TextField
                    label="Expiry Date"
                    value={String(pathDetails?.expiry)}
                    inputType="text"
                    id="Admin_FlaggedPathExpiry"
                    readonly
                  />
                  <div className="flex gap-4">
                    <p className="text-xs italic" id="Admin_FlaggedIsExpired">
                      Has hazard pin expired: {String(pathDetails?.is_expired)}
                    </p>
                    <p className="text-xs italic" id="Admin_FlaggedIsDeac">
                      Has hazard pin deactivated:
                      {String(pathDetails?.is_deactivated)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </FormLayout>
      </div>
      <div className="hidden md:block">
        <FormLayout
          updateId="Admin_FlaggedPathIgnore"
          updBtnLabel="Ignore"
          deleteBtnLabel="Remove"
          deleteId="Admin_FlaggedPathDelete"
          updateClick={(e) => ignoreFlag(e)}
          deleteClick={(e) => rejectFlag(e)}
          isDisabled={disabled}
          isDeactivated={pathDetails?.is_deactivated}
        >
          <div className="flex flex-col gap-8 mx-18">
            <p className="text-2xl font-bold" style={{ color: colors.heading }}>
              Flagged Hazard Details
            </p>
            <div>
              {loading ? (
                <div className="flex justify-center">
                  <FormDesktopSkeleton />
                </div>
              ) : (
                <>
                  <div className="flex gap-12 justify-center bg-gray-400/20 p-8 rounded-lg">
                    <div className="flex flex-col gap-4 w-1/2">
                      <TextField
                        label="Flag Type"
                        value={String(pathDetails?.flag_info.type)}
                        inputType="text"
                        id="Admin_FlaggedPathType"
                        readonly
                      />
                      <TextField
                        label="Flag Count"
                        value={String(pathDetails?.flag_info.flag_count)}
                        inputType="text"
                        id="Admin_FlaggedPathCount"
                        readonly
                      />
                      {pathDetails?.flag_info.reasons.map((reason) => (
                        <div className="flex gap-2">
                          <TextField
                            label="Flag Reason"
                            value={reason.reason}
                            inputType="text"
                            id="Admin_FlaggedPathReason"
                            readonly
                          />
                          <TextField
                            label="Count"
                            value={String(reason.flag_count)}
                            inputType="text"
                            id="Admin_FlaggedPathReasonCount"
                            readonly
                          />
                        </div>
                      ))}

                      <TextField
                        label="Flood Path Id"
                        value={String(pathDetails?.id)}
                        inputType="text"
                        id="Admin_FlaggedPathId"
                        readonly
                      />
                      <TextField
                        label="Element Id"
                        value={String(pathDetails?.element_id)}
                        inputType="text"
                        id="Admin_FlaggedPathElementId"
                        readonly
                      />
                      <Field>
                        <FieldLabel>Media</FieldLabel>
                        {pathDetails?.media && pathDetails?.media.length > 0 ? (
                          pathDetails?.media.map((media) => <img src={media} />)
                        ) : (
                          <p>No Media</p>
                        )}
                      </Field>

                      <TextField
                        label="Description"
                        value={String(pathDetails?.description)}
                        inputType="text"
                        id="Admin_FlaggedPathDesc"
                        readonly
                      />
                      <TextField
                        label="Flood Level"
                        value={String(pathDetails?.flood_level.level_name)}
                        inputType="text"
                        id="Admin_FlaggedPathLevel"
                        readonly
                      />
                      <TextField
                        label="Posted By"
                        value={String(pathDetails?.posted_by.username)}
                        inputType="text"
                        id="Admin_FlaggedPathPostedBy"
                        readonly
                      />
                      <div className="flex gap-2">
                        <TextField
                          label="Upvotes"
                          value={String(pathDetails?.upvotes)}
                          inputType="text"
                          id="Admin_FlaggedPathUpvotes"
                          readonly
                        />
                        <TextField
                          label="Downvotes"
                          value={String(pathDetails?.downvotes)}
                          inputType="text"
                          id="Admin_FlaggedPathDownvotes"
                          readonly
                        />
                      </div>
                      <TextField
                        label="Last Confirmed"
                        value={String(pathDetails?.last_confirmed)}
                        inputType="text"
                        id="Admin_FlaggedPathLastConfirmed"
                        readonly
                      />
                      <div className="flex flex-col gap-1">
                        <TextField
                          label="Expiry Date"
                          value={String(pathDetails?.expiry)}
                          inputType="text"
                          id="Admin_FlaggedPathExpiry"
                          readonly
                        />
                        <div className="flex gap-4">
                          <p
                            className="text-xs italic"
                            id="Admin_FlaggedIsExpired"
                          >
                            Has hazard pin expired:{" "}
                            {String(pathDetails?.is_expired)}
                          </p>
                          <p
                            className="text-xs italic"
                            id="Admin_FlaggedIsDeac"
                          >
                            Has hazard pin deactivated:
                            {String(pathDetails?.is_deactivated)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="w-1/2">
                      <MapContainer
                        center={midpoint}
                        zoom={17}
                        scrollWheelZoom={false}
                        style={{ height: "60vh", width: "100%" }}
                        id="Admin_FlaggedPathMapContainer"
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
                          url={`https://api.maptiler.com/maps/base-v4/{z}/{x}/{y}.png?key=fvhZKnEDjdbWySpYqEZM`}
                        />
                        <Marker
                          position={midpoint as LatLngExpression}
                          icon={floodIcon}
                        />
                        <Polyline
                          positions={pathDetails?.path as LatLngTuple[]}
                          weight={6}
                          color={getColor(pathDetails?.flood_level.id)}
                        />
                      </MapContainer>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </FormLayout>
      </div>
    </>
  );
}

export default FlaggedDetails;

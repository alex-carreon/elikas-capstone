import { getMidpoint } from "@/lib/mapUtils";
import React from "react";
import { type NavigateFunction } from "react-router";
import { toast } from "sonner";
import { formatInTimeZone } from "date-fns-tz";
import { addDays } from "date-fns";
import api from "@/api";
import { format } from "date-fns-tz";

type FloodLevel = {
  id: number;
  level_name: string;
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
  media?: File[] | undefined;
};

interface handleActionProps {
  e?: React.FormEvent<Element>;
  center?: [number, number];
  routePoints?: [number, number][];
  desc?: string;
  floodLevel?: string;
  token?: string | null;
  setMidpoint?: React.Dispatch<
    React.SetStateAction<[number, number] | undefined>
  >;
  setError?: React.Dispatch<React.SetStateAction<string>>;
  navigate?: NavigateFunction;
  floodDetails?: FloodDetails;
  id?: string;
  setIsEditable?: React.Dispatch<React.SetStateAction<boolean>>;
  setHasUpdated?: React.Dispatch<React.SetStateAction<boolean>>;
  snapped?: [number, number][];
  isEditable?: boolean;
  media?: File | undefined;
  deleteNavigate?: string;
  setDisabled?: React.Dispatch<React.SetStateAction<boolean>>;
  userExpiry?: Date;
}

export const handleSubmit = async ({
  e,
  center,
  routePoints,
  desc,
  floodLevel,
  setMidpoint,
  setError,
  navigate,
  media,
  setDisabled,
  userExpiry,
}: handleActionProps) => {
  e?.preventDefault();

  const formData = new FormData();

  try {
    setDisabled?.(true);
    if (center && routePoints) {
      if (!routePoints || routePoints.length < 2) {
        toast("Please indicate the hazard on the map");
        return;
      }

      setMidpoint?.(getMidpoint(routePoints));

      const dateTime = formatInTimeZone(
        new Date(),
        "Asia/Manila",
        "MMMM dd, yyyy, h:mm a",
      );

      if (!desc) {
        setError?.("This field is required.");
        return;
      }

      const expDate = userExpiry ?? addDays(dateTime, 3);

      formData.append("expiry", format(expDate, "yyyy-MM-dd"));
      routePoints.forEach((point, index) => {
        formData.append(`path[${index}][0]`, String(point[0]));
        formData.append(`path[${index}][1]`, String(point[1]));
      });
      if (media) {
        formData.append("file", media);
      }
      formData.append("level_id", String(floodLevel));
      formData.append("description", String(desc));

      const response = api.post("/flood-paths", formData, {
        headers: {
          "Content-Type": "undefined",
        },
      });

      toast.promise(response, {
        loading: "Adding your pin to the map...",
        success: "Pin successfully added!",
        error: (err) => err?.message || "Please try again.",
        position: "top-center",
      });

      response.then(() => {
        navigate?.("/map");
      });
    }
  } catch (error: any) {
    console.error("Request failed");

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error:", error.message);
    }
  } finally {
    setDisabled?.(false);
  }

  return;
};

export const handleUpdate = async ({
  e,
  routePoints,
  desc,
  floodLevel,
  floodDetails,
  id,
  setIsEditable,
  setHasUpdated,
  setDisabled,
  userExpiry,
}: handleActionProps) => {
  e?.preventDefault();

  try {
    setDisabled?.(true);
    if (!floodDetails) return;

    if (!routePoints || routePoints.length < 2) {
      toast.error("Please indicate the hazard on the map");
      return;
    }

    if (!floodLevel) {
      return;
    }

    if (desc === null) {
      toast.error("Please fill the description field");
      return;
    }

    if (!userExpiry) {
      toast.error("Please enter an expiry date.");
      return;
    }

    const expDate = userExpiry;

    const dateTime = formatInTimeZone(
      expDate,
      "Asia/Manila",
      "MMMM dd, yyyy, h:mm a",
    );

    const response = api.patch(`/flood-paths/${id}`, {
      level_id: floodLevel,
      description: desc,
      expiry: dateTime,
      path: routePoints,
    });

    toast.promise(response, {
      loading: "Saving your updates...",
      success: "Pin successfully updated!",
      position: "top-center",
    });

    response.then(() => {
      setIsEditable?.(false);
      setHasUpdated?.(true);
    });
  } catch (err: string | any) {
    console.log(err.message || "An error occurred");
  } finally {
    setDisabled?.(false);
  }
};

export const handleDelete = async ({
  id,
  navigate,
  deleteNavigate,
  setDisabled,
}: handleActionProps) => {
  try {
    setDisabled?.(true);
    const response = api.patch(`/flood-paths/${id}/deactivate`);

    toast.promise(response, {
      loading: "Deleting your pin...",
      success: "Pin Deleted!",
      error: (err: any) => {
        console.log(err.response?.data);
        return err.response?.data?.message || "Please try again.";
      },
      position: "top-center",
    });

    const navigation = deleteNavigate ? deleteNavigate : "/History";

    response.then(() => {
      navigate?.(navigation);
    });
  } catch (err) {
    console.error("Error Deactivating");
  } finally {
    setDisabled?.(false);
  }
};

export const handleAddMedia = async ({
  e,
  id,
  media,
  setDisabled,
}: handleActionProps) => {
  e?.preventDefault();

  const formData = new FormData();

  try {
    setDisabled?.(true);
    if (media) {
      formData.append("file", media);
    }

    const response = api.post(`/flood-paths/${id}/media`, formData);

    toast.promise(response, {
      loading: "Adding your photo...",
      success: "Photo added. Do the same if you want to add another!",
      error: (err: any) => {
        return err.response.data;
      },
      position: "top-center",
    });
  } catch (err: any) {
    console.log(err.response.data);
  } finally {
    setDisabled?.(false);
  }
};

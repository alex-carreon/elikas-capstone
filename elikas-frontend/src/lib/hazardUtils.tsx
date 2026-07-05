import { getMidpoint } from "@/lib/mapUtils";
import React from "react";
import { type NavigateFunction } from "react-router";
import { toast } from "sonner";
import { formatInTimeZone } from "date-fns-tz";
import { addDays } from "date-fns";
import api from "@/api";

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

  setDisabled?.(true);
  if (center && routePoints) {
    if (!routePoints || routePoints.length < 2) {
      toast("Please indicate the hazard on the map");
      setDisabled?.(false);
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

    const now = new Date();
    const expDateWithTime = new Date(
      expDate.getFullYear(),
      expDate.getMonth(),
      expDate.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
    );

    formData.append(
      "expiry",
      formatInTimeZone(
        expDateWithTime,
        "Asia/Manila",
        "yyyy-MM-dd HH:mm:ssXXX",
      ),
    );
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
      error: (err) => {
        if (err.response.data.message) {
          return err.response.data.message;
        }
        if (err.response.errors > 0) {
          return "Please fill all fields mark with a *";
        }
        return "An unexpected error occurred. Please try again.";
      },
      position: "top-center",
    });

    response
      .then(() => {
        navigate?.("/map");
      })
      .catch((error: any) => {
        if (error.response) {
          console.error("Status:", error.response);
        } else if (error.request) {
          console.error("No response received:", error.request);
        } else {
          console.error("Error:", error.message);
        }
      })
      .finally(() => setDisabled?.(false));
  }
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

  setDisabled?.(true);

  if (!floodDetails) {
    setDisabled?.(false);
    return;
  }

  if (!routePoints || routePoints.length < 2) {
    toast.error("Please indicate the hazard on the map");
    setDisabled?.(false);
    return;
  }

  if (!floodLevel) {
    setDisabled?.(false);
    return;
  }

  if (desc === null) {
    toast.error("Please fill the description field");
    setDisabled?.(false);

    return;
  }

  if (!userExpiry) {
    toast.error("Please enter an expiry date.");
    setDisabled?.(false);
    return;
  }

  const expDate = userExpiry ? new Date(userExpiry) : addDays(new Date(), 3);

  const now = new Date();
  const expDateWithTime = new Date(
    expDate.getFullYear(),
    expDate.getMonth(),
    expDate.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
  );

  const dateTime = formatInTimeZone(
    expDateWithTime,
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
    error: (err: any) => {
      if (err.response.data.message) {
        return err.response.data.message;
      }
      return "An unexpected error occurred. Please try again.";
    },
    position: "top-center",
  });

  response
    .then(() => {
      setIsEditable?.(false);
      setHasUpdated?.(true);
    })
    .catch((err: string | any) => {
      console.log(err.message || "An error occurred");
    })
    .finally(() => setDisabled?.(false));
};

export const handleDelete = async ({
  id,
  navigate,
  deleteNavigate,
  setDisabled,
}: handleActionProps) => {
  setDisabled?.(true);
  const response = api.patch(`/flood-paths/${id}/deactivate`);

  toast.promise(response, {
    loading: "Deleting your pin...",
    success: "Pin Deleted!",
    error: (err: any) => {
      if (err.response.data.message) {
        return err.response.data.message;
      }
      return "An unexpected error occurred. Please try again.";
    },
    position: "top-center",
  });

  const navigation = deleteNavigate ? deleteNavigate : "/History";

  response
    .then(() => {
      navigate?.(navigation);
    })
    .catch(() => {
      toast.error(
        "An unexpected error has occurred. Please wait as the team tries to fix this!",
      );
    })
    .finally(() => setDisabled?.(false));
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
        if (err.response.data.message) {
          return err.response.data.message;
        }
        return "An unexpected error has occurred. Please try again later.";
      },
      position: "top-center",
    });
  } catch (err: any) {
    console.log(err.response.data);
  } finally {
    setDisabled?.(false);
  }
};

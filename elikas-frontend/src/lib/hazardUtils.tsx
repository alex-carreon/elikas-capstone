import { getMidpoint } from "@/lib/mapUtils";
import { snapAllPointsToRoads } from "@/lib/mapUtils";
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
};

interface handleActionProps {
  e?: React.FormEvent<Element>;
  center?: [number, number];
  routePoints?: [number, number][];
  desc?: string;
  floodLevel?: string;
  token?: string | null;
  setSnapped?: React.Dispatch<React.SetStateAction<[number, number][]>>;
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
}

export const handleSubmit = async ({
  e,
  center,
  routePoints,
  desc,
  floodLevel,
  token,
  setSnapped,
  setMidpoint,
  setError,
  navigate,
}: handleActionProps) => {
  e?.preventDefault();

  try {
    if (center && routePoints) {
      const fullPath: [number, number][] = [center, ...routePoints];
      const snapped = await snapAllPointsToRoads(fullPath);

      if (!snapped) {
        toast("You went off-road. Please re-draw");
        return;
      } else if (snapped.length < 2) {
        toast("Please indicate the hazard on the map");
        return;
      }

      setSnapped?.(snapped);
      setMidpoint?.(getMidpoint(snapped));

      const dateTime = formatInTimeZone(
        new Date(),
        "Asia/Manila",
        "MMMM dd, yyyy, h:mm a",
      );

      if (!desc) {
        setError?.("This field is required.");
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
        navigate?.("/map");
      });
    }
  } catch (err: string | any) {
    Error(err.message || "An error occurred during registration");
  }

  return;
};

export const handleUpdate = async ({
  e,
  routePoints,
  desc,
  floodLevel,
  token,
  setSnapped,
  floodDetails,
  id,
  setIsEditable,
  setHasUpdated,
}: handleActionProps) => {
  e?.preventDefault();

  try {
    const originalPath = floodDetails?.path ?? [];
    const newPoints = routePoints?.slice(originalPath.length);

    let finalSnapped: [number, number][] = [];

    if (floodDetails && newPoints && routePoints) {
      if (newPoints?.length === 0) {
        finalSnapped = originalPath;
      } else {
        const snapped =
          newPoints.length > 0 ? await snapAllPointsToRoads(routePoints) : [];

        if (!snapped) {
          toast("You went off-road. Please re-draw");
          return;
        } else if (routePoints.length < 2) {
          toast("Please indicate the hazard on the map");
          return;
        } else {
          finalSnapped = [...originalPath, ...snapped];
        }
      }
    }

    setSnapped?.(finalSnapped);

    const dateTime = formatInTimeZone(
      new Date(),
      "Asia/Manila",
      "MMMM dd, yyyy, h:mm a",
    );

    const expDate = addDays(dateTime, 7);

    if (!floodLevel) {
      return;
    }

    const updPromise = new Promise(async (resolve, reject) => {
      const response = await api.patch(
        `/flood-paths/${id}`,
        {
          level_id: floodLevel,
          description: desc,
          expiry: expDate,
          path: finalSnapped,
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
      setIsEditable?.(false);
      setHasUpdated?.(true);
    });
  } catch (err: string | any) {
    console.log(err.message || "An error occurred");
  }
};

export const handleDelete = async ({
  token,
  id,
  navigate,
}: handleActionProps) => {
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
      loading: "Deleting your pin...",
      success: "Pin Deleted!",
      error: (err: any) => {
        console.log(err.response?.data);
        return err.response?.data?.message || "Please try again.";
      },
      position: "top-center",
    });

    deacPromise.then(() => {
      navigate?.("/History");
    });
  } catch (err) {
    console.error("Error Deactivating");
  }
};

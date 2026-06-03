import api from "@/api";
import type { NavigateFunction } from "react-router";
import { toast } from "sonner";

interface handleActionProps {
  e?: React.FormEvent;
  navigate?: NavigateFunction;
  name?: string;
  mountHeight?: number;
  location?: [number, number];
  address?: string;
  yellowLevel?: number;
  orangeLevel?: number;
  redLevel?: number;
  brgy?: number;
  id?: number;
  setIsEditable?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const handleCreate = async ({
  e,
  navigate,
  name,
  mountHeight,
  location,
  address,
  yellowLevel,
  orangeLevel,
  redLevel,
  brgy,
}: handleActionProps) => {
  e?.preventDefault();

  try {
    const response = api.post("/sensors", {
      name: name,
      mountHeight: mountHeight,
      location: location,
      address: address,
      yellowLevel: yellowLevel,
      orangeLevel: orangeLevel,
      redLevel: redLevel,
      locationId: brgy,
    });
    console.log(response);

    if (!response) {
      console.log(response);
    }

    toast.promise(response, {
      loading: "Adding your sensor to the map...",
      success: "Sensor added successfully!",
      error: (err) => err?.message || "Please try again",
      position: "top-center",
    });

    response.then(() => {
      navigate?.("/History");
    });
  } catch (error: any) {
    console.error(error.response.data);
  }

  return;
};

export const handleUpdate = async ({
  e,
  id,
  name,
  mountHeight,
  address,
  yellowLevel,
  orangeLevel,
  redLevel,
  setIsEditable,
}: handleActionProps) => {
  e?.preventDefault();

  try {
    const response = api.patch(`/sensors/${id}`, {
      name: name,
      mountHeight: mountHeight,
      address: address,
      yellowLevel: yellowLevel,
      //   orangeLevel: orangeLevel,
      redLevel: redLevel,
    });

    toast.promise(response, {
      loading: "Updating this sensor...",
      success: "Sensor is successfully updated!",
      error: (err: any) => {
        return err.response.data.message || "Please try again.";
      },
    });

    response.then(() => {
      setIsEditable?.(false);
    });
  } catch (err: any) {
    console.log(err.response.data);
  }
};

export const handleDeac = async ({ id, navigate }: handleActionProps) => {
  try {
    const response = api.patch(`/sensors/${id}/deactivate`);

    if (!response) {
      console.log("Error in deactivating");
      return;
    }

    toast.promise(response, {
      loading: "Deleting this sensor...",
      success: () => {
        navigate?.("/History");
        return "Sensor successfully deleted!";
      },
      error: (err: any) => {
        return err.response.data.message;
      },
      position: "top-center",
    });
  } catch (err: any) {
    console.log(err.response.data);
  }
};

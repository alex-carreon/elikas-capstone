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
  setError?: React.Dispatch<
    React.SetStateAction<{
      yellowLevel: string;
      orangeLevel: string;
      redLevel: string;
    }>
  >;
  error?: {
    yellowLevel: string;
    orangeLevel: string;
    redLevel: string;
  };
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
  setError,
}: handleActionProps) => {
  e?.preventDefault();

  try {
    if (mountHeight) {
      if (!yellowLevel || yellowLevel == 0) {
        setError?.({
          yellowLevel: "Yellow level must be greater than 0",
          orangeLevel: "",
          redLevel: "",
        });
        return;
      }
      if (
        !orangeLevel ||
        !redLevel ||
        !(yellowLevel < orangeLevel) ||
        !(orangeLevel < redLevel)
      ) {
        setError?.({
          yellowLevel: "",
          orangeLevel:
            "Orange level must be greater than yellow level and less than red level",
          redLevel: "",
        });
        return;
      }
      if (!redLevel || !(redLevel > orangeLevel) || !(redLevel < mountHeight)) {
        setError?.({
          yellowLevel: "",
          orangeLevel: "",
          redLevel:
            "Red level must be greater than orange level and less than the mount height",
        });
        return;
      } else {
        setError?.({
          yellowLevel: "",
          orangeLevel: "",
          redLevel: "",
        });
      }
    }

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
      error: (err: any) => {
        if (err.response.status == 422) {
          return "Fill in all the fields";
        }

        return "An error occurred. Please try again.";
      },
      position: "top-center",
    });

    response.then(() => {
      navigate?.("/History");
    });
  } catch (error: any) {
    console.error(error?.response?.data);
    if (error instanceof Error) {
      setError?.({
        yellowLevel: "Yellow level must be greater than 0",
        orangeLevel:
          "Orange level must be greater than yellow level and less than red level",
        redLevel:
          "Red level must be greater than orange level and less than the mount height",
      });
    }
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
  setError,
}: handleActionProps) => {
  e?.preventDefault();

  try {
    if (mountHeight) {
      if (!yellowLevel || yellowLevel == 0) {
        setError?.({
          yellowLevel: "Yellow level must be greater than 0",
          orangeLevel: "",
          redLevel: "",
        });
        return;
      }
      if (
        !orangeLevel ||
        !redLevel ||
        !(yellowLevel < orangeLevel) ||
        !(orangeLevel < redLevel)
      ) {
        setError?.({
          yellowLevel: "",
          orangeLevel:
            "Orange level must be greater than yellow level and less than red level",
          redLevel: "",
        });
        return;
      }
      if (!redLevel || !(redLevel > orangeLevel) || !(redLevel < mountHeight)) {
        setError?.({
          yellowLevel: "",
          orangeLevel: "",
          redLevel:
            "Red level must be greater than orange level and less than the mount height",
        });
        return;
      } else {
        setError?.({
          yellowLevel: "",
          orangeLevel: "",
          redLevel: "",
        });
      }
    }

    const response = api.patch(`/sensors/${id}`, {
      name: name,
      mountHeight: mountHeight,
      address: address,
      yellowLevel: yellowLevel,
      orangeLevel: orangeLevel,
      redLevel: redLevel,
    });

    toast.promise(response, {
      loading: "Updating this sensor...",
      success: "Sensor is successfully updated!",
      error: (err: any) => {
        if (err.response.status == 422) {
          return "Fill in all the fields";
        }

        return "An error occurred. Please try again.";
      },
    });

    response.then(() => {
      setIsEditable?.(false);
    });
  } catch (err: any) {
    console.log(err.response.data);
    if (err instanceof Error) {
      setError?.({
        yellowLevel: "Yellow level must be greater than 0",
        orangeLevel:
          "Orange level must be greater than yellow level and less than red level",
        redLevel:
          "Red level must be greater than orange level and less than the mount height",
      });
    }
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

import api from "@/api";
import type { NavigateFunction } from "react-router";
import { toast } from "sonner";

interface handleActionProps {
  e?: React.FormEvent;
  navigate?: NavigateFunction;
  name: string;
  mountHeight?: number;
  location?: [number, number];
  address?: string;
  yellowLevel?: number;
  orangeLevel?: number;
  redLevel?: number;
  brgy?: number;
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
    console.error("Request failed");

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error:", error.message);
    }
  }

  return;
};

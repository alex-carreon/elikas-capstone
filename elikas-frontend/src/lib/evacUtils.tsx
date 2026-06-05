import api from "@/api";
import { toast } from "sonner";
import { type NavigateFunction } from "react-router-dom";

interface handleActionProps {
  e?: React.FormEvent<Element>;
  id?: string;
  name?: string;
  address?: string;
  description?: string;
  lat?: number;
  lng?: number;
  location_id?: number;
  area_type?: number;
  capacity_level?: number;
  is_persistent?: boolean;
  for_reg_flood?: boolean;
  for_heavy_flood?: boolean;
  has_accom?: boolean;
  has_DRRMO?: boolean;
  has_health?: boolean;
  pwd_friendly?: boolean;
  has_catchment?: boolean;
  toilet_count?: number;
  kitchen_count?: number;
  child_prayer_count?: number;
  breastfeed_count?: number;
  other_facilities?: string;
  contact_person?: string;
  contact_number?: string;
  expiry?: string | null | undefined;
  file?: File | undefined;
  navigate?: NavigateFunction;
  setIsEditable?: React.Dispatch<React.SetStateAction<boolean>>;
  setHasUpdated?: React.Dispatch<React.SetStateAction<boolean>>;
  formData?: FormData;
}

export const handleSubmit = async ({
  e,
  navigate,
  formData,
}: handleActionProps) => {
  e?.preventDefault();

  try {
    const response = api.post("/pins", formData, {
      headers: {
        "Content-Type": undefined,
      },
    });

    console.log(response);

    if (!response) {
      console.log("No response from server");
    }

    toast.promise(response, {
      loading: "Adding your pin to the map...",
      success: "Pin successfully added!",
      error: (err) => err?.message || "Please try again.",
      position: "top-center",
    });

    response.then(() => {
      navigate?.("/map");
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

export const handleUpdate = async ({
  e,
  id,
  name,
  address,
  description,
  area_type,
  is_persistent,
  for_reg_flood,
  for_heavy_flood,
  has_accom,
  has_DRRMO,
  has_health,
  pwd_friendly,
  has_catchment,
  toilet_count,
  kitchen_count,
  child_prayer_count,
  breastfeed_count,
  other_facilities,
  contact_person,
  contact_number,
  expiry,
  setIsEditable,
  setHasUpdated,
}: handleActionProps) => {
  // e?.preventDefault();

  try {
    e?.preventDefault();
    const responsePromise = api.put(`/pins/${id}`, {
      name: name,
      address: address,
      description: description,
      //   location_id: location_id,
      area_type: area_type,
      //   capacity_level: capacity_level,
      is_persistent: is_persistent,
      for_reg_flood: for_reg_flood,
      for_heavy_flood: for_heavy_flood,
      has_accom: has_accom,
      has_DRRMO: has_DRRMO,
      has_health: has_health,
      pwd_friendly: pwd_friendly,
      has_catchment: has_catchment,
      toilet_count: toilet_count,
      kitchen_count: kitchen_count,
      child_prayer_count: child_prayer_count,
      breastfeed_count: breastfeed_count,
      other_facilities: other_facilities,
      contact_person: contact_person,
      contact_number: contact_number,
      expiry: expiry,
    });

    toast.promise(responsePromise, {
      loading: "Updating your pin...",
      success: "Pin successfully updated!",
      error: (err: any) => {
        console.log(err.response?.data);
        return err.response?.data?.message || "Please try again.";
      },
    });

    responsePromise.then(() => {
      setIsEditable?.(false);
      setHasUpdated?.(true);
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
};

export const handleDelete = async ({ id, navigate }: handleActionProps) => {
  try {
    const responsePromise = api.patch(`/pins/${id}/deactivate`);

    toast.promise(responsePromise, {
      loading: "Deleting your pin...",
      success: () => {
        navigate?.("/History");
        return "Pin Deleted!";
      },
      error: (err: any) => {
        console.log(err.response?.data);
        return err.response?.data?.message || "Please try again.";
      },
      position: "top-center",
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
};

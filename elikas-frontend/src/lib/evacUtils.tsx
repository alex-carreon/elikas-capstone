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
  redirect?: string;
  role?: string;
  setDisabled?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const handleSubmit = async ({
  e,
  navigate,
  formData,
  setDisabled,
}: handleActionProps) => {
  e?.preventDefault();

  setDisabled?.(true);
  const response = api.post("/pins", formData, {
    headers: {
      "Content-Type": undefined,
    },
  });

  if (!response) {
    toast.error(
      "eLikas isn't responding right now. Please try later as the team is working on it!",
    );
  }

  toast.promise(response, {
    loading: "Adding your pin to the map...",
    success: "Pin successfully added!",
    error: (err: any) => {
      if (
        err.response.data.details ===
        "The expiry field must be a date after now."
      ) {
        return "The expiry date must be a date after now.";
      }
      if (err.response.data.message === "Too Many Attempts") {
        return "Too many attempts. Please try again later.";
      }
      return err.response.data.error;
    },
    position: "top-center",
  });

  response
    .then(() => {
      navigate?.("/map");
    })
    .catch((error: any) => {
      console.error("Request failed");

      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
      } else if (error.request) {
        console.error("No response received:", error.request);
      } else {
        console.error("Error:", error.message);
      }
    })
    .finally(() => setDisabled?.(false));
};

export const handleUpdate = async ({
  e,
  id,
  name,
  address,
  description,
  area_type,
  capacity_level,
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
  role,
  setDisabled,
  location_id,
}: handleActionProps) => {
  e?.preventDefault();
  setDisabled?.(true);

  const responsePromise = api.put(`/pins/${id}`, {
    ...(name && { name: name }),
    address: address,
    description: description,
    area_type: area_type,
    capacity_level: capacity_level,
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
    location_id: location_id,
    ...(contact_person && { contact_person: contact_person }),
    ...(contact_number && { contact_number: contact_number }),
    ...(role === "brgy_op" && { expiry: expiry }),
    expiry: expiry,
  });

  console.log(responsePromise);

  toast.promise(responsePromise, {
    loading: "Updating your pin...",
    success: "Pin successfully updated!",
    error: (err: any) => {
      console.log(err.response?.data);
      if (
        err.response.data.error ===
        "The expiry date cannot be modified for non-persistent (ad-hoc) evacuation pins. Set is_persistent to true before adjusting the expiry, or omit the expiry field."
      ) {
        return "Non-persistent evacuation pins does not allow change in expiry.";
      }
      return err.response?.data?.message || "Please try again.";
    },
  });

  responsePromise
    .then(() => {
      setIsEditable?.(false);
      setHasUpdated?.(true);
    })
    .catch((error: any) => {
      console.error("Request failed");

      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
      } else if (error.request) {
        console.error("No response received:", error.request);
      } else {
        console.error("Error:", error.message);
      }
    })
    .finally(() => setDisabled?.(false));
};

export const handleDelete = async ({
  id,
  navigate,
  redirect,
  setDisabled,
}: handleActionProps) => {
  try {
    setDisabled?.(true);
    const responsePromise = api.patch(`/pins/${id}/deactivate`);

    toast.promise(responsePromise, {
      loading: "Deactivating your pin...",
      success: () => {
        navigate?.(redirect ? redirect : "");
        return "Pin Deactivated!";
      },
      error: (err: any) => {
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
  } finally {
    setDisabled?.(false);
  }
};

export const handleReOpen = ({
  e,
  id,
  expiry,
  navigate,
  redirect,
  setDisabled,
}: handleActionProps) => {
  e?.preventDefault();

  setDisabled?.(true);
  const response = api.put(`/pins/${id}`, { expiry: expiry });
  toast.promise(response, {
    loading: "Re-opening your pin...",
    success: "Pin Re-opened!",
    error: (err: any) => {
      return err.response.data;
    },
    position: "top-center",
  });

  response
    .then(() => {
      navigate?.(redirect ? redirect : "");
    })
    .catch((err: any) => {
      console.log(err.response.data);
    })
    .finally(() => setDisabled?.(false));
};

export const handleReactivate = ({
  e,
  id,
  navigate,
  redirect,
  setDisabled,
}: handleActionProps) => {
  e?.preventDefault();

  setDisabled?.(true);
  const response = api.patch(`/pins/${id}/restore`);
  console.log(response);

  toast.promise(response, {
    loading: "Re-activating this pin...",
    success: "Pin Re-activated!",
    error: (err: any) => {
      return err.response.data;
    },
    position: "top-center",
  });

  response
    .then(() => {
      navigate?.(redirect ? redirect : "");
    })
    .catch((err: any) => {
      console.log(err.response.data);
    })
    .finally(() => setDisabled?.(false));
};

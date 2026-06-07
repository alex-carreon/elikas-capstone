import api from "@/api";
import type React from "react";
import type { NavigateFunction } from "react-router";
import { toast } from "sonner";

interface handleActionProps {
  e?: React.FormEvent;
  title?: string;
  address?: string;
  primaryNo?: string;
  secondaryNo?: string;
  brgyId?: number;
  navigate?: NavigateFunction;
  id?: string;
}

export const handleSubmit = ({
  e,
  title,
  address,
  primaryNo,
  secondaryNo,
  brgyId,
  navigate,
}: handleActionProps) => {
  e?.preventDefault();

  try {
    const response = api.post("/emergency-contacts", {
      name: title,
      address: address,
      phone_number: primaryNo,
      mobile_number: secondaryNo,
      location_id: brgyId,
    });

    console.log(response);

    if (!response) {
      console.log("Create Failed");
      toast.error("Adding a new contact failed.");
    }

    toast.promise(response, {
      loading: "Adding your contact...",
      success: "Contact successfully added!",
      error: (err: any) => err.response.data,
      position: "top-center",
    });

    response.then(() => {
      navigate?.("/Hotlines");
    });
  } catch (err: any) {
    console.log(err.response);
  }
};

export const handleUpdate = ({
  e,
  title,
  address,
  primaryNo,
  secondaryNo,
  brgyId,
  navigate,
  id,
}: handleActionProps) => {
  e?.preventDefault();

  try {
    const response = api.patch(`/emergency-contacts/${id}`, {
      name: title,
      address: address,
      phone_number: primaryNo,
      mobile_number: secondaryNo,
      location_id: brgyId,
    });

    console.log(response);

    if (!response) {
      console.log("Update Failed");
      toast.error("Updating a contact failed.");
    }

    toast.promise(response, {
      loading: "Updating your contact...",
      success: "Contact updated added!",
      error: (err: any) => err.response.data,
      position: "top-center",
    });

    response.then(() => {
      navigate?.("/Hotlines");
    });
  } catch (err: any) {
    console.log(err.response);
  }
};

export const handleDeac = ({ id, navigate }: handleActionProps) => {
  try {
    const response = api.patch(`/emergency-contacts/${id}/deactivate`);

    if (!response.catch) {
      toast.error("Deleting this hotline failed.");
      console.log(response);
    }

    toast.promise(response, {
      loading: "Deleting this hotline...",
      success: "Hotline deleted!",
      error: (err: any) => {
        return err.response.data.message || "Please try again.";
      },
      position: "top-center",
    });

    response.then(() => {
      navigate?.("/Hotlines");
    });
  } catch (err: any) {
    console.log(err.response.data);
  }
};

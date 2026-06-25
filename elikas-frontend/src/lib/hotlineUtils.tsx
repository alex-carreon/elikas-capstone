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
  redirect?: string;
}

export const handleSubmit = ({
  e,
  title,
  address,
  primaryNo,
  secondaryNo,
  brgyId,
  navigate,
  redirect,
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
      toast.error("An error occurred. Please try agian.");
    }

    toast.promise(response, {
      loading: "Adding your contact...",
      success: "Contact successfully added!",
      error: (err: any) => {
        if (err.response.data.error === "Failed to create emergency contact") {
          return "Please fill in all the fields.";
        }
        return "An error occurred. Please try again.";
      },
      position: "top-center",
    });

    response.then(() => {
      navigate?.(redirect ? redirect : "/Hotlines");
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
  redirect,
}: handleActionProps) => {
  e?.preventDefault();

  try {
    if (primaryNo === null) {
      toast.error("Please fill in the Primary Number field.");
      return;
    }

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
      toast.error("An error occurred. Please try again.");
    }

    toast.promise(response, {
      loading: "Updating your contact...",
      success: "Contact updated added!",
      error: (err: any) => {
        if (err.response.data.error === "Failed to update emergency contact") {
          return "Please fill in all the fields";
        }
        return "An error occurred. Please try again.";
      },
      position: "top-center",
    });

    response.then(() => {
      navigate?.(redirect ? redirect : "");
    });
  } catch (err: any) {
    console.log(err.response);
  }
};

export const handleDeac = ({ id, navigate, redirect }: handleActionProps) => {
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
      navigate?.(redirect ? redirect : "");
    });
  } catch (err: any) {
    console.log(err.response.data);
  }
};

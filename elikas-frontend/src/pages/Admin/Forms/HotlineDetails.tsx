import api from "@/api";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import FormLayout from "./FormLayout";
import TextField from "@/components/TextField";
import FormSkeleton from "@/pages/Skeletons/FormSkeleton";
import { handleDeac, handleUpdate } from "@/lib/hotlineUtils";

type HotlineDetails = {
  id: number;
  location_name: string;
  name: string;
  address: string;
  phone_number: string;
  mobile_number: string;
  last_updated: string;
  posted_by: string;
};

function HotlineDetails() {
  const [hotlines, setHotlines] = useState<HotlineDetails>();
  const [loading, setLoading] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [primaryNo, setPrimaryNo] = useState("");
  const [secondaryNo, setSecondaryNo] = useState("");
  const [brgyId, setBrgyId] = useState(0);
  const [error, setError] = useState({ primary: "", secondary: "" });

  const { id } = useParams();
  const navigate = useNavigate();

  const contactValidate = /^\(0\d{2}\)\d{7}$|^\(02\)\d{8}$|^09\d{9}$/;

  const getDetails = async (signal?: AbortSignal) => {
    try {
      const response = await api.get(`/emergency-contacts/${id}`, { signal });
      setHotlines(response.data.emergency_contact);
      setTitle(response.data.emergency_contact.name);
      setAddress(response.data.emergency_contact.address);
      setPrimaryNo(response.data.emergency_contact.phone_number);
      setSecondaryNo(response.data.emergency_contact.mobile_number);
      setBrgyId(response.data.emergency_contact.location_id);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        return;
      }
      console.log(err.response?.data);
    }
  };

  const getAll = async () => {
    const controller = new AbortController();
    try {
      setLoading(true);

      await getDetails(controller.signal);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        setLoading(false);
        return;
      }
      console.log(err.response?.data);
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  };

  const update = (e: React.FormEvent) => {
    if (!contactValidate.test(primaryNo)) {
      setError({ primary: "Enter a valid contact number", secondary: "" });
      return;
    } else {
      setError({ primary: "", secondary: "" });
    }

    if (secondaryNo) {
      if (!contactValidate.test(secondaryNo)) {
        setError({ primary: "", secondary: "Enter a valid contact number" });
        return;
      } else {
        setError({ primary: "", secondary: "" });
      }
    }

    handleUpdate({
      e: e,
      title: title,
      address: address,
      primaryNo: primaryNo,
      secondaryNo: secondaryNo,
      brgyId: brgyId,
      navigate: navigate,
      id: id,
      redirect: `/admin-hotlines/${String(hotlines?.id)}`,
    });
  };

  const deac = () => {
    handleDeac({
      id: id,
      navigate: navigate,
      redirect: "/admin-hotlines",
    });
  };

  useEffect(() => {
    getAll();
  }, []);

  return (
    <FormLayout
      formTitle="Emergency Contact Details"
      formId="Admin_HotlineDetailsUpdateForm"
      isEditable={isEditable}
      updateId="Admin_HotlineDetailsUpdBtn"
      deleteId="Admin_HotlineDetailsDelBtn"
      submitUpdId="Admin_HotlineDetailsUpdSubBtn"
      closeUpdId="Admin_HotlineDetailsCloseUpdBtn"
      updateClick={() => setIsEditable(true)}
      closeUpdClick={() => {
        setIsEditable(false);
        getAll();
      }}
      deleteClick={() => deac()}
    >
      {loading ? (
        <div className="w-full h-full flex flex-col items-center p-12 mt-8 mb-2 gap-4">
          <FormSkeleton />
        </div>
      ) : (
        <form
          className="flex flex-col gap-4"
          id="Admin_HotlineDetailsUpdateForm"
          onSubmit={(e) => update(e)}
        >
          <TextField
            label="Hotline Id"
            inputType="text"
            id="Admin_HotlineDetailsId"
            value={String(hotlines?.id)}
            readonly
          />
          <TextField
            label="Hotline Name"
            inputType="text"
            id="Admin_HotlineDetailsName"
            value={title}
            onSubmit={(e) => setTitle(e.target.value)}
            readonly={!isEditable}
          />
          <TextField
            label="Barangay"
            inputType="text"
            id="Admin_HotlineDetailsBarangay"
            value={String(hotlines?.location_name)}
            readonly
          />
          <TextField
            label="Address"
            inputType="text"
            id="Admin_HotlineDetailsAddress"
            value={address}
            onSubmit={(e) => setAddress(e.target.value)}
            readonly={!isEditable}
          />
          <TextField
            label="Primary Contact Number"
            inputType="text"
            placeholder="(XXX or XX)XXXXXXX or 09XXXXXXXXX"
            id="Admin_HotlineDetailsOfNo"
            value={primaryNo}
            onSubmit={(e) => setPrimaryNo(e.target.value)}
            readonly={!isEditable}
            error={error.primary}
          />
          <TextField
            label="Secondary Contact Number"
            inputType="text"
            placeholder="(XXX or XX)XXXXXXX or 09XXXXXXXXX"
            id="Admin_HotlineDetailsSecNo"
            value={secondaryNo}
            onSubmit={(e) => setSecondaryNo(e.target.value)}
            readonly={!isEditable}
            error={error.secondary}
          />
          <TextField
            label="Posted by"
            inputType="text"
            id="Admin_HotlineDetailsPostedBy"
            value={String(hotlines?.posted_by)}
            readonly
          />
          <TextField
            label="Last Updated"
            inputType="text"
            id="Admin_HotlineDetailsLastUpdated"
            value={String(hotlines?.last_updated)}
            readonly
          />
        </form>
      )}
    </FormLayout>
  );
}

export default HotlineDetails;

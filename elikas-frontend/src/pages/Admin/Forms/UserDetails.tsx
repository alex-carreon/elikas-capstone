import api from "@/api";
import FormLayout from "./FormLayout";
import TextField from "@/components/TextField";
import { useNavigate, useParams } from "react-router";
import React, { useEffect, useState } from "react";
import FormSkeleton from "@/pages/Skeletons/FormSkeleton";
import { toast } from "sonner";
import AlertDialogue from "@/components/AlertDialogue";
import SelectDropdown from "@/components/SelectDropdown";
import { bigSmile } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { User } from "lucide-react";

type UserData = {
  created_at: string;
  deactivated_at: string;
  email: string;
  first_name: string;
  id: number;
  indiv_location: string;
  indiv_location_id: number;
  last_name: string;
  phone: string | null;
  role: string | null;
  username: string;
  avatar_seed: string;
};

type Barangays = {
  id: number;
  name: string;
  parent_id: number;
  parent_location: Cities;
};

type Cities = {
  id: number;
  name: string;
  parent_id: number;
  parent_location: Province;
};

type Province = {
  id: number;
  level_id: number;
  name: string;
};

function UserDetails() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [seed, setSeed] = useState("");
  const [username, setUsername] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [locationId, setLocationId] = useState("");
  const [phone, setPhone] = useState<string>("");
  const [createdAt, setCreatedAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [willDeac, setWillDeac] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [userData, setUserData] = useState<UserData>();
  const [barangays, setBarangays] = useState<Barangays[]>([]);
  const [brgyLoad, setBrgyLoad] = useState(false);
  const [cities, setCities] = useState<Cities[]>([]);
  const [cityId, setCityId] = useState(0);
  const [disabled, setDisabled] = useState(false);

  const getIndivDetails = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/users/${id}`, { signal });

      const userDetails = response.data;
      setSeed(userDetails.avatar_seed);
      setUserData(userDetails);
      setUsername(userDetails.username);
      setFirstname(userDetails.first_name);
      setLastname(userDetails.last_name);
      setEmail(userDetails.email);
      setLocation(userDetails.indiv_location);
      setLocationId(String(userDetails.indiv_location_id));
      setPhone(userDetails.phone);
      setCreatedAt(userDetails.created_at);
    } catch (err: any) {
      if (err.name === "CanceledError") return;
      console.log(err);
    }
  };

  const getCity = async () => {
    try {
      setLoading(true);
      const cityRes = await api.get("/locations/cities");

      const cities = cityRes.data.Cities;
      setCities(cities);
    } catch (err: any) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateIndiv = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Sending:", {
      username,
      email,
      first_name: firstname,
      last_name: lastname,
      phone,
      indiv_location_id: locationId,
    });

    try {
      setDisabled(true);
      const response = await api.patch(`/admin/users/${id}`, {
        username: username,
        email: email,
        first_name: firstname,
        last_name: lastname,
        ...(phone ? { phone } : {}),
        // indiv_location_id: location,
        indiv_location_id: locationId,
      });

      if (!response) {
        return;
      } else {
        setIsEditable(false);
        getIndivDetails();
      }
    } catch (err: any) {
      console.log(err.response?.data);
      toast.error("An unexpected error occurred.");
    } finally {
      setDisabled(false);
    }
  };

  const deacIndiv = async () => {
    setDisabled(true);
    const response = api.patch(`/admin/users/${id}/deactivate`);

    toast.promise(response, {
      loading: "Deactivating this account...",
      success: "Account Deactivated!",
      position: "top-center",
    });

    response
      .then(() => {
        navigate("/admin-indiv");
      })
      .catch((err: any) => {
        console.log(err.response.message);
      })
      .finally(() => setDisabled(false));
  };

  useEffect(() => {
    const controller = new AbortController();

    const getAll = async () => {
      try {
        setLoading(true);
        await getIndivDetails(controller.signal);
      } catch (err: any) {
        if (err.name === "CanceledError") {
          setLoading(false);
          return;
        }
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    getAll();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    if (!cityId) return;

    const getBrgy = async () => {
      try {
        setBrgyLoad(true);
        const brgyRes = await api.get(
          `/locations/barangays?city_id=${cityId}`,
          { signal: controller.signal },
        );
        const barangays = brgyRes.data.Barangays;
        setBarangays(barangays);
      } catch (err: any) {
        if (err.name === "CanceledError") {
          setBrgyLoad(false);
          return;
        }
        console.log(err);
      } finally {
        setBrgyLoad(false);
      }
    };

    getBrgy();

    return () => controller.abort();
  }, [cityId]);

  useEffect(() => {
    if (isEditable) {
      getCity();
    }
  }, [isEditable]);

  useEffect(() => {
    if (isEditable && userData) {
      setUsername(userData.username);
      setEmail(userData.email);
      setFirstname(userData.first_name);
      setLastname(userData.last_name);
      setPhone(userData.phone ?? "");
      setLocationId(String(userData.indiv_location_id));
    }
  }, [isEditable]);

  const avatar = createAvatar(bigSmile, {
    seed: seed ? seed : undefined,
    backgroundColor: ["b6e3f4", "c0aede", "d1d4f9"],
    radius: 50,
    scale: 90,
    accessoriesProbability: 50,
    eyes: ["cheery", "normal", "starstruck", "winking"],
    mouth: ["braces", "gapSmile", "kawaii", "openedSmile", "teethSmile"],
  });

  const dataUri = avatar.toDataUri();

  return (
    <>
      {willDeac && (
        <AlertDialogue
          contentId="Admin_IndivDeacContent"
          closeId="Admin_IndivDeacClose"
          actionId="Admin_IndivDeacBtn"
          open={willDeac}
          title="You are about to deactivate this user"
          description="Deactivating this user will remove them from the active users list."
          buttonText="Delete"
          onClose={() => {
            setWillDeac(false);
          }}
          onClick={deacIndiv}
        />
      )}
      <FormLayout
        updateId="Admin_IndivUpdateBtn"
        deleteId="Admin_IndivDeleteBtn"
        deleteClick={() => setWillDeac(true)}
        submitUpdId="Admin_IndivSubmitUpdBtn"
        closeUpdId="Admin_IndivCloseUpdBtn"
        isEditable={isEditable}
        updateClick={() => setIsEditable(true)}
        closeUpdClick={() => {
          setIsEditable(false);
          getIndivDetails();
        }}
        formId="Admin_IndivUpdateForm"
        isDisabled={disabled}
      >
        {loading ? (
          <div className="flex justify-center">
            <FormSkeleton />
          </div>
        ) : (
          <>
            <form
              onSubmit={updateIndiv}
              className="flex flex-col gap-4"
              id="Admin_IndivUpdateForm"
            >
              <div className="w-full flex justify-center">
                {seed ? (
                  <img src={dataUri} className="w-24" />
                ) : (
                  <User className="w-24" />
                )}
              </div>
              <TextField
                label="User ID"
                inputType="text"
                id="Admin_IndivIdField"
                value={id}
                readonly
              />
              <TextField
                label="Username"
                inputType="text"
                id="Admin_IndivUsernameField"
                value={username}
                readonly={!isEditable}
                onSubmit={(e) => setUsername(e.target.value)}
              />
              <TextField
                label="First Name"
                inputType="text"
                id="Admin_IndivFirstnameField"
                value={firstname}
                readonly={!isEditable}
                onSubmit={(e) => setFirstname(e.target.value)}
              />
              <TextField
                label="Last Name"
                inputType="text"
                id="Admin_IndivLastnameField"
                value={lastname}
                readonly={!isEditable}
                onSubmit={(e) => setLastname(e.target.value)}
              />
              <TextField
                label="Email"
                inputType="text"
                id="Admin_IndivEmailField"
                value={email}
                readonly={!isEditable}
                onSubmit={(e) => setEmail(e.target.value)}
              />
              {!isEditable ? (
                <TextField
                  label="Address"
                  inputType="text"
                  id="Admin_IndivAddressField"
                  value={location}
                  readonly
                />
              ) : (
                <>
                  <SelectDropdown
                    value={String(cityId)}
                    onValueChange={(val) => {
                      setCityId;
                      setCityId(Number(val));
                    }}
                    label="City"
                    placeholder="Select a City"
                    id="Admin_IndivCityField"
                    onSubmit={(e) => setLocation(e.target.value)}
                    options={cities?.map((city) => ({
                      label: city.name,
                      value: String(city.id),
                    }))}
                    isRequired={!id ? true : false}
                  />
                  <SelectDropdown
                    value={String(locationId)}
                    onValueChange={setLocationId}
                    label="Barangay"
                    placeholder="Select a Barangay (Please select a city first)"
                    id="Admin_IndivBrgyField"
                    onSubmit={(e) => setLocation(e.target.value)}
                    options={barangays?.map((brgy) => ({
                      label: brgy.name,
                      value: String(brgy.id),
                    }))}
                    isRequired={!id ? true : false}
                    loading={brgyLoad}
                  />
                </>
              )}

              <TextField
                label="Contact Number"
                inputType="text"
                id="Admin_IndivContactNoField"
                value={phone ?? ""}
                readonly={!isEditable}
                onSubmit={(e) => setPhone(e.target.value)}
              />
              <TextField
                label="Created At"
                inputType="text"
                id="Admin_IndivCreatedField"
                value={createdAt}
                readonly
              />
            </form>
          </>
        )}
      </FormLayout>
    </>
  );
}

export default UserDetails;

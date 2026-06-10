import api from "@/api";
import FormLayout from "./FormLayout";
import TextField from "@/components/TextField";
import { useNavigate, useParams } from "react-router";
import React, { useEffect, useState } from "react";
import { useUserContext } from "@/context/AuthContext";
import FormSkeleton from "@/pages/Skeletons/FormSkeleton";
import { toast } from "sonner";
import AlertDialogue from "@/components/AlertDialogue";
import SelectDropdown from "@/components/SelectDropdown";
import { bigSmile } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";

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
  const { token } = useUserContext();
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
  const [cities, setCities] = useState<Cities[]>([]);
  const [cityId, setCityId] = useState(0);

  //   Get Details
  const getIndivDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/users/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("response", response);

      if (!response) {
        return new Error("Failed to retrieve data");
      }

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
    } catch (err: string | any) {
      Error(err.message || "An error occurred");
    } finally {
      setLoading(false);
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

  useEffect(() => {
    if (!cityId) return;

    const getBrgy = async () => {
      try {
        const brgyRes = await api.get(`/locations/barangays?city_id=${cityId}`);

        const barangays = brgyRes.data.Barangays;
        console.log(barangays);
        setBarangays(barangays);
      } catch (err: any) {
        console.log(err.message);
      }
    };

    getBrgy();
  }, [cityId]);

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
      const response = await api.patch(
        `/admin/users/${id}`,
        {
          username: username,
          email: email,
          first_name: firstname,
          last_name: lastname,
          ...(phone ? { phone } : {}),
          // indiv_location_id: location,
          indiv_location_id: locationId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response) {
        new Error(response || "Update failed");
        return;
      } else {
        setIsEditable(false);
        getIndivDetails();
      }
    } catch (err: string | any) {
      console.log(err.response?.data);
    }
  };

  const deacIndiv = async () => {
    try {
      const deacPromise = new Promise(async (resolve, reject) => {
        const response = await api.patch(`/admin/users/${id}/deactivate`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        console.log(response);

        const userDataDelete = await response.data;

        if (!response) {
          reject(new Error(userDataDelete.error || "Deactivation failed"));
        } else resolve(userDataDelete);
      });

      toast.promise(deacPromise, {
        loading: "Deactivating this account...",
        success: "Account Deactivated!",
        position: "top-center",
      });

      deacPromise.then(() => {
        navigate("/admin-indiv");
      });
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  useEffect(() => {
    getIndivDetails();

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
    seed: seed,
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
                <img src={dataUri} className="w-24" />
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
              {/* <TextField
                label="Address"
                inputType="text"
                id="Admin_IndivAddressField"
                value={location}
                readonly
              /> */}
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

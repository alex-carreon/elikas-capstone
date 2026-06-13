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

type UserData = {
  created_at: string;
  deactivated_at: string;
  email: string;
  username: string;
  govop_level: string;
  id: number;
  govop_location: string;
  govop_location_id: number;
  point_person: string;
  point_position: string;
  role: string | null;
};

type Barangays = {
  id: number;
  name: string;
  role: string;
  location: string;
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

function BrgyDetails() {
  const { id } = useParams();
  const { token } = useUserContext();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [locationId, setLocationId] = useState("");
  const [pointPerson, setPointPerson] = useState("");
  const [pointPosition, setPointPosition] = useState("");
  const [locLevel, setLocLevel] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [willDeac, setWillDeac] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [userData, setUserData] = useState<UserData>();
  const [barangays, setBarangays] = useState<Barangays[]>([]);
  const [cities, setCities] = useState<Cities[]>([]);
  const [cityId, setCityId] = useState(0);
  const [brgyLoad, setBrgyLoad] = useState(false);
  const [isCity, setIsCity] = useState(false);

  const getGovopDetails = async (signal?: AbortSignal) => {
    try {
      const response = await api.get(`/admin/users/${id}`, { signal });
      console.log("response", response);

      if (!response) {
        return new Error("Failed to retrieve data");
      }

      const userDetails = response.data;
      setUserData(userDetails);
      setUsername(userDetails.username);
      setEmail(userDetails.email);
      setLocation(userDetails.govop_location);
      setLocationId(String(userDetails.govop_location_id));
      setCreatedAt(userDetails.created_at);
      setPointPerson(userDetails.point_person);
      setPointPosition(userDetails.point_position);
      setLocLevel(userDetails.govop_level);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        return;
      }
      console.log(err);
    }
  };

  const getCity = async (signal?: AbortSignal) => {
    try {
      const cityRes = await api.get("/locations/cities", { signal });

      const cities = cityRes.data.Cities;
      setCities(cities);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        return;
      }
      console.log(err);
    }
  };

  const getAll = async () => {
    const controller = new AbortController();

    try {
      setLoading(true);
      await getCity(controller.signal);
      await getGovopDetails(controller.signal);
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

  const updateGovop = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = api.patch(
        `/admin/users/${id}`,
        {
          username: username,
          email: email,
          govop_location_id: locationId,
          pointPerson: pointPerson,
          pointPosition: pointPosition,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log(response);

      if (!response) {
        console.log(response);
        return;
      }

      toast.promise(response, {
        loading: "Updating this barangay user...",
        success: "Barangay user updated!",
        error: (err: any) => {
          return err.response.data;
        },
        position: "top-center",
      });
      setIsEditable(false);
      getGovopDetails();
    } catch (err: string | any) {
      console.log(err.response?.data);
    }
  };

  const deacGovop = async () => {
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
        navigate("/admin-brgy");
      });
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    if (!cityId) {
      return;
    }

    const getBrgy = async () => {
      try {
        setBrgyLoad(true);
        const brgyRes = await api.get(
          `/locations/barangays?city_id=${cityId}`,
          { signal: controller.signal },
        );

        const barangays = brgyRes.data.Barangays;
        console.log(barangays);
        setBarangays(barangays);
      } catch (err: any) {
        console.log(err.message);
      } finally {
        setBrgyLoad(false);
      }
    };

    getBrgy();

    return () => controller.abort();
  }, [cityId]);

  useEffect(() => {
    if (locLevel === "city") {
      setIsCity(true);
    }
  }, [locLevel]);

  useEffect(() => {
    getAll();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    if (isEditable) {
      const getCityAll = async () => {
        try {
          setLoading(true);
          await getCity(controller.signal);
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

      getCityAll();
    }

    return () => controller.abort();
  }, [isEditable]);

  useEffect(() => {
    if (isEditable && userData) {
      setUsername(userData.username);
      setEmail(userData.email);
      setLocation(userData.govop_location);
      setLocationId(String(userData.govop_location_id));
      setCreatedAt(userData.created_at);
      setPointPerson(userData.point_person);
      setPointPosition(userData.point_position);
      setLocLevel(userData.govop_level);
    }
  }, [isEditable]);

  return (
    <>
      {willDeac && (
        <AlertDialogue
          contentId="Admin_GovopDeacContent"
          closeId="Admin_GovopDeacClose"
          actionId="Admin_GovopDeacBtn"
          open={willDeac}
          title="You are about to delete this Barangay account"
          description="By deleting this barangay, it will not be called again."
          buttonText="Delete"
          onClose={() => {
            setWillDeac(false);
          }}
          onClick={deacGovop}
        />
      )}
      <FormLayout
        updateId="Admin_GovopUpdateBtn"
        updBtnLabel="Update"
        deleteId="Admin_GovopDeleteBtn"
        deleteClick={() => setWillDeac(true)}
        submitUpdId="Admin_GovopSubmitUpdBtn"
        closeUpdId="Admin_GovopCloseUpdBtn"
        isEditable={isEditable}
        updateClick={() => setIsEditable(true)}
        closeUpdClick={() => {
          setIsEditable(false);
          getGovopDetails();
        }}
        formId="Admin_GovopUpdateForm"
      >
        {loading ? (
          <div className="flex justify-center">
            <FormSkeleton />
          </div>
        ) : (
          <>
            <form
              onSubmit={updateGovop}
              className="flex flex-col gap-4"
              id="Admin_GovopUpdateForm"
            >
              <TextField
                label="User ID"
                inputType="text"
                id="Admin_GovopIdField"
                value={id}
                readonly
              />
              <TextField
                label="Username"
                inputType="text"
                id="Admin_GovopUsernameField"
                value={username}
                readonly={!isEditable}
                onSubmit={(e) => setUsername(e.target.value)}
              />
              <TextField
                label="Email"
                inputType="text"
                id="Admin_GovopEmailField"
                value={email}
                readonly
              />
              {!isEditable ? (
                <>
                  <TextField
                    label="Government Level"
                    inputType="text"
                    id="Admin_GovopLevelField"
                    value={locLevel}
                    readonly={!isEditable}
                    onSubmit={(e) => setLocLevel(e.target.value)}
                  />
                  <TextField
                    label="Address"
                    inputType="text"
                    id="Admin_GovopAddressField"
                    value={location}
                    readonly={!isEditable}
                    // onSubmit={(e) => setLocation(e.target.value)}
                  />
                </>
              ) : (
                <>
                  <SelectDropdown
                    value={String(cityId)}
                    onValueChange={(val) => {
                      setCityId(Number(val));
                    }}
                    label="City"
                    placeholder="Select a City"
                    id="Admin_GovopCityField"
                    onSubmit={(e) => setLocation(e.target.value)}
                    options={cities?.map((city) => ({
                      label: city.name,
                      value: String(city.id),
                    }))}
                    isRequired={!id ? true : false}
                  />
                  {isCity ? null : (
                    <SelectDropdown
                      value={String(locationId)}
                      onValueChange={setLocationId}
                      label="Barangay"
                      placeholder="Select a Barangay (Please select a city first)"
                      id="Admin_GovopBrgyField"
                      onSubmit={(e) => setLocation(e.target.value)}
                      options={barangays?.map((brgy) => ({
                        label: brgy.name,
                        value: String(brgy.id),
                      }))}
                      isRequired={!id ? true : false}
                      loading={brgyLoad}
                    />
                  )}
                </>
              )}

              <TextField
                label="Point person"
                inputType="text"
                id="Admin_GovopPointPersonField"
                value={pointPerson}
                readonly={!isEditable}
                onSubmit={(e) => setPointPerson(e.target.value)}
              />
              <TextField
                label="Point person's position"
                inputType="text"
                id="Admin_GovopPointPositionField"
                value={pointPosition}
                readonly
              />
              <TextField
                label="Created At"
                inputType="text"
                id="Admin_GovopCreatedField"
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

export default BrgyDetails;

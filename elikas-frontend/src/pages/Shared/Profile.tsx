import api from "@/api";
import ButtonComp from "@/components/Button";
import TextField from "@/components/TextField";
import { useUserContext } from "@/context/AuthContext";
import { bigSmile } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import SelectDropdown from "@/components/SelectDropdown";
import FormSkeleton from "@/pages/Skeletons/FormSkeleton";
import { UserIcon } from "lucide-react";
import brgyProfile from "@/assets/brgyProfile.svg";

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

function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

function Profile() {
  const [isEditable, setIsEditable] = useState(false);
  const [seed, setSeed] = useState<string | null>("");
  const [errors, setErrors] = useState("");
  const [username, setUsername] = useState("");
  const [newUsername, setNewUsername] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [cities, setCities] = useState<Cities[]>([]);
  const [cityId, setCityId] = useState(0);
  const [barangays, setBarangays] = useState<Barangays[]>([]);
  const [brgyId, setBrgyId] = useState(0);
  const [contact, setContact] = useState("");
  const [userId, setUserId] = useState(0);
  const [loading, setLoading] = useState(false);
  const [brgyLoad, setBrgyLoad] = useState(false);
  const [cityLoad, setCityLoad] = useState(false);

  const { token, role } = useUserContext();

  const navigate = useNavigate();

  const getProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userData = response.data;
      console.log(userData);

      setUsername(userData.username);
      setFirstName(userData.first_name);
      setLastName(userData.last_name);
      setEmail(userData.email);
      setAddress(userData.location);
      setUserId(userData.id);
      setContact(userData.phone || "No Registered Number");
      setSeed(userData?.avatar_seed);

      return userData;
    } catch (err: string | any) {
      setErrors(err.message || "An error occurred during registration");
      console.error("Status:", err.response?.status);
      console.error("Data:", err.response?.data); // ← server's error body
      console.error("Message:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const putProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("Sending", {
        username,
        firstName,
        lastName,
        email,
        brgyId,
        contact,
      });

      const response = api.put(
        "/profile",
        {
          username: newUsername,
          first_name: firstName,
          last_name: lastName,
          email: email,
          location_id: brgyId,
          phone: contact,
          avatar_seed: seed,
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
        return;
      }

      setIsEditable(false);
      setNewUsername(null);
      getProfile();
    } catch (err: string | any) {
      setErrors(err.message || "An error occurred during registration");
    }
  };

  const deleteProfile = async () => {
    try {
      const deacPromise = new Promise(async (resolve, reject) => {
        const response = await api.patch("/profile/deactivate", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const userDataDelete = await response.data;

        if (!response) {
          reject(setErrors(userDataDelete.error || "Deactivation failed"));
        } else resolve(userDataDelete);
      });

      toast.promise(deacPromise, {
        loading: "Deactivating your account...",
        success:
          "Account Deactivated! Please contact eLikas to reactivate your account",
        position: "top-center",
      });

      deacPromise.then(() => {
        navigate("/");
      });
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  useEffect(() => {
    const getCity = async () => {
      try {
        setCityLoad(true);
        const cityRes = await api.get("/locations/cities");

        const cities = cityRes.data.Cities;
        setCities(cities);
      } catch (err: any) {
        console.log(err.message);
      } finally {
        setCityLoad(false);
      }
    };

    getCity();

    if (!cityId) {
      return;
    }

    const getBrgy = async () => {
      try {
        setBrgyLoad(true);
        const brgyRes = await api.get(`/locations/barangays?city_id=${cityId}`);

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
  }, [cityId]);

  useEffect(() => {
    getProfile();
  }, []);

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

  return loading ? (
    <div className="h-screen flex justify-center items-center">
      <FormSkeleton />
    </div>
  ) : (
    <div className="min-h-screen flex justify-center p-6 pt-20">
      <div className="w-full max-w-sm flex flex-col gap-10 items-center">
        <div className="w-full flex justify-between flex-col">
          <div className="w-full flex gap-10 flex-col">
            <div>
              <div className="flex flex-col">
                <div className="w-full flex flex-col items-center gap-2">
                  {seed ? (
                    <img src={dataUri} className="w-24" />
                  ) : role === "indiv" ? (
                    <UserIcon className="w-24" />
                  ) : (
                    <img src={brgyProfile} className="w-24" />
                  )}
                  {isEditable ? (
                    role === "indiv" && (
                      <ButtonComp
                        text="Generate New Avatar"
                        id="Profile_RandommAvatarBtn"
                        variant="outline"
                        onClick={() => setSeed(randomSeed())}
                      />
                    )
                  ) : (
                    <ButtonComp
                      text="Edit Profile"
                      variant="outline"
                      type="button"
                      id="Profile_EditBtn"
                      heightSize="32px"
                      widthSize="100px"
                      onClick={() => setIsEditable(true)}
                    />
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-4">
                {isEditable ? (
                  <TextField
                    label="User Name"
                    placeholder={username}
                    inputType="text"
                    id="Profile_Username"
                    readonly={!isEditable}
                    onSubmit={(e) => setNewUsername(e.target.value)}
                  />
                ) : (
                  <TextField
                    label="User Name"
                    placeholder={username}
                    inputType="text"
                    value={username}
                    id="Profile_Username"
                    readonly={!isEditable}
                    onSubmit={(e) => setUsername(e.target.value)}
                  />
                )}

                <TextField
                  label="First Name"
                  placeholder={firstName}
                  inputType="text"
                  id="Profile_Firstname"
                  value={firstName}
                  readonly={!isEditable}
                  onSubmit={(e) => setFirstName(e.target.value)}
                />
                <TextField
                  label="Last Name"
                  placeholder={lastName}
                  inputType="text"
                  id="Profile_Lastname"
                  readonly={!isEditable}
                  value={lastName}
                  onSubmit={(e) => setLastName(e.target.value)}
                />
                <TextField
                  label="Email Address"
                  placeholder={email}
                  inputType="text"
                  id="Profile_Email"
                  readonly={!isEditable}
                  value={email}
                  onSubmit={(e) => setEmail(e.target.value)}
                />
                {isEditable ? (
                  <>
                    <SelectDropdown
                      value={String(cityId)}
                      onValueChange={(val) => setCityId(Number(val))}
                      label="City"
                      placeholder="Select your City"
                      id="Profile_City"
                      onSubmit={(e) => setCityId(Number(e.target.value))}
                      options={cities?.map((city) => ({
                        label: city.name,
                        value: String(city.id),
                      }))}
                      loading={cityLoad}
                    />
                    <SelectDropdown
                      value={String(brgyId)}
                      onValueChange={(val) => setBrgyId(Number(val))}
                      label="Barangay"
                      placeholder="Select a Barangay (Please select a city first)"
                      id="Profile_Brgy"
                      onSubmit={(e) => setBrgyId(Number(e.target.value))}
                      options={barangays?.map((brgy) => ({
                        label: brgy.name,
                        value: String(brgy.id),
                      }))}
                      loading={brgyLoad}
                    />
                  </>
                ) : (
                  <>
                    <TextField
                      label="Address"
                      placeholder={address}
                      inputType="text"
                      id="Profile_Address"
                      readonly
                      value={address}
                    />
                  </>
                )}
                <TextField
                  label="Contact Number"
                  description={
                    isEditable ? "Please use (639#########) format" : ""
                  }
                  placeholder={contact}
                  inputType="text"
                  id="Profile_ContactNo"
                  readonly={!isEditable}
                  value={contact}
                  onSubmit={(e) => setContact(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 items-center">
              {isEditable ? (
                <>
                  <ButtonComp
                    text="Update"
                    variant="primary"
                    type="button"
                    id="Profile_FormSubmitBtn"
                    heightSize="38px"
                    widthSize="100%"
                    onClick={(e) => putProfile(e)}
                  ></ButtonComp>
                  <ButtonComp
                    text="Cancel"
                    variant="outline"
                    type="button"
                    id="Profile_FormCancelBtn"
                    heightSize="38px"
                    widthSize="100%"
                    onClick={() => {
                      setIsEditable(false);
                      getProfile();
                    }}
                  ></ButtonComp>
                </>
              ) : (
                <>
                  <ButtonComp
                    text="Reset Password"
                    variant="primary"
                    type="submit"
                    id="Profile_ResetPwBtn"
                    heightSize="38px"
                    widthSize="100%"
                  ></ButtonComp>
                  <ButtonComp
                    text="Deactivate Account"
                    variant="important"
                    type="button"
                    id="Profile_DeacBtn"
                    heightSize="38px"
                    widthSize="100%"
                    onClick={deleteProfile}
                  ></ButtonComp>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;

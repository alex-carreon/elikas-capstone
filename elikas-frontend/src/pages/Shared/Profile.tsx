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
import { Separator } from "@/components/ui/separator";
import { auth } from "@/firebase";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import AlertDialogue from "@/components/AlertDialogue";

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
  const [newContact, setNewContact] = useState<string | null>("");
  const [contactTouched, setContactTouched] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [brgyLoad, setBrgyLoad] = useState(false);
  const [cityLoad, setCityLoad] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [error, setError] = useState("");
  const [showDeac, setShowDeac] = useState(false);

  const { token, role } = useUserContext();

  const navigate = useNavigate();

  const contactValidate = /^639\d{9}$/;

  const getProfile = async (signal?: AbortSignal) => {
    try {
      const response = await api.get("/profile", { signal });

      const userData = response.data;

      console.log(userData);

      setUsername(userData.username);
      setFirstName(userData.first_name);
      setLastName(userData.last_name);
      setEmail(userData.email);
      setAddress(userData.location);
      setContact(userData.phone || "No Registered Number");
      setSeed(userData?.avatar_seed);
      setIsVerified(userData?.is_verified);

      return userData;
    } catch (err: string | any) {
      if (err.name === "CanceledError") {
        return;
      }
      console.log(err.response?.data);
    }
  };

  const putProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisabled(true);

    if (newContact) {
      if (!contactValidate.test(newContact)) {
        setError("Invalid Contact Number");
        return;
      } else {
        setError("");
      }
    }

    const response = api.put("/profile", {
      username: newUsername,
      first_name: firstName,
      last_name: lastName,
      email: email,
      ...(brgyId && { location_id: brgyId }),
      ...(contactTouched && { phone: newContact }),
      avatar_seed: seed,
    });

    console.log(response);

    if (!response) {
      return;
    }

    toast.promise(response, {
      loading: "Updating your profile...",
      success: "Profile updated!",
      error: (err: any) => {
        if (
          err.response.data.details === "The username has already been taken."
        ) {
          return "Username has already been taken.";
        }
        return "Update failed";
      },
    });

    response
      .then(() => {
        setIsEditable(false);
        setNewUsername(null);
        setNewContact("");
        setContactTouched(false);
        getProfile();
      })
      .catch((err: string | any) => {
        console.log(err.response.data);
        setDisabled(false);
      })
      .finally(() => setDisabled(false));
  };

  const deleteProfile = async () => {
    setDisabled(true);
    const response = api.patch("/profile/deactivate", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    toast.promise(response, {
      loading: "Deactivating your account...",
      success:
        "Account Deactivated! Please contact eLikas to reactivate your account",
      error: "An error occurred. Please try again.",
      position: "top-center",
    });

    response
      .then(() => {
        auth.signOut();
      })
      .catch((error) => {
        console.error("Error during logout:", error);
        setDisabled(false);
      })
      .finally(() => setDisabled(false));
  };

  const sendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    setDisabled(true);
    const response = api.post("/otp/send", {
      phone_number: contact,
      message: `Hi ${username}! Do not share this OTP with others. Here is your code: :otp`,
    });

    console.log(response);

    toast.promise(response, { success: "OTP has been sent to your number." });

    response
      .then(() => {
        localStorage.setItem("phone_number", contact);
        navigate("/VerifyOTP");
      })
      .catch((err: any) => {
        if (err.name === "CanceledError") {
          setDisabled(false);
          return;
        }
        console.log(err.response?.data);
      })
      .finally(() => setDisabled(false));
  };

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

  const getData = async () => {
    const controller = new AbortController();

    try {
      setLoading(true);
      await getProfile(controller.signal);
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

  const handleResetPW = async (currentPw: string) => {
    const user = auth.currentUser;

    if (!user || !user.email) {
      toast.error("You are not authenticated.");
      return;
    }

    const credentials = EmailAuthProvider.credential(user.email, currentPw);

    try {
      setDisabled(true);
      await reauthenticateWithCredential(user, credentials);
    } catch (err: any) {
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password"
      ) {
        toast.error("The current password is incorrect.");
        return;
      }

      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setDisabled(false);
    }

    try {
      const updatePw = await updatePassword(user, newPw);
      console.log(updatePw);
      toast.success("Password has been updated!");
      setShowReset(false);
      setError("");
    } catch (err: any) {
      if (err.code === "auth/password-does-not-meet-requirements") {
        setError(
          "Password must be at least 8 characters long and should contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
        );
      }
    }
  };

  useEffect(() => {
    getCity();

    if (!cityId) {
      return;
    }

    getBrgy();
  }, [cityId]);

  useEffect(() => {
    getData();
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

  return loading ? (
    <div className="h-screen flex justify-center items-center">
      <FormSkeleton />
    </div>
  ) : (
    <>
      {showReset && (
        <AlertDialogue
          title="Reset your Password"
          description="Please enter your current password before setting a new one."
          buttonText="Reset Password"
          open={showReset}
          contentId="Profile_PWResetContent"
          actionId="Profile_PWResetBtn"
          onClick={() => handleResetPW(currentPw)}
          onClose={() => setShowReset(false)}
          closeId="Profile_PWResetClose"
          disabled={disabled}
        >
          <TextField
            label="Current Password"
            inputType="password"
            id="Profile_CurrPWField"
            isPassword
            onSubmit={(e) => setCurrentPw(e.target.value)}
          />
          <TextField
            label="New Password"
            inputType="password"
            id="Profile_NewPWField"
            isPassword
            onSubmit={(e) => setNewPw(e.target.value)}
            error={error}
          />
        </AlertDialogue>
      )}
      {showDeac && (
        <AlertDialogue
          contentId="Profile_DeacModallContent"
          closeId="Profile_DeacModalClose"
          actionId="Profile_DeacModalBtn"
          open={showDeac}
          title="You are about to deactivate your account"
          description="Deactivating your account will remove your access to online features. This will also remove all your posts on the map."
          buttonText="Deactivate Account"
          onClose={() => {
            setShowDeac(false);
          }}
          onClick={() => deleteProfile()}
          disabled={disabled}
        />
      )}
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
                        onClick={() => {
                          setIsEditable(true);
                          setNewContact(
                            contact === "No Registered Number" ? "" : contact,
                          );
                        }}
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
                      onSubmit={(e) => setNewUsername(e.target.value)}
                    />
                  ) : (
                    <TextField
                      label="User Name"
                      inputType="text"
                      value={username}
                      id="Profile_Username"
                      readonly
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
                  <div className="w-full flex flex-col gap-1">
                    <TextField
                      label="Email Address"
                      placeholder={email}
                      inputType="text"
                      id="Profile_Email"
                      readonly
                      value={email}
                      onSubmit={(e) => setEmail(e.target.value)}
                    />
                    <ButtonComp
                      text="Change Email"
                      variant="outline"
                      type="button"
                      id="Profile_ChangeEmailBtn"
                      heightSize="30px"
                      widthSize="1/2"
                      onClick={() => navigate("/ChangeEmail")}
                      isDisabled={disabled}
                    ></ButtonComp>
                  </div>

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
                  <div className="flex flex-col gap-2">
                    {isEditable ? (
                      <TextField
                        label="Contact Number"
                        description="Please use (639#########) format"
                        placeholder={
                          newContact === null ? "No Registered Number" : contact
                        }
                        inputType="text"
                        id="Profile_ContactNo"
                        value={newContact ?? ""}
                        onSubmit={(e) => {
                          setNewContact(e.target.value);
                          setContactTouched(true);
                        }}
                        error={error}
                      />
                    ) : (
                      <TextField
                        label="Contact Number"
                        placeholder={
                          newContact === null ? "No Registered Number" : contact
                        }
                        inputType="text"
                        id="Profile_ContactNo"
                        readonly={!isEditable}
                        value={contact}
                      />
                    )}

                    {contact === "No Registered Number" ||
                    isVerified ||
                    isEditable ? null : (
                      <ButtonComp
                        text="Verify"
                        variant="primary"
                        id="Profile_VerifyBtnNumberBtn"
                        onClick={(e) => sendOTP(e)}
                        widthSize="1/2"
                        isDisabled={disabled}
                      />
                    )}
                    {isEditable && contact !== "No Registered Number" ? (
                      <ButtonComp
                        text="Remove Number"
                        variant="outline"
                        id="Profile_VerifyBtnNumberBtn"
                        onClick={() => {
                          setNewContact(null);
                          setContactTouched(true);
                        }}
                        widthSize="1/2"
                      />
                    ) : null}
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex flex-col gap-2 items-center">
                {isEditable ? (
                  <>
                    <ButtonComp
                      text="Save"
                      variant="primary"
                      type="button"
                      id="Profile_FormSubmitBtn"
                      heightSize="38px"
                      widthSize="100%"
                      onClick={(e) => putProfile(e)}
                      isDisabled={disabled}
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
                        setNewContact("");
                        setContactTouched(false);
                      }}
                      isDisabled={disabled}
                    ></ButtonComp>
                  </>
                ) : (
                  <>
                    <ButtonComp
                      text="Reset Password"
                      variant="primary"
                      type="button"
                      id="Profile_ResetPwBtn"
                      heightSize="38px"
                      widthSize="100%"
                      isDisabled={disabled}
                      onClick={() => setShowReset(true)}
                    ></ButtonComp>
                    <ButtonComp
                      text="Deactivate Account"
                      variant="important"
                      type="button"
                      id="Profile_DeacBtn"
                      heightSize="38px"
                      widthSize="100%"
                      onClick={() => setShowDeac(true)}
                      isDisabled={disabled}
                    ></ButtonComp>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;

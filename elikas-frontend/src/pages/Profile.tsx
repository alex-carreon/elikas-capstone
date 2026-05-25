import api from "@/api";
import ButtonComp from "@/components/Button";
import TextField from "@/components/TextField";
import { useUserContext } from "@/context/AuthContext";
import { bigSmile } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

function Profile() {
  const [isEditable, setIsEditable] = useState(false);
  const [seed, setSeed] = useState("Felix");
  const [errors, setErrors] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [barangay, setBarangay] = useState("");
  const [contact, setContact] = useState("");
  const [userId, setUserId] = useState(0);

  const { token } = useUserContext();

  const navigate = useNavigate();

  const getProfile = async () => {
    try {
      const getPromise = new Promise(async (resolve, reject) => {
        const response = await api.get("/profile");
        const userData = await response.data;

        setUsername(userData.username);
        setFirstName(userData.first_name);
        setLastName(userData.last_name);
        setEmail(userData.email);
        setBarangay(userData.location);
        setUserId(userData.id);

        if (userData.phone) {
          setContact(userData.phone);
        } else setContact("No Registered Number");

        if (!response) {
          reject(setErrors(userData.error || "Login failed"));
        } else resolve(userData);
      });

      toast.promise(getPromise, {
        loading: "Getting your information...",
        position: "top-center",
      });
    } catch (err: string | any) {
      setErrors(err.message || "An error occurred during registration");
    }
  };

  const putProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.put(
        "/profile",
        {
          username: username,
          first_name: firstName,
          last_name: lastName,
          email: email,
          location: barangay,
          phone: contact,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log(response);

      const userDataUpdate = await response.data;

      if (!response) {
        setErrors(userDataUpdate.error || "Update failed");
      } else {
        setIsEditable(false);
        getProfile();
      }
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

        console.log(response);

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
    getProfile();
  }, []);

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
    <div className="min-h-screen flex justify-center p-6 pt-26">
      <div className="w-full max-w-sm flex flex-col gap-10 items-center">
        <div className="w-full h-full flex justify-between flex-col">
          <form
            onSubmit={putProfile}
            className="w-full h-full flex justify-between flex-col"
          >
            <div className="flex gap-2 flex-col">
              <div className="w-full flex flex-col items-center gap-2">
                <img src={dataUri} className="w-24" />
                {isEditable ? (
                  <ButtonComp
                    text="Generate New Avatar"
                    id="Profile_RandommAvatarBtn"
                    variant="outline"
                    onClick={() => setSeed(randomSeed())}
                  />
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
              <TextField
                label="User Name"
                placeholder={username}
                inputType="text"
                value={username}
                id="Profile_Username"
                readonly={!isEditable}
                onSubmit={(e) => setUsername(e.target.value)}
              />
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
              <TextField
                label="Barangay"
                placeholder={barangay}
                inputType="text"
                id="Profile_Barangay"
                readonly={!isEditable}
                value={barangay}
                onSubmit={(e) => setBarangay(e.target.value)}
              />
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
            <div className="flex flex-col gap-2">
              {isEditable ? (
                <>
                  <ButtonComp
                    text="Update"
                    variant="primary"
                    type="submit"
                    id="Profile_FormSubmitBtn"
                    heightSize="38px"
                    widthSize="100%"
                  ></ButtonComp>
                  <ButtonComp
                    text="Cancel"
                    variant="outline"
                    type="button"
                    id="Profile_FormSubmitBtn"
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
                    id="Profile_FormSubmitBtn"
                    heightSize="38px"
                    widthSize="100%"
                  ></ButtonComp>
                  <ButtonComp
                    text="Deactivate Account"
                    variant="important"
                    type="button"
                    id="Profile_FormSubmitBtn"
                    heightSize="38px"
                    widthSize="100%"
                    onClick={deleteProfile}
                  ></ButtonComp>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;

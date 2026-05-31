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
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type User,
} from "firebase/auth";
import { auth } from "@/firebase";

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

function BrgyAdd() {
  const { token } = useUserContext();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [pointPerson, setPointPerson] = useState("");
  const [pointPosition, setPointPosition] = useState("");
  const [loading, setLoading] = useState(false);
  const [barangays, setBarangays] = useState<Barangays[]>([]);
  const [brgyId, setBrgyId] = useState(0);
  const [cities, setCities] = useState<Cities[]>([]);
  const [cityId, setCityId] = useState(0);
  const [brgyLoad, setBrgyLoad] = useState(false);
  const [levelId, setLevelId] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [errors, setErrors] = useState({ email: "", pw: "", confirmPw: "" });
  const [adminPw, setAdminPw] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [enterPw, setEnterPw] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User>();
  const [adminIn, setAdminIn] = useState(false);

  useEffect(() => {
    if (!adminPw) {
      setEnterPw(true);
      return;
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (pw != confirmPw) {
      setErrors({
        email: "",
        pw: "Passwords do not match",
        confirmPw: "Passwords do not match",
      });
      return;
    }

    try {
      const adminEmail = auth.currentUser?.email ?? "";

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        pw,
      );
      const firebaseUser = userCredential.user;
      const firebaseUid = firebaseUser.uid;

      await signInWithEmailAndPassword(auth, adminEmail, adminPw);

      // Get token immediately after signing back in
      const freshToken = (await auth.currentUser?.getIdToken(true)) ?? "";

      console.log("freshToken:", freshToken); // check this

      const createPromise = api.post(
        "/admin/create-govop",
        {
          username: username,
          email: email,
          firebase_uid: String(firebaseUid),
          level_id: levelId,
          location_id: brgyId ? brgyId : cityId,
          point_person: pointPerson,
          point_position: pointPosition,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${freshToken}`,
          },
        },
      );

      createPromise.catch((err) =>
        console.log("API error:", err.response?.data),
      );

      toast.promise(createPromise, {
        loading: "Creating Govop User...",
        success: () => {
          navigate(-1);
          return "Govop user has been created!";
        },
        error: "Govop creation failed",
        position: "top-center",
      });
    } catch (err: any) {
      console.log(err.response?.data);
      if (err.code === "auth/email-already-in-use") {
        setErrors({
          email: "This email is already registered.",
          pw: "",
          confirmPw: "",
        });
      } else if (err.code === "auth/weak-password") {
        setErrors({
          pw: "Password must be at least 6 characters.",
          confirmPw: "",
          email: "",
        });
      }
    }
  };

  useEffect(() => {
    if (levelId === 1) {
      setDisabled(true);
    } else setDisabled(false);

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

    getCity();

    if (!cityId) {
      return;
    } else if (disabled) {
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
  }, [cityId, levelId, disabled]);

  return (
    <>
      {enterPw && (
        <AlertDialogue
          contentId="Admin_GovopAuthContent"
          closeId="Admin_GovopAuthClose"
          actionId="Admin_GovopAuthBtn"
          open={enterPw}
          title="Enter your Admin Password"
          description="You need to enter your password to proceed with this action."
          buttonText="Submit"
          onClose={() => {
            setEnterPw(false);
          }}
          onClick={() => setEnterPw(false)}
        >
          <TextField
            label="Email"
            inputType="text"
            id="Admin_NewBrgyAdminEmail"
            placeholder="Enter your email"
            onSubmit={(e) => setAdminEmail(e.target.value)}
            isRequired
            isPassword
          />
          <TextField
            label="Password"
            inputType="password"
            id="Admin_NewBrgyAdminPw"
            placeholder="********"
            onSubmit={(e) => setAdminPw(e.target.value)}
            isRequired
            isPassword
          />
        </AlertDialogue>
      )}
      <FormLayout
        // isAvatar
        updateId="Admin_NewSubmitBtn"
        updBtnLabel="Create"
        btnType="submit"
        // Add handleSubmit
        formId="Admin_BrgyAddForm"
        // updateClick={() => setShowDialog(true)}
      >
        <>
          <form
            onSubmit={adminPw ? handleSubmit : () => {}}
            className="flex flex-col gap-4"
            id="Admin_BrgyAddForm"
          >
            <TextField
              label="Username"
              inputType="text"
              id="Admin_NewBrgyUsernameField"
              placeholder="Enter Govop's Username"
              onSubmit={(e) => setUsername(e.target.value)}
              isRequired
            />
            <TextField
              label="Email"
              inputType="text"
              id="Admin_NewBrgyEmailField"
              placeholder="Enter Govop's Email"
              onSubmit={(e) => setEmail(e.target.value)}
              isRequired
              error={errors.email}
            />
            <SelectDropdown
              value={String(levelId)}
              onValueChange={(val) => setLevelId(Number(val))}
              label="Government Level"
              placeholder="Select the Govop's level"
              id="Admin_NewGovopLevelField"
              onSubmit={(e) => setLevelId(Number(e.target.value))}
              options={[
                { label: "City", value: "1" },
                { label: "Barangay", value: "2" },
              ]}
              isRequired
            />
            <SelectDropdown
              value={String(cityId)}
              onValueChange={(val) => setCityId(Number(val))}
              label="City"
              placeholder="Select the Govop's City"
              id="Admin_NewGovopCityField"
              onSubmit={(e) => setCityId(Number(e.target.value))}
              options={cities?.map((city) => ({
                label: city.name,
                value: String(city.id),
              }))}
              isRequired
            />
            <SelectDropdown
              value={String(brgyId)}
              onValueChange={(val) => setBrgyId(Number(val))}
              label="Barangay"
              placeholder="Select a Barangay (Please select a city first)"
              id="Admin_GovopBrgyField"
              onSubmit={(e) => setLocation(e.target.value)}
              options={barangays?.map((brgy) => ({
                label: brgy.name,
                value: String(brgy.id),
              }))}
              isRequired={!disabled}
              disabled={disabled}
              loading={brgyLoad}
            />
            <TextField
              label="Point person"
              inputType="text"
              id="Admin_NewBrgyPointPersonField"
              placeholder="Enter Govop's Point Person"
              onSubmit={(e) => setPointPerson(e.target.value)}
            />
            <TextField
              label="Point person's position"
              inputType="text"
              id="Admin_NewBrgyPointPositionField"
              placeholder="Enter Govop's Point Person's Position"
              onSubmit={(e) => setPointPosition(e.target.value)}
            />
            <TextField
              label="Password"
              inputType="password"
              id="Admin_NewGovopPasswordField"
              placeholder="Enter Govop's Password"
              onSubmit={(e) => setPw(e.target.value)}
              isPassword
              error={errors.pw}
            />
            <TextField
              label="Confirm Password"
              inputType="password"
              id="Admin_NewGovopConfirmPasswordField"
              placeholder="Re-enter Govop's Password"
              onSubmit={(e) => setConfirmPw(e.target.value)}
              isPassword
              error={errors.confirmPw}
            />
          </form>
        </>
      </FormLayout>
    </>
  );
}

export default BrgyAdd;

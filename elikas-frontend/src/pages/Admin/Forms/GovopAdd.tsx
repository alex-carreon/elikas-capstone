import api from "@/api";
import FormLayout from "./FormLayout";
import TextField from "@/components/TextField";
import { useNavigate } from "react-router";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import SelectDropdown from "@/components/SelectDropdown";

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
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
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
      const createPromise = api.post("/admin/create-govop", {
        username: username,
        email: email,
        password: pw,
        level_id: levelId,
        location_id: brgyId ? brgyId : cityId,
        point_person: pointPerson,
        point_position: pointPosition,
      });

      createPromise.catch((err) => console.log(err.response?.data));

      toast.promise(createPromise, {
        loading: "Creating Govop User...",
        success: () => {
          navigate(-1);
          return "Govop user has been created!";
        },
        error: "Govop creation failed",
        position: "top-center",
      });

      createPromise.then(() => {
        navigate("/admin-brgy");
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
      <FormLayout
        formTitle="Add a Barangay User"
        updateId="Admin_NewSubmitBtn"
        updBtnLabel="Create"
        btnType="submit"
        formId="Admin_BrgyAddForm"
      >
        <>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
            id="Admin_BrgyAddForm"
          >
            <TextField
              label="Username"
              inputType="text"
              id="Admin_NewBrgyUsernameField"
              onSubmit={(e) => setUsername(e.target.value)}
              isRequired
            />
            <TextField
              label="Email"
              inputType="text"
              id="Admin_NewBrgyEmailField"
              onSubmit={(e) => setEmail(e.target.value)}
              isRequired
              error={errors.email}
            />
            <SelectDropdown
              value={String(levelId)}
              onValueChange={(val) => setLevelId(Number(val))}
              label="Government Level"
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
              loading={loading}
            />
            <SelectDropdown
              value={String(brgyId)}
              onValueChange={(val) => setBrgyId(Number(val))}
              label="Barangay"
              placeholder="Select a Barangay (Please select a city first)"
              id="Admin_GovopBrgyField"
              onSubmit={(e) => setBrgyId(Number(e.target.value))}
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
              onSubmit={(e) => setPointPerson(e.target.value)}
            />
            <TextField
              label="Point person's position"
              inputType="text"
              id="Admin_NewBrgyPointPositionField"
              onSubmit={(e) => setPointPosition(e.target.value)}
            />
            <TextField
              label="Password"
              inputType="password"
              id="Admin_NewGovopPasswordField"
              onSubmit={(e) => setPw(e.target.value)}
              isPassword
              error={errors.pw}
            />
            <TextField
              label="Confirm Password"
              inputType="password"
              id="Admin_NewGovopConfirmPasswordField"
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

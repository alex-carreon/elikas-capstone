import api from "@/api";
import FormLayout from "./FormLayout";
import TextField from "@/components/TextField";
import { useNavigate } from "react-router";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import SelectDropdown from "@/components/SelectDropdown";
import colors from "@/constants/colors";

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

  const isValidPassword = (password: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(
      password,
    );
  };

  const pwHasWhiteSpace = (password: string) => {
    return /\s/.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (pw != confirmPw) {
      setErrors({
        email: "",
        pw: "Passwords do not match.",
        confirmPw: "Passwords do not match.",
      });
      return;
    } else {
      setErrors({
        email: "",
        pw: "",
        confirmPw: "",
      });
    }

    if (!isValidPassword(pw)) {
      setErrors({
        email: "",
        pw: "Password must be 8 characters minimum, and have at least one uppercase, one lowercase, one number, and one special character.",
        confirmPw: "",
      });
      return;
    } else {
      setErrors({
        email: "",
        pw: "",
        confirmPw: "",
      });
    }

    if (pwHasWhiteSpace(pw)) {
      setErrors({
        email: "",
        pw: "",
        confirmPw: "Password must not have spaces.",
      });
      return;
    } else {
      setErrors({
        email: "",
        pw: "",
        confirmPw: "",
      });
    }

    const createPromise = api.post("/admin/create-govop", {
      username: username,
      email: email,
      password: pw,
      level_id: levelId,
      location_id: brgyId ? brgyId : cityId,
      point_person: pointPerson,
      point_position: pointPosition,
    });

    toast.promise(createPromise, {
      loading: "Creating Govop User...",
      success: "Govop user has been created!",
      error: (err: any) => {
        if (err.response.data.errors.username?.[0]) {
          return err.response.data.errors.username?.[0];
        }
        if (err.response.data.errors.email?.[0]) {
          setErrors({
            email: err.response.data.errors.email?.[0],
            pw: "",
            confirmPw: "",
          });
          return err.response.data.errors.email?.[0];
        }
        return "An unexpected error occurred. Please try again.";
      },
      position: "top-center",
    });

    createPromise
      .then(() => {
        navigate(-1);
      })
      .catch((error: any) => {
        if (error.response) {
          console.error(error.response);
        } else if (error.request) {
          console.error(error.request);
        } else {
          console.error(error.message);
        }
      });
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
      <div className="md:hidden">
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
                maxLength={20}
              />
              <TextField
                label="Email"
                inputType="text"
                id="Admin_NewBrgyEmailField"
                onSubmit={(e) => setEmail(e.target.value)}
                isRequired
                error={errors.email}
                maxLength={50}
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
                maxLength={100}
              />
              <TextField
                label="Point person's position"
                inputType="text"
                id="Admin_NewBrgyPointPositionField"
                onSubmit={(e) => setPointPosition(e.target.value)}
                maxLength={50}
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
      </div>
      <div className="hidden md:block">
        <FormLayout
          updateId="Admin_NewSubmitBtn"
          updBtnLabel="Create"
          btnType="submit"
          formId="Admin_BrgyAddForm_Desktop"
        >
          <>
            <div className="flex flex-col gap-8 mx-18">
              <p
                className="text-2xl font-bold"
                style={{ color: colors.heading }}
              >
                Add a Barangay User
              </p>
              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-4 bg-gray-400/20 p-8 rounded-lg"
                id="Admin_BrgyAddForm_Desktop"
              >
                <div className="w-full grid grid-flow-col grid-rows-5 gap-6 px-8">
                  <TextField
                    label="Username"
                    inputType="text"
                    id="Admin_NewBrgyUsernameField"
                    onSubmit={(e) => setUsername(e.target.value)}
                    isRequired
                    maxLength={20}
                  />
                  <TextField
                    label="Email"
                    inputType="text"
                    id="Admin_NewBrgyEmailField"
                    onSubmit={(e) => setEmail(e.target.value)}
                    isRequired
                    error={errors.email}
                    maxLength={50}
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
                    maxLength={100}
                  />
                  <TextField
                    label="Point person's position"
                    inputType="text"
                    id="Admin_NewBrgyPointPositionField"
                    onSubmit={(e) => setPointPosition(e.target.value)}
                    maxLength={50}
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
                </div>
              </form>
            </div>
          </>
        </FormLayout>
      </div>
    </>
  );
}

export default BrgyAdd;

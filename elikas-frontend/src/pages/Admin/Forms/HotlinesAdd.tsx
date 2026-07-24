import FormLayout from "./FormLayout";
import TextField from "@/components/TextField";
import SelectDropdown from "@/components/SelectDropdown";
import { useEffect, useState } from "react";
import api from "@/api";
import { useNavigate } from "react-router";
import { handleSubmit } from "@/lib/hotlineUtils";
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

function HotlinesAdd() {
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [primaryNo, setPrimaryNo] = useState("");
  const [secondaryNo, setSecondaryNo] = useState("");
  const [barangays, setBarangays] = useState<Barangays[]>([]);
  const [brgyId, setBrgyId] = useState(0);
  const [brgyLoad, setBrgyLoad] = useState(false);
  const [cities, setCities] = useState<Cities[]>([]);
  const [cityId, setCityId] = useState(0);
  const [cityLoad, setCityLoad] = useState(false);
  const [error, setError] = useState({ primary: "", secondary: "" });

  const navigate = useNavigate();

  const contactValidate = /^\(0\d{2}\)\d{7}$|^\(02\)\d{8}$|^09\d{9}$/;

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

  useEffect(() => {
    getCity();
  }, []);

  useEffect(() => {
    if (!cityId) {
      return;
    }
    getBrgy();
  }, [cityId]);

  const create = (e: React.FormEvent) => {
    e.preventDefault();

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

    handleSubmit({
      e: e,
      title: title,
      address: address,
      primaryNo: primaryNo,
      secondaryNo: secondaryNo,
      brgyId: brgyId,
      navigate: navigate,
      redirect: "/admin-hotlines",
    });
  };

  return (
    <>
      <div className="md:hidden">
        <FormLayout
          updateId="Admin_NewHotlineBtn"
          updBtnLabel="Create"
          btnType="submit"
          formId="Admin_NewHotlineForm"
        >
          <>
            <form
              onSubmit={(e) => create(e)}
              className="flex flex-col gap-4"
              id="Admin_NewHotlineForm"
            >
              <TextField
                label="Hotline Name*"
                inputType="text"
                id="Admin_NewHotlineNameField"
                onSubmit={(e) => setTitle(e.target.value)}
                isRequired
              />
              <TextField
                label="Hotline Address*"
                inputType="text"
                id="Admin_NewHotlineAddressField"
                onSubmit={(e) => setAddress(e.target.value)}
                isRequired
              />
              <SelectDropdown
                value={String(cityId)}
                onValueChange={(val) => setCityId(Number(val))}
                label="City*"
                id="Admin_NewHotlineCityField"
                onSubmit={(e) => setCityId(Number(e.target.value))}
                options={cities?.map((city) => ({
                  label: city.name,
                  value: String(city.id),
                }))}
                isRequired
                loading={cityLoad}
              />
              <SelectDropdown
                value={String(brgyId)}
                onValueChange={(val) => setBrgyId(Number(val))}
                label="Barangay*"
                id="Admin_NewHotlineBrgyField"
                onSubmit={(e) => setBrgyId(Number(e.target.value))}
                options={barangays?.map((brgy) => ({
                  label: brgy.name,
                  value: String(brgy.id),
                }))}
                isRequired
                loading={brgyLoad}
              />
              <TextField
                label="Primary Contact Number*"
                description="This will be the number the citizens will copy."
                placeholder="(XXX or XX)XXXXXXX or 09XXXXXXXXX"
                inputType="text"
                id="Admin_NewHotlinePrimaryNoField"
                onSubmit={(e) => setPrimaryNo(e.target.value)}
                isRequired
                error={error.primary}
              />
              <TextField
                label="Secondary Contact Number (optional)"
                inputType="text"
                placeholder="(XXX or XX)XXXXXXX or 09XXXXXXXXX"
                id="Admin_NewHotlineSecondaryNoField"
                onSubmit={(e) => setSecondaryNo(e.target.value)}
                error={error.secondary}
              />
            </form>
          </>
        </FormLayout>
      </div>
      <div className="hidden md:block">
        <FormLayout
          updateId="Admin_NewHotlineBtn"
          updBtnLabel="Create"
          btnType="submit"
          formId="Admin_NewHotlineForm_Desktop"
        >
          <>
            <div className="flex flex-col gap-8 mx-18">
              <p
                className="text-2xl font-bold"
                style={{ color: colors.heading }}
              >
                Add a Hotline
              </p>
              <form
                onSubmit={(e) => create(e)}
                className="flex flex-col gap-4 bg-gray-400/20 p-8 rounded-lg"
                id="Admin_NewHotlineForm_Desktop"
              >
                <div className="w-full grid grid-flow-col grid-rows-4 gap-6 px-8">
                  <TextField
                    label="Hotline Name*"
                    inputType="text"
                    id="Admin_NewHotlineNameField"
                    onSubmit={(e) => setTitle(e.target.value)}
                    isRequired
                  />
                  <TextField
                    label="Hotline Address*"
                    inputType="text"
                    id="Admin_NewHotlineAddressField"
                    onSubmit={(e) => setAddress(e.target.value)}
                    isRequired
                  />
                  <SelectDropdown
                    value={String(cityId)}
                    onValueChange={(val) => setCityId(Number(val))}
                    label="City*"
                    id="Admin_NewHotlineCityField"
                    onSubmit={(e) => setCityId(Number(e.target.value))}
                    options={cities?.map((city) => ({
                      label: city.name,
                      value: String(city.id),
                    }))}
                    isRequired
                    loading={cityLoad}
                  />
                  <SelectDropdown
                    value={String(brgyId)}
                    onValueChange={(val) => setBrgyId(Number(val))}
                    label="Barangay*"
                    id="Admin_NewHotlineBrgyField"
                    onSubmit={(e) => setBrgyId(Number(e.target.value))}
                    options={barangays?.map((brgy) => ({
                      label: brgy.name,
                      value: String(brgy.id),
                    }))}
                    isRequired
                    loading={brgyLoad}
                  />
                  <TextField
                    label="Primary Contact Number*"
                    description="This will be the number the citizens will copy."
                    placeholder="(XXX or XX)XXXXXXX or 09XXXXXXXXX"
                    inputType="text"
                    id="Admin_NewHotlinePrimaryNoField"
                    onSubmit={(e) => setPrimaryNo(e.target.value)}
                    isRequired
                    error={error.primary}
                  />
                  <TextField
                    label="Secondary Contact Number (optional)"
                    inputType="text"
                    placeholder="(XXX or XX)XXXXXXX or 09XXXXXXXXX"
                    id="Admin_NewHotlineSecondaryNoField"
                    onSubmit={(e) => setSecondaryNo(e.target.value)}
                    error={error.secondary}
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

export default HotlinesAdd;

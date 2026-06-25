import FormLayout from "./FormLayout";
import TextField from "@/components/TextField";
import SelectDropdown from "@/components/SelectDropdown";
import { useEffect, useState } from "react";
import api from "@/api";
import { useNavigate } from "react-router";
import { handleSubmit } from "@/lib/hotlineUtils";

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

  const navigate = useNavigate();

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
              inputType="text"
              id="Admin_NewHotlinePrimaryNoField"
              onSubmit={(e) => setPrimaryNo(e.target.value)}
              isRequired
            />
            <TextField
              label="Secondary Contact Number (optional)"
              inputType="text"
              id="Admin_NewHotlineSecondaryNoField"
              onSubmit={(e) => setSecondaryNo(e.target.value)}
            />
          </form>
        </>
      </FormLayout>
    </>
  );
}

export default HotlinesAdd;

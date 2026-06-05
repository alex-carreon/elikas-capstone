import colors from "@/constants/colors";
import { Field } from "@/components/ui/field";
import CheckBox from "@/components/CheckBox";
import TextField from "@/components/TextField";
import { useState, useEffect } from "react";
import ButtonComp from "@/components/Button";
import api from "@/api";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router";
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

function HotlinesForm() {
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [primaryNo, setPrimaryNo] = useState("");
  const [secondaryNo, setSecondaryNo] = useState("");
  const [cityLoad, setCityLoad] = useState(false);
  const [brgyLoad, setBrgyLoad] = useState(false);
  const [brgyId, setBrgyId] = useState(0);
  const [cities, setCities] = useState<Cities[]>([]);
  const [cityId, setCityId] = useState(0);
  const [barangays, setBarangays] = useState<Barangays[]>([]);
  const [infoCheck, setInfoCheck] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (!id) {
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
    }
  }, [id]);

  useEffect(() => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = api.post("/emergency-contacts", {
        name: title,
        address: address,
        phone_number: primaryNo,
        mobile_number: secondaryNo,
        location_id: brgyId,
      });

      console.log(response);

      if (!response) {
        console.log("Create Failed");
        toast.error("Adding a new contact failed.");
      }

      toast.promise(response, {
        loading: "Adding your contact...",
        success: "Contact successfully added!",
        error: (err: any) => err.response.data,
        position: "top-center",
      });

      response.then(() => {
        navigate("/Hotlines");
      });
    } catch (err: any) {
      console.log(err.response);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center ">
      <div className="w-full max-w-md pt-12 p-6 mt-8 mb-2 flex flex-col gap-4 items-center">
        <div>
          <p
            className="font-bold text-lg text-center"
            style={{ color: colors.heading }}
          >
            Add a Hotline
          </p>
          <p
            className="text-align text-center italic text-sm"
            style={{ color: colors.label }}
          >
            Hotlines added will be accessible by all users.
          </p>
        </div>
        <form
          id="Hotline_Form"
          onSubmit={handleSubmit}
          className="w-full flex flex-col justify-center items-center m-0"
        >
          <div className="w-full max-w-md flex flex-col gap-5">
            <TextField
              label="Hotline Name*"
              description="Enter where the hotline belongs to."
              inputType="text"
              id="Hotline_NameField"
              placeholder="i.e. Medical and Health"
              onSubmit={(e) => setTitle(e.target.value)}
              isRequired
            />
            <TextField
              label="Address*"
              description="Enter the hotline's address if applicable."
              placeholder="Blk # Lot #, Street, Barangay, City"
              id="Hotline_AddressField"
              inputType="text"
              onSubmit={(e) => setAddress(e.target.value)}
              isRequired
            ></TextField>
            <SelectDropdown
              value={String(cityId)}
              onValueChange={(val) => setCityId(Number(val))}
              label="City"
              placeholder="Select the hotline's city"
              id="Hotline_CityField"
              onSubmit={(e) => setCityId(Number(e.target.value))}
              options={cities?.map((city) => ({
                label: city.name,
                value: String(city.id),
              }))}
              isRequired={!id}
              loading={cityLoad}
            />
            <SelectDropdown
              value={String(brgyId)}
              onValueChange={(val) => setBrgyId(Number(val))}
              label="Barangay"
              placeholder="Select the hotline's barangay (Please enter a city first)"
              id="Hotline_BrgyField"
              onSubmit={(e) => setBrgyId(Number(e.target.value))}
              options={barangays?.map((brgy) => ({
                label: brgy.name,
                value: String(brgy.id),
              }))}
              isRequired={!id}
              loading={brgyLoad}
            />
            <TextField
              label="Official Contact Number*"
              description="This will be the number the citizens will copy."
              placeholder="Enter official phone number"
              id="Hotline_OfficialNumberField"
              inputType="number"
              onSubmit={(e) => setPrimaryNo(e.target.value)}
              isRequired
            ></TextField>
            <TextField
              label="Second Contact Number (optional)"
              description="This will be the number citizens will use in case the official number is unreachable."
              placeholder="Enter second phone number"
              id="Hotline_SecondNumberField"
              inputType="number"
              onSubmit={(e) => setSecondaryNo(e.target.value)}
            ></TextField>
            <div>
              <CheckBox
                text="I confirm that this location is safe for temporary 
evacuation use."
                id="Hotline_InfoChckbox"
                checked={infoCheck}
                onCheckedChange={(val) => {
                  setInfoCheck(!!val);
                }}
              />
            </div>
            <div className="w-full max-w-md flex justify-center">
              <ButtonComp
                text="Create Pin"
                variant="primary"
                id="Hotline_SubmitBtn"
                isDisabled={!infoCheck}
                heightSize="38px"
                widthSize="100%"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default HotlinesForm;

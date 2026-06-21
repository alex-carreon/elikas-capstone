import colors from "@/constants/colors";
import CheckBox from "@/components/CheckBox";
import TextField from "@/components/TextField";
import { useState, useEffect } from "react";
import ButtonComp from "@/components/Button";
import api from "@/api";
import { useNavigate, useParams } from "react-router";
import SelectDropdown from "@/components/SelectDropdown";
import { handleDeac, handleSubmit, handleUpdate } from "@/lib/hotlineUtils";
import FormSkeleton from "@/pages/Skeletons/FormSkeleton";

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

type HotlineDetails = {
  id: number;
  location_name: string;
  name: string;
  address: string;
  phone_number: string;
  mobile_number: string;
  last_updated: string;
  posted_by: string;
};

function HotlinesForm() {
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [primaryNo, setPrimaryNo] = useState("");
  const [secondaryNo, setSecondaryNo] = useState("");
  const [cityLoad, setCityLoad] = useState(false);
  const [brgyLoad, setBrgyLoad] = useState(false);
  const [loading, setLoading] = useState(false);
  const [brgyId, setBrgyId] = useState(0);
  const [barangay, setBarangay] = useState("");
  const [cities, setCities] = useState<Cities[]>([]);
  const [cityId, setCityId] = useState(0);
  const [barangays, setBarangays] = useState<Barangays[]>([]);
  const [infoCheck, setInfoCheck] = useState(false);
  const [hotlines, setHotlines] = useState<HotlineDetails>();
  const [isEditable, setIsEditable] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      const getHotlineDetails = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/emergency-contacts/${id}`);
          setHotlines(response.data.emergency_contact);
          setTitle(response.data.emergency_contact.name);
          setAddress(response.data.emergency_contact.address);
          setPrimaryNo(response.data.emergency_contact.phone_number);
          setSecondaryNo(response.data.emergency_contact.mobile_number);
          setBarangay(response.data.emergency_contact.location_name);
        } catch (err: any) {
          console.log(err.response.data);
        } finally {
          setLoading(false);
        }
      };
      getHotlineDetails();
    }
  }, []);

  useEffect(() => {
    if (!id || isEditable) {
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
  }, [id, isEditable]);

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
    });
  };

  const update = (e: React.FormEvent) => {
    handleUpdate({
      e: e,
      title: title,
      address: address,
      primaryNo: primaryNo,
      secondaryNo: secondaryNo,
      brgyId: brgyId,
      navigate: navigate,
      id: id,
      redirect: "/Hotlines",
    });
  };

  const deac = () => {
    handleDeac({
      id: id,
      navigate: navigate,
      redirect: "/Hotlines",
    });
  };

  return loading ? (
    <div className="w-full h-full flex flex-col items-center p-12 mt-8 mb-2 gap-4">
      <FormSkeleton />
    </div>
  ) : (
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
          onSubmit={create}
          className="w-full flex flex-col justify-center items-center m-0"
        >
          <div className="w-full max-w-md flex flex-col gap-5">
            {id && (
              <TextField
                label="Hotline Id"
                description="Enter where the hotline belongs to."
                inputType="text"
                id="Hotline_Id"
                placeholder="i.e. Medical and Health"
                value={String(hotlines?.id)}
                readonly
              />
            )}
            <TextField
              label="Hotline Name*"
              description="Enter where the hotline belongs to."
              inputType="text"
              id="Hotline_NameField"
              placeholder="i.e. Medical and Health"
              onSubmit={(e) => setTitle(e.target.value)}
              value={id && title}
              isRequired={!id}
              readonly={!isEditable}
            />
            <TextField
              label="Address*"
              description="Enter the hotline's address if applicable."
              placeholder="Blk # Lot #, Street, Barangay, City"
              id="Hotline_AddressField"
              inputType="text"
              onSubmit={(e) => setAddress(e.target.value)}
              value={id && address}
              isRequired={!id}
              readonly={!isEditable}
            ></TextField>
            {!id || isEditable ? (
              <>
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
              </>
            ) : (
              <TextField
                label="Barangay Location"
                id="Hotline_Barangay"
                inputType="text"
                readonly
                value={barangay}
              ></TextField>
            )}

            <TextField
              label="Primary Contact Number*"
              description="This will be the number the citizens will copy."
              id="Hotline_OfficialNumberField"
              inputType="text"
              onSubmit={(e) => setPrimaryNo(e.target.value)}
              value={id && primaryNo}
              isRequired={!id}
              readonly={!isEditable}
            ></TextField>
            <TextField
              label="Secondary Contact Number (optional)"
              description="This will be the number citizens will use in case the official number is unreachable."
              id="Hotline_SecondNumberField"
              inputType="text"
              onSubmit={(e) => setSecondaryNo(e.target.value)}
              value={id && secondaryNo}
              isRequired={!id}
              readonly={!isEditable}
            ></TextField>

            {id ? (
              isEditable ? (
                <>
                  <div className="mx-2 flex justify-evenly shrink gap-4">
                    <ButtonComp
                      text="Submit"
                      id="Hotline_SubmitUpdBtn"
                      // type="button"
                      variant="primary"
                      heightSize="38px"
                      widthSize="20"
                      onClick={(e) => update(e)}
                    ></ButtonComp>
                    <ButtonComp
                      text="Cancel"
                      id="Hotline_CancelUpdBtn"
                      variant="outline"
                      heightSize="38px"
                      widthSize="20"
                      onClick={() => {
                        navigate("/Hotlines");
                      }}
                      type="button"
                    ></ButtonComp>
                  </div>
                </>
              ) : (
                <div className="mx-2 flex justify-evenly shrink gap-4">
                  <ButtonComp
                    text="Update"
                    id="Hotline_UpdateBtn"
                    // type="button"
                    variant="primary"
                    heightSize="38px"
                    widthSize="20"
                    onClick={() => setIsEditable(true)}
                  ></ButtonComp>
                  <ButtonComp
                    text="Delete"
                    id="Hotline_DeleteBtn"
                    variant="important"
                    heightSize="38px"
                    widthSize="20"
                    onClick={() => {
                      deac();
                    }}
                    type="button"
                  ></ButtonComp>
                </div>
              )
            ) : (
              <>
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
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default HotlinesForm;

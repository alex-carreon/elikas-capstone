import colors from "@/constants/colors";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import TextField from "@/components/TextField";
import SelectDropdown from "@/components/SelectDropdown";
import api from "@/api";
import ButtonComp from "@/components/Button";
import { handleCreate, handleDeac, handleUpdate } from "@/lib/sensorUtils";
import { Field, FieldLabel } from "@/components/ui/field";
import AlertDialogue from "@/components/AlertDialogue";
import FormSkeleton from "../../Skeletons/FormSkeleton";

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

function SensorForm() {
  const [isEditable, setIsEditable] = useState(false);
  const [sensorCode, setSensorCode] = useState("");
  const [name, setName] = useState("");
  const [mountHeight, setMountHeight] = useState(0);
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [address, setAddress] = useState("");
  const [yellowLevel, setYellowLevel] = useState(0);
  const [orangeLevel, setOrangeLevel] = useState(0);
  const [redLevel, setRedLevel] = useState(0);
  const [brgy, setBrgy] = useState(0);
  const [cities, setCities] = useState<Cities[]>([]);
  const [cityId, setCityId] = useState(0);
  const [barangays, setBarangays] = useState<Barangays[]>([]);
  const [mountLocation, setMountLocation] = useState("");
  const [registeredBy, setRegisteredBy] = useState("");
  const [deactivatedAt, setDeactivatedAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [brgyLoad, setBrgyLoad] = useState(false);
  const [willDeac, setWillDeac] = useState(false);
  const [error, setError] = useState({
    yellowLevel: "",
    orangeLevel: "",
    redLevel: "",
  });

  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      const getSensorDetails = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/sensors/${id}`);
          const details = await response.data.data;

          if (!response) {
            console.log("Error getting details");
          }

          console.log(response.data.data.mountLocation);

          setSensorCode(details.sensorCode);
          setName(details.name);
          setMountHeight(details.mountHeight);
          setLatitude(details.location[0]);
          setLongitude(details.location[1]);
          setAddress(details.address);
          setYellowLevel(details.yellowLevel);
          setOrangeLevel(details.orangeLevel);
          setRedLevel(details.redLevel);
          setMountLocation(details.mountLocation);
          setRegisteredBy(details.registeredBy);
          setDeactivatedAt(details.deactivatedAt);
        } catch (err: any) {
          console.log(err.response.data);
        } finally {
          setLoading(false);
        }
      };

      getSensorDetails();
    }
  }, [isEditable]);

  useEffect(() => {
    if (isEditable || !id) {
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
    }
  }, [isEditable, id]);

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

    handleCreate({
      e: e,
      name: name,
      mountHeight: mountHeight,
      location: [latitude, longitude],
      address: address,
      yellowLevel: yellowLevel,
      orangeLevel: orangeLevel,
      redLevel: redLevel,
      brgy: brgy,
      navigate: navigate,
      setError: setError,
      error: error,
    });
  };

  const update = (e: React.FormEvent) => {
    e.preventDefault();

    handleUpdate({
      e: e,
      id: Number(id),
      name: name,
      mountHeight: mountHeight,
      address: address,
      yellowLevel: yellowLevel,
      orangeLevel: orangeLevel,
      redLevel: redLevel,
      setIsEditable: setIsEditable,
      setError: setError,
    });
  };

  const deac = () => {
    handleDeac({ id: Number(id), navigate: navigate });
  };

  return loading ? (
    <div className="w-full h-full flex flex-col items-center p-12 mt-8 mb-2 gap-4">
      <FormSkeleton />
    </div>
  ) : (
    <>
      {willDeac && (
        <AlertDialogue
          contentId="Sensors_DeacContent"
          closeId="Sensors_DeacClose"
          actionId="Sensors_DeacBtn"
          open={willDeac}
          title="You are about to delete this sensors"
          description="Deleting this sensor will remove it from the map and your history permanently."
          buttonText="Delete"
          onClose={() => {
            setWillDeac(false);
          }}
          onClick={() => deac()}
        />
      )}
      <div className="w-full h-full flex flex-col items-center p-12 mt-8 mb-2 gap-8">
        <div>
          <p
            className="font-bold text-lg text-center"
            style={{ color: colors.heading }}
          >
            {id
              ? "Sensor Details"
              : isEditable
                ? "Sensor Update"
                : "Add a Sensor Record"}
          </p>
          {id ? null : (
            <p
              className="text-align text-center italic text-sm"
              style={{ color: colors.label }}
            >
              Get real-time information on the state of rivers surrounding your
              area.
            </p>
          )}
        </div>
        <div className="w-full max-w-sm flex flex-col justify-center items-center m-0 gap-4">
          {id && (
            <TextField
              label="Sensor Code"
              value={sensorCode}
              inputType="text"
              id="Sensor_SensorCode"
              onSubmit={(e) => setName(e.target.value)}
              readonly
            />
          )}
          <TextField
            label="Sensor Name"
            description="This is what will appear on the map"
            value={name}
            inputType="text"
            id="Sensor_NameField"
            onSubmit={(e) => setName(e.target.value)}
            isRequired={!id}
            readonly={!id || isEditable ? false : true}
          />
          <TextField
            label="Mount Height in Meters"
            description="This refers to the meters of the sensor from the ground"
            value={String(mountHeight)}
            inputType="number"
            id="Sensor_MountHeightField"
            onSubmit={(e) => setMountHeight(Number(e.target.value))}
            isRequired={!id}
            readonly={!id || isEditable ? false : true}
          />
          <TextField
            label="Latitude"
            description="The latitude of the sensor's location"
            value={String(latitude)}
            inputType="number"
            id="Sensor_LatitudeField"
            onSubmit={(e) => setLatitude(Number(e.target.value))}
            isRequired={!id}
            readonly={!id || isEditable ? false : true}
          />
          <TextField
            label="Longitude"
            description="The longitude of the sensor's location"
            value={String(longitude)}
            inputType="number"
            id="Sensor_LongitudeField"
            onSubmit={(e) => setLongitude(Number(e.target.value))}
            isRequired={!id}
            readonly={!id || isEditable ? false : true}
          />
          {!id ? (
            <Field>
              <FieldLabel>Mount Location</FieldLabel>
              <SelectDropdown
                value={String(cityId)}
                onValueChange={(val) => setCityId(Number(val))}
                label="City"
                placeholder="Select the sensor's city"
                id="Sensor_CityField"
                onSubmit={(e) => setCityId(Number(e.target.value))}
                options={cities?.map((city) => ({
                  label: city.name,
                  value: String(city.id),
                }))}
                isRequired={!id}
                loading={loading}
              />
              <SelectDropdown
                value={String(brgy)}
                onValueChange={(val) => setBrgy(Number(val))}
                label="Barangay"
                placeholder="Select the sensor's barangay (Please enter a city first)"
                id="Sensor_BrgyField"
                onSubmit={(e) => setBrgy(Number(e.target.value))}
                options={barangays?.map((brgy) => ({
                  label: brgy.name,
                  value: String(brgy.id),
                }))}
                isRequired={!id}
                loading={brgyLoad}
              />
            </Field>
          ) : (
            <TextField
              label="Mount Location"
              value={mountLocation}
              inputType="string"
              id="Sensor_MountLoc"
              readonly
            />
          )}
          <TextField
            label="Address"
            description="The address of the sensor"
            value={address}
            inputType="string"
            id="Sensor_AddressField"
            onSubmit={(e) => setAddress(e.target.value)}
            isRequired={!id}
            readonly={!id || isEditable ? false : true}
          />
          <TextField
            label="Yellow Level in Meters"
            description="Set the yellow level of the sensor. This will be the basis of how high the river should be to have a yellow alert. This must be greater than 0"
            value={String(yellowLevel)}
            inputType="number"
            id="Sensor_YellowField"
            onSubmit={(e) => setYellowLevel(Number(e.target.value))}
            isRequired={!id}
            readonly={!id || isEditable ? false : true}
            error={error.yellowLevel}
          />
          <TextField
            label="Orange Level in Meters"
            description="Set the orange level of the sensor. This will be the basis of how high the river should be to have an orange alert. This must be greater than yellow level and less than red level"
            value={String(orangeLevel)}
            inputType="number"
            id="Sensor_OrangeField"
            onSubmit={(e) => setOrangeLevel(Number(e.target.value))}
            isRequired={!id}
            readonly={!id || isEditable ? false : true}
            error={error.orangeLevel}
          />
          <TextField
            label="Red Level in Meters"
            description="Set the red level of the sensor. This will be the basis of how high the river should be to have a red alert. It must be greater than orange level and less than the mount height."
            value={String(redLevel)}
            inputType="number"
            id="Sensor_RedField"
            onSubmit={(e) => setRedLevel(Number(e.target.value))}
            isRequired={!id}
            readonly={!id || isEditable ? false : true}
            error={error.redLevel}
          />
          {id && (
            <>
              <TextField
                label="Registered By"
                value={registeredBy}
                inputType="text"
                id="Sensor_RegisteredBy"
                readonly
              />
              {deactivatedAt && (
                <TextField
                  label="Registered By"
                  value={deactivatedAt}
                  inputType="text"
                  id="Sensor_RegisteredBy"
                  readonly
                />
              )}
            </>
          )}
        </div>
        <div className="w-full max-w-sm">
          {id ? (
            !isEditable ? (
              <>
                <div className="w-full mx-2 flex justify-evenly shrink gap-4">
                  <ButtonComp
                    text="Update"
                    id="EvacPin_UpdatePinBtn"
                    variant="primary"
                    heightSize="38px"
                    widthSize="20"
                    onClick={() => setIsEditable(true)}
                    type="button"
                  ></ButtonComp>
                  <ButtonComp
                    text="Delete"
                    id="EvacPin_ClosePinBtn"
                    variant="important"
                    heightSize="38px"
                    widthSize="20"
                    type="button"
                    onClick={() => setWillDeac(true)}
                  ></ButtonComp>
                </div>
              </>
            ) : (
              <>
                <div className="w-full mx-2 flex justify-evenly shrink gap-4">
                  <ButtonComp
                    text="Submit"
                    id="EvacPin_SubmitUpdBtn"
                    type="button"
                    variant="primary"
                    heightSize="38px"
                    widthSize="20"
                    onClick={(e) => update(e)}
                  ></ButtonComp>
                  <ButtonComp
                    text="Cancel"
                    id="EvacPin_CancelUpdBtn"
                    variant="outline"
                    heightSize="38px"
                    widthSize="20"
                    onClick={() => {
                      setIsEditable(false);
                    }}
                    type="button"
                  ></ButtonComp>
                </div>
              </>
            )
          ) : (
            <>
              <div className="w-full max-w-md flex justify-center">
                <ButtonComp
                  text="Add Sensor"
                  variant="primary"
                  id="Sensor_SubmitBtn"
                  heightSize="46px"
                  onClick={(e) => create(e)}
                  type="submit"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default SensorForm;

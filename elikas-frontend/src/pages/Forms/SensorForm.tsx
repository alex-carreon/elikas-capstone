import colors from "@/constants/colors";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import TextField from "@/components/TextField";
import SelectDropdown from "@/components/SelectDropdown";
import api from "@/api";
import ButtonComp from "@/components/Button";
import { handleCreate } from "@/lib/sensorUtils";

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
  const [loading, setLoading] = useState(false);
  const [brgyLoad, setBrgyLoad] = useState(false);

  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
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
  }, []);

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
    });
  };

  return (
    <>
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
          <TextField
            label="Sensor Name"
            description="This is what will appear on the map"
            inputType="text"
            id="Sensor_NameField"
            onSubmit={(e) => setName(e.target.value)}
            isRequired
          />
          <TextField
            label="Mount Height in Meters"
            description="This refers to the meters of the sensor from the ground"
            inputType="number"
            id="Sensor_MountHeightField"
            onSubmit={(e) => setMountHeight(Number(e.target.value))}
            isRequired
          />
          <TextField
            label="Latitude"
            description="The latitude of the sensor's location"
            inputType="number"
            id="Sensor_LatitudeField"
            onSubmit={(e) => setLatitude(Number(e.target.value))}
            isRequired
          />
          <TextField
            label="Longitude"
            description="The longitude of the sensor's location"
            inputType="number"
            id="Sensor_LongitudeField"
            onSubmit={(e) => setLongitude(Number(e.target.value))}
            isRequired
          />
          <SelectDropdown
            value={String(cityId)}
            onValueChange={(val) => setCityId(Number(val))}
            label="City"
            placeholder="Select the sensor's city"
            id="Sensor_LocationField"
            onSubmit={(e) => setCityId(Number(e.target.value))}
            options={cities?.map((city) => ({
              label: city.name,
              value: String(city.id),
            }))}
            isRequired
            loading={loading}
          />
          <SelectDropdown
            value={String(brgy)}
            onValueChange={(val) => setBrgy(Number(val))}
            label="Barangay"
            placeholder="Select the sensor's barangay (Please enter a city first)"
            id="Sensor_LocationField"
            onSubmit={(e) => setBrgy(Number(e.target.value))}
            options={barangays?.map((brgy) => ({
              label: brgy.name,
              value: String(brgy.id),
            }))}
            isRequired
            loading={brgyLoad}
          />
          <TextField
            label="Address"
            description="The address of the sensor"
            inputType="string"
            id="Sensor_AddressField"
            onSubmit={(e) => setAddress(e.target.value)}
            isRequired
          />
          <TextField
            label="Yellow Level in Meters"
            description="Set the yellow level of the sensor. This will be the basis of how high the river should be to have a yellow alert"
            inputType="number"
            id="Sensor_YellowField"
            onSubmit={(e) => setYellowLevel(Number(e.target.value))}
            isRequired
          />
          <TextField
            label="Orange Level in Meters"
            description="Set the orange level of the sensor. This will be the basis of how high the river should be to have an orange alert"
            inputType="number"
            id="Sensor_OrangeField"
            onSubmit={(e) => setOrangeLevel(Number(e.target.value))}
            isRequired
          />
          <TextField
            label="Red Level in Meters"
            description="Set the red level of the sensor. This will be the basis of how high the river should be to have a red alert"
            inputType="number"
            id="Sensor_RedField"
            onSubmit={(e) => setRedLevel(Number(e.target.value))}
            isRequired
          />
        </div>
        <div className="w-full max-w-md flex justify-center">
          <ButtonComp
            text="Add Sensor"
            variant="primary"
            id="Sensor_SubmitBtn"
            heightSize="46px"
            onClick={(e) => create(e)}
          />
        </div>
      </div>
    </>
  );
}

export default SensorForm;

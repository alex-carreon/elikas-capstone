import api from "@/api";
import FormLayout from "./FormLayout";
import TextField from "@/components/TextField";
import { useParams } from "react-router";
import { useEffect, useState } from "react";
import FormSkeleton from "@/pages/Skeletons/FormSkeleton";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";

function SensorDetails() {
  const [loading, setLoading] = useState(false);
  const [sensorCode, setSensorCode] = useState("");
  const [name, setName] = useState("");
  const [mountHeight, setMountHeight] = useState(0);
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [address, setAddress] = useState("");
  const [yellowLevel, setYellowLevel] = useState(0);
  const [orangeLevel, setOrangeLevel] = useState(0);
  const [redLevel, setRedLevel] = useState(0);
  const [mountLocation, setMountLocation] = useState("");
  const [registeredBy, setRegisteredBy] = useState("");
  const [deactivatedAt, setDeactivatedAt] = useState("");

  const convertDateTime = (utcString: string) => {
    const zoned = toZonedTime(new Date(utcString), "Asia/Manila");
    return format(zoned, "MMM d, yyyy h:mm a");
  };

  const { id } = useParams();

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
  }, []);

  return (
    <>
      <FormLayout formTitle="Sensor Details">
        {loading ? (
          <div className="flex justify-center">
            <FormSkeleton />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              <TextField
                label="Sensor Code"
                value={sensorCode}
                inputType="text"
                id="Sensor_SensorCode"
                readonly
              />
              <TextField
                label="Sensor Name"
                description="This is what will appear on the map"
                value={name}
                inputType="text"
                id="Sensor_NameField"
                readonly
              />
              <TextField
                label="Mount Height in Meters"
                description="This refers to the meters of the sensor from the ground"
                value={String(mountHeight)}
                inputType="number"
                id="Sensor_MountHeightField"
                readonly
              />
              <TextField
                label="Latitude"
                description="The latitude of the sensor's location"
                value={String(latitude)}
                inputType="number"
                id="Sensor_LatitudeField"
                readonly
              />
              <TextField
                label="Longitude"
                description="The longitude of the sensor's location"
                value={String(longitude)}
                inputType="number"
                id="Sensor_LongitudeField"
                readonly
              />

              <TextField
                label="Mount Location"
                value={mountLocation}
                inputType="string"
                id="Sensor_MountLoc"
                readonly
              />

              <TextField
                label="Address"
                description="The address of the sensor"
                value={address}
                inputType="string"
                id="Sensor_AddressField"
                readonly
              />
              <TextField
                label="Yellow Level in Meters"
                description="Set the yellow level of the sensor. This will be the basis of how high the river should be to have a yellow alert. This must be greater than 0"
                value={String(yellowLevel)}
                inputType="number"
                id="Sensor_YellowField"
                readonly
              />
              <TextField
                label="Orange Level in Meters"
                description="Set the orange level of the sensor. This will be the basis of how high the river should be to have an orange alert. This must be greater than yellow level and less than red level"
                value={String(orangeLevel)}
                inputType="number"
                id="Sensor_OrangeField"
                readonly
              />
              <TextField
                label="Red Level in Meters"
                description="Set the red level of the sensor. This will be the basis of how high the river should be to have a red alert. It must be greater than orange level and less than the mount height."
                value={String(redLevel)}
                inputType="number"
                id="Sensor_RedField"
                readonly
              />

              <TextField
                label="Registered by"
                value={registeredBy}
                inputType="text"
                id="Sensor_RegisteredBy"
                readonly
              />
              {deactivatedAt && (
                <TextField
                  label="Deactivated at"
                  value={convertDateTime(deactivatedAt)}
                  inputType="text"
                  id="Sensor_RegisteredBy"
                  readonly
                />
              )}
            </div>
          </>
        )}
      </FormLayout>
    </>
  );
}

export default SensorDetails;

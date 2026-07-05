import api from "@/api";
import FormLayout from "./FormLayout";
import TextField from "@/components/TextField";
import { useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import FormSkeleton from "@/pages/Skeletons/FormSkeleton";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { toast } from "sonner";

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
  const [disabled, setDisabled] = useState(false);

  const navigate = useNavigate();

  const convertDateTime = (utcString: string) => {
    const zoned = toZonedTime(new Date(utcString), "Asia/Manila");
    return format(zoned, "MMM d, yyyy h:mm a");
  };

  const { id } = useParams();

  const getSensorDetails = async (signal?: AbortSignal) => {
    try {
      const response = await api.get(`/sensors/${id}`, { signal });
      const details = await response.data.data;

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
      if (err.name === "CanceledError") return;
      toast.error(err.response.data.error);
      console.log(err);
    }
  };

  const getAll = async () => {
    const controller = new AbortController();

    try {
      setLoading(true);
      setDisabled(true);
      await getSensorDetails(controller.signal);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        setLoading(false);
        setDisabled(false);
        return;
      }
      console.log(err);
    } finally {
      setLoading(false);
      setDisabled(false);
    }
    return () => controller.abort();
  };

  useEffect(() => {
    getAll();
  }, []);

  return (
    <>
      <FormLayout
        formTitle="Sensor Details"
        updBtnLabel="See Logs"
        updateId="Sensors_Logs"
        singleUpd={() => {
          navigate(`/admin-sensorlogs/${sensorCode}`);
        }}
        isDeactivated={deactivatedAt ? true : false}
        isDisabled={disabled}
      >
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
                id="Admin_SensorDetailsCode"
                readonly
              />
              <TextField
                label="Sensor Name"
                description="This is what will appear on the map"
                value={name}
                inputType="text"
                id="Admin_SensorDetailsName"
                readonly
              />
              <TextField
                label="Mount Height in Meters"
                description="This refers to the meters of the sensor from the ground"
                value={String(mountHeight)}
                inputType="number"
                id="Admin_SensorDetailsMountHeight"
                readonly
              />
              <TextField
                label="Latitude"
                description="The latitude of the sensor's location"
                value={String(latitude)}
                inputType="number"
                id="Admin_SensorDetailsLat"
                readonly
              />
              <TextField
                label="Longitude"
                description="The longitude of the sensor's location"
                value={String(longitude)}
                inputType="number"
                id="Admin_SensorDetailsLong"
                readonly
              />

              <TextField
                label="Mount Location"
                value={mountLocation}
                inputType="string"
                id="Admin_SensorDetailsMountLoc"
                readonly
              />

              <TextField
                label="Address"
                description="The address of the sensor"
                value={address}
                inputType="string"
                id="Admin_SensorDetailsAddress"
                readonly
              />
              <TextField
                label="Yellow Level in Meters"
                description="This is be the basis of how high the river should be to have a yellow alert. This must be greater than 0"
                value={String(yellowLevel)}
                inputType="number"
                id="Admin_SensorDetailsYellow"
                readonly
              />
              <TextField
                label="Orange Level in Meters"
                description="This is be the basis of how high the river should be to have an orange alert. This must be greater than yellow level and less than red level"
                value={String(orangeLevel)}
                inputType="number"
                id="Admin_SensorDetailsOrange"
                readonly
              />
              <TextField
                label="Red Level in Meters"
                description="This is be the basis of how high the river should be to have a red alert. It must be greater than orange level and less than the mount height."
                value={String(redLevel)}
                inputType="number"
                id="Admin_SensorDetailsRed"
                readonly
              />

              <TextField
                label="Registered by"
                value={registeredBy}
                inputType="text"
                id="Admin_SensorDetailsRegisteredBy"
                readonly
              />
              {deactivatedAt && (
                <TextField
                  label="Deactivated at"
                  value={convertDateTime(deactivatedAt)}
                  inputType="text"
                  id="Admin_SensorDetailsDeacAt"
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

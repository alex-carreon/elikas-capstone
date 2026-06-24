import api from "@/api";
import SensorIconDetailed from "../SensorIconDetailed";
import { DrawerClose } from "@/components/ui/drawer";
import { CircleX } from "lucide-react";
import { useEffect, useState } from "react";
import Skeleton from "@mui/material/Skeleton";

type Sensors = {
  id: number;
  name: string;
  location: [number, number];
  water_level: any | null;
  last_only: any | null;
  current_status: string;
};

type SensorsDetails = {
  id: number;
  name: string;
  waterLevel: any | null;
  lastOnline: any | null;
  location: [number, number];
  address: string;
  currentStatus: string;
  barangay: string;
};

function SensorDrawer({ selectedPin }: { selectedPin: Sensors | null }) {
  const [sensorDetails, setSensorDetails] = useState<
    SensorsDetails | undefined
  >();
  const [height, setHeight] = useState<number | null>();
  const [loading, setLoading] = useState(false);

  const colorSensor = {
    yellow: "#F3C217",
    orange: "#E6793B",
    red: "#B22B42",
    purple: "#6E4998",
    green: "#318631",
    inactive: "#D3D3D3",
  };

  useEffect(() => {
    if (!selectedPin) return;

    const getSensorDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/public/sensors/${selectedPin.id}`);
        if (!response) {
          console.log("Error fetching");
        }
        setSensorDetails(response.data);
        setHeight(response.data.waterLevel);
      } catch (err: any) {
        console.log(err.response.data);
      } finally {
        setLoading(false);
      }
    };

    getSensorDetails();
  }, [selectedPin?.id]);

  const calcRiskInfo = (status: string | null | undefined) => {
    if (status == null)
      return {
        color: colorSensor.inactive,
        risk: "Not yet installed",
        desc: "This sensor is not yet installed",
      };
    if (status == "red")
      // Overflow
      return {
        color: colorSensor.red,
        risk: "Critical",
        desc: "Flooding is imminent or ongoing. Evacuate immediately to higher ground.",
      };
    else if (status == "orange") {
      // Critical
      return {
        color: colorSensor.orange,
        risk: "Alarm",
        desc: "Water levels are significantly elevated. Prepare for possible evacuation and secure belongings.",
      };
    } else if (status == "yellow") {
      // Alarm
      return {
        color: colorSensor.orange,
        risk: "Alert",
        desc: "Water levels are rising. Monitor the situation closely and stay informed of updates.",
      };
    } else
      return {
        color: colorSensor.green,
        risk: "Normal",
        desc: "Water levels are normal.",
      };
  };

  //   if (!height) return;
  const riskInfo = calcRiskInfo(sensorDetails?.currentStatus);

  return loading ? (
    <>
      <div className="w-full px-4 pb-4 flex flex-col gap-4">
        <div className="w-full flex flex-row justify-between">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-38 rounded-lg bg-[#59260B]/30" />
          </div>
          <DrawerClose id="DrawerMark_CloseBtn" className="self-start">
            <CircleX size={28} fill="#CECECE" strokeWidth={1} />
          </DrawerClose>
        </div>
        <div className="w-full flex flex-col self-start gap-2">
          <div className="w-full flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full bg-[#59260B]/30" />
            <div className="w-full space-y-2 items-start justify-center">
              <Skeleton className="h-4 w-full bg-[#59260B]/30" />
              <Skeleton className="h-4 w-[200px] bg-[#59260B]/30" />
            </div>
          </div>
          <Skeleton className="h-12 w-full bg-[#59260B]/30" />
          <Skeleton className="h-12 w-full bg-[#59260B]/30" />
        </div>
      </div>
    </>
  ) : (
    <>
      <div className="px-4 pb-4">
        <div className="w-full flex flex-row justify-between">
          <div className="flex flex-row gap-2 items-center">
            <SensorIconDetailed
              width={50}
              height={50}
              color={riskInfo ? riskInfo.color : ""}
            />
            <div>
              <div className="flex flex-row">
                <p className="text-lg font-semibold">{sensorDetails?.name}</p>
              </div>
              <p className="text-xs text-left font-semibold italic">
                Last Online:{" "}
                {sensorDetails?.lastOnline
                  ? sensorDetails?.lastOnline
                  : "No online record"}
              </p>
            </div>
          </div>
          <DrawerClose id="DrawerMark_CloseBtn" className="self-start">
            <CircleX size={28} fill="#CECECE" strokeWidth={1} />
          </DrawerClose>
        </div>
        <div className="mt-2">
          <ul className="list-disc pl-8 text-left text-sm flex flex-col gap-1">
            <li>
              <b>Location</b>:{" "}
              {`${sensorDetails?.address}, ${sensorDetails?.barangay}`}
            </li>
            <li>
              <b>Water Height in Meters</b>: {height}
            </li>
            <li>
              <b>Risk Level</b>: {riskInfo.risk}
            </li>
            <p>{riskInfo.desc}</p>
          </ul>
        </div>
      </div>
    </>
  );
}

export default SensorDrawer;

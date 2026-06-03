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
  sensorCode: string;
  name: string;
  waterLevel: any | null;
  lastOnline: any | null;
  mountHeight: number;
  location: [number, number];
  address: string;
  yellowLevel: number;
  redLevel: number;
  currentStatus: string;
  mountLocation: string;
  deactivatedAt: any | null;
  registeredBy: string;
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
  };

  useEffect(() => {
    if (!selectedPin) return;

    const getSensorDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/sensors/${selectedPin.id}`);
        if (!response) {
          console.log("Error fetching");
        }
        console.log("Response", response.data.data);
        setSensorDetails(response.data.data);
        setHeight(response.data.data.waterLevel);
      } catch (err: any) {
        console.log(err.response.data);
      } finally {
        setLoading(false);
      }
    };

    getSensorDetails();
  }, [selectedPin?.id]);

  const calcRiskInfo = (height: number | null) => {
    if (height == null)
      return {
        color: colorSensor.green,
        risk: "Normal",
        desc: "Water levels are normal",
      };
    if (height >= 40)
      // Overflow
      return {
        color: colorSensor.purple,
        risk: "Overflow",
        desc: "Water has exceeded safe levels and is overflowing. Avoid flood-prone areas and follow emergency instructions.",
      };
    else if (height >= 30) {
      // Critical
      return {
        color: colorSensor.red,
        risk: "Critical",
        desc: "Flooding is imminent or ongoing. Evacuate immediately to higher ground.",
      };
    } else if (height >= 20) {
      // Alarm
      return {
        color: colorSensor.orange,
        risk: "Alarm",
        desc: "Water levels are significantly elevated. Prepare for possible evacuation and secure belongings.",
      };
    } else if (height >= 10) {
      // Alert
      return {
        color: colorSensor.yellow,
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
  const riskInfo = calcRiskInfo(height ? height : null);

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
              {/* <p className="text-xs text-left font-semibold italic">
                Timestamp: Mar 25, 2026 – 9:42 PM
              </p> */}
            </div>
          </div>
          <DrawerClose id="DrawerMark_CloseBtn" className="self-start">
            <CircleX size={28} fill="#CECECE" strokeWidth={1} />
          </DrawerClose>
        </div>
        <div className="mt-2">
          <ul className="list-disc pl-8 text-left text-sm flex flex-col gap-1">
            <li>
              <b>Sensor Code</b>: {sensorDetails?.sensorCode}
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

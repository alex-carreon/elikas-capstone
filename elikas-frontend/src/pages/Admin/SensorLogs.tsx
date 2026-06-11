import FormLayout from "./Forms/FormLayout";
import { useState, useEffect } from "react";
import { useParams } from "react-router";
import api from "@/api";
import { Fragment } from "react";
import Row from "@/components/Row";
import { Skeleton } from "@/components/ui/skeleton";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";

type sensorLog = {
  waterLevel: number;
  statusLevel: string;
  sensorTimestamp: string;
  logTime: string;
};

function SensorLogs() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<sensorLog[]>([]);

  const { sensorcode } = useParams();

  const convertDateTime = (utcString: string) => {
    const zoned = toZonedTime(new Date(utcString), "Asia/Manila");
    return format(zoned, "MMM d, yyyy h:mm a");
  };

  const getSensorLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sensors/${sensorcode}/logs`);
      setLogs(response.data.data);
    } catch (err: any) {
      console.log(err.response.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSensorLogs();
  }, []);

  return (
    <>
      <FormLayout formTitle={`Sensor Logs: ${sensorcode}`}>
        {loading ? (
          <>
            <div className="w-full flex flex-col items-center">
              <div className="flex w-full max-w-sm flex-col gap-7 pt-4">
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-24 w-full bg-[#59260B]/30" />
                </div>
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-24 w-full bg-[#59260B]/30" />
                </div>
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-24 w-full bg-[#59260B]/30" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <Fragment key={index}>
                  <Row
                    postId={sensorcode}
                    title={`Water Level: ${log.waterLevel} meters`}
                    desc={`Time stamp: ${convertDateTime(log.sensorTimestamp)}`}
                    address={`Log Time: ${convertDateTime(log.logTime)}`}
                  >
                    <div className="flex flex-row gap-2">
                      <div
                        className={`mt-2 px-2 py-1 rounded-3xl ${log.statusLevel == "normal" ? "bg-green-700/60" : log.statusLevel == "yellow" ? "bg-yellow-700/60" : log.statusLevel == "orange" ? "bg-amber-700/60" : log.statusLevel == "red" ? "bg-red-700/60" : "bg-gray-500/30"} w-fit text-sm`}
                      >
                        {log.statusLevel
                          ? log.statusLevel
                          : "No Level Detected"}
                      </div>
                    </div>
                  </Row>
                </Fragment>
              ))
            ) : (
              <p className="text-center">No Logs yet!</p>
            )}
          </div>
        )}
      </FormLayout>
    </>
  );
}

export default SensorLogs;

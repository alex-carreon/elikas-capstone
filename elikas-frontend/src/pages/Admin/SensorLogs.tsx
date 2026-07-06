import FormLayout from "./Forms/FormLayout";
import { useState, useEffect } from "react";
import { useParams } from "react-router";
import api from "@/api";
import { Fragment } from "react";
import Row from "@/components/Row";
import { Skeleton } from "@/components/ui/skeleton";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { toast } from "sonner";
import PaginationComp from "@/components/Pagination";

type sensorLog = {
  waterLevel: number;
  statusLevel: string;
  sensorTimestamp: string;
  logTime: string;
};

function SensorLogs() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<sensorLog[]>([]);
  const [next, setNext] = useState(1);

  const { sensorcode } = useParams();

  const convertDateTime = (utcString: string) => {
    const zoned = toZonedTime(new Date(utcString), "Asia/Manila");
    return format(zoned, "MMM d, yyyy h:mm a");
  };

  const getSensorLogs = async (signal?: AbortSignal) => {
    try {
      const response = await api.get(`/sensors/${sensorcode}/logs`, { signal });
      setLogs(response.data.data);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        return;
      }
      toast.error(err.response.data.error);
      console.log(err.response?.data.details);
    }
  };

  const getAll = async () => {
    const controller = new AbortController();

    try {
      setLoading(true);
      await getSensorLogs(controller.signal);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        setLoading(false);
        return;
      }
      console.log(err);
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  };

  const getByPage = async (page: number) => {
    const controller = new AbortController();
    try {
      setLoading(true);
      const response = await api.get(
        `/sensors/${sensorcode}/logs?page=${String(page)}`,
        {
          signal: controller.signal,
        },
      );

      setLogs(response.data.data);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        return;
      }
      console.log(err.response?.data);
      toast.error(
        "An unexpected occurred. Please wait while we try to fix this!",
      );
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  };

  useEffect(() => {
    getAll();
  }, []);

  return (
    <>
      <FormLayout formTitle={`Sensor Logs: ${sensorcode}`}>
        <PaginationComp
          onClickPrev={() => {
            const updated = next - 1;
            setNext(updated);
            getByPage(updated);
          }}
          onClick1={() => {
            setNext(1);
            getByPage(1);
          }}
          onClick2={() => {
            setNext(2);
            getByPage(2);
          }}
          onClick3={() => {
            setNext(3);
            getByPage(3);
          }}
          onClickNext={() => {
            const updated = next + 1;
            setNext(updated);
            getByPage(updated);
          }}
          next={next}
        />
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
          <>
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
          </>
        )}
      </FormLayout>
    </>
  );
}

export default SensorLogs;

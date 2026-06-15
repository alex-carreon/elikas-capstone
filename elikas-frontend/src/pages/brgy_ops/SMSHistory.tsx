import colors from "@/constants/colors";
import { useEffect, useState } from "react";
import { Clock, Send } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import Row from "@/components/Row";
import api from "@/api";
import { Skeleton } from "@/components/ui/skeleton";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";

type StatusType = {
  id: number;
  name: string;
};

type BroadcastsType = {
  id: number;
  message_content: string;
  status: StatusType;
  scheduled_for: string;
  sent_at: string;
  total_recipients: number;
};

function SMSHistory() {
  const [sendStatus, setSendStatus] = useState<"sent" | "scheduled" | null>();
  const [broadcasts, setBroadcasts] = useState<BroadcastsType[]>([]);
  const [loading, setLoading] = useState(false);

  const convertDateTime = (utcString: string) => {
    const zoned = toZonedTime(new Date(utcString), "Asia/Manila");
    return format(zoned, "MMM d, yyyy h:mm a");
  };

  const getSMSBroadcasts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/sms/broadcasts");
      setBroadcasts(response.data.broadcasts);
    } catch (err: any) {
      console.log(err.response.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSMSBroadcasts();
  }, []);
  return (
    <div className=" overflow-hidden h-screen flex justify-center pt-20 p-5">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <div className="flex flex-col">
          <div>
            <p className="font-bold text-2xl" style={{ color: colors.heading }}>
              SMS History
            </p>
            <p className="italic text-sm" style={{ color: colors.label }}>
              View the SMS Messages you have sent!
            </p>
          </div>
          {loading ? (
            <>
              <div className="flex w-full max-w-sm flex-col gap-7 pt-4">
                <div className="flex flex-row gap-3 justify-between mx-8">
                  <Skeleton className="h-4 w-20 bg-[#59260B]/30" />
                  <Skeleton className="h-4 w-20 bg-[#59260B]/30" />
                </div>
                <div className="flex flex-row gap-3 justify-between mx-8">
                  <Skeleton className="h-4 w-20 bg-[#59260B]/30" />
                  <Skeleton className="h-4 w-20 bg-[#59260B]/30" />
                </div>
                <div className="flex flex-col gap-3 items-end">
                  <Skeleton className="h-4 w-24 bg-[#59260B]/30" />
                </div>
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
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col items-end gap-1">
                <p className="text-sm">Filters</p>
                <div className="flex flex-row items-center gap-2">
                  <Toggle
                    size="sm"
                    variant="outline"
                    className="aria-pressed:bg-yellow-500/50 aria-pressed:text-white border-gray-400"
                    onPressedChange={(pressed) =>
                      setSendStatus(pressed ? "sent" : null)
                    }
                    pressed={sendStatus == "sent"}
                    id="SMS_SentFilter"
                  >
                    <Send />
                  </Toggle>
                  <Toggle
                    size="sm"
                    variant="outline"
                    className="aria-pressed:bg-orange-500/50 aria-pressed:text-white border-gray-400"
                    onPressedChange={(pressed) =>
                      setSendStatus(pressed ? "scheduled" : null)
                    }
                    pressed={sendStatus == "scheduled"}
                    id="SMS_ScheduledFilter"
                  >
                    <Clock />
                  </Toggle>
                </div>
              </div>
              <div className="flex flex-col gap-2 overflow-y-auto max-h-screen">
                {broadcasts.length > 0 ? (
                  broadcasts.map((broadcast) => (
                    <Row
                      postId={String(broadcast.id)}
                      title={`Sent to: ${broadcast.total_recipients} recipient/s`}
                      desc={
                        broadcast.status.name === "Scheduled"
                          ? `Sending on: ${convertDateTime(broadcast.scheduled_for)}`
                          : `Sent on: ${convertDateTime(broadcast.sent_at)}`
                      }
                      link=""
                      buttonId="SMSHistory_CancelSend"
                      btnText="Cancel Send"
                      showBtn={broadcast.status.name === "Scheduled"}
                      showCollapsible
                      collapseContent={broadcast.message_content}
                    />
                  ))
                ) : (
                  <p>You haven't sent any SMS yet!</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SMSHistory;

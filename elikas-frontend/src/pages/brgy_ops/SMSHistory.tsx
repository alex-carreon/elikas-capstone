import colors from "@/constants/colors";
import { useEffect, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon, X, Search } from "lucide-react";
import Row from "@/components/Row";
import api from "@/api";
import { Skeleton } from "@/components/ui/skeleton";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import SelectDropdown from "@/components/SelectDropdown";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

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

type SmsStatus = {
  id: number;
  name: string;
};

function SMSHistory() {
  const [broadcasts, setBroadcasts] = useState<BroadcastsType[]>([]);
  const [status, setStatus] = useState<SmsStatus[]>([]);
  const [statusFilter, setStatusFilter] = useState(0);
  const [loading, setLoading] = useState(false);
  const [openCollapse, setOpenCollapse] = useState(false);
  const [searchFor, setSearchFor] = useState("");

  const params = new URLSearchParams();

  const convertDateTime = (utcString: string) => {
    const zoned = toZonedTime(new Date(utcString), "Asia/Manila");
    return format(zoned, "MMM d, yyyy h:mm a");
  };

  const now = new Date();
  const manilaNow = toZonedTime(now, "Asia/Manila");

  const getSMSBroadcasts = async (
    signal?: AbortSignal,
    parameters?: string,
  ) => {
    try {
      const response = await api.get(
        `/sms/broadcasts${parameters ? `?${parameters}` : ""}`,
        { signal },
      );
      setBroadcasts(response.data.broadcasts);
      console.log(response.data.broadcasts);
    } catch (err: any) {
      console.log(err.response.data);
    }
  };

  const getSmsStatus = async (signal?: AbortSignal) => {
    try {
      const response = await api.get("/sms/statuses", { signal });
      setStatus(response.data.statuses);
    } catch (err: any) {
      if (err.name === "CanceledError") return;
      console.log(err);
    }
  };

  const getAll = async () => {
    const controller = new AbortController();

    try {
      setLoading(true);
      await getSMSBroadcasts(controller.signal);
      await getSmsStatus(controller.signal);
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

  const getFiltered = async () => {
    const controller = new AbortController();

    try {
      setLoading(true);
      if (statusFilter) {
        params.set("status", String(statusFilter));
      }

      if (searchFor) {
        params.set("search", searchFor);
      }

      const parameters = params.toString();
      const response = Promise.all([
        await getSMSBroadcasts(controller.signal, parameters),
      ]);

      if (parameters) {
        toast.promise(response, {
          loading: "Filtering...",
          success: "SMS Filtered!",
          position: "top-center",
        });
      }
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

  const cancelSend = ({ id }: { id: number }) => {
    try {
      const response = api.patch(`/sms/broadcasts/${id}/cancel `);
      console.log(response);
      toast.promise(response, {
        loading: "Canceling this message...",
        success: "Message canceled!",
        error: (err: any) =>
          err.response.message ? err.response.message : err.response.data,
        position: "top-center",
      });

      getFiltered();
    } catch (err: any) {
      toast.error(
        "An error occurred when canceling your message. Please try again in a bit!",
      );
    }
  };

  useEffect(() => {
    getAll();
  }, []);

  useEffect(() => {
    getFiltered();
  }, [statusFilter]);

  return (
    <div className="h-screen flex flex-col justify-center items-center pt-20 p-5 overflow-hidden">
      <div className="w-full max-w-sm flex flex-col min-h-0 flex-1">
        <div>
          <p className="font-bold text-2xl" style={{ color: colors.heading }}>
            SMS History
          </p>
          <p className="italic text-sm" style={{ color: colors.label }}>
            View the SMS Messages you have sent!
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col items-end gap-1 pt-6">
            <div className="w-full flex justify-end items-center gap-2">
              <InputGroup className="w-2/3">
                <InputGroupInput
                  className="text-sm h-8"
                  id="History_SearchField"
                  onChange={(e) => setSearchFor(e.target.value)}
                  value={searchFor}
                ></InputGroupInput>
                <InputGroupAddon align="inline-end">
                  <Search
                    onClick={() => {
                      getFiltered();
                    }}
                  />
                </InputGroupAddon>
              </InputGroup>
              {searchFor ? (
                <button
                  onClick={() => {
                    setSearchFor("");
                    getFiltered();
                  }}
                  id="Hotline_SearchField"
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>
            <Collapsible className="w-full flex flex-col justify-end rounded-md mt-2">
              <CollapsibleTrigger
                onClick={() => setOpenCollapse(!openCollapse)}
                id="History_FiltersTrigger"
              >
                <div className="w-full flex flex-row justify-end mb-2">
                  Filters
                  {openCollapse ? (
                    <ChevronUpIcon className="ml-2 group-data-[state=open]:rotate-180" />
                  ) : (
                    <ChevronDownIcon className="ml-2 group-data-[state=open]:rotate-180" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent
                id="History_FiltersContent"
                className="flex flex-col items-center  px-2.5 pt-0 text-sm"
              >
                <div className="w-full flex flex-row items-center gap-2">
                  <SelectDropdown
                    placeholder="Status"
                    value={String(statusFilter)}
                    onValueChange={(val) => setStatusFilter(Number(val))}
                    id="SMSHistory_StatusFilter"
                    options={[
                      { label: "All", value: "0" },
                      ...(status.map((status) => ({
                        label: status.name,
                        value: String(status.id),
                      })) ?? []),
                    ]}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
        {loading ? (
          <>
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
              <div className="flex flex-col gap-3">
                <Skeleton className="h-24 w-full bg-[#59260B]/30" />
              </div>
              <div className="flex flex-col gap-3">
                <Skeleton className="h-24 w-full bg-[#59260B]/30" />
              </div>
            </div>
          </>
        ) : (
          <>
            <Separator className="mt-6" />
            <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0 pb-10 pt-6">
              {broadcasts.length > 0 ? (
                broadcasts.map((broadcast) => (
                  <Row
                    key={broadcast.id}
                    title={`Sent to: ${broadcast.total_recipients} recipient/s`}
                    desc={
                      broadcast.status.name === "Scheduled"
                        ? `Sending on: ${convertDateTime(broadcast.scheduled_for)}`
                        : broadcast.status.name === "Cancelled"
                          ? "Canceled"
                          : `Sent on: ${convertDateTime(broadcast.sent_at)}`
                    }
                    address={broadcast.status.name}
                    onClick={() => cancelSend({ id: broadcast.id })}
                    buttonId="SMSHistory_CancelSend"
                    btnText="Cancel Send"
                    showBtn={
                      broadcast.status.name === "Scheduled" &&
                      new Date(broadcast.scheduled_for) > manilaNow
                    }
                    showCollapsible
                    collapseContent={broadcast.message_content}
                  />
                ))
              ) : (
                <p className="text-sm pt-4 text-center">
                  You haven't sent any SMS yet!
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SMSHistory;

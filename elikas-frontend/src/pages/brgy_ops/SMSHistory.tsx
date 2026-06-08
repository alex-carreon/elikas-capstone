import colors from "@/constants/colors";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon, Clock, Send } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import Row from "@/components/Row";

function SMSHistory() {
  const [openCollapse, setOpenCollapse] = useState(false);
  const [sendStatus, setSendStatus] = useState<"sent" | "scheduled" | null>();

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
        </div>

        <div>
          <Row
            postId="Sample"
            title="TITLE SAMPLE"
            link=""
            buttonId=""
            btnText="Cancel Send"
            showBtn
          >
            <Collapsible className="w-full flex flex-col rounded-md mt-2">
              <CollapsibleTrigger
                onClick={() => setOpenCollapse(!openCollapse)}
                id="History_FiltersTrigger"
              >
                <div className="w-full flex flex-row mb-2 text-sm">
                  Message
                  {openCollapse ? (
                    <ChevronUpIcon
                      size={20}
                      className="ml-2 group-data-[state=open]:rotate-180"
                    />
                  ) : (
                    <ChevronDownIcon
                      size={20}
                      className="ml-2 group-data-[state=open]:rotate-180"
                    />
                  )}
                </div>{" "}
              </CollapsibleTrigger>
              <CollapsibleContent
                id="History_FiltersContent"
                className="flex flex-col items-center pr-2.5 pt-0 text-xs"
              >
                I am the message. Please evacuate.
              </CollapsibleContent>
            </Collapsible>
          </Row>
        </div>
      </div>
    </div>
  );
}

export default SMSHistory;

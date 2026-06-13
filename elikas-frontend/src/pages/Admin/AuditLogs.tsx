import DashboardHeader from "@/components/Admin/DashboardHeader";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/api";
import Row from "@/components/Row";
import { toZonedTime, format } from "date-fns-tz";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  Search,
  X,
  ArrowUpWideNarrow,
} from "lucide-react";
import SelectDropdown from "@/components/SelectDropdown";
import { Toggle } from "@/components/ui/toggle";

type log = {
  id: number;
  logId: string;
  userType: string;
  userName: string;
  activity: string;
  table: string;
  actionDate: string;
};

type Table = {
  id: number;
  table_name: string;
};

function AuditLogs() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<log[]>([]);
  const [searchFor, setSearchFor] = useState<string | null>();
  const [openCollapse, setOpenCollapse] = useState(false);
  const [isBrgy, setIsBrgy] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isIndiv, setIsIndiv] = useState(false);
  const [targetTables, setTargetTables] = useState<Table[]>([]);
  const [tableFilter, setTableFilter] = useState(0);
  const [isAsc, setIsAsc] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const convertDateTime = (utcString: string) => {
    const zoned = toZonedTime(new Date(utcString), "Asia/Manila");
    return format(zoned, "MMM d, yyyy h:mm a");
  };

  const params = new URLSearchParams();

  const getTables = async (signal?: AbortSignal) => {
    try {
      const response = await api.get("/admin/target-tables", { signal });
      setTargetTables(response.data);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        return;
      }
      console.log(err.response?.data);
    }
  };

  const getLogs = async (signal?: AbortSignal, search = searchFor) => {
    try {
      if (search) {
        params.set("search", search);
      }

      if (isAdmin) {
        params.append("user_type[]", "admin");
      }

      if (isBrgy) {
        params.append("user_type[]", "brgy_op");
      }

      if (isIndiv) {
        params.append("user_type[]", "indiv");
      }

      if (tableFilter && tableFilter !== 0) {
        params.set("target_table_id[]", String(tableFilter));
      }

      if (isAsc) {
        params.set("sort_order", "asc");
      }

      if (isCreated) {
        params.append("event[]", "created");
      }

      if (isUpdated) {
        params.append("event[]", "updated");
      }

      if (isDeleted) {
        params.append("event[]", "deleted");
      }

      const parameters = params.toString();

      const response = await api.get(
        `/admin/audit-logs${parameters ? `?${parameters}` : ""}`,
        { signal },
      );

      setLogs(response.data.data);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        return;
      }
      console.log(err.response?.data);
    }
  };

  const getAll = async () => {
    const controller = new AbortController();

    try {
      setLoading(true);
      await getLogs(controller.signal);
      await getTables(controller.signal);
    } catch (err: any) {
      if (err.name === "CanceledError") return;
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const getFiltered = async () => {
    const controller = new AbortController();

    try {
      setLoading(true);
      await getLogs(controller.signal);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        setLoading(false);
        return;
      }
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAll();
  }, []);

  useEffect(() => {
    getFiltered();
  }, [
    isAdmin,
    isIndiv,
    isBrgy,
    tableFilter,
    isAsc,
    isCreated,
    isUpdated,
    isDeleted,
  ]);

  return (
    <>
      <div className="w-full flex flex-col items-center">
        <div className="w-full max-w-md">
          <DashboardHeader title="Audit Logs" />
          <div className="bg-white -mt-8 rounded-4xl p-4 flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <Collapsible className="w-full flex flex-col gap-2">
                <div className="w-full flex justify-between">
                  <InputGroup className="w-2/3">
                    <InputGroupInput
                      className="text-sm h-8"
                      id="Admin_LogSearchField"
                      onChange={(e) => setSearchFor(e.target.value)}
                      value={searchFor ? searchFor : ""}
                    ></InputGroupInput>
                    <InputGroupAddon align="inline-end">
                      <Search
                        onClick={() => {
                          getFiltered();
                        }}
                      />
                    </InputGroupAddon>
                  </InputGroup>
                  <CollapsibleTrigger
                    onClick={() => setOpenCollapse(!openCollapse)}
                    id="Admin_LogFilterTrigger"
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
                </div>
                <CollapsibleContent
                  id="Admin_LogTriggerContent"
                  className="flex flex-col items-center px-2.5 text-sm"
                >
                  <div className="w-full gap-2 bg-gray-300/50 p-4 rounded-lg flex flex-col items-end">
                    <SelectDropdown
                      value={String(tableFilter)}
                      onValueChange={(val) => setTableFilter(Number(val))}
                      placeholder="Table"
                      id="Admin_BrgyCityFilter"
                      options={[
                        { label: "All", value: "0" },
                        ...(targetTables?.map((table) => ({
                          label: table.table_name,
                          value: String(table.id),
                        })) ?? []),
                      ]}
                    />
                    {tableFilter ? (
                      <button
                        onClick={() => setTableFilter(0)}
                        id="History_ClearBrgyFilter"
                      >
                        <X size={14} />
                      </button>
                    ) : null}
                    <div className="flex flex-row gap-2">
                      <Toggle
                        size="sm"
                        variant="outline"
                        className="aria-pressed:bg-gray-500/50 aria-pressed:text-white border-gray-400"
                        onPressedChange={setIsCreated}
                        pressed={isCreated}
                        id="Admin_LogCreatedFilter"
                      >
                        <p className="m-2 group-aria-pressed/toggle:text-black">
                          Created
                        </p>
                      </Toggle>
                      <Toggle
                        size="sm"
                        variant="outline"
                        className="aria-pressed:bg-gray-500/50 aria-pressed:text-white border-gray-400"
                        onPressedChange={setIsUpdated}
                        pressed={isUpdated}
                        id="Admin_LogUpdatedFilter"
                      >
                        <p className="m-2 group-aria-pressed/toggle:text-black">
                          Updated
                        </p>
                      </Toggle>
                      <Toggle
                        size="sm"
                        variant="outline"
                        className="aria-pressed:bg-gray-500/50 aria-pressed:text-white border-gray-400"
                        onPressedChange={setIsDeleted}
                        pressed={isDeleted}
                        id="Admin_LogDeletedFilter"
                      >
                        <p className="m-2 group-aria-pressed/toggle:text-black">
                          Deleted
                        </p>
                      </Toggle>
                    </div>
                    <div className="flex flex-row gap-2">
                      <Toggle
                        size="sm"
                        variant="outline"
                        className="aria-pressed:bg-gray-500/50 aria-pressed:text-white border-gray-400"
                        onPressedChange={setIsAsc}
                        pressed={isAsc}
                        id="Admin_LogAscFilter"
                      >
                        <p className="m-2 group-aria-pressed/toggle:text-black">
                          <ArrowUpWideNarrow />
                        </p>
                      </Toggle>
                      <Toggle
                        size="sm"
                        variant="outline"
                        className="aria-pressed:bg-gray-500/50 aria-pressed:text-white border-gray-400"
                        onPressedChange={setIsIndiv}
                        pressed={isIndiv}
                        id="Admin_LogIndivFilter"
                      >
                        <p className="m-2 group-aria-pressed/toggle:text-black">
                          Indiv
                        </p>
                      </Toggle>
                      <Toggle
                        size="sm"
                        variant="outline"
                        className="aria-pressed:bg-gray-500/50 aria-pressed:text-white border-gray-400"
                        onPressedChange={setIsBrgy}
                        pressed={isBrgy}
                        id="Admin_LogBrgyFilter"
                      >
                        <p className="m-2 group-aria-pressed/toggle:text-black">
                          Brgy_op
                        </p>
                      </Toggle>
                      <Toggle
                        size="sm"
                        variant="outline"
                        className="aria-pressed:bg-gray-500/50 aria-pressed:text-white border-gray-400"
                        onPressedChange={setIsAdmin}
                        pressed={isAdmin}
                        id="Admin_LogAdminFilter"
                      >
                        <p className="m-2 group-aria-pressed/toggle:text-black">
                          Admin
                        </p>
                      </Toggle>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
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
                logs.map((log, index) => (
                  <Row
                    key={index}
                    postId={String(log.logId)}
                    title={`${log.activity} at ${log.table} table`}
                    desc={log.userType}
                    address={log.userName}
                    datePosted={convertDateTime(log.actionDate)}
                    showBtn
                    buttonId="Admin_LogsShowDetails"
                    link={`/admin-logs/${log.id}`}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AuditLogs;

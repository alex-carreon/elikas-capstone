import api from "@/api";
import CountRow from "@/components/Admin/CountRow";
import DashboardHeader from "@/components/Admin/DashboardHeader";
import { useState, useEffect, Fragment } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  Search,
  AlarmClockOff,
  MapPinMinusInside,
  X,
} from "lucide-react";
import Row from "@/components/Row";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Toggle } from "@/components/ui/toggle";
import SelectDropdown from "@/components/SelectDropdown";

type Barangays = {
  id: number;
  name: string;
  role: string;
  location: string;
};

type FlaggedPaths = {
  flag_id: number;
  flood_path_id: number;
  element_id: number;
  reason: string;
  flag_count: number;
  flagged_at: string;
};

function Pins() {
  const [isEvac, setIsEvac] = useState(true);
  const [activeEvac, setActiveEvac] = useState(true);
  const [activeHaz, setActiveHaz] = useState(true);
  const [flaggedHaz, setFlaggedHaz] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openCollapse, setOpenCollapse] = useState(false);
  const [status, setStatus] = useState<"Deactivated" | "Expiry" | null>();
  const [barangays, setBarangays] = useState<Barangays[]>([]);
  const [brgyFilter, setBrgyFilter] = useState(0);
  const [flaggedPaths, setFlaggedPaths] = useState<FlaggedPaths[]>([]);
  const [flaggedPathsCount, setFlaggedPathsCount] = useState(0);

  const getHazardFlagged = async () => {
    try {
      setLoading(true);
      const response = await api.get("admin/flood-paths/flags");

      setFlaggedPaths(response.data.flags);
      setFlaggedPathsCount(response.data.count);
    } catch (err: any) {
      console.log(err.response.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getBrgy = async () => {
      try {
        setLoading(true);
        const brgyRes = await api.get(`/locations/barangays?city_id=2`);

        const barangays = brgyRes.data.Barangays;
        setBarangays(barangays);
      } catch (err: any) {
        console.log(err.message);
      } finally {
        setLoading(false);
      }
    };

    getBrgy();
    getHazardFlagged();
  }, []);

  return (
    <>
      <div className="w-full flex flex-col items-center">
        <div className="w-full max-w-md">
          <DashboardHeader title="Map Pins">
            <CountRow
              title="Evacuation Pins"
              lastUpdated="Last updated 3 minutes ago"
              count={3}
              // loading={loading}
            />
            <CountRow
              title="Hazard Pins"
              lastUpdated="Last updated 3 minutes ago"
              count={3}
              // loading={loading}
            />
            {isEvac ? (
              <CountRow
                title="Flagged Comments"
                lastUpdated="Last updated 3 minutes ago"
                count={3}
                // loading={loading}
              />
            ) : (
              <CountRow
                title="Flagged Hazard Paths"
                lastUpdated="Last updated 3 minutes ago"
                count={flaggedPathsCount}
                loading={loading}
              />
            )}
          </DashboardHeader>
          <div className="bg-white -mt-8 rounded-4xl p-4 flex flex-col gap-2">
            <Tabs
              defaultValue="overview"
              className="w-full max-w-md flex items-center"
            >
              <TabsList className="w-full flex justify-between">
                <TabsTrigger
                  value="Evacuation"
                  onClick={() => {
                    setIsEvac(true);
                  }}
                  id="History_EvacTrigger"
                >
                  Evacuation Pins
                </TabsTrigger>
                <TabsTrigger
                  value="Hazard"
                  onClick={() => {
                    setIsEvac(false);
                  }}
                  id="History_HazardTrigger"
                >
                  Hazard Pins
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs
              defaultValue="overview"
              className="w-full max-w-md flex items-center"
            >
              {isEvac ? (
                <TabsList
                  variant="line"
                  className="w-full flex justify-between"
                  id="History_EvacTabs"
                >
                  <TabsTrigger
                    value="ActiveEvac"
                    id="History_ActiveEvacTrigger"
                    onClick={() => setActiveEvac(true)}
                  >
                    Active Pins
                  </TabsTrigger>
                  <TabsTrigger
                    value="ExpiredEvac"
                    id="History_ExpiredEvacTrigger"
                    onClick={() => setActiveEvac(false)}
                  >
                    Inactive Pins
                  </TabsTrigger>
                  <TabsTrigger
                    value="ExpiredEvac"
                    id="History_ExpiredEvacTrigger"
                    // onClick={() => setActiveEvac(false)}
                  >
                    Flagged
                  </TabsTrigger>
                </TabsList>
              ) : (
                <TabsList
                  variant="line"
                  className="w-full flex justify-between"
                  id="History_HazardTabs"
                >
                  <TabsTrigger
                    value="ActiveHaz"
                    id="History_ActiveHazardTrigger"
                    onClick={() => {
                      setActiveHaz(true);
                      setFlaggedHaz(false);
                    }}
                  >
                    Active Pins
                  </TabsTrigger>
                  <TabsTrigger
                    value="ExpiredHaz"
                    id="History_ExpiredHazardTrigger"
                    onClick={() => {
                      setActiveHaz(false);
                      setFlaggedHaz(false);
                    }}
                  >
                    Inactive Pins
                  </TabsTrigger>
                  <TabsTrigger
                    value="FlaggedHaz"
                    id="History_FlaggedHazardTrigger"
                    onClick={() => {
                      setActiveHaz(false);
                      setFlaggedHaz(true);
                    }}
                  >
                    Flagged
                  </TabsTrigger>
                </TabsList>
              )}
            </Tabs>
            <Collapsible className="w-full flex-col items-center gap-2">
              <div className="w-full flex justify-between">
                <InputGroup className="w-2/3">
                  <InputGroupInput
                    className="text-sm h-8"
                    id="Admin_IndivSearchField"
                  ></InputGroupInput>
                  <InputGroupAddon align="inline-end">
                    <Search />
                  </InputGroupAddon>
                </InputGroup>
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
              </div>
              <CollapsibleContent
                id="History_FiltersContent"
                className="bg-gray-300/50 p-2 rounded-lg flex flex-row items-center justify-end gap-2 px-2.5 mt-2 text-sm"
              >
                {(!activeEvac || !activeHaz) && (
                  <>
                    <Toggle
                      size="sm"
                      variant="outline"
                      className="aria-pressed:bg-gray-500/50 aria-pressed:text-white border-gray-400"
                      onPressedChange={(pressed) =>
                        setStatus(pressed ? "Expiry" : null)
                      }
                      pressed={status == "Expiry"}
                      id="History_InactiveFilter"
                    >
                      <AlarmClockOff className="group-aria-pressed/toggle:stroke-white" />
                    </Toggle>
                    <Toggle
                      size="sm"
                      variant="outline"
                      className="aria-pressed:bg-gray-500/50 aria-pressed:text-white border-gray-400"
                      onPressedChange={(pressed) =>
                        setStatus(pressed ? "Deactivated" : null)
                      }
                      pressed={status == "Deactivated"}
                      id="History_InactiveFilter"
                    >
                      <MapPinMinusInside className="group-aria-pressed/toggle:stroke-white" />
                    </Toggle>
                  </>
                )}
                <SelectDropdown
                  value={String(brgyFilter)}
                  onValueChange={(val) => setBrgyFilter(Number(val))}
                  placeholder="Barangay"
                  id="Admin_PinsBrgyFilter"
                  options={[
                    { label: "All", value: "0" },
                    ...barangays?.map((barangay) => ({
                      label: barangay.name,
                      value: String(barangay.id),
                    })),
                  ]}
                />
                {brgyFilter ? (
                  <button
                    onClick={() => setBrgyFilter(0)}
                    id="History_ClearBrgyFilter"
                  >
                    <X size={14} />
                  </button>
                ) : null}
              </CollapsibleContent>
            </Collapsible>

            <div className="flex flex-col gap-2">
              {loading && (
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
              )}
              {isEvac && activeEvac ? <></> : flaggedHaz ? <></> : <></>}
              {!isEvac && activeHaz ? (
                <></>
              ) : flaggedHaz ? (
                flaggedPaths.map((paths) => (
                  <Fragment key={paths.flag_id}>
                    <Row
                      postId={String(paths.flag_id)}
                      title={paths.reason}
                      desc={`On Comment ID: ${paths.flood_path_id}`}
                      link={`/admin-flagged/${paths.flood_path_id}`}
                      buttonId="Admin_ActiveIndivDetailsBtn"
                      showBtn
                    />
                  </Fragment>
                ))
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Pins;

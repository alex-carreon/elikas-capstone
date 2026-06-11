import api from "@/api";
import CountRow from "@/components/Admin/CountRow";
import DashboardHeader from "@/components/Admin/DashboardHeader";
import { useState, useEffect, Fragment } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronDownIcon,
  ChevronUpIcon,
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

type FlaggedPaths = {
  flag_id: number;
  flood_path_id: number;
  element_id: number;
  reason: string;
  flag_count: number;
  flagged_at: string;
};

type Hazards = {
  id: number;
  description: string;
  level: string;
  posted_at: string;
  is_expired: boolean;
  is_deactivated: boolean;
};

type FloodLevels = {
  id: number;
  level_name: string;
  description: string;
};

function Pins() {
  const [isEvac, setIsEvac] = useState(true);
  const [activeEvac, setActiveEvac] = useState(true);
  const [activeHaz, setActiveHaz] = useState(true);
  const [flaggedHaz, setFlaggedHaz] = useState(false);
  const [flaggedCom, setFlaggedCom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hazardCountLoad, setHazardCountLoad] = useState(false);
  const [openCollapse, setOpenCollapse] = useState(false);
  const [status, setStatus] = useState<"Deactivated" | "Expiry" | null>();
  // const [barangays, setBarangays] = useState<Barangays[]>([]);
  // const [brgyFilter, setBrgyFilter] = useState(0);
  const [flaggedPaths, setFlaggedPaths] = useState<FlaggedPaths[]>([]);
  const [flaggedPathsCount, setFlaggedPathsCount] = useState(0);
  const [activeHazards, setActiveHazards] = useState<Hazards[]>([]);
  const [activeHazCount, setActiveHazCount] = useState(0);
  const [inactiveHazCount, setInactiveHazCount] = useState(0);
  const [floodLevels, setFloodLevels] = useState<FloodLevels[]>([]);
  const [levelFilter, setLevelFilter] = useState(0);

  const params = new URLSearchParams();

  const colorHazard = {
    lightBlue: "#52B2DA",
    darkBlue: "#578EC2",
    red: "#B22B42",
    fallback: "#C7C7C7",
  };

  const getHazardCounts = async (signal?: AbortSignal) => {
    try {
      setHazardCountLoad(true);
      const [flaggedHazRes, hazRes] = await Promise.all([
        api.get("admin/flood-paths/flags", { signal }),
        api.get("/admin/flood-paths", { signal }),
      ]);

      const inactiveCount = hazRes.data.flood_paths.filter(
        (path: Hazards) => path.is_deactivated || path.is_expired,
      ).length;

      const activeCount = hazRes.data.flood_paths.filter(
        (path: Hazards) => !path.is_deactivated && !path.is_expired,
      ).length;

      setFlaggedPathsCount(flaggedHazRes.data.count);
      setActiveHazCount(activeCount);
      setInactiveHazCount(inactiveCount);
      setHazardCountLoad(false);
    } catch (err: any) {
      if (err.name === "CanceledError") return;
      console.log(err);
      setHazardCountLoad(false);
    }
  };

  const getHazardFlagged = async (signal?: AbortSignal) => {
    try {
      const response = await api.get("admin/flood-paths/flags", { signal });
      setFlaggedPaths(response.data.flags);
      setFlaggedPathsCount(response.data.count);
    } catch (err: any) {
      if (err.name === "CanceledError") return;
      console.log(err);
    }
  };

  const getHazards = async (signal?: AbortSignal) => {
    try {
      if (levelFilter || levelFilter !== 0) {
        params.set("flood_level_id", String(levelFilter));
      }

      const parameters = params.toString();

      const response = await api.get(
        `/admin/flood-paths${parameters ? `?${parameters}` : ""}`,
        { signal },
      );
      const floodPaths = response.data.flood_paths;

      setActiveHazards(floodPaths);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        return;
      }
      console.log(err.response?.data);
    }
  };

  const getLevels = async (signal?: AbortSignal) => {
    try {
      const response = await api.get("/flood-levels", { signal });
      setFloodLevels(response.data.flood_levels);
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
      await Promise.all([
        getLevels(controller.signal),
        getHazardFlagged(controller.signal),
        getHazards(controller.signal),
        getHazardCounts(controller.signal),
      ]);
    } catch (err: any) {
      if (err.name === "CanceledError") return;
      console.log(err);
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  };

  useEffect(() => {
    getAll();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getHazards(controller.signal);
    return () => controller.abort();
  }, [levelFilter]);

  return (
    <>
      <div className="w-full flex flex-col items-center">
        <div className="w-full max-w-md">
          <DashboardHeader title="Map Pins">
            {isEvac ? (
              <>
                <CountRow
                  title="Hazard Pins"
                  lastUpdated="Last updated 3 minutes ago"
                  count={3}
                  // loading={loading}
                />
                <CountRow
                  title="Flagged Comments"
                  lastUpdated="Last updated 3 minutes ago"
                  count={3}
                  // loading={loading}
                />
              </>
            ) : (
              <>
                <CountRow
                  title="Active Hazard Paths"
                  lastUpdated="Last updated 3 minutes ago"
                  count={activeHazCount}
                  loading={loading}
                />
                <CountRow
                  title="Inactive Hazard Paths"
                  lastUpdated="Last updated 3 minutes ago"
                  count={inactiveHazCount}
                  loading={hazardCountLoad}
                />
                <CountRow
                  title="Flagged Hazard Paths"
                  lastUpdated="Last updated 3 minutes ago"
                  count={flaggedPathsCount}
                  loading={hazardCountLoad}
                />
              </>
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
            {!flaggedHaz && (
              <Collapsible className="w-full flex-col items-center gap-2 mt-2">
                <div className="w-full flex justify-between">
                  {/* <InputGroup className="w-2/3">
                  <InputGroupInput
                    className="text-sm h-8"
                    id="Admin_IndivSearchField"
                  ></InputGroupInput>
                  <InputGroupAddon align="inline-end">
                    <Search />
                  </InputGroupAddon>
                </InputGroup> */}
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
                  {flaggedCom && (
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
                  {!isEvac && (
                    <SelectDropdown
                      value={String(levelFilter)}
                      onValueChange={(val) => setLevelFilter(Number(val))}
                      placeholder="Flood Level"
                      id="Admin_HazardLevelFilter"
                      options={[
                        { label: "All", value: "0" },
                        ...floodLevels?.map((level) => ({
                          label: level.level_name,
                          value: String(level.id),
                        })),
                      ]}
                    />
                  )}
                  {levelFilter ? (
                    <button
                      onClick={() => setLevelFilter(0)}
                      id="History_ClearBrgyFilter"
                    >
                      <X size={14} />
                    </button>
                  ) : null}
                </CollapsibleContent>
              </Collapsible>
            )}

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
              {!loading && isEvac && activeEvac ? (
                <></>
              ) : flaggedHaz ? (
                <></>
              ) : (
                <></>
              )}
              {!loading && !isEvac && activeHaz
                ? activeHazards.map((path) => {
                    if (!path.is_expired && !path.is_deactivated) {
                      return (
                        <Row
                          postId={String(path.id)}
                          title="Flood"
                          desc={path.level}
                          address={path.description}
                          datePosted={path.posted_at}
                          link={`/admin-hazardDetails/${path.id}`}
                          isExpired={path.is_expired}
                          buttonId="History_ExpHazardDetailsBtn"
                          showBtn
                        >
                          <div
                            className={`mt-2 px-2 py-1 rounded-3xl w-fit text-sm`}
                            style={{
                              backgroundColor:
                                path.level === "Gutter" ||
                                path.level === "Half Knee"
                                  ? colorHazard.lightBlue
                                  : path.level === "Half Tire" ||
                                      path.level === "Knee"
                                    ? colorHazard.darkBlue
                                    : path.level === "Tire" ||
                                        path.level === "Waist" ||
                                        path.level === "chest"
                                      ? colorHazard.red
                                      : colorHazard.fallback,
                            }}
                          >
                            {path.level}
                          </div>
                        </Row>
                      );
                    }
                  })
                : flaggedHaz
                  ? flaggedPaths.map((paths) => (
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
                  : activeHazards.map((path) => {
                      if (path.is_expired || path.is_deactivated) {
                        return (
                          <Row
                            postId={String(path.id)}
                            title="Flood"
                            desc={path.level}
                            address={path.description}
                            datePosted={path.posted_at}
                            link={`/admin-hazardDetails/${path.id}`}
                            isExpired={path.is_expired}
                            buttonId="History_ExpHazardDetailsBtn"
                            showBtn
                          />
                        );
                      }
                    })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Pins;

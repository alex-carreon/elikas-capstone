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
  const [loading, setLoading] = useState(false);
  const [openCollapse, setOpenCollapse] = useState(false);
  const [status, setStatus] = useState<"Deactivated" | "Expiry" | null>();
  const [barangays, setBarangays] = useState<Barangays[]>([]);
  const [brgyFilter, setBrgyFilter] = useState(0);
  const [flaggedPaths, setFlaggedPaths] = useState<FlaggedPaths[]>([]);
  const [flaggedPathsCount, setFlaggedPathsCount] = useState(0);
  const [activeHazards, setActiveHazards] = useState<Hazards[]>([]);
  const [activeHazCount, setActiveHazCount] = useState(0);
  const [floodLevels, setFloodLevels] = useState<FloodLevels[]>([]);
  const [levelFilter, setLevelFilter] = useState(0);

  const colorHazard = {
    lightBlue: "#52B2DA",
    darkBlue: "#578EC2",
    red: "#B22B42",
    fallback: "#C7C7C7",
  };

  const getHazardCounts = async () => {
    try {
      setLoading(true);
      const [flaggedHazRes, hazRes] = await Promise.all([
        api.get("admin/flood-paths/flags"),
        api.get("/admin/flood-paths?is_expired=false&is_deactivated=false"),
      ]);
      setFlaggedPathsCount(flaggedHazRes.data.count);
      setActiveHazCount(hazRes.data.count);
    } catch (err: any) {
      console.log(err.response.data);
    } finally {
      setLoading(false);
    }
  };

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

  const getHazards = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/flood-paths");
      const floodPaths = response.data.flood_paths;

      setActiveHazards(floodPaths);
    } catch (err: any) {
      console.log(err.response.data);
    }
  };

  useEffect(() => {
    // const getBrgy = async () => {
    //   try {
    //     setLoading(true);
    //     const brgyRes = await api.get(`/locations/barangays?city_id=2`);

    //     const barangays = brgyRes.data.Barangays;
    //     setBarangays(barangays);
    //   } catch (err: any) {
    //     console.log(err.message);
    //   } finally {
    //     setLoading(false);
    //   }
    // };

    const getLevels = async () => {
      try {
        setLoading(true);

        const response = await api.get("/flood-levels");
        setFloodLevels(response.data.flood_levels);
      } catch (err: any) {
        console.log(err.response.data);
      }
    };

    // getBrgy();
    getLevels();
    getHazardFlagged();
    getHazards();
    getHazardCounts();
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
                  title="Flagged Hazard Paths"
                  lastUpdated="Last updated 3 minutes ago"
                  count={flaggedPathsCount}
                  loading={loading}
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
                {flaggedHaz && (
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
              {!isEvac && activeHaz
                ? activeHazards.map((path) => {
                    if (!path.is_expired && !path.is_deactivated) {
                      return (
                        <Row
                          postId={String(path.id)}
                          title="Flood"
                          desc={path.level}
                          address={path.description}
                          datePosted={path.posted_at}
                          link="/HazardForm"
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
                            link="/HazardForm"
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

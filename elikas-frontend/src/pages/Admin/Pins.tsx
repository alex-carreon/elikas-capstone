import api from "@/api";
import CountRow from "@/components/Admin/CountRow";
import DashboardHeader from "@/components/Admin/DashboardHeader";
import { useState, useEffect } from "react";
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

function Pins() {
  const [isEvac, setIsEvac] = useState(true);
  const [isSensors, setIsSensors] = useState(false);
  const [activeEvac, setActiveEvac] = useState(true);
  const [activeHaz, setActiveHaz] = useState(true);
  const [loading, setLoading] = useState(false);
  const [openCollapse, setOpenCollapse] = useState(false);
  const [status, setStatus] = useState<"Deactivated" | "Expiry" | null>();
  const [barangays, setBarangays] = useState<Barangays[]>([]);
  const [brgyFilter, setBrgyFilter] = useState(0);

  useEffect(() => {
    const getBrgy = async () => {
      try {
        setLoading(true);
        const brgyRes = await api.get(`/locations/barangays?city_id=2`);

        const barangays = brgyRes.data.Barangays;
        console.log(barangays);
        setBarangays(barangays);
      } catch (err: any) {
        console.log(err.message);
      } finally {
        setLoading(false);
      }
    };

    getBrgy();
  }, []);

  return (
    <>
      <div className="w-full flex flex-col items-center">
        <div className="w-full max-w-md">
          <DashboardHeader title="Map Pins">
            <CountRow
              title="Active Users"
              lastUpdated="Last updated 3 minutes ago"
              count={3}
              // loading={loading}
            />
            <CountRow
              title="Deactivated Users"
              lastUpdated="Last updated 3 minutes ago"
              count={3}
              // loading={loading}
            />
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
                    setIsSensors(false);
                  }}
                  id="History_EvacTrigger"
                >
                  Evacuation Pins
                </TabsTrigger>
                <TabsTrigger
                  value="Hazard"
                  onClick={() => {
                    setIsEvac(false);
                    setIsSensors(false);
                  }}
                  id="History_HazardTrigger"
                >
                  Hazard Pins
                </TabsTrigger>
                <TabsTrigger
                  value="Sensors"
                  onClick={() => {
                    setIsEvac(false);
                    setIsSensors(true);
                  }}
                  id="History_HazardTrigger"
                >
                  Sensors
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs
              defaultValue="overview"
              className="w-full max-w-md flex items-center"
            >
              {isEvac && !isSensors ? (
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
              ) : !isEvac && !isSensors ? (
                <TabsList
                  variant="line"
                  className="w-full flex justify-between"
                  id="History_HazardTabs"
                >
                  <TabsTrigger
                    value="ActiveHaz"
                    id="History_ActiveHazardTrigger"
                    onClick={() => setActiveHaz(true)}
                  >
                    Active Pins
                  </TabsTrigger>
                  <TabsTrigger
                    value="ExpiredHaz"
                    id="History_ExpiredHazardTrigger"
                    onClick={() => setActiveHaz(false)}
                  >
                    Inactive Pins
                  </TabsTrigger>
                  <TabsTrigger
                    value="ExpiredHaz"
                    id="History_ExpiredHazardTrigger"
                    // onClick={() => setActiveHaz(false)}
                  >
                    Flagged
                  </TabsTrigger>
                </TabsList>
              ) : null}
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
              ) : isEvac ? (
                activeEvac ? (
                  // evacPins.map((pins) => {
                  //   if (!pins.is_expired && !pins.deactivated_at) {
                  //     return (
                  //       <Row
                  //         postId={String(pins.id)}
                  //         title={pins.name}
                  //         address={pins.address}
                  //         datePosted={pins.posted_at}
                  //         link={`/EvacForm/${pins.id}`}
                  //         isExpired={pins.is_expired}
                  //         buttonId="History_ActiveEvacDetailsBtn"
                  //         showBtn
                  //       />
                  //     );
                  //   }
                  // })
                  <Row
                    postId="Placeholder"
                    title="Placeholder"
                    address="Placeholder"
                    datePosted="Placeholder"
                    link="Placeholder"
                    // isExpired="Placeholder"
                    buttonId="Placeholder"
                    showBtn
                  />
                ) : (
                  // evacPins.map((pins) => {
                  //   if (pins.is_expired) {
                  //     return (
                  //       <Row
                  //         postId={String(pins.id)}
                  //         title={pins.name}
                  //         address={pins.address}
                  //         datePosted={pins.posted_at}
                  //         link={`/EvacForm/${pins.id}`}
                  //         isExpired={pins.is_expired}
                  //         buttonId="History_ExpiredEvacDetailsBtn"
                  //         showBtn
                  //       />
                  //     );
                  //   }
                  // })
                  <Row
                    postId="placeholder"
                    title="placeholder"
                    address="placeholder"
                    datePosted="placeholder"
                    link="placeholder"
                    // isExpired={pins.is_expired}
                    buttonId="placeholder"
                    showBtn
                  />
                )
              ) : isSensors ? (
                // sensors.map((pins) => {
                //   return (
                //     <Row
                //       postId={String(pins.sensorCode)}
                //       title={pins.name}
                //       desc={`Status: ${pins.currentStatus}`}
                //       address={`${pins.address}`}
                //       datePosted={pins.lastOnline}
                //       link={`/SensorForm/${pins.id}`}
                //       // isExpired={pins.deactivatedAt}
                //       buttonId="History_ExpiredEvacDetailsBtn"
                //       showBtn
                //     >
                //       <div className="flex flex-row gap-2">
                //         <div
                //           className={`mt-2 px-2 py-1 rounded-3xl ${pins.deactivatedAt ? "bg-gray-500/30" : "bg-green-700/60"} w-fit text-sm`}
                //         >
                //           {pins.deactivatedAt ? "Inactive" : "Active"}
                //         </div>
                //         {!pins.deactivatedAt && (
                //           <div
                //             className={`mt-2 px-2 py-1 rounded-3xl ${pins.currentStatus == "normal" ? "bg-green-700/60" : pins.currentStatus == "yellow" ? "bg-yellow-700/60" : pins.currentStatus == "orange" ? "bg-amber-700/60" : pins.currentStatus == "red" ? "bg-red-700/60" : "bg-gray-500/30"} w-fit text-sm`}
                //           >
                //             {pins.currentStatus
                //               ? pins.currentStatus
                //               : "No Level Detected"}
                //           </div>
                //         )}
                //       </div>
                //     </Row>
                //   );
                // })
                <Row
                  postId="Placeholder"
                  title="Placeholder"
                  desc="Placeholder"
                  address="Placeholder"
                  datePosted="Placeholder"
                  link="Placeholder"
                  // isExpired={pins.deactivatedAt}
                  buttonId="Placeholder"
                  showBtn
                >
                  {/* <div className="flex flex-row gap-2">
                    <div
                      className={`mt-2 px-2 py-1 rounded-3xl ${pins.deactivatedAt ? "bg-gray-500/30" : "bg-green-700/60"} w-fit text-sm`}
                    >
                      {pins.deactivatedAt ? "Inactive" : "Active"}
                    </div>
                    {!pins.deactivatedAt && (
                      <div
                        className={`mt-2 px-2 py-1 rounded-3xl ${pins.currentStatus == "normal" ? "bg-green-700/60" : pins.currentStatus == "yellow" ? "bg-yellow-700/60" : pins.currentStatus == "orange" ? "bg-amber-700/60" : pins.currentStatus == "red" ? "bg-red-700/60" : "bg-gray-500/30"} w-fit text-sm`}
                      >
                        {pins.currentStatus
                          ? pins.currentStatus
                          : "No Level Detected"}
                      </div>
                    )}
                  </div> */}
                </Row>
              ) : activeHaz ? (
                //
                <Row
                  postId="Placeholder"
                  title="Flood"
                  desc="Placeholder"
                  address="Placeholder"
                  datePosted="Placeholder"
                  link="Placeholder"
                  // isExpired="Placeholder"
                  buttonId="Placeholder"
                >
                  {/* <div
                    className={`mt-2 px-2 py-1 rounded-3xl w-fit text-sm`}
                    style={{
                      backgroundColor:
                        path.level === "Gutter" || path.level === "Half Knee"
                          ? colorHazard.lightBlue
                          : path.level === "Half Tire" || path.level === "Knee"
                            ? colorHazard.darkBlue
                            : path.level === "Tire" ||
                                path.level === "Waist" ||
                                path.level === "chest"
                              ? colorHazard.red
                              : colorHazard.fallback,
                    }}
                  >
                    {path.level}
                  </div> */}
                </Row>
              ) : (
                // floodPaths.map((path) => {
                //   if (path.is_expired)
                //     return (
                //       <Row
                //         postId={String(path.id)}
                //         title="Flood"
                //         desc={path.level}
                //         address={path.description}
                //         datePosted={path.last_confirmed}
                //         link="/HazardForm"
                //         isExpired={path.is_expired}
                //         buttonId="History_ExpHazardDetailsBtn"
                //       />
                //     );
                // })
                <Row
                  postId="Placeholder"
                  title="Flood"
                  desc="Placeholder"
                  address="Placeholder"
                  datePosted="Placeholder"
                  link="/HazardForm"
                  // isExpired="Placeholder"
                  buttonId="Placeholder"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Pins;

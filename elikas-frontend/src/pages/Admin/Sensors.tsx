import DashboardHeader from "@/components/Admin/DashboardHeader";
import CountRow from "@/components/Admin/CountRow";
import api from "@/api";
import { useState, useEffect, Fragment } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { ChevronDownIcon, ChevronUpIcon, Search, X } from "lucide-react";
import Row from "@/components/Row";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import SelectDropdown from "@/components/SelectDropdown";

type Barangays = {
  id: number;
  name: string;
  role: string;
  location: string;
};

type SensorsDetails = {
  id: number;
  sensorCode: string;
  name: string;
  waterLevel: any | null;
  lastOnline: any | null;
  mountHeight: number;
  location: [number, number];
  address: string;
  yellowLevel: number;
  redLevel: number;
  currentStatus: string;
  mountLocation: string;
  deactivatedAt: any | null;
  registeredBy: string;
};

function Sensors() {
  const [isSensors, setIsSensors] = useState(true);
  const [isSensorLogs, setIsSensorLogs] = useState(false);
  const [isActiveSensor, setIsActiveSensor] = useState(true);
  const [openCollapse, setOpenCollapse] = useState(false);
  const [loading, setLoading] = useState(false);
  const [barangays, setBarangays] = useState<Barangays[]>([]);
  const [brgyFilter, setBrgyFilter] = useState(0);
  const [activeSensors, setActiveSensors] = useState<SensorsDetails[]>([]);
  const [activeSensorsCount, setActiveSensorsCount] = useState(0);
  const [inactiveSensors, setInactiveSensors] = useState<SensorsDetails[]>([]);

  const getBarangays = async () => {
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

  const getSensors = async () => {
    try {
      setLoading(true);
      const [activeSensorsRes, inactiveSensorsRes] = await Promise.all([
        api.get(`/sensors?is_active=1`),
        api.get(`/sensors?is_active=0`),
      ]);

      const activeSensors = activeSensorsRes.data.data;
      const inactiveSensors = inactiveSensorsRes.data.data;
      const activeCount = activeSensors.length;

      console.log(activeSensors);

      setActiveSensors(activeSensors);
      setInactiveSensors(inactiveSensors);
      setActiveSensorsCount(activeCount);
    } catch (err: any) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSensors();
    getBarangays();
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-md">
        <DashboardHeader title="Sensors">
          <CountRow
            title="Active Sensors"
            lastUpdated="Last updated 3 minutes ago"
            count={activeSensorsCount}
            // loading={loading}
          />
          <CountRow
            title="Inactive Sensors"
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
                value="Sensors"
                onClick={() => {
                  setIsSensors(true);
                  setIsSensorLogs(false);
                }}
                id="History_EvacTrigger"
              >
                All Sensors
              </TabsTrigger>
              <TabsTrigger
                value="Hazard"
                onClick={() => {
                  setIsSensorLogs(true);
                  setIsSensors(false);
                }}
                id="History_HazardTrigger"
              >
                Sensor Logs
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs
            defaultValue="overview"
            className="w-full max-w-md flex items-center"
          >
            {isSensors && !isSensorLogs && (
              <TabsList
                variant="line"
                className="w-full flex justify-between"
                id="History_EvacTabs"
              >
                <TabsTrigger
                  value="ActiveEvac"
                  id="History_ActiveEvacTrigger"
                  onClick={() => setIsActiveSensor(true)}
                >
                  Active Sensors
                </TabsTrigger>
                <TabsTrigger
                  value="ExpiredEvac"
                  id="History_ExpiredEvacTrigger"
                  onClick={() => setIsActiveSensor(false)}
                >
                  Inactive Sensors
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
            ) : isSensors ? (
              isActiveSensor ? (
                activeSensors.map((sensors) => (
                  <Fragment key={sensors.id}>
                    <Row
                      postId={String(sensors.sensorCode)}
                      title={sensors.name}
                      desc={`Status: ${sensors.currentStatus}`}
                      address={`${sensors.address}`}
                      datePosted={sensors.lastOnline}
                      link={`/SensorForm/${sensors.id}`}
                      buttonId="History_ExpiredEvacDetailsBtn"
                      showBtn
                    >
                      <div className="flex flex-row gap-2">
                        {!sensors.deactivatedAt && (
                          <div
                            className={`mt-2 px-2 py-1 rounded-3xl ${sensors.currentStatus == "normal" ? "bg-green-700/60" : sensors.currentStatus == "yellow" ? "bg-yellow-700/60" : sensors.currentStatus == "orange" ? "bg-amber-700/60" : sensors.currentStatus == "red" ? "bg-red-700/60" : "bg-gray-500/30"} w-fit text-sm`}
                          >
                            {sensors.currentStatus
                              ? sensors.currentStatus
                              : "No Level Detected"}
                          </div>
                        )}
                      </div>
                    </Row>
                  </Fragment>
                ))
              ) : (
                // <Row
                //   postId="Placeholder"
                //   title="Placeholder"
                //   address="Placeholder"
                //   datePosted="Placeholder"
                //   link="Placeholder"
                //   // isExpired="Placeholder"
                //   buttonId="Placeholder"
                //   showBtn
                // />
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
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sensors;

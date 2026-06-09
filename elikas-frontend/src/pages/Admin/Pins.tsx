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
import { Filter, Search } from "lucide-react";
import Row from "@/components/Row";
import { Skeleton } from "@/components/ui/skeleton";

type BrgyUser = {
  id: number;
  location: string;
  name: string;
  role: string;
};

function Pins() {
  const [isEvac, setIsEvac] = useState(true);
  const [isSensors, setIsSensors] = useState(false);
  const [activeEvac, setActiveEvac] = useState(true);
  const [activeHaz, setActiveHaz] = useState(true);
  const [loading, setLoading] = useState(false);

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
                    Expired Pins
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
                    Expired Pins
                  </TabsTrigger>
                </TabsList>
              ) : null}
            </Tabs>
            <div className="flex flex-row">
              <div className="w-2/3 flex justify-start items-center gap-2">
                <InputGroup className="w-2/3">
                  <InputGroupInput
                    className="text-sm h-8"
                    id="Admin_BrgySearchField"
                  ></InputGroupInput>
                  <InputGroupAddon align="inline-end">
                    <Search />
                  </InputGroupAddon>
                </InputGroup>
                <Filter size={18} id="Admin_BrgyFilterBtn" />
              </div>
            </div>

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

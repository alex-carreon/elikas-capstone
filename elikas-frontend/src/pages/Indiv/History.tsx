import colors from "@/constants/colors";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import Row from "@/components/Row";
import { Filter, Search } from "lucide-react";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import api from "@/api";
import { useUserContext } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

type FloodLevel = {
  id: number;
  level_name: string;
};

type myFloodPaths = {
  description: string;
  id: number;
  is_deactivated: boolean;
  is_expired: boolean;
  last_confirmed: string;
  level: FloodLevel;
  posted_at: string;
  posted_by: string;
};

function History() {
  // const location = useLocation();
  const { token } = useUserContext();

  const [evacPins, setEvacPins] = useState(true);
  const [activeEvac, setActiveEvac] = useState(true);
  const [activeHaz, setActiveHaz] = useState(true);
  const [floodPaths, setFloodPaths] = useState<myFloodPaths[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getMyHazards = async () => {
      try {
        setLoading(true);
        const response = await api.get("/flood-paths/my", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response) {
          console.log("Failed to retrieve data");
        }

        const myHazards = await response.data.flood_paths;
        setFloodPaths(myHazards);
      } catch (err: string | any) {
        Error(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    getMyHazards();
  }, []);

  return (
    <div className=" overflow-hidden h-screen flex justify-center pt-20 p-5">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <p className="font-bold text-2xl" style={{ color: colors.heading }}>
          Pin History
        </p>
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
          <>
            <div className="flex flex-col justify-center items-center gap-2">
              <Tabs
                defaultValue="overview"
                className="w-full max-w-md flex items-center"
              >
                <TabsList className="w-full flex justify-between">
                  <TabsTrigger
                    value="Evacuation"
                    onClick={() => setEvacPins(true)}
                    id="History_EvacTrigger"
                  >
                    Evacuation Pins
                  </TabsTrigger>
                  <TabsTrigger
                    value="Hazard"
                    onClick={() => setEvacPins(false)}
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
                {evacPins ? (
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
                      value="ClosedEvac"
                      id="History_ClosedEvacTrigger"
                      onClick={() => setActiveEvac(false)}
                    >
                      Closed Pins
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
                )}
              </Tabs>
            </div>
            <div className="flex justify-end items-center gap-2">
              <InputGroup className="w-2/3">
                <InputGroupInput
                  className="text-sm h-8"
                  id="History_SearchField"
                ></InputGroupInput>
                <InputGroupAddon align="inline-end">
                  <Search />
                </InputGroupAddon>
              </InputGroup>
              <Filter size={18} id="History_FilterBtn" />
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto max-h-screen">
              {evacPins ? (
                activeEvac ? (
                  <Row
                    postId="123"
                    title="Home"
                    address="Blk 123 Lot 2 Avenue street"
                    datePosted="March 13, 2005"
                    availability
                    isAvailable
                    link="/EvacForm"
                    buttonId="History_ActiveEvacDetailsBtn"
                  />
                ) : (
                  <Row
                    postId="123"
                    title="Home"
                    address="Blk 123 Lot 2 Avenue street"
                    datePosted="March 13, 2005"
                    availability
                    link="/EvacForm"
                    buttonId="History_ClosedEvacDetailsBtn"
                  />
                )
              ) : activeHaz ? (
                floodPaths.map((path) => {
                  if (!path.is_expired)
                    return (
                      <Row
                        postId={String(path.id)}
                        title="Flood"
                        address={path.description}
                        datePosted={path.posted_at}
                        link={`/HazardForm/${path.id}`}
                        isExpired={path.is_expired}
                        buttonId="History_ActiveHazardDetailsBtn"
                      />
                    );
                })
              ) : (
                floodPaths.map((path) => {
                  if (path.is_expired)
                    return (
                      <Row
                        postId={String(path.id)}
                        title="Flood"
                        address={path.description}
                        datePosted={path.posted_at}
                        link="/HazardForm"
                        isExpired={path.is_expired}
                        buttonId="History_ExpHazardDetailsBtn"
                      />
                    );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default History;

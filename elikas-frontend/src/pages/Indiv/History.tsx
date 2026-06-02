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

type myEvacPins = {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  expiry: string;
  is_expired: boolean;
  is_deactivated: boolean;
  deactivated_at: string | null;
  posted_at: string;
  // last_updated: string | null;
  last_confirmed: string | null;
};

function History() {
  // const location = useLocation();
  const { token } = useUserContext();

  const [isEvac, setIsEvac] = useState(true);
  const [evacPins, setEvacPins] = useState<myEvacPins[]>([]);
  const [activeEvac, setActiveEvac] = useState(true);
  const [activeHaz, setActiveHaz] = useState(true);
  const [floodPaths, setFloodPaths] = useState<myFloodPaths[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getMyPins = async () => {
      try {
        setLoading(true);
        const [floodResponse, evacResponse] = await Promise.all([
          api.get("/flood-paths/my"),
          api.get("/pins/history"),
        ]);

        if (!floodResponse || !evacResponse) {
          console.log("Failed to retrieve data");
        }

        console.log(evacResponse.data.pins);

        const myHazards = await floodResponse.data.flood_paths;
        const myEvacs = await evacResponse.data.pins;
        setFloodPaths(myHazards);
        setEvacPins(myEvacs);
      } catch (err: string | any) {
        Error(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    getMyPins();
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
                    onClick={() => setIsEvac(true)}
                    id="History_EvacTrigger"
                  >
                    Evacuation Pins
                  </TabsTrigger>
                  <TabsTrigger
                    value="Hazard"
                    onClick={() => setIsEvac(false)}
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
                      Expired Pins
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
              {isEvac
                ? activeEvac
                  ? evacPins.map((pins) => {
                      if (!pins.is_expired)
                        return (
                          <Row
                            postId={String(pins.id)}
                            title={pins.name}
                            address={pins.address}
                            datePosted={pins.posted_at}
                            link={`/EvacForm/${pins.id}`}
                            isExpired={pins.is_expired}
                            buttonId="History_ActiveEvacDetailsBtn"
                          />
                        );
                    })
                  : evacPins.map((pins) => {
                      if (pins.is_expired)
                        return (
                          <Row
                            postId={String(pins.id)}
                            title={pins.name}
                            address={pins.address}
                            datePosted={pins.posted_at}
                            link={`/EvacForm/${pins.id}`}
                            isExpired={pins.is_expired}
                            buttonId="History_ExpiredEvacDetailsBtn"
                          />
                        );
                    })
                : activeHaz
                  ? floodPaths.map((path) => {
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
                  : floodPaths.map((path) => {
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
                    })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default History;

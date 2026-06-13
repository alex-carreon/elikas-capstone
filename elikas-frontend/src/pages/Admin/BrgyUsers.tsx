import api from "@/api";
import CountRow from "@/components/Admin/CountRow";
import DashboardHeader from "@/components/Admin/DashboardHeader";
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";
import Row from "@/components/Row";
import { Skeleton } from "@/components/ui/skeleton";
import ButtonComp from "@/components/Button";
import { Link } from "react-router";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import SelectDropdown from "@/components/SelectDropdown";

type BrgyUser = {
  id: number;
  location: string;
  name: string;
  role: string;
};

type Cities = {
  id: number;
  name: string;
  parent_id: number;
  parent_location: Province;
};

type Province = {
  id: number;
  level_id: number;
  name: string;
};

function BrgyUsers() {
  const [loading, setLoading] = useState(true);
  const [countLoad, setCountLoad] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [deacCount, setDeacCount] = useState(0);
  const [activeUsers, setActiveUsers] = useState<BrgyUser[]>([]);
  const [deacUsers, setDeacUsers] = useState<BrgyUser[]>([]);
  const [isActiveUsers, setIsActiveUsers] = useState(true);
  const [isSMS, setIsSMS] = useState(false);
  const [sentMessages, setSentMessages] = useState(true);
  const [cityFilter, setCityFilter] = useState(0);
  const [cities, setCities] = useState<Cities[]>([]);
  const [openCollapse, setOpenCollapse] = useState(false);

  const params = new URLSearchParams();

  const getBrgyData = async (signal?: AbortSignal) => {
    try {
      if (cityFilter && cityFilter !== 0) {
        params.set("city_id", String(cityFilter));
      }

      const parameter = params.toString();

      const [activeResponse, deacResponse] = await Promise.all([
        api.get(
          `/admin/users?role=brgy_op&active=true${parameter ? `&${parameter}` : ""}`,
          { signal },
        ),
        api.get("/admin/users?role=brgy_op&active=false", { signal }),
      ]);

      setActiveUsers(activeResponse.data.users);
      setDeacUsers(deacResponse.data.users);
    } catch (err: string | any) {
      if (err.name === "CanceledError") {
        return;
      }
      console.log(err.response?.data);
    }
  };

  const getBrgyCount = async (signal?: AbortSignal) => {
    try {
      setCountLoad(true);
      const [activeResponse, deacResponse] = await Promise.all([
        api.get(`/admin/users?role=brgy_op&active=true`, { signal }),
        api.get("/admin/users?role=brgy_op&active=false", { signal }),
      ]);

      setActiveCount(activeResponse.data.count);
      setDeacCount(deacResponse.data.count);
      setCountLoad(false);
    } catch (err: string | any) {
      if (err.name === "CanceledError") {
        setCountLoad(false);
        return;
      }
      console.log(err.response?.data);
      setCountLoad(false);
    }
  };

  const getCity = async (signal?: AbortSignal) => {
    try {
      setCountLoad(true);

      const cityRes = await api.get("/locations/cities", { signal });

      const cities = cityRes.data.Cities;
      setCities(cities);
      setCountLoad(false);
    } catch (err: any) {
      console.log(err.message);
      if (err.name === "CanceledError") {
        setCountLoad(false);
        return;
      }
      console.log(err.response?.data);
      setCountLoad(false);
    }
  };

  const getAll = async () => {
    const controller = new AbortController();

    try {
      setLoading(true);
      await Promise.all([
        getCity(controller.signal),
        getBrgyData(controller.signal),
        getBrgyCount(controller.signal),
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

    getBrgyData(controller.signal);

    return () => controller.abort();
  }, [cityFilter]);

  return (
    <>
      <div className="w-full flex flex-col items-center">
        <div className="w-full max-w-md">
          <DashboardHeader title="Barangay Users">
            <CountRow
              title="Active Barangay Users"
              lastUpdated="Barangay Users that are not Deactivated"
              count={activeCount}
              loading={countLoad}
            />
            <CountRow
              title="Deactivated Barangay Users"
              lastUpdated="Barangay Users that are Deactivated"
              count={deacCount}
              loading={countLoad}
            />
          </DashboardHeader>
          <div className="bg-white -mt-8 rounded-4xl p-4 flex flex-col gap-2">
            <Tabs
              defaultValue="overview"
              className="w-full max-w-md flex items-center"
            >
              <TabsList
                className="w-full flex justify-between"
                id="Admin_BrgyTabs"
              >
                <TabsTrigger
                  value="Active"
                  onClick={() => {
                    setIsActiveUsers(true);
                    setIsSMS(false);
                  }}
                  id="Admin_BrgyIsActiveTrigger"
                >
                  Active
                </TabsTrigger>
                <TabsTrigger
                  value="Deactivated"
                  onClick={() => {
                    setIsActiveUsers(false);
                    setIsSMS(false);
                  }}
                  id="Admin_BrgyInactiveTrigger"
                >
                  Deactivated
                </TabsTrigger>
                <TabsTrigger
                  value="SMS"
                  onClick={() => {
                    setIsActiveUsers(false);
                    setIsSMS(true);
                  }}
                  id="Admin_BrgySMSTrigger"
                >
                  SMS
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {isSMS && (
              <Tabs
                defaultValue="overview"
                className="w-full max-w-md flex items-center"
              >
                <TabsList
                  variant="line"
                  className="w-full flex justify-between"
                  id="Admin_BrgySMSTabs"
                >
                  <TabsTrigger
                    value="ActiveEvac"
                    id="Admin_BrgySMSSent"
                    onClick={() => setSentMessages(true)}
                  >
                    SMS Messages
                  </TabsTrigger>
                  <TabsTrigger
                    value="ExpiredEvac"
                    id="Admin_BrgySMSTemplates"
                    onClick={() => setSentMessages(false)}
                  >
                    Templates
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            <Collapsible className="w-full flex-col items-center">
              <div className="w-full flex justify-between gap-2">
                {!isSMS && (
                  <div className="w-30">
                    <Link to="/admin-brgyAdd">
                      <ButtonComp
                        variant="primary"
                        text="Add"
                        id="Admin_BrgyAddBtn"
                        heightSize="30px"
                        widthSize="100%"
                      />
                    </Link>
                  </div>
                )}
              </div>
              <CollapsibleTrigger
                onClick={() => setOpenCollapse(!openCollapse)}
                id="Admin_BrgyFiltersTrigger"
                className="mt-2 flex justify-self-end"
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
              <CollapsibleContent
                id="Admin_BrgyFiltersContent"
                className="flex flex-col items-center px-2.5 text-sm"
              >
                <div className="w-full gap-2 bg-gray-300/50 p-4 rounded-lg flex">
                  <SelectDropdown
                    value={String(cityFilter)}
                    onValueChange={(val) => setCityFilter(Number(val))}
                    placeholder="City"
                    id="Admin_BrgyCityFilter"
                    options={[
                      { label: "All", value: "0" },
                      ...(cities?.map((city) => ({
                        label: city.name,
                        value: String(city.id),
                      })) ?? []),
                    ]}
                  />
                  {cityFilter ? (
                    <button
                      onClick={() => setCityFilter(0)}
                      id="Admin_BrgyCityClearFilter"
                    >
                      <X size={14} />
                    </button>
                  ) : null}
                </div>
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
              ) : isActiveUsers ? (
                activeUsers.map((user, index) => {
                  return (
                    <Row
                      key={index}
                      postId={String(user.id)}
                      title={user.location}
                      address="San Juan city, Manila"
                      link={`/admin-brgyDetails/${user.id}`}
                      buttonId="Admin_ActiveBrgyDetailsBtn"
                      showBtn
                    />
                  );
                })
              ) : isSMS ? (
                <></>
              ) : (
                deacUsers.map((user, index) => {
                  return (
                    <Row
                      key={index}
                      postId={String(user.id)}
                      title={user.location}
                      address="San Juan city, Manila"
                      link={`/admin-brgyDetails/${user.id}`}
                      buttonId="Admin_InactiveBrgyDetailsBtn"
                      showBtn
                    />
                  );
                })
              )}
              {}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default BrgyUsers;

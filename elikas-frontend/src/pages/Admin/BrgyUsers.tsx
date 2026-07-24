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
import {
  type BrgyUser,
  BrgyColumns,
} from "@/components/Admin/DataTable/BrgyColumns";
import { type SMS, SMSColumns } from "@/components/Admin/DataTable/SMSColumns";
import { DataTable } from "@/components/Admin/DataTable/DataTable";

type Barangays = {
  id: number;
  name: string;
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

type SmsStatus = {
  id: number;
  name: string;
};

function BrgyUsers() {
  const [loading, setLoading] = useState(true);
  const [countLoad, setCountLoad] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [deacCount, setDeacCount] = useState(0);
  const [smsCount, setSmsCount] = useState(0);
  const [activeUsers, setActiveUsers] = useState<BrgyUser[]>([]);
  const [deacUsers, setDeacUsers] = useState<BrgyUser[]>([]);
  const [isActiveUsers, setIsActiveUsers] = useState(true);
  const [isSMS, setIsSMS] = useState(false);
  const [brgyFilter, setBrgyFilter] = useState(0);
  const [barangays, setBarangays] = useState<Barangays[]>([]);
  const [cityFilter, setCityFilter] = useState(0);
  const [cities, setCities] = useState<Cities[]>([]);
  const [statuses, setStatuses] = useState<SmsStatus[]>([]);
  const [statusFilter, setStatusFilter] = useState(0);
  const [openCollapse, setOpenCollapse] = useState(false);
  const [sms, setSMS] = useState<SMS[]>([]);

  const params = new URLSearchParams();

  const getBrgyData = async (signal?: AbortSignal, parameter?: string) => {
    try {
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

  const getSMSCount = async (signal?: AbortSignal) => {
    try {
      setCountLoad(true);
      const response = await api.get(`/admin/sms/broadcasts`, { signal });

      setSmsCount(response.data.broadcasts.length);
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

  const getBrgy = async (signal?: AbortSignal) => {
    try {
      const response = await api.get("/locations/barangays", { signal });
      setBarangays(response.data.Barangays);
    } catch (err: any) {
      if (err.name === "CanceledError") return;
      console.log(err);
    }
  };

  const getSMS = async (signal?: AbortSignal, parameter?: string) => {
    try {
      const response = await api.get(
        `/admin/sms/broadcasts${parameter ? `?${parameter}` : ""}`,
        { signal },
      );
      setSMS(response.data.broadcasts);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        return;
      }
      console.log(err.response?.data);
    }
  };

  const getSmsStatus = async (signal?: AbortSignal) => {
    try {
      const response = await api.get("/sms/statuses", { signal });
      setStatuses(response.data.statuses);
    } catch (err: any) {
      if (err.name === "CanceledError") return;
      console.log(err);
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
        getSMSCount(controller.signal),
        getSMS(controller.signal),
        getBrgy(controller.signal),
        getSmsStatus(controller.signal),
      ]);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        setLoading(false);
        return;
      }
      console.log(err);
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  };

  const getSMSFilter = async () => {
    const controller = new AbortController();

    try {
      setLoading(true);

      if (brgyFilter && brgyFilter !== 0) {
        params.set("location_id", String(brgyFilter));
      }
      if (statusFilter && statusFilter !== 0) {
        params.set("status", String(statusFilter));
      }

      const smsParameter = params.toString();
      await getSMS(controller.signal, smsParameter);
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

  const getBrgyUsersFilter = async () => {
    const controller = new AbortController();

    try {
      setLoading(true);
      if (cityFilter && cityFilter !== 0) {
        params.set("city_id", String(cityFilter));
      }

      const parameter = params.toString();

      await getBrgyData(controller.signal, parameter);
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
    if (isSMS) {
      getSMSFilter();
    }
    getBrgyUsersFilter();
  }, [cityFilter, brgyFilter, statusFilter]);

  return (
    <>
      <div className="w-full flex flex-col items-center">
        <div className="w-full">
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
            <CountRow
              title="All SMS Transactions"
              lastUpdated="Includes all statuses"
              count={smsCount}
              loading={countLoad}
            />
          </DashboardHeader>
          <div className="bg-white -mt-8 rounded-4xl p-4 flex flex-col gap-2">
            <div className="w-full flex justify-center">
              <Tabs
                defaultValue="overview"
                className="w-full max-w-lg flex items-center"
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
            </div>

            <Collapsible className="w-full flex-col items-center md:px-8">
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
                  {isSMS ? (
                    <div className="w-full flex flex-row gap-2">
                      <div className="flex flex-row gap-2 w-full">
                        <SelectDropdown
                          value={String(brgyFilter)}
                          onValueChange={(val) => setBrgyFilter(Number(val))}
                          placeholder="Barangay"
                          id="Admin_SMSBrgyFilter"
                          options={[
                            { label: "All", value: "0" },
                            ...(barangays?.map((brgy) => ({
                              label: brgy.name,
                              value: String(brgy.id),
                            })) ?? []),
                          ]}
                        />
                        {brgyFilter ? (
                          <button
                            onClick={() => setBrgyFilter(0)}
                            id="Admin_BrgyBrgyClearFilter"
                          >
                            <X size={14} />
                          </button>
                        ) : null}
                      </div>
                      <div className="flex flex-row gap-2 w-full">
                        <SelectDropdown
                          value={String(statusFilter)}
                          onValueChange={(val) => setStatusFilter(Number(val))}
                          placeholder="Status"
                          id="Admin_SMSStatusFilter"
                          options={[
                            { label: "All", value: "0" },
                            ...(statuses?.map((status) => ({
                              label: status.name,
                              value: String(status.id),
                            })) ?? []),
                          ]}
                        />
                        {statusFilter ? (
                          <button
                            onClick={() => setStatusFilter(0)}
                            id="Admin_BrgyStatusClearFilter"
                          >
                            <X size={14} />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
            <div className="flex flex-col gap-2">
              {loading ? (
                <>
                  <div className="w-full flex flex-col items-center">
                    <div className="flex w-full flex-col gap-7 pt-4">
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
                <>
                  <div className="hidden md:block px-8">
                    <DataTable columns={BrgyColumns} data={activeUsers} />
                  </div>
                  <div className="md:hidden">
                    {activeUsers.map((user, index) => {
                      return (
                        <Row
                          key={index}
                          postId={String(user.id)}
                          title={user.location}
                          address={user.parent_location}
                          link={`/admin-brgyDetails/${user.id}`}
                          buttonId="Admin_ActiveBrgyDetailsBtn"
                          showBtn
                        />
                      );
                    })}
                  </div>
                </>
              ) : isSMS ? (
                <>
                  <div className="hidden md:block px-8">
                    <DataTable columns={SMSColumns} data={sms} />
                  </div>
                  <div className="md:hidden">
                    {sms?.map((sms, index) => {
                      return (
                        <Row
                          key={index}
                          postId={String(sms.id)}
                          title={`Sent to: ${sms.total_recipients} recipient/s`}
                          address={`Sender: ${sms.sender.point_person} - ${sms.sender.username}`}
                          desc={sms.status.name}
                          datePosted={
                            sms.status.name === "Scheduled"
                              ? `Sending on: ${sms.scheduled_for}`
                              : `Sent on: ${sms.sent_at ? sms.sent_at : "Not sent"}`
                          }
                          showCollapsible
                          collapseContent={sms.message_content}
                        />
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <div className="hidden md:block">
                    <DataTable columns={BrgyColumns} data={deacUsers} />
                  </div>
                  <div className="md:hidden">
                    {deacUsers.map((user, index) => {
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
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default BrgyUsers;

import DashboardHeader from "@/components/Admin/DashboardHeader";
import CountRow from "@/components/Admin/CountRow";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import Row from "@/components/Row";
import colors from "@/constants/colors";
import api from "@/api";
import { ChevronDownIcon, ChevronUpIcon, X } from "lucide-react";
import SelectDropdown from "@/components/SelectDropdown";

type Hotline = {
  id: number;
  location_id: number;
  location_name: string;
  name: string;
  address: string;
  phone_number: string;
  mobile_number: string;
  last_updated: string;
  posted_by: string;
  is_deactivated: boolean;
  deactivated_at: string;
};

type Barangays = {
  id: number;
  name: string;
  role: string;
  location: string;
};

function Hotlines() {
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadCount, setLoadCount] = useState(false);
  const [hotlines, setHotlines] = useState<Hotline[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [openCollapse, setOpenCollapse] = useState(false);
  const [brgyFilter, setBrgyFilter] = useState(0);
  const [barangays, setBarangays] = useState<Barangays[]>([]);

  const params = new URLSearchParams();

  const getHotlines = async (signal?: AbortSignal) => {
    try {
      if (brgyFilter && brgyFilter !== 0) {
        params.set("location_id", String(brgyFilter));
      }

      const parameters = params.toString();

      const response = await api.get(
        `/admin/emergency-contacts${parameters ? `?${parameters}` : ""}`,
        { signal },
      );

      setHotlines(response.data.emergency_contacts);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        return;
      }
      console.log(err.response?.data);
    }
  };

  const getHotlineCount = async (signal?: AbortSignal) => {
    try {
      const response = await api.get(`/admin/emergency-contacts`, { signal });

      const activeHotlines = response.data.emergency_contacts.filter(
        (contact: Hotline) => !contact.is_deactivated,
      );

      const inactiveHotlines = response.data.emergency_contacts.filter(
        (contact: Hotline) => contact.is_deactivated,
      );

      setActiveCount(activeHotlines.length);
      setInactiveCount(inactiveHotlines.length);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        return;
      }
      console.log(err.response?.data);
    }
  };

  const getBarangays = async (signal?: AbortSignal) => {
    try {
      const response = await api.get("/locations/barangays?city_id=2", {
        signal,
      });
      setBarangays(response.data.Barangays);
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
      setLoadCount(true);
      await getHotlines(controller.signal);
      await getBarangays(controller.signal);
      await getHotlineCount(controller.signal);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        setLoading(false);
        setLoadCount(false);
        return;
      }
      console.log(err.response?.data);
    } finally {
      setLoading(false);
      setLoadCount(false);
    }
  };

  const getFilter = async () => {
    const controller = new AbortController();

    try {
      setLoading(true);
      await getHotlines(controller.signal);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        setLoading(false);
        setLoadCount(false);
        return;
      }
      console.log(err.response?.data);
    } finally {
      setLoading(false);
      setLoadCount(false);
    }

    return () => controller.abort();
  };

  useEffect(() => {
    getAll();
  }, []);

  useEffect(() => {
    getFilter();
  }, [brgyFilter]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-md">
        <DashboardHeader title="Emergency Contacts">
          <CountRow
            title="Active Hotlines"
            lastUpdated="Not Deactivated and Not Expired"
            count={activeCount}
            loading={loadCount}
          />
          <CountRow
            title="Inactive Hotlines"
            lastUpdated="Deactivated and Expired"
            count={inactiveCount}
            loading={loadCount}
          />
        </DashboardHeader>
        <div className="bg-white -mt-8 rounded-4xl p-4 flex flex-col gap-2">
          <Tabs
            defaultValue="overview"
            className="w-full max-w-md flex items-center"
          >
            <TabsList className="w-full flex justify-between">
              <TabsTrigger
                value="Active Hotlines"
                onClick={() => {
                  setIsActive(true);
                }}
                id="Admin_HotlinesActiveTrigger"
              >
                Active Hotlines
              </TabsTrigger>
              <TabsTrigger
                value="Inactive Hotlines"
                onClick={() => {
                  setIsActive(false);
                }}
                id="Admin_HotlinesInactiveTrigger"
              >
                Inactive Hotlines
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Collapsible className="w-full flex-col items-center gap-2 mt-2">
            <div className="w-full flex justify-between">
              <CollapsibleTrigger
                onClick={() => setOpenCollapse(!openCollapse)}
                id="Admin_HotlinesFilterTrigger"
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
              id="Admin_HotlinesFilterContent"
              className="bg-gray-300/50 p-2 rounded-lg flex flex-row items-center justify-end gap-2 px-2.5 mt-2 text-sm"
            >
              <SelectDropdown
                value={String(brgyFilter)}
                onValueChange={(val) => setBrgyFilter(Number(val))}
                placeholder="Flood Level"
                id="Admin_HotlinesBrgyFilter"
                options={[
                  { label: "All", value: "0" },
                  ...barangays?.map((brgy) => ({
                    label: brgy.name,
                    value: String(brgy.id),
                  })),
                ]}
              />
              {brgyFilter ? (
                <button
                  onClick={() => setBrgyFilter(0)}
                  id="Admin_HotlinesClearBrgyFilter"
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
            {!loading &&
              isActive &&
              hotlines.map((hotline) => {
                if (!hotline.deactivated_at)
                  return (
                    <Row
                      key={hotline.id}
                      postId={String(hotline.id)}
                      title={hotline.name}
                      address={hotline.location_name}
                      datePosted={hotline.posted_by}
                      link={`/admin-hotlines/${hotline.id}`}
                      buttonId="Admin_HotlinesDetailsBtn"
                      showBtn
                    >
                      <p
                        className="text-sm"
                        style={{ color: colors.heading }}
                        id="Admin_HotlinesPrimary"
                      >
                        {`Primary Contact: ${hotline.phone_number}`}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: colors.heading }}
                        id="Admin_HotlinesSecondary"
                      >
                        {`Secondary Contact: ${hotline.mobile_number}`}
                      </p>
                    </Row>
                  );
              })}
            {!loading &&
              !isActive &&
              hotlines.map((hotline) => {
                if (hotline.deactivated_at)
                  return (
                    <Row
                      postId={String(hotline.id)}
                      title={hotline.name}
                      address={hotline.location_name}
                      datePosted={hotline.posted_by}
                      link={`/admin-hotlines/${hotline.id}`}
                      buttonId="Admin_HotlinesDetailsBtn"
                      isDeactivated={hotline.is_deactivated}
                      showBtn
                    >
                      <p
                        className="text-sm"
                        style={{ color: colors.heading }}
                        id="Admin_HotlinesPrimary"
                      >
                        {`Primary Contact: ${hotline.phone_number}`}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: colors.heading }}
                        id="Admin_HotlinesSecondary"
                      >
                        {`Secondary Contact: ${hotline.mobile_number}`}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: colors.heading }}
                        id="Admin_HotlinesDeacAt"
                      >
                        {`Deactivated at: ${hotline.deactivated_at}`}
                      </p>
                    </Row>
                  );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hotlines;

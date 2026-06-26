import { Phone } from "lucide-react";
import { useEffect, useState } from "react";
import HotlineRow from "@/components/HotlineRow";
import { useUserContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import api from "@/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import SelectDropdown from "@/components/SelectDropdown";

type Hotline = {
  id: number;
  name: string;
  address: string;
  location_name: string;
  phone_number: string;
  mobile_number: string;
  last_updated: string;
  posted_by: string;
};

type Barangays = {
  id: number;
  name: string;
  role: string;
  location: string;
};

function Hotlines() {
  const [loading, setLoading] = useState(false);
  const [hotlines, setHotlines] = useState<Hotline[]>([]);
  const [searchFor, setSearchFor] = useState("");
  const [barangays, setBarangays] = useState<Barangays[]>([]);
  const { role } = useUserContext();

  const params = new URLSearchParams();

  const getHotlines = async (signal?: AbortSignal, search = searchFor) => {
    try {
      if (search) {
        params.set("location_name", search);
      }
      const parameters = params.toString();
      const endpoint = `/emergency-contacts${parameters ? `?${parameters}` : ""}`;
      console.log("endpoint", endpoint);
      const response = await api.get(
        `/emergency-contacts${parameters ? `?${parameters}` : ""}`,
        { signal },
      );

      if (!response) {
        toast.error("Failed to fetch hotlines");
        console.log(response);
        return;
      }

      const contacts = response.data.emergency_contacts;
      if (contacts.length > 0) toast.success("Hotlines fetched successfully!");
      setHotlines(contacts);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        return;
      }
      console.log(err.response?.data);
    }
  };

  const getBrgy = async (signal?: AbortSignal) => {
    try {
      const brgyRes = await api.get(`/locations/barangays?city_id=2`, {
        signal,
      });

      const barangays = brgyRes.data.Barangays;
      setBarangays(barangays);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        return;
      }
      console.log(err.response?.data);
    }
  };

  const getData = async () => {
    const controller = new AbortController();

    try {
      setLoading(true);
      await Promise.all([
        getHotlines(controller.signal),
        getBrgy(controller.signal),
      ]);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        setLoading(false);
        return;
      }
      console.log(err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const getFiltered = async () => {
    const controller = new AbortController();

    try {
      setLoading(true);
      await getHotlines(controller.signal);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        setLoading(false);
        return;
      }
      console.log(err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    if (searchFor) {
      getFiltered();
    }
  }, [searchFor]);

  return loading ? (
    <>
      <div className="w-full h-screen flex flex-col items-center p-6 mt-8 gap-4">
        <div className="flex flex-col items-center gap-1 mt-6">
          <Phone />
          <p>
            <b>Emergency Hotline Directory</b>
          </p>
        </div>
        <div className="flex w-full max-w-sm flex-col gap-7 pt-4">
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
      </div>
    </>
  ) : (
    <>
      <div className="w-full h-screen flex flex-col items-center p-6 mt-8 gap-4">
        {/* Header */}
        <div className="flex flex-col items-center gap-1 mt-6">
          <Phone />
          <p>
            <b>Emergency Hotline Directory</b>
          </p>
        </div>
        {/* Search and Filter and Add button */}
        <div className="w-full max-w-md flex flex-row justify-between items-center">
          {role === "brgy_op" && (
            <div>
              <Link to="/HotlinesForm">
                <Button
                  size="sm"
                  className="w-24 bg-gradient-to-r from-[#FFA011] to-[#F3C962]"
                  id="Hotlines-Add"
                >
                  Add Hotline
                </Button>
              </Link>
            </div>
          )}
          <div className="w-3/5 flex justify-center gap-2">
            <SelectDropdown
              value={String(searchFor)}
              onValueChange={(val) => setSearchFor(val)}
              placeholder="Barangay"
              id="Hotlines_BrgyFilter"
              options={[
                { label: "All", value: "" },
                ...(barangays?.map((barangays) => ({
                  label: barangays.name,
                  value: barangays.name,
                })) ?? []),
              ]}
            />
          </div>
        </div>

        {/* Hotline rows */}
        {hotlines.length > 0 ? (
          hotlines.map((hotline) => {
            return (
              <HotlineRow
                lastUpdate={hotline.last_updated}
                name={hotline.name}
                address={`${hotline.address}, ${hotline.location_name}`}
                primary={hotline.phone_number}
                secondary={hotline.mobile_number}
                postedBy={hotline.posted_by}
                id={hotline.id}
              />
            );
          })
        ) : (
          <p className="text-sm pt-4 text-center">
            There are no registered emergency hotlines yet!
          </p>
        )}
      </div>
    </>
  );
}

export default Hotlines;

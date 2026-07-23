import { Phone, Search } from "lucide-react";
import { useEffect, useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import HotlineRow from "../components/HotlineRow";
import { useUserContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import api from "@/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

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

function Hotlines() {
  const [loading, setLoading] = useState(false);
  const [hotlines, setHotlines] = useState<Hotline[]>([]);
  const { role } = useUserContext();

  useEffect(() => {
    const getHotlines = async () => {
      try {
        setLoading(true);
        const response = await api.get("/emergency-contacts");

        console.log(response);

        if (!response) {
          toast.error("Failed to fetch hotlines");
          console.log(response);
          return;
        }

        const contacts = response.data.emergency_contacts;
        setHotlines(contacts);
      } catch (err: any) {
        console.log(err.response.data);
      } finally {
        setLoading(false);
      }
    };

    getHotlines();
  }, []);

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
        <div className="w-full max-w-md flex flex-row justify-between">
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
          <div className="w-full flex justify-end items-center gap-2">
            <InputGroup className="w-2/3">
              <InputGroupInput
                className="text-sm h-8"
                id="Hotlines_Search"
              ></InputGroupInput>
              <InputGroupAddon align="inline-end">
                <Search />
              </InputGroupAddon>
            </InputGroup>
          </div>
        </div>

        {/* Hotline rows */}
        <div className="w-full max-w-md grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl: grid-cols-4">
          {hotlines.map((hotline) => {
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
          })}
        </div>
      </div>
    </>
  );
}

export default Hotlines;

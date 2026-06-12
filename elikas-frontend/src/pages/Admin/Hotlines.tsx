import DashboardHeader from "@/components/Admin/DashboardHeader";
import CountRow from "@/components/Admin/CountRow";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import HotlineRow from "@/components/HotlineRow";
import Row from "@/components/Row";
import colors from "@/constants/colors";

function Hotlines() {
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-md">
        <DashboardHeader title="Hotlines">
          <CountRow
            title="Active Hotlines"
            lastUpdated="Last updated 3 minutes ago"
            count={3}
            // loading={loading}
          />
          <CountRow
            title="Deactivated Hotlines"
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
                value="Active Hotlines"
                onClick={() => {
                  setIsActive(true);
                }}
                id="History_EvacTrigger"
              >
                Active Hotlines
              </TabsTrigger>
              <TabsTrigger
                value="Deactivated Hotlines"
                onClick={() => {
                  setIsActive(false);
                }}
                id="History_HazardTrigger"
              >
                Deactivated Hotlines
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="w-full flex-col items-center gap-2 mt-2">
            <div className="w-full flex justify-end">
              <InputGroup className="w-2/3">
                <InputGroupInput
                  className="text-sm h-8"
                  id="Admin_IndivSearchField"
                ></InputGroupInput>
                <InputGroupAddon align="inline-end">
                  <Search />
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>
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
            {!loading && isActive && (
              <Row
                postId="Active Hotline"
                title="Active Hotline"
                address="Active Hotline"
                datePosted="Active Hotline"
                link="Active Hotline"
                buttonId="History_ExpHazardDetailsBtn"
                showBtn
              >
                <p className="text-sm" style={{ color: colors.heading }}>
                  Primary Contact: Active
                </p>
                <p className="text-sm" style={{ color: colors.heading }}>
                  Secondary Contact: Inactive
                </p>
              </Row>
            )}
            {!loading && !isActive && (
              <HotlineRow
                lastUpdate="Inactive Hotline"
                name="Inactive Hotline"
                address="Inactive Hotline"
                primary="Inactive Hotline"
                secondary="Inactive Hotline"
                postedBy="Inactive Hotline"
                id={1}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hotlines;

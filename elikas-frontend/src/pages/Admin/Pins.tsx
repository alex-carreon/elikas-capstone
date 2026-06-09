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
import ButtonComp from "@/components/Button";
import { Link } from "react-router";

type BrgyUser = {
  id: number;
  location: string;
  name: string;
  role: string;
};

function Pins() {
  return (
    <>
      <div className="w-full flex flex-col items-center">
        <div className="w-full max-w-md">
          <DashboardHeader title="Barangay Users">
            <CountRow
              title="Active Users"
              lastUpdated="Last updated 3 minutes ago"
              count={activeCount}
              loading={loading}
            />
            <CountRow
              title="Deactivated Users"
              lastUpdated="Last updated 3 minutes ago"
              count={deacCount}
              loading={loading}
            />
          </DashboardHeader>
          <div className="bg-white -mt-8 rounded-4xl p-4 flex flex-col gap-2">
            <Tabs
              defaultValue="overview"
              className="w-full max-w-md flex items-center"
            >
              <TabsList className="w-full flex justify-between">
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
                  id="Admin_BrgyNotActiveTrigger"
                >
                  Deactivated
                </TabsTrigger>
                <TabsTrigger
                  value="SMS"
                  onClick={() => {
                    setIsActiveUsers(false);
                    setIsSMS(true);
                  }}
                  id="Admin_BrgyFeedbackTrigger"
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
                      buttonId="Admin_ActiveIndivDetailsBtn"
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
                      buttonId="Admin_ActiveIndivDetailsBtn"
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

export default Pins;

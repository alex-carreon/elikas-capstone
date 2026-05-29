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

type Users = {
  id: number;
  location: string;
  name: string;
  role: string;
};

function IndivUsers() {
  const [activeCount, setActiveCount] = useState(0);
  const [deacCount, setDeacCount] = useState(0);
  const [isActiveUsers, setIsActiveUsers] = useState(true);
  const [isFeedback, setIsFeedback] = useState(false);
  const [activeUsers, setActiveUsers] = useState<Users[]>([]);
  const [deacUsers, setDeacUsers] = useState<Users[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getIndivData = async () => {
      try {
        setLoading(true);
        const [activeResponse, deacResponse] = await Promise.all([
          api.get("/admin/users?role=indiv&active=true"),
          api.get("/admin/users?role=indiv&active=false"),
        ]);

        setActiveCount(activeResponse.data.count);
        setActiveUsers(activeResponse.data.users);
        setDeacCount(deacResponse.data.count);
        setDeacUsers(deacResponse.data.users);
      } catch (err: string | any) {
        new Error(err.message || "An error occurred during registration");
      } finally {
        setLoading(false);
      }
    };

    getIndivData();
  }, []);

  return (
    <>
      <div className="w-full flex flex-col items-center">
        <div className="w-full max-w-md">
          <DashboardHeader>
            <CountRow
              title="Active Users"
              lastUpdated="Last updated 3 minutes ago"
              count={activeCount}
            />
            <CountRow
              title="Deactivated Users"
              lastUpdated="Last updated 3 minutes ago"
              count={deacCount}
            />
            <CountRow
              title="Active Users"
              lastUpdated="Last updated 3 minutes ago"
              count={0}
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
                    setIsFeedback(false);
                  }}
                  id="AdminIndivUsers_IsActiveTrigger"
                >
                  Active
                </TabsTrigger>
                <TabsTrigger
                  value="Deactivated"
                  onClick={() => {
                    setIsActiveUsers(false);
                    setIsFeedback(false);
                  }}
                  id="AdminIndivUsers_NotActiveTrigger"
                >
                  Deactivated
                </TabsTrigger>
                <TabsTrigger
                  value="Feedback"
                  onClick={() => {
                    setIsActiveUsers(false);
                    setIsFeedback(true);
                  }}
                  id="AdminIndivUsers_FeedbackTrigger"
                >
                  Feedback
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="w-2/3 flex justify-start items-center gap-2">
              <InputGroup className="w-2/3">
                <InputGroupInput
                  className="text-sm h-8"
                  id="Admin_IndivSearchField"
                ></InputGroupInput>
                <InputGroupAddon align="inline-end">
                  <Search />
                </InputGroupAddon>
              </InputGroup>
              <Filter size={18} id="History_FilterBtn" />
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
                      title={user.name}
                      address={user.location}
                      link={`/admin-userDetails/${user.id}`}
                      buttonId="Admin_IndivDetailsTrigger"
                    />
                  );
                })
              ) : isFeedback ? (
                <></>
              ) : (
                deacUsers.map((user, index) => {
                  return (
                    <Row
                      key={index}
                      postId={String(user.id)}
                      title={user.name}
                      address={user.location}
                      link={`/admin-userDetails/${user.id}`}
                      buttonId="Admin_IndivDetailsTrigger"
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

export default IndivUsers;

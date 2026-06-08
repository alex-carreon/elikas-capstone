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
import { ChevronDownIcon, ChevronUpIcon, Search } from "lucide-react";
import Row from "@/components/Row";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import SelectDropdown from "@/components/SelectDropdown";

type Users = {
  id: number;
  location: string;
  name: string;
  role: string;
};

type submittedBy = {
  id: number;
  username: string;
  role: string;
};

type Feedback = {
  id: number;
  rating: number;
  message: string;
  sent_at: string;
  submitted_by: submittedBy;
};

function IndivUsers() {
  const [activeCount, setActiveCount] = useState(0);
  const [deacCount, setDeacCount] = useState(0);
  const [feedbackAve, setFeedbackAve] = useState(0);
  const [isActiveUsers, setIsActiveUsers] = useState(true);
  const [isFeedback, setIsFeedback] = useState(false);
  const [activeUsers, setActiveUsers] = useState<Users[]>([]);
  const [deacUsers, setDeacUsers] = useState<Users[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [openCollapse, setOpenCollapse] = useState(false);

  useEffect(() => {
    const getIndivData = async () => {
      try {
        setLoading(true);
        const [activeResponse, deacResponse, feedbackResponse] =
          await Promise.all([
            api.get("/admin/users?role=indiv&active=true"),
            api.get("/admin/users?role=indiv&active=false"),
            api.get("/admin/feedback"),
          ]);

        const ratings = feedbackResponse.data.feedback.map(
          (item: Feedback) => item.rating,
        );

        const aveRating = ratings.length
          ? ratings.reduce((sum: number, n: number) => sum + n, 0) /
            ratings.length
          : 0;

        setActiveCount(activeResponse.data.count);
        setActiveUsers(activeResponse.data.users);
        setDeacCount(deacResponse.data.count);
        setDeacUsers(deacResponse.data.users);
        setFeedback(feedbackResponse.data.feedback);
        setFeedbackAve(aveRating);
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
          <DashboardHeader title="Indiv Users">
            <CountRow
              title="Active Users"
              count={activeCount}
              loading={loading}
            />
            <CountRow
              title="Deactivated Users"
              count={deacCount}
              loading={loading}
            />
            <CountRow
              title="Feedback Average"
              count={feedbackAve}
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
                    setIsFeedback(false);
                  }}
                  id="Admin_IndivIsActiveTrigger"
                >
                  Active
                </TabsTrigger>
                <TabsTrigger
                  value="Deactivated"
                  onClick={() => {
                    setIsActiveUsers(false);
                    setIsFeedback(false);
                  }}
                  id="Admin_IndivNotActiveTrigger"
                >
                  Deactivated
                </TabsTrigger>
                <TabsTrigger
                  value="Feedback"
                  onClick={() => {
                    setIsActiveUsers(false);
                    setIsFeedback(true);
                  }}
                  id="Admin_IndivFeedbackTrigger"
                >
                  Feedback
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Collapsible className="w-full flex-col items-center gap-2">
              <div className="w-full flex justify-between">
                <InputGroup className="w-2/3">
                  <InputGroupInput
                    className="text-sm h-8"
                    id="Admin_IndivSearchField"
                  ></InputGroupInput>
                  <InputGroupAddon align="inline-end">
                    <Search />
                  </InputGroupAddon>
                </InputGroup>
                <CollapsibleTrigger
                  onClick={() => setOpenCollapse(!openCollapse)}
                  id="History_FiltersTrigger"
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
                id="History_FiltersContent"
                className="flex flex-col items-center px-2.5 mt-2 text-sm"
              >
                <div className="w-full gap-2 bg-gray-300/50 p-4 rounded-lg flex">
                  {/* <SelectDropdown
                      value={String(levelFilter)}
                      onValueChange={(val) => setLevelFilter(Number(val))}
                      placeholder="Flood Level"
                      id="History_LevelFilter"
                      options={[
                        { label: "All", value: "0" },
                        ...(levels?.map((level) => ({
                          label: level.level_name,
                          value: String(level.id),
                        })) ?? []),
                      ]}
                    /> */}
                  {/* {levelFilter ? (
                      <button
                        onClick={() => setLevelFilter(0)}
                        id="History_ClearBrgyFilter"
                      >
                        <X size={14} />
                      </button>
                    ) : null} */}
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
                      title={user.name}
                      address={user.location}
                      link={`/admin-userDetails/${user.id}`}
                      buttonId="Admin_ActiveIndivDetailsBtn"
                      showBtn
                    />
                  );
                })
              ) : isFeedback ? (
                feedback.map((feedback, index) => {
                  return (
                    <Row
                      key={index}
                      postId={String(feedback.id)}
                      title={`Rating: ${String(feedback.rating)}`}
                      address={`User: ${feedback.submitted_by.username} - ${feedback.submitted_by.role}`}
                      datePosted={feedback.sent_at}
                      link=""
                      buttonId="Admin_DeacIndivDetailsBtn"
                    />
                  );
                })
              ) : (
                deacUsers.map((user, index) => {
                  return (
                    <Row
                      key={index}
                      postId={String(user.id)}
                      title={user.name}
                      address={user.location}
                      link={`/admin-userDetails/${user.id}`}
                      buttonId="Admin_DeacIndivDetailsBtn"
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

export default IndivUsers;

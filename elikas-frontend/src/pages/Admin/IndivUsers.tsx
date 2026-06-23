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
import { ChevronDownIcon, ChevronUpIcon, Search, X } from "lucide-react";
import Row from "@/components/Row";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import SelectDropdown from "@/components/SelectDropdown";
import { Toggle } from "@/components/ui/toggle";

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

type Barangays = {
  id: number;
  name: string;
  role: string;
  location: string;
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
  const [loading, setLoading] = useState(true);
  const [countLoad, setCountLoad] = useState(true);
  const [openCollapse, setOpenCollapse] = useState(false);
  const [barangays, setBarangays] = useState<Barangays[]>([]);
  const [brgyFilter, setBrgyFilter] = useState(0);
  const [ratingFilter, setRatingFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<"indiv" | "brgy" | null>();
  const [messageFilter, setMessageFilter] = useState("");
  const [rangeFilter, setRangeFilter] = useState("");

  const params = new URLSearchParams();

  const getActiveIndivData = async (signal?: AbortSignal) => {
    try {
      if (brgyFilter || brgyFilter !== 0) {
        params.set("barangay_id", String(brgyFilter));
      }

      const parameter = params.toString();
      const [activeResponse, feedbackResponse] = await Promise.all([
        api.get(
          `/admin/users?role=indiv&active=true${parameter ? `&${parameter}` : ""}`,
          { signal },
        ),
        api.get(`/admin/feedback${parameter ? `?${parameter}` : ""}`, {
          signal,
        }),
      ]);

      setActiveUsers(activeResponse.data.users);
      setFeedback(feedbackResponse.data.feedback);
    } catch (err: string | any) {
      if (err.name === "CanceledError") {
        return;
      }
      console.log(err.response?.data);
    }
  };

  const getInactiveIndivData = async (signal?: AbortSignal) => {
    try {
      if (brgyFilter || brgyFilter !== 0) {
        params.set("barangay_id", String(brgyFilter));
      }

      const parameter = params.toString();

      const [deacResponse, feedbackResponse] = await Promise.all([
        api.get(
          `/admin/users?role=indiv&active=false${parameter ? `&${parameter}` : ""}`,
          { signal },
        ),
        api.get(`/admin/feedback${parameter ? `?${parameter}` : ""}`, {
          signal,
        }),
      ]);

      setDeacUsers(deacResponse.data.users);
      setFeedback(feedbackResponse.data.feedback);
    } catch (err: string | any) {
      if (err.name === "CanceledError") {
        return;
      }
      console.log(err.response?.data);
    }
  };

  const getFeedbacks = async (signal?: AbortSignal) => {
    try {
      if (brgyFilter || brgyFilter !== 0) {
        params.set("location_id", String(brgyFilter));
      }

      if (ratingFilter) {
        params.append("rating", ratingFilter);
      }

      if (roleFilter) {
        params.append("role", roleFilter);
      }

      if (messageFilter) {
        params.append("message", messageFilter);
      }

      if (rangeFilter) {
        params.append("range", rangeFilter);
      }

      const parameter = params.toString();

      const feedbackResponse = await api.get(
        `/admin/feedback${parameter ? `?${parameter}` : ""}`,
        { signal },
      );

      setFeedback(feedbackResponse.data.feedback);
    } catch (err: string | any) {
      if (err.name === "CanceledError") {
        return;
      }
      console.log(err.response?.data);
    }
  };

  const getIndivCount = async (signal?: AbortSignal) => {
    try {
      setCountLoad(true);
      const [activeResponse, deacResponse, feedbackResponse] =
        await Promise.all([
          api.get("/admin/users?role=indiv&active=true", { signal }),
          api.get("/admin/users?role=indiv&active=false", { signal }),
          api.get("/admin/feedback", { signal }),
        ]);

      const ratings = feedbackResponse.data.feedback.map(
        (item: Feedback) => item.rating,
      );

      const aveRating = ratings.length
        ? ratings.reduce((sum: number, n: number) => sum + n, 0) /
          ratings.length
        : 0;

      setActiveCount(activeResponse.data.count);
      setDeacCount(deacResponse.data.count);
      setFeedbackAve(aveRating);

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

  const getAll = async () => {
    const controller = new AbortController();

    try {
      setLoading(true);
      await Promise.all([
        getActiveIndivData(controller.signal),
        getInactiveIndivData(controller.signal),
        getFeedbacks(controller.signal),
        getBrgy(controller.signal),
        getIndivCount(controller.signal),
      ]);
    } catch (err: any) {
      if (err.name === "CanceledError") return;
      console.log(err);
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  };

  const getFiltered = async () => {
    const controller = new AbortController();

    if (isActiveUsers) {
      setLoading(true);
      await getActiveIndivData(controller.signal);
    }
    if (isFeedback) {
      setLoading(true);
      await getFeedbacks(controller.signal);
    }
    if (!isActiveUsers) {
      setLoading(true);
      await getInactiveIndivData(controller.signal);
    }

    setLoading(false);

    return () => controller.abort();
  };

  useEffect(() => {
    getAll();
  }, []);

  useEffect(() => {
    getFiltered();
  }, [brgyFilter, ratingFilter, roleFilter, messageFilter, rangeFilter]);

  return (
    <>
      <div className="w-full flex flex-col items-center">
        <div className="w-full max-w-md">
          <DashboardHeader title="Indiv Users">
            <CountRow
              title="Active Users"
              count={activeCount}
              loading={countLoad}
            />
            <CountRow
              title="Deactivated Users"
              count={deacCount}
              loading={countLoad}
            />
            <CountRow
              title="Feedback Average"
              count={Number(feedbackAve.toFixed(2))}
              loading={countLoad}
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
                    onChange={(e) => setMessageFilter(e.target.value)}
                  ></InputGroupInput>
                  <InputGroupAddon align="inline-end">
                    <Search onClick={() => getFeedbacks()} />
                  </InputGroupAddon>
                </InputGroup>
                <CollapsibleTrigger
                  onClick={() => setOpenCollapse(!openCollapse)}
                  id="Admin_IndivFilterTrigger"
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
                id="Admin_IndivFilterContent"
                className="flex flex-col items-center px-2.5 mt-2 text-sm"
              >
                <div className="w-full gap-2 bg-gray-300/50 p-4 rounded-lg flex flex-col items-center">
                  {isFeedback && (
                    <div className="flex flex-row w-full gap-2 justify-end">
                      <Toggle
                        size="sm"
                        variant="outline"
                        className="aria-pressed:bg-red-500/50 aria-pressed:text-white border-gray-400"
                        onPressedChange={(pressed) =>
                          setRoleFilter(pressed ? "indiv" : null)
                        }
                        pressed={roleFilter === "indiv"}
                        id="Admin_IndivFeedbackRoleIndiv"
                      >
                        Indiv
                      </Toggle>
                      <Toggle
                        size="sm"
                        variant="outline"
                        className="aria-pressed:bg-red-500/50 aria-pressed:text-white border-gray-400"
                        onPressedChange={(pressed) =>
                          setRoleFilter(pressed ? "brgy" : null)
                        }
                        pressed={roleFilter === "brgy"}
                        id="Admin_IndivFeedbackRoleBrgy"
                      >
                        Brgy
                      </Toggle>
                    </div>
                  )}
                  <div className="flex flex-row w-full gap-2">
                    {isFeedback ? (
                      <div className="flex flex-row gap-2 w-full">
                        <SelectDropdown
                          value={String(ratingFilter)}
                          onValueChange={(val) => setRatingFilter(val)}
                          placeholder="Rating"
                          id="Admin_IndivFeedbackRating"
                          options={[
                            { label: "All", value: "0" },
                            { label: "1", value: "1" },
                            { label: "1.5", value: "1.5" },
                            { label: "2", value: "2" },
                            { label: "2.5", value: "2.5" },
                            { label: "3", value: "3" },
                            { label: "3.5", value: "3.5" },
                            { label: "4", value: "4" },
                            { label: "4.5", value: "4.5" },
                            { label: "5", value: "5" },
                          ]}
                        />
                        <SelectDropdown
                          value={String(rangeFilter)}
                          onValueChange={(val) => setRangeFilter(val)}
                          placeholder="Range"
                          id="Admin_IndivFeedbackRange"
                          options={[
                            { label: "All", value: "0" },
                            { label: "weekly", value: "weekly" },
                            { label: "monthly", value: "monthly" },
                            { label: "quarterly", value: "quarterly" },
                          ]}
                        />
                      </div>
                    ) : (
                      <SelectDropdown
                        value={String(brgyFilter)}
                        onValueChange={(val) => setBrgyFilter(Number(val))}
                        placeholder="Barangay"
                        id="Admin_IndivFeedbackBrgy"
                        options={[
                          { label: "All", value: "0" },
                          ...(barangays?.map((brgy) => ({
                            label: String(brgy.name),
                            value: String(brgy.id),
                          })) ?? []),
                        ]}
                      />
                    )}
                    {ratingFilter || brgyFilter ? (
                      <button
                        onClick={() => setRatingFilter("")}
                        id="Admin_IndivFeedbackRatingClear"
                      >
                        <X size={14} />
                      </button>
                    ) : null}
                  </div>
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
                      desc={feedback.message}
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

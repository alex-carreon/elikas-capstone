import {
  Flag,
  ThumbsUp,
  ThumbsDown,
  UserIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import colors from "@/constants/colors";
import React, { useEffect, useState } from "react";
import { bigSmile } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import AlertDialogue from "./AlertDialogue";
import { createPortal } from "react-dom";
import Radio from "./Radio";
import api from "@/api";
import { Spinner } from "@/components/ui/spinner";
import ButtonComp from "./Button";
import { Link } from "react-router";
import { toast } from "sonner";
import { Skeleton } from "./ui/skeleton";
import brgyProfile from "@/assets/brgyProfile.svg";
import adminProfile from "@/assets/adminProfile.svg";

type Reasons = {
  id: number;
  reason_label: string;
};

interface PostRowProps {
  seed: string;
  username: string;
  timePosted: string;
  description: string;
  level?: string;
  levelDescription?: string;
  locationVerified?: boolean;
  flagCount?: number;
  expiryDays?: number;
  image?: string;
  isSimple?: boolean;
  children?: React.ReactNode;
  id?: number;
  isHazardPost: boolean;
  isEvacComments: boolean;
  isMyHazard?: boolean;
  role?: string;
}

function PostRow({
  seed,
  username,
  timePosted,
  description,
  level,
  levelDescription,
  image,
  isSimple,
  children,
  id,
  isHazardPost,
  isEvacComments,
  isMyHazard,
  role,
}: PostRowProps) {
  const [report, setReport] = useState(false);
  const [upvote, setUpvote] = useState(0);
  const [vote, setVote] = useState<1 | -1 | 0>(0);
  const [downvote, setDownvote] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [voteLoad, setVoteLoad] = useState(false);
  const [reasons, setReasons] = useState<Reasons[]>([]);
  const [reasonLoad, setReasonLoad] = useState(false);
  const [openPhoto, sentOpenPhoto] = useState(false);

  const avatar = seed
    ? createAvatar(bigSmile, {
        seed: seed,
        backgroundColor: ["b6e3f4", "c0aede", "d1d4f9"],
        radius: 50,
        scale: 90,
        accessoriesProbability: 50,
        eyes: ["cheery", "normal", "starstruck", "winking"],
        mouth: ["braces", "gapSmile", "kawaii", "openedSmile", "teethSmile"],
      })
    : null;

  const dataUri = avatar?.toDataUri() ?? "";

  const getFlagged = async () => {
    try {
      if (isHazardPost) {
        const response = await api.get(`/flood-paths/${id}`);
        const flagged = response.data.user_flagged;
        setReport(flagged);
      }

      if (isEvacComments) {
        const response = await api.get(`/comments/${id}`);
        const flagged = response.data.user_flagged;
        setReport(flagged);
      }
    } catch (err: any) {
      console.log(err.response.data);
    }
  };

  const getVotes = async () => {
    try {
      setVoteLoad(true);

      if (isHazardPost) {
        const response = await api.get(`/flood-paths/${id}`);
        setUpvote(response.data.flood_path.upvotes);
        setDownvote(response.data.flood_path.downvotes);

        const voted = response.data.user_vote;

        if (voted === 1) {
          setVote(1);
        } else if (voted === -1) {
          setVote(-1);
        } else setVote(0);
      }

      if (isEvacComments) {
        const response = await api.get(`/comments/${id}`);

        setUpvote(response.data.vote);
        setDownvote(response.data.downvote);

        const voted = response.data.user_vote;
        if (voted === 1) {
          setVote(1);
        } else if (voted === -1) {
          setVote(-1);
        } else setVote(0);
      }
    } catch (err: string | any) {
      console.log(err.message || "An error occurred");
    } finally {
      setVoteLoad(false);
    }
  };

  const getFlags = async () => {
    try {
      setReasonLoad(true);
      const response = await api.get("/flag-reasons");
      setReasons(response.data.reasons);
    } catch (err: any) {
      console.log(err.response.data);
    } finally {
      setReasonLoad(false);
    }
  };

  useEffect(() => {
    getVotes();
    getFlagged();
  }, []);

  useEffect(() => {
    if (openDialog) {
      getFlags();
    }
  }, [openDialog]);

  const handleVote = async (voteValue: number) => {
    try {
      setVoteLoad(true);

      if (isHazardPost) {
        const response = api.post(`/flood-paths/${id}/vote`, {
          vote: voteValue,
        });

        toast.promise(response, {
          error: (err: any) => {
            if (err.response.data.message) {
              return err.response.data.message;
            }
            return "An unexpected error occurred. Please try again.";
          },
        });
      }

      if (isEvacComments) {
        const response = api.post(`/comments/${id}/vote`, {
          vote: voteValue,
        });

        toast.promise(response, {
          error: (err: any) => {
            if (err.response.data.message) {
              return err.response.data.message;
            }
            return "An unexpected error occurred. Please try again.";
          },
        });
      }

      getVotes();
    } catch (error) {
      console.log("Error submitting vote:", error);
      setVoteLoad(false);
    }
  };

  const handleFlag = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isHazardPost) {
        const response = api.post(`/flood-paths/${id}/flag`, {
          reason_id: reason,
        });

        console.log(response);

        toast.promise(response, {
          loading: "Flagging this comment...",
          success:
            "Comment has been flagged! Thank you for making this community safer for everyone.",
          error: (err: any) => {
            if (err.response.data.message) {
              return err.response.data.message;
            }
            return "An unexpected error occurred. Please try again.";
          },
          position: "top-center",
        });

        response.then(() => {
          setOpenDialog(false);
          getFlagged();
        });
      }

      if (isEvacComments) {
        const response = api.post(`/comments/${id}/flag`, {
          reason_id: reason,
        });

        toast.promise(response, {
          loading: "Flagging this comment...",
          success:
            "Comment has been flagged! Thank you for making this community safer for everyone.",

          error: (err: any) => {
            if (err.response.data.message) {
              return err.response.data.message;
            }
            return "An unexpected error occurred. Please try again.";
          },
          position: "top-center",
        });

        response.then(() => {
          setOpenDialog(false);
          getFlagged();
        });
      }
    } catch (err: any) {
      console.log(err.response.data);
    }
  };

  return (
    <>
      {openDialog &&
        createPortal(
          <AlertDialogue
            open={openDialog}
            title="Flag a Comment"
            description="Why do you think this is an inappropriate comment? Check all that applies."
            buttonText="Report"
            onClose={() => {
              setOpenDialog(false);
            }}
            onClick={(e) => handleFlag(e)}
            contentId="Drawer_ReportDialogContent"
            closeId="Drawer_ReportDialogClose"
            actionId="Drawer_ReportDialogSubmit"
            disabled={report}
          >
            {reasonLoad ? (
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <Skeleton className="w-4 h-4 rounded-lg bg-[#59260B]/30" />
                  <Skeleton className="w-1/2 h-4 rounded-lg bg-[#59260B]/30" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="w-4 h-4 rounded-lg bg-[#59260B]/30" />
                  <Skeleton className="w-1/2 h-4 rounded-lg bg-[#59260B]/30" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="w-4 h-4 rounded-lg bg-[#59260B]/30" />
                  <Skeleton className="w-1/2 h-4 rounded-lg bg-[#59260B]/30" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="w-4 h-4 rounded-lg bg-[#59260B]/30" />
                  <Skeleton className="w-1/2 h-4 rounded-lg bg-[#59260B]/30" />
                </div>
              </div>
            ) : report ? (
              <p className="text-center">You have already flagged this post</p>
            ) : (
              <Radio
                key={1}
                isRequired
                onValueChange={setReason}
                onSubmit={(e) => setReason(e.target.value)}
                options={reasons.map((reason) => ({
                  key: reason.id,
                  id: `FlagReason_${reason.id}`,
                  value: String(reason.id),
                  label: reason.reason_label,
                }))}
              />
            )}
          </AlertDialogue>,
          // </div>,
          document.body,
        )}
      <div className="mt-1 flex gap-2 flex-col">
        <div
          className="flex flex-row items-center text-xs gap-0.5 justify-end mx-2"
          onClick={() => {
            setOpenDialog(true);
          }}
        >
          {report ? (
            <Flag
              id="Drawer_PostFlagBtn"
              fill="#C43E3E"
              strokeWidth={1}
              size={16}
            />
          ) : (
            <Flag id="Drawer_PostFlagBtn" strokeWidth={1} size={16} />
          )}
          <p>Report</p>
        </div>
        <div className="bg-[#B6D6FF] p-3 rounded-lg flex flex-col gap-2">
          <div className="flex flex-row">
            <div className="w-full flex flex-row gap-2">
              {seed ? (
                <img src={dataUri} className="w-10" />
              ) : role === "brgy_op" ? (
                <img src={brgyProfile} className="w-11" />
              ) : role === "admin" ? (
                <img src={adminProfile} className="w-11" />
              ) : (
                <UserIcon className="w-11" />
              )}
              <div className="w-full flex flex-col">
                <div className="flex flex-row justify-between">
                  <p>
                    <b>{username}</b>
                  </p>
                  <p className="text-xs" style={{ color: colors.label }}>
                    {timePosted}
                  </p>
                </div>
                <div className="flex flex-row justify-between">
                  <div>
                    {level && (
                      <p className="text-xs font-semibold text-700">
                        Flood Level: {level}
                      </p>
                    )}

                    {levelDescription && (
                      <p className="text-xs text-gray-500 italic">
                        {levelDescription}
                      </p>
                    )}

                    <p className="text-sm mt-2">
                      {description}
                    </p>
                </div>
                  {isMyHazard && (
                    <div>
                      <Link to={`/HazardForm/${id}`} state={{ from: "/map" }}>
                        <ButtonComp
                          text="Edit"
                          variant="outline"
                          id="Drawer_HazardEdit"
                          heightSize="28px"
                        />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {children}
        </div>

        <Collapsible className="flex flex-col gap-4">
          <div className="px-2 flex flex-row justify-between items-center">
            <div className="flex flex-row gap-3">
              <div
                className="flex flex-row items-center gap-1"
                onClick={() => {
                  const newVote = vote === 1 ? 0 : 1;
                  setVote(newVote);
                  handleVote(1);
                }}
              >
                {vote === 1 ? (
                  <ThumbsUp
                    id="Drawer_PostUpvoteBtn"
                    size={16}
                    strokeWidth={1.5}
                    fill="#FFA215"
                  />
                ) : (
                  <ThumbsUp
                    id="Drawer_PostUpvoteBtn"
                    size={16}
                    strokeWidth={1.5}
                  />
                )}
                <p className="text-xs flex flex-row">
                  {voteLoad ? <Spinner className="w-6" /> : `(${upvote})`}
                </p>
              </div>
              <div
                className="flex flex-row items-center gap-1"
                onClick={() => {
                  const newVote = vote === -1 ? 0 : -1;
                  setVote(newVote);
                  handleVote(-1);
                }}
              >
                {vote === -1 ? (
                  <ThumbsDown
                    id="Drawer_PostDownvoteBtn"
                    size={16}
                    strokeWidth={1.5}
                    fill="#642424"
                  />
                ) : (
                  <ThumbsDown
                    id="Drawer_PostDownvoteBtn"
                    size={16}
                    strokeWidth={1.5}
                  />
                )}
                <p className="text-xs flex flex-row">
                  {voteLoad ? <Spinner className="w-6" /> : `(${downvote})`}
                </p>
              </div>
            </div>
            {isSimple || image?.length === 0 ? null : (
              <CollapsibleTrigger
                id="Drawer_PostDetailsTrigger"
                className="border rounded-lg px-2 flex shrink items-center"
                style={{ color: colors.heading, borderColor: colors.heading }}
                onClick={() => sentOpenPhoto(!openPhoto)}
              >
                {openPhoto ? (
                  <ChevronUpIcon className="ml-auto group-data-[state=open]:rotate-180" />
                ) : (
                  <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
                )}
                View Photo
              </CollapsibleTrigger>
            )}
          </div>
          <CollapsibleContent id="Drawer_PostDetailsContent">
            {image ? (
              <>
                <img src={image} />
              </>
            ) : null}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </>
  );
}

export default PostRow;

import { Flag, ThumbsUp, ThumbsDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import colors from "@/constants/colors";
import React, { useEffect, useState, type ReactHTMLElement } from "react";
import { bigSmile, identicon } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import AlertDialogue from "./AlertDialogue";
import { createPortal } from "react-dom";
import Radio from "./Radio";
import api from "@/api";
import { Spinner } from "@/components/ui/spinner";

interface PostRowProps {
  username: string;
  timePosted: string;
  description: string;
  level?: string;
  locationVerified?: boolean;
  flagCount?: number;
  expiryDays?: number;
  image?: string;
  isSimple?: boolean;
  children?: React.ReactNode;
  id?: number;
  isHazardPost: boolean;
  isEvacComments: boolean;
}

function PostRow({
  username,
  timePosted,
  description,
  level,
  locationVerified,
  flagCount,
  expiryDays,
  image,
  isSimple,
  children,
  id,
  isHazardPost,
  isEvacComments,
}: PostRowProps) {
  const [report, setReport] = useState(false);
  const [upvote, setUpvote] = useState(0);
  const [vote, setVote] = useState<1 | -1 | 0>(0);
  const [downvote, setDownvote] = useState(0);
  const [seed, setSeed] = useState("Felix");
  const [openDialog, setOpenDialog] = useState(false);
  const [reason, setReason] = useState("");
  const [voteLoad, setVoteLoad] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  console.log("openDialog", openDialog);

  const avatar = createAvatar(bigSmile, {
    seed: seed,
    backgroundColor: ["b6e3f4", "c0aede", "d1d4f9"],
    radius: 50,
    scale: 90,
    accessoriesProbability: 50,
    eyes: ["cheery", "normal", "starstruck", "winking"],
    mouth: ["braces", "gapSmile", "kawaii", "openedSmile", "teethSmile"],
  });

  const dataUri = avatar.toDataUri();

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
        console.log("commend Id", response);

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

  useEffect(() => {
    getVotes();
  }, []);

  const handleVote = async (voteValue: number) => {
    try {
      setVoteLoad(true);

      if (isHazardPost) {
        const response = await api.post(`/flood-paths/${id}/vote`, {
          vote: voteValue,
        });
      }

      if (isEvacComments) {
        const response = await api.post(`/comments/${id}/vote`, {
          vote: voteValue,
        });
      }

      getVotes();
    } catch (error) {
      console.log("Error submitting vote:", error);
      setVoteLoad(false);
    }
  };

  const handleSubmit = () => {
    console.log("reason", reason);

    setOpenDialog(false);
  };

  const handleRemove = () => {
    console.log("Report Removed");
  };

  return (
    <>
      {report &&
        openDialog &&
        createPortal(
          <AlertDialogue
            open={openDialog}
            title="Flag a Comment"
            description="Why do you think this is an inappropriate comment? Check all that applies."
            buttonText="Report"
            onClose={() => {
              setOpenDialog(false);
              setReport(false);
              console.log("onClose called");
            }}
            onClick={handleSubmit}
            contentId="Drawer_ReportDialogContent"
            closeId="Drawer_ReportDialogClose"
            actionId="Drawer_ReportDialogSubmit"
          >
            <Radio
              isRequired
              onValueChange={setReason}
              onSubmit={(e) => setReason(e.target.value)}
              options={[
                {
                  label: "False Information",
                  value: "1",
                  id: "Drawer_ReportReason1",
                },
                {
                  label: "Spam / Irrelevant",
                  value: "2",
                  id: "Drawer_ReportReason2",
                },
                {
                  label: "Offensive Language",
                  value: "3",
                  id: "Drawer_ReportReason3",
                },
                {
                  label: "Dangerous or Misleading",
                  value: "4",
                  id: "Drawer_ReportReason4",
                },
              ]}
            />
          </AlertDialogue>,
          // </div>,
          document.body,
        )}
      <div className="mt-1 flex gap-2 flex-col">
        <div
          className="flex flex-row items-center text-xs gap-0.5 justify-end mx-2"
          onClick={() => {
            setReport(!report);
            setOpenDialog(true);
          }}
        >
          {report ? (
            <Flag
              id="Drawer_PostFlagBtn"
              fill="#C43E3E"
              strokeWidth={1}
              size={16}
              onClick={handleRemove}
            />
          ) : (
            <Flag id="Drawer_PostFlagBtn" strokeWidth={1} size={16} />
          )}
          <p>Report</p>
        </div>
        <div className="bg-[#B6D6FF] p-3 rounded-lg flex flex-col gap-2">
          <div className="flex flex-row">
            <div className="w-full flex flex-row gap-2">
              <img src={dataUri} className="w-10" />
              <div className="w-full flex flex-col">
                <div className="flex flex-row justify-between">
                  <p>
                    <b>{username}</b>
                  </p>
                  <p className="text-xs" style={{ color: colors.label }}>
                    {timePosted}
                  </p>
                </div>
                {level && <p className="text-xs">Flood Level: {level}</p>}
                <p className="text-xs">{description}</p>
              </div>
            </div>
          </div>
          {children}
        </div>

        <Collapsible className="">
          <div className="px-2 flex flex-row gap-4">
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
                Upvote {voteLoad ? <Spinner className="w-6" /> : `(${upvote})`}
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
                Downvote
                {voteLoad ? <Spinner className="w-6" /> : `(${downvote})`}
              </p>
            </div>
            {isSimple || image?.length === 0 ? null : (
              <CollapsibleTrigger
                id="Drawer_PostDetailsTrigger"
                className="text-xs underline italic flex ml-auto"
              >
                See More
              </CollapsibleTrigger>
            )}
          </div>
          <CollapsibleContent id="Drawer_PostDetailsContent">
            {/* <div className="border-2 border-solid rounded-lg p-4 m-2 flex flex-col gap-1">
              <div className="flex flex-row gap-2 text-xs">
                <ThumbsUp size={16} strokeWidth={1.5} fill="#FFA215" />
                {upvote}
              </div>
              <div className="flex flex-row gap-2 text-xs">
                <ThumbsDown size={16} strokeWidth={1.5} fill="#642424" />
                {downvote}
              </div>
              <div className="flex flex-row gap-2 text-xs">
                <Flag size={16} strokeWidth={1.5} fill="#C43E3E" /> {flagCount}
                {expiryDays && (
                  <p
                    className="italic text-xs flex ml-auto"
                    style={{ color: colors.label }}
                  >
                    Expires in {expiryDays} days
                  </p>
                )}
              </div>
            </div> */}
            <img src={image} className="m-2" />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </>
  );
}

export default PostRow;

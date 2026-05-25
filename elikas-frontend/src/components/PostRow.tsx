import { Flag, ThumbsUp, ThumbsDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import colors from "@/constants/colors";
import { useState } from "react";
import { bigSmile } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import AlertDialogue from "./AlertDialogue";
import { createPortal } from "react-dom";
import Radio from "./Radio";

interface PostRowProps {
  username: string;
  timePosted: string;
  description: string;
  locationVerified: boolean;
  upVotesCount: number;
  downVotesCount: number;
  flagCount: number;
  expiryDays: number;
  image?: string;
}

function PostRow({
  username,
  timePosted,
  description,
  locationVerified,
  upVotesCount,
  downVotesCount,
  flagCount,
  expiryDays,
  image,
}: PostRowProps) {
  const [report, setReport] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [seed, setSeed] = useState("Felix");
  const [openDialog, setOpenDialog] = useState(false);
  const [reason, setReason] = useState("");

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
          >
            <Radio
              isRequired
              onValueChange={setReason}
              onSubmit={(e) => setReason(e.target.value)}
              options={[
                { label: "False Information", value: "1" },
                { label: "Spam / Irrelevant", value: "2" },
                { label: "Offensive Language", value: "3" },
                { label: "Dangerous or Misleading", value: "4" },
              ]}
            />
          </AlertDialogue>,
          // </div>,
          document.body,
        )}
      <div className="mt-1 flex gap-1 flex-col">
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
        <div className="bg-[#B6D6FF] p-3 rounded-lg flex flex-row">
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
              <p className="text-xs">{description}</p>
            </div>
          </div>
        </div>
        <Collapsible className="">
          <div className="px-2 flex flex-row gap-4">
            <div
              className="flex flex-row items-center gap-1"
              onClick={() => setVote(vote === "up" ? null : "up")}
            >
              {vote === "up" ? (
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
              <p className="text-xs">Upvote (1)</p>
            </div>
            <div
              className="flex flex-row items-center gap-1"
              onClick={() => setVote(vote === "down" ? null : "down")}
            >
              {vote === "down" ? (
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

              <p className="text-xs">Downvote</p>
            </div>
            <CollapsibleTrigger
              id="Drawer_PostDetailsTrigger"
              className="text-xs underline italic flex ml-auto"
            >
              See More
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent id="Drawer_PostDetailsContent">
            <div className="border-2 border-solid rounded-lg p-4 m-2 flex flex-col gap-1">
              <p className="flex flex-row text-xs">
                <b>Location Verified</b>:{" "}
                {locationVerified ? <p>Yes</p> : <p>No</p>}
              </p>
              <div className="flex flex-row gap-2 text-xs">
                <ThumbsUp size={16} strokeWidth={1.5} fill="#FFA215" />
                {upVotesCount}
              </div>
              <div className="flex flex-row gap-2 text-xs">
                <ThumbsDown size={16} strokeWidth={1.5} fill="#642424" />
                {downVotesCount}
              </div>
              <div className="flex flex-row gap-2 text-xs">
                <Flag size={16} strokeWidth={1.5} fill="#C43E3E" /> {flagCount}
                <p
                  className="italic text-xs flex ml-auto"
                  style={{ color: colors.label }}
                >
                  Expires in {expiryDays} days
                </p>
              </div>
            </div>
            <img src={image} className="m-2" />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </>
  );
}

export default PostRow;

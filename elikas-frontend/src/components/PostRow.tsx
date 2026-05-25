import { Flag, ThumbsUp, ThumbsDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import colors from "@/constants/colors";
import { useState } from "react";

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
        <p>Report</p>
      </div>
      <div className="bg-[#B6D6FF] p-4 rounded-lg flex gap-0.5 flex-col">
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
              <ThumbsUp id="Drawer_PostUpvoteBtn" size={16} strokeWidth={1.5} />
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
  );
}

export default PostRow;

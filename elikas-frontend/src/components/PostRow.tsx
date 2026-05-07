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
    <div className="mt-1 flex gap-1 flex-col">
      <div
        className="flex flex-row items-center text-xs gap-0.5 justify-end mx-2"
        onClick={() => setReport(!report)}
      >
        {report ? (
          <Flag fill="#C43E3E" strokeWidth={1} size={16} />
        ) : (
          <Flag strokeWidth={1} size={16} />
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
              <ThumbsUp size={16} strokeWidth={1.5} fill="#FFA215" />
            ) : (
              <ThumbsUp size={16} strokeWidth={1.5} />
            )}
            <p className="text-xs">Upvote (1)</p>
          </div>
          <div
            className="flex flex-row items-center gap-1"
            onClick={() => setVote(vote === "down" ? null : "down")}
          >
            {vote === "down" ? (
              <ThumbsDown size={16} strokeWidth={1.5} fill="#642424" />
            ) : (
              <ThumbsDown size={16} strokeWidth={1.5} />
            )}

            <p className="text-xs">Downvote</p>
          </div>
          <CollapsibleTrigger className="text-xs underline italic flex ml-auto">
            See More
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
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

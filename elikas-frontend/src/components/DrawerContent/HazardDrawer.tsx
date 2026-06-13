import { DrawerClose } from "@/components/ui/drawer";
import { CircleX, X } from "lucide-react";
import ButtonComp from "@/components/Button";
import CSIcon from "@/assets/Map/CrowdsourceIcon.svg";
import PostRow from "@/components/PostRow";
import { Link } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { differenceInDays } from "date-fns";
import api from "@/api";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type FloodLevel = {
  id: number;
  level_name: string;
};

type FloodPath = {
  id: number;
  is_expired: boolean;
  is_deactivated: boolean;
  level: FloodLevel;
  path: [number, number][];
};

type FloodDetails = {
  id: number;
  element_id: number;
  media: string[];
  is_expired: boolean;
  is_deactivated: boolean;
  flood_levels: FloodLevel;
  path: [number, number][];
  posted_by: string;
  description: string;
  upvotes: number;
  downvotes: number;
  last_confirmed: string;
  expiry: string;
  posted_at: string;
  avatar_seed: string;
  role: string;
};

function HazardDrawer({ selectedPin }: { selectedPin: FloodPath }) {
  const [loading, setLoading] = useState(false);
  const [floodDetails, setFloodDetails] = useState<FloodDetails | undefined>();
  const [daysLeft, setDaysleft] = useState(0);
  const [upVote, setUpvote] = useState(0);
  const [downVote, setDownvote] = useState(0);
  const [isMine, setIsMine] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const convertDateTime = (utcString: string) => {
    const zoned = toZonedTime(new Date(utcString), "Asia/Manila");
    return format(zoned, "MMM d, yyyy h:mm a");
  };

  useEffect(() => {
    if (!selectedPin) return;

    const getFloodDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/flood-paths/${selectedPin.id}`);
        const floodDetails = await response.data.flood_path;
        setFloodDetails(floodDetails);
        setUpvote(floodDetails.upvotes);
        setDownvote(floodDetails.downvotes);
        setIsMine(response.data.is_mine);

        const today = new Date();
        const expDate = new Date(floodDetails.expiry);

        setDaysleft(differenceInDays(expDate, today));
      } catch (err: string | any) {
        console.log(err.message || "An error occurred");
      }
      setLoading(false);
    };
    getFloodDetails();
  }, [selectedPin?.id]);

  return loading ? (
    <>
      <div className="w-full px-4 pb-4 flex flex-col gap-4">
        <div className="w-full flex flex-row justify-between">
          <div className="flex flex-row gap-2">
            <div className="flex flex-row items-center gap-2 px-4">
              <img src={CSIcon} className="w-12" />
              <p className="text-base">
                <b>Crowdsourced Updates</b>
              </p>
            </div>
          </div>
          <DrawerClose id="DrawerMark_CloseBtn" className="self-start">
            <CircleX size={28} fill="#CECECE" strokeWidth={1} />
          </DrawerClose>
        </div>
        <div className="w-full flex flex-col self-start gap-2">
          <div className="h-full w-full flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full bg-[#59260B]/30" />
            <div className="w-full space-y-2 items-start justify-center">
              <Skeleton className="h-4 w-full bg-[#59260B]/30" />
              <Skeleton className="h-4 w-[200px] bg-[#59260B]/30" />
            </div>
          </div>
          <Skeleton className="h-56 w-full bg-[#59260B]/30" />
        </div>
      </div>
    </>
  ) : (
    <>
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setSelectedImage(null)} // click outside to close
        >
          <img
            src={selectedImage}
            className="max-w-full max-h-full object-contain p-4"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking image
          />
          <button
            className="absolute top-4 right-4 text-white"
            onClick={() => setSelectedImage(null)}
          >
            <X size={28} />
          </button>
        </div>
      )}
      <div className="px-4 pb-4 flex flex-col overflow-y-auto">
        <div className="w-full flex flex-row justify-between">
          <div className="flex flex-row gap-2">
            <div className="flex flex-row items-center gap-2 px-4">
              <img src={CSIcon} className="w-12" />
              <p className="text-base">
                <b>Crowdsourced Updates</b>
              </p>
            </div>
          </div>
          <DrawerClose id="DrawerMark_CloseBtn" className="self-start">
            <CircleX size={28} fill="#CECECE" strokeWidth={1} />
          </DrawerClose>
        </div>
        {floodDetails ? (
          <PostRow
            username={floodDetails.posted_by}
            timePosted={convertDateTime(floodDetails.last_confirmed)}
            description={floodDetails.description}
            isEvacComments={false}
            isHazardPost={true}
            // upvotes={upVote}
            // downvotes={downVote}
            level={floodDetails.flood_levels.level_name}
            expiryDays={daysLeft}
            id={floodDetails.id}
            isSimple
            isMyHazard={isMine}
            seed={floodDetails.avatar_seed}
            role={floodDetails.role}
          >
            <div
              className={cn(
                "gap-1 grid",
                floodDetails.media.length === 1
                  ? "grid-cols-1"
                  : floodDetails.media.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-3",
              )}
            >
              {floodDetails.media.map((media, index) => (
                <img
                  key={index}
                  src={media}
                  className="w-full h-24 object-cover cursor-pointer"
                  onClick={() => setSelectedImage(media)}
                />
              ))}
            </div>
          </PostRow>
        ) : (
          <>
            <div className="h-70 flex justify-center items-center">
              <div className="flex flex-col justify-center items-center gap-2">
                <div className="flex flex-col justify-center items-center">
                  <p className="text-center">Join the community!</p>
                  <p className="text-center">
                    Create an account to view other people's comments.
                  </p>
                </div>
                <Link to="/Login">
                  <ButtonComp
                    text="Sign in"
                    id="Drawer_HazardSignIn"
                    variant="primary"
                    heightSize="40px"
                    widthSize="100px"
                  />
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default HazardDrawer;

import { DrawerClose } from "@/components/ui/drawer";
import { CircleX } from "lucide-react";
import ButtonComp from "@/components/Button";
import CSIcon from "@/assets/Map/CrowdsourceIcon.svg";
import PostRow from "@/components/PostRow";
import { Link } from "react-router";
import sample from "@/assets/Map/SamplePhoto.png";
import { Skeleton } from "@/components/ui/skeleton";

type FloodLevel = {
  id: number;
  level_name: string;
};

type FloodDetails = {
  id: number;
  element_id: number;
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
};

function HazardDrawer({
  loading,
  floodDetails,
  daysLeft,
}: {
  loading: boolean;
  floodDetails: FloodDetails | undefined;
  daysLeft: number;
}) {
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
      <div className="px-4 pb-4 flex flex-col">
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
            timePosted={floodDetails.posted_at}
            description={floodDetails.description}
            upVotesCount={floodDetails.upvotes}
            downVotesCount={floodDetails.downvotes}
            level={floodDetails.flood_levels.level_name}
            expiryDays={daysLeft}
            isSimple
          >
            <img src={sample} />
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

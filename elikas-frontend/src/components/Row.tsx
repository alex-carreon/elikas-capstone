import colors from "@/constants/colors";
import { Link, type To } from "react-router";
import ButtonComp from "./Button";

interface rowProps {
  postId: string;
  title: string;
  address: string;
  datePosted: string;
  isAvailable?: boolean;
  availability?: boolean;
  isExpired?: boolean;
  link: string;
}

function Row({
  postId,
  title,
  address,
  datePosted,
  isAvailable,
  availability,
  isExpired,
  link,
}: rowProps) {
  return (
    <div className="border border-#9E9898 rounded-md p-2 flex flex-row items-center justify-between">
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium" style={{ color: colors.heading }}>
          {postId}
        </p>
        <div>
          <p
            className="text-xl font-medium"
            style={{ color: colors.activeIcon }}
          >
            {title}
          </p>
          <p className="text-sm" style={{ color: colors.heading }}>
            {address}
          </p>
          <p className="text-sm font-bold" style={{ color: colors.heading }}>
            {availability ? (isAvailable ? "AVAILABLE" : "CLOSED") : null}
            {isExpired ? "EXPIRED" : null}
          </p>
        </div>
        <p className="text-xs" style={{ color: colors.heading }}>
          {datePosted}
        </p>
      </div>
      <Link to={link} state={{ from: location.pathname }}>
        <ButtonComp
          variant="important"
          text="Details"
          id="History_PinDetailsBtn"
          heightSize="45px"
          widthSize="100%"
        ></ButtonComp>
      </Link>
    </div>
  );
}

export default Row;

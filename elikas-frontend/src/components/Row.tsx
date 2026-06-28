import colors from "@/constants/colors";
import { Link } from "react-router";
import ButtonComp from "./Button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

interface rowProps {
  postId?: string;
  title?: string;
  address?: string;
  desc?: string;
  datePosted?: string;
  isAvailable?: boolean;
  availability?: boolean;
  isExpired?: boolean;
  isDeactivated?: boolean;
  isUserDeac?: boolean;
  link?: string;
  buttonId?: string;
  children?: React.ReactNode;
  btnText?: string;
  showBtn?: boolean;
  showCollapsible?: boolean;
  collapseContent?: any;
  onClick?: (e?: any) => void;
}

function Row({
  postId,
  title,
  address,
  datePosted,
  isAvailable,
  availability,
  isExpired,
  isDeactivated,
  isUserDeac,
  link,
  buttonId,
  desc,
  children,
  btnText,
  showBtn,
  showCollapsible,
  collapseContent,
  onClick,
}: rowProps) {
  const [openCollapse, setOpenCollapse] = useState(false);

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
          <p className="text-sm" style={{ color: colors.heading }}>
            {desc}
          </p>
          <p className="text-sm font-bold" style={{ color: colors.heading }}>
            {availability ? (isAvailable ? "AVAILABLE" : "CLOSED") : null}
            <div>
              <span>{isExpired ? "EXPIRED" : null}</span>
              <span> {isDeactivated ? "DEACTIVATED" : null}</span>
              <span> {isUserDeac ? "USER-D" : null}</span>
            </div>
          </p>
          {showCollapsible && (
            <Collapsible className="w-full flex flex-col rounded-md mt-2">
              <CollapsibleTrigger
                onClick={() => setOpenCollapse(!openCollapse)}
                id="History_FiltersTrigger"
              >
                <div className="w-full flex flex-row mb-2 text-sm">
                  Message
                  {openCollapse ? (
                    <ChevronUpIcon
                      size={20}
                      className="ml-2 group-data-[state=open]:rotate-180"
                    />
                  ) : (
                    <ChevronDownIcon
                      size={20}
                      className="ml-2 group-data-[state=open]:rotate-180"
                    />
                  )}
                </div>{" "}
              </CollapsibleTrigger>
              <CollapsibleContent
                id="History_FiltersContent"
                className="flex flex-col items-center pr-2.5 pt-0 text-xs"
              >
                {collapseContent}
              </CollapsibleContent>
            </Collapsible>
          )}
          {children}
        </div>
        <p className="text-xs" style={{ color: colors.heading }}>
          {datePosted}
        </p>
      </div>
      {showBtn &&
        (link ? (
          <Link
            to={link ? link : ""}
            state={{ from: location.pathname }}
            className="ml-2"
          >
            <ButtonComp
              variant="important"
              text={btnText ? btnText : "Details"}
              id={buttonId ? buttonId : ""}
              heightSize="45px"
              widthSize="100%"
            ></ButtonComp>
          </Link>
        ) : (
          <div className="ml-2">
            <ButtonComp
              variant="important"
              text={btnText ? btnText : "Details"}
              id={buttonId ? buttonId : ""}
              heightSize="45px"
              widthSize="100%"
              onClick={onClick}
            ></ButtonComp>
          </div>
        ))}
    </div>
  );
}

export default Row;

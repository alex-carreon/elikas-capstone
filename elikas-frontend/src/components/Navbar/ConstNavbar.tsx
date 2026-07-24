import LogoComp from "@/components/Logo";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Outlet, useLocation } from "react-router";
import { useNavigate } from "react-router";
import AlertDialogue from "../AlertDialogue";
import { useUserContext } from "@/context/AuthContext";

function ConstNavbar({ redirect }: { redirect?: string }) {
  const [showLeave, setShowLeave] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const { role } = useUserContext();

  return (
    <>
      {showLeave && (
        <AlertDialogue
          contentId="SMS_LeaveContent"
          closeId="SMS_LeaveClose"
          actionId="SMS_LeaveBtn"
          actionId2="SMS_StayBtn"
          open={showLeave}
          title="You are about to leave the SMS Form"
          description="By leaving this page, you will need to re-enter your token."
          buttonText="Stay"
          buttonText2="Leave"
          onClose={() => {
            setShowLeave(false);
          }}
          onClick={() => {
            setShowLeave(false);
          }}
          onClick2={() => {
            setShowLeave(false);
            redirect ? navigate(redirect) : navigate(-1);
          }}
        />
      )}
      <div className="fixed top-0 left-0 right-0 z-50 h-content flex justify-center">
        <div className="w-full flex flex-row justify-start items-center p-3 shadow-lg bg-white">
          <ArrowLeft
            id="Navbar_Back"
            onClick={() => {
              if (location.pathname === "/SMS") {
                setShowLeave(true);
              } else {
                redirect ? navigate(redirect) : navigate(-1);
              }
            }}
          />
          <div className="flex flex-row gap-2 justify-center items-center w-full">
            <LogoComp />
            {role === "brgy_op" && (
              <div className="h-fit w-fit px-4 py-1 rounded-xl bg-[#5f80aa]">
                <p className="text-xs text-white">Barangay Mode</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Outlet />
    </>
  );
}

export default ConstNavbar;

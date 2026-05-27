import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  MapPin,
  Phone,
  ScrollText,
  Map,
  UserRound,
  Landmark,
} from "lucide-react";
import WhiteLogo from "../WhiteLogo";
import SidebarRow from "../SidebarRow";
import api from "@/api";
import { useState } from "react";
import { toast } from "sonner";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";
import { useNavigate } from "react-router";
import ButtonComp from "@/components/Button";

function AdminSidebar() {
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      localStorage.clear();

      const logoutPromise = new Promise(async (resolve, reject) => {
        const response = await api.post("/auth/logout");

        const userData = await response;

        if (!response) {
          reject(setError("Logout failed"));
        } else {
          resolve(userData);
          await signOut(auth);
        }
      });

      toast.promise(logoutPromise, {
        loading: "Logging you out...",
        success: "You're logged out!",
        position: "top-center",
      });

      logoutPromise.then(() => {
        navigate("/");
      });
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <Sidebar className="h-full" collapsible="offcanvas" variant="sidebar">
      <SidebarHeader className="h-1/5 p-0">
        <div className="h-full w-full bg-gradient-to-r from-[#FFA011] to-[#F3C962] flex flex-col items-center justify-center gap-2">
          <WhiteLogo />
          <p className="text-center text-4xl font-bold BeVietnamPro text-white">
            Admin Panel
          </p>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4 flex flex-col gap-2">
        <SidebarRow
          label="Map"
          description="Live view of the map (View only)"
          icon={Map}
          link=""
          id="Admin_BurgerNavMap"
        />
        <SidebarRow
          label="User Information"
          description="Individual Details and User Feedback"
          icon={UserRound}
          link=""
          id="Admin_BurgerNavUsers"
        />
        <SidebarRow
          label="Barangay Management"
          description="Manage Barangay Accounts"
          icon={Landmark}
          link=""
          id="Admin_BurgerNavBrgy"
        />
        <SidebarRow
          label="Pins"
          description="Evacuation and Hazard Pins"
          icon={MapPin}
          link=""
          id="Admin_BurgerNavPins"
        />
        <SidebarRow
          label="Emergency Contacts"
          description="Hotline Numbers"
          icon={Phone}
          link=""
          id="Admin_BurgerNavHotlines"
        />
        <SidebarRow
          label="Audit Logs"
          description="See each admin’s activity"
          icon={ScrollText}
          link=""
          id="Admin_BurgerNavLogs"
        />
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter className="flex justify-center items-center">
        <ButtonComp
          text="Logout"
          variant="primary"
          id="Admin_LogOutBtn"
          onClick={handleLogout}
          heightSize="38px"
          widthSize="90%"
        ></ButtonComp>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AdminSidebar;

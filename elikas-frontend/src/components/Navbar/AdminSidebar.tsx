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
  Wifi,
} from "lucide-react";
import WhiteLogo from "../Admin/WhiteLogo";
import SidebarRow from "../SidebarRow";
import api from "@/api";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router";
import ButtonComp from "@/components/Button";

function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: "map",
      label: "Map",
      description: "Live view of the map (View only)",
      icon: Map,
      link: "/admin-map",
      testId: "Admin_BurgerNavMap",
    },
    {
      id: "indiv",
      label: "User Information",
      description: "Individual Details and User Feedback",
      icon: UserRound,
      link: "/admin-indiv",
      testId: "Admin_BurgerNavUsers",
    },
    {
      id: "brgy",
      label: "Barangay Management",
      description: "Manage Barangay Accounts",
      icon: Landmark,
      link: "/admin-brgy",
      testId: "Admin_BurgerNavBrgy",
    },
    {
      id: "pins",
      label: "Pins",
      description: "Evacuation and Hazard Pins",
      icon: MapPin,
      link: "/admin-pins",
      testId: "Admin_BurgerNavPins",
    },
    {
      id: "sensors",
      label: "Sensors",
      description: "Barangay Registered Sensors",
      icon: Wifi,
      link: "/admin-sensors",
      testId: "Admin_BurgerNavPins",
    },
    {
      id: "contacts",
      label: "Emergency Contacts",
      description: "Hotline Numbers",
      icon: Phone,
      link: "/admin-hotlines",
      testId: "Admin_BurgerNavHotlines",
    },
    {
      id: "logs",
      label: "Audit Logs",
      description: "See each admin's activity",
      icon: ScrollText,
      link: "/admin-logs",
      testId: "Admin_BurgerNavLogs",
    },
  ];

  const handleLogout = async () => {
    localStorage.clear();

    const response = api.post("/auth/logout");

    toast.promise(response, {
      loading: "Logging you out...",
      success: "You're logged out!",
      position: "top-center",
    });

    response
      .then(() => {
        navigate("/Login");
      })
      .catch((error) => {
        console.error("Error during logout:", error);
        toast.error("An unexpecte error occurred. Please try again later.");
      });
  };

  return (
    <Sidebar className="h-full" collapsible="offcanvas" variant="sidebar">
      <SidebarHeader className="h-1/5 p-0">
        <div className="h-full w-full bg-gradient-to-r from-[#FFA011] to-[#F3C962] flex flex-col items-center justify-center gap-2 p-4">
          <WhiteLogo />
          <p className="text-center text-4xl font-bold BeVietnamPro text-white mx-4">
            Admin Panel
          </p>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4 flex flex-col gap-2">
        {navItems.map((item) => (
          <SidebarRow
            key={item.id}
            label={item.label}
            description={item.description}
            icon={item.icon}
            link={item.link}
            id={item.testId}
            clicked={location.pathname === item.link}
          />
        ))}
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

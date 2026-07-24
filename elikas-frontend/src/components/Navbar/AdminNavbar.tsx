import WhiteLogo from "@/components/Admin/WhiteLogo";
import { useSidebar } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import colors from "@/constants/colors";

function AdminNavbar() {
  const { toggleSidebar } = useSidebar();

  return (
    <>
      <div className="w-full flex flex-row justify-between items-center p-3 shadow-lg bg-[#FFB13B]">
        <div className="flex flex-row items-center gap-2">
          <Menu
            onClick={toggleSidebar}
            strokeWidth={3}
            color={colors.heading}
            id="Admin_BurgerNavBtn"
          />
          <p className="BeVietnamPro font-bold text-white text-xl">Admin</p>
        </div>
        <WhiteLogo />
      </div>
    </>
  );
}

export default AdminNavbar;

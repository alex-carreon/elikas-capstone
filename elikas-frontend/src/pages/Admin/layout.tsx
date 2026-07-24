import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/Navbar/AdminSidebar";
import AdminNavbar from "@/components/Navbar/AdminNavbar";
import { Outlet } from "react-router";

function Layout() {
  return (
    <SidebarProvider
      style={{ "--sidebar-width": "16rem" } as React.CSSProperties}
    >
      <AdminSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <AdminNavbar />
        <main className="">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}

export default Layout;

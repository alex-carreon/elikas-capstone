import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/Navbar/AdminSidebar";
import AdminNavbar from "@/components/Navbar/AdminNavbar";
import { Outlet } from "react-router";

function Layout() {
  return (
    <SidebarProvider
      className="min-h-screen max-w-3xl mx-auto"
      style={{ "--sidebar-width": "16rem" } as React.CSSProperties}
    >
      <AdminSidebar />
      <div className="flex flex-col flex-1">
        <AdminNavbar />
        <main>
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}

export default Layout;

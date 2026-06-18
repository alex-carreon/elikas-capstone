import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/Navbar/AdminSidebar";
import AdminNavbar from "@/components/Navbar/AdminNavbar";
import { Outlet } from "react-router";

function Layout() {
  return (
    <SidebarProvider
      className="min-h-screen max-w-3xl mx-auto flex justify-center"
      style={{ "--sidebar-width": "16rem" } as React.CSSProperties}
    >
      <AdminSidebar />
      <div className="flex flex-1 flex-col max-w-md">
        <AdminNavbar />
        <main className="">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}

export default Layout;

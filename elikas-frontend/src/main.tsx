import { StrictMode } from "react";
import "./index.css";
import "leaflet/dist/leaflet.css";
import App from "./App.tsx";
import ReactDOM from "react-dom/client";
import { Toaster } from "sonner";
import { MapFilterProvider } from "./context/MapFilterContext.tsx";
import { BrowserRouter } from "react-router";
import { registerSW } from "virtual:pwa-register";
import { InstallProvider } from "./context/InstallContext.tsx";

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("New version of eLikas available. Reload?")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log("eLikas is ready to work offline");
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <StrictMode>
      <InstallProvider>
        <MapFilterProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              classNames: {
                toast: "!bg-[#FFF1DD] !font-medium !text-black-500",
                success: "!bg-[#FFF1DD] !text-sm !font-medium !text-green-800",
                error: "!bg-[#FFF1DD] !text-sm !font-medium !text-red-500",
              },
            }}
          />
          <App />
        </MapFilterProvider>
      </InstallProvider>
    </StrictMode>
  </BrowserRouter>,
);

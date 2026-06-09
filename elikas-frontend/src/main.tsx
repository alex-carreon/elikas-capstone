import { StrictMode } from "react";
import "./index.css";
import App from "./App.tsx";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "./context/AuthContext.tsx";
import { Toaster } from "sonner";
import { MapFilterProvider } from "./context/MapFilterContext.tsx";
import { BrowserRouter, Router } from "react-router";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <StrictMode>
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
    </StrictMode>
  </BrowserRouter>,
);

import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.tsx";
import { useUserContext } from "./context/AuthContext.tsx";
import { Navigate } from "react-router-dom";

// Normal Load
import LogIn from "./pages/Authentication/LogIn";
import EmailVerif from "./pages/Authentication/EmailVerif";
import GuestNavbar from "./components/Navbar/GuestNavbar";
import AuthNavbar from "./components/Navbar/AuthNavbar";
import ConstNavbar from "./components/Navbar/ConstNavbar";
import Hotlines from "@/pages/Shared/Hotlines";
import Settings from "@/pages/Shared/Settings";
import ProtectedRoute from "./components/ProtectedRoutes";
import SMS from "./pages/brgy_ops/Forms/SMS";
import History from "@/pages/Shared/History";
import Loading from "./pages/Shared/Loading";
import Profile from "@/pages/Shared/Profile";
import HotlinesForm from "./pages/brgy_ops/Forms/HotlinesForm";
import IndivUsers from "@/pages/Admin/IndivUsers";
import UserDetails from "./pages/Admin/Forms/UserDetails";
import BrgyUsers from "./pages/Admin/BrgyUsers";
import GovopDetails from "./pages/Admin/Forms/GovOpDetails";
import SensorForm from "./pages/brgy_ops/Forms/SensorForm";
import SMSHistory from "./pages/brgy_ops/SMSHistory";
import Pins from "./pages/Admin/Pins";
import Sensors from "@/pages/Admin/Sensors.tsx";
import SensorDetails from "./pages/Admin/Forms/SensorDetails.tsx";
import FlaggedDetails from "./pages/Admin/Forms/FlaggedDetails.tsx";
import HazardDetails from "./pages/Admin/Forms/HazardDetails.tsx";
import HotlinesAdmin from "./pages/Admin/Hotlines.tsx";
import EvacDetails from "./pages/Admin/Forms/EvacDetails.tsx";
import EvacComments from "./pages/Admin/EvacComments.tsx";
import CommentDetails from "./pages/Admin/Forms/CommentDetails.tsx";
import FlaggedCommentDetails from "./pages/Admin/Forms/FlaggedCommentDetails.tsx";
import AuditLogs from "./pages/Admin/AuditLogs.tsx";
import AuditLogDetails from "./pages/Admin/Forms/AuditLogDetails.tsx";
import HotlineDetails from "./pages/Admin/Forms/HotlineDetails.tsx";
import HotlinesAdd from "./pages/Admin/Forms/HotlinesAdd.tsx";
import Map from "./pages/Shared/Map.tsx";

// Lazy load
const SplashRegistration = lazy(
  () => import("@/pages/Authentication/SplashRegistration"),
);
const FormRegistration = lazy(
  () => import("@/pages/Authentication/FormRegistration"),
);
const ContactNo = lazy(() => import("@/pages/Authentication/ContactNo"));
const CustomizeProfile = lazy(
  () => import("@/pages/Authentication/CustomizeProfile"),
);
const Permissions = lazy(() => import("@/pages/Authentication/Permissions"));
const Finish = lazy(() => import("@/pages/Authentication/Finish"));
const ForgotPW = lazy(() => import("@/pages/Authentication/ForgotPW"));
const TermsConditions = lazy(() => import("@/pages/Shared/TermsConditions"));
const Feedback = lazy(() => import("@/pages/Indiv/Feedback"));
const BrgyAdd = lazy(() => import("@/pages/Admin/Forms/GovopAdd"));
const SensorLogs = lazy(() => import("@/pages/Admin/SensorLogs"));
const VerifyOTP = lazy(() => import("@/pages/Indiv/VerifyOTP"));
const ChangeEmail = lazy(() => import("@/pages/Shared/ChangeEmail"));
const Layout = lazy(() => import("@/pages/Admin/layout"));
const EvacForm = lazy(() => import("@/pages/Shared/Forms/EvacForms"));
const HazardForm = lazy(() => import("@/pages/Shared/Forms/HazardForm"));

function RootRedirect() {
  const { role, loading } = useUserContext();

  if (loading) return null;

  if (role) {
    const roleDefault: Record<string, string> = {
      indiv: "/map",
      brgy_op: "/map",
      admin: "/admin-map",
    };
    return <Navigate to={roleDefault[role] ?? "/Login"} replace />;
  }

  return <Map />;
}

function App() {
  return (
    <>
      <AuthProvider>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/Loading" element={<Loading />} />
            <Route path="/Login" element={<LogIn />} />
            <Route path="/ResetPassword" element={<ForgotPW />} />
            <Route path="/Registration">
              <Route path="Splash" element={<SplashRegistration />} />
              <Route path="Form" element={<FormRegistration />} />
              <Route path="Verify" element={<EmailVerif />} />
              <Route path="Contact" element={<ContactNo />} />
              <Route path="CustomProfile" element={<CustomizeProfile />} />
              <Route path="Permissions" element={<Permissions />} />
              <Route path="Finish" element={<Finish />} />
            </Route>
            <Route element={<GuestNavbar />}>
              <Route path="/" element={<RootRedirect />} />
            </Route>

            <Route element={<ConstNavbar />}>
              <Route path="/TermsConditions" element={<TermsConditions />} />
            </Route>

            <Route element={<ConstNavbar redirect="/map" />}>
              <Route path="/Hotlines" element={<Hotlines />} />
            </Route>

            <Route element={<ProtectedRoute userRole={"indiv"} />}>
              <Route element={<ConstNavbar />}>
                <Route path="/VerifyOTP" element={<VerifyOTP />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute userRole={"brgy_op"} />}>
              <Route element={<ConstNavbar />}>
                <Route path="/SMS" element={<SMS />} />
                <Route path="/SMSHistory" element={<SMSHistory />} />
                <Route path="/HotlinesForm" element={<HotlinesForm />} />
                <Route path="/HotlinesForm/:id" element={<HotlinesForm />} />
                <Route path="/SensorForm" element={<SensorForm />} />
                <Route path="/SensorForm/:id" element={<SensorForm />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute userRole={"admin"} />}>
              <Route element={<Layout />}>
                <Route path="/admin-map" element={<Map />} />
                <Route path="/admin-indiv" element={<IndivUsers />} />
                <Route path="/admin-brgy" element={<BrgyUsers />} />
                <Route path="/admin-pins" element={<Pins />} />
                <Route path="/admin-sensors" element={<Sensors />} />
                <Route path="/admin-hotlines" element={<HotlinesAdmin />} />
                <Route path="/admin-logs" element={<AuditLogs />} />
              </Route>

              <Route path="/admin-userDetails/:id" element={<UserDetails />} />
              <Route path="/admin-brgyDetails/:id" element={<GovopDetails />} />
              <Route
                path="/admin-sensorDetails/:id"
                element={<SensorDetails />}
              />
              <Route path="/admin-brgyAdd" element={<BrgyAdd />} />
              <Route path="/admin-flagged/:id" element={<FlaggedDetails />} />
              <Route
                path="/admin-hazardDetails/:id"
                element={<HazardDetails />}
              />
              <Route
                path="/admin-sensorlogs/:sensorcode"
                element={<SensorLogs />}
              />
              <Route path="/admin-evacDetails/:id" element={<EvacDetails />} />
              <Route
                path="/admin-pins/:pinId/comments"
                element={<EvacComments />}
              />
              <Route
                path="/admin-pins/comments/:id"
                element={<CommentDetails />}
              />
              <Route
                path="/admin-flaggedComment/:id"
                element={<FlaggedCommentDetails />}
              />
              <Route path="/admin-logs/:id" element={<AuditLogDetails />} />

              <Route path="/admin-hotlines/add" element={<HotlinesAdd />} />
              <Route path="/admin-hotlines/:id" element={<HotlineDetails />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<ConstNavbar />}>
                <Route path="/EvacForm" element={<EvacForm />} />
                <Route path="/HazardForm" element={<HazardForm />} />
                <Route path="/EvacForm/:id" element={<EvacForm />} />
                <Route path="/HazardForm/:id" element={<HazardForm />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute userRole={["indiv", "brgy_op"]} />}>
              <Route element={<ConstNavbar />}>
                <Route path="/Feedback" element={<Feedback />} />
                <Route path="/ChangeEmail" element={<ChangeEmail />} />
              </Route>
              <Route element={<ConstNavbar redirect="/map" />}>
                <Route path="/History" element={<History />} />
              </Route>
              <Route element={<ConstNavbar redirect="/Settings" />}>
                <Route path="/Profile" element={<Profile />} />
              </Route>
              <Route element={<ConstNavbar redirect="/Map" />}>
                <Route path="/Settings" element={<Settings />} />
              </Route>
              <Route element={<AuthNavbar />}>
                <Route path="/map" element={<Map />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </>
  );
}

export default App;

import LogIn from "./pages/Authentication/LogIn";
import SplashRegistration from "./pages/Authentication/SplashRegistration";
import FormRegistration from "./pages/Authentication/FormRegistration";
import EmailVerif from "./pages/Authentication/EmailVerif";
import ContactNo from "./pages/Authentication/ContactNo";
import CustomizeProfile from "./pages/Authentication/CustomizeProfile";
import Permissions from "./pages/Authentication/Permissions";
import Finish from "./pages/Authentication/Finish";
import GuestNavbar from "./components/Navbar/GuestNavbar";
import AuthNavbar from "./components/Navbar/AuthNavbar";
import ConstNavbar from "./components/Navbar/ConstNavbar";
import Map from "@/pages/Shared/Map";
import Hotlines from "@/pages/Shared/Hotlines";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Settings from "@/pages/Shared/Settings";
import ProtectedRoute from "./components/ProtectedRoutes";
import SMS from "./pages/brgy_ops/Forms/SMS";
import EvacForm from "./pages/Shared/Forms/EvacForms";
import HazardForm from "./pages/Shared/Forms/HazardForm";
import History from "@/pages/Shared/History";
import ForgotPW from "./pages/Authentication/ForgotPW";
import TermsConditions from "./pages/Shared/TermsConditions";
import Loading from "./pages/Shared/Loading";
import Profile from "@/pages/Shared/Profile";
import Feedback from "./pages/Indiv/Feedback";
import HotlinesForm from "./pages/brgy_ops/Forms/HotlinesForm";
import Layout from "@/pages/Admin/layout";
import IndivUsers from "@/pages/Admin/IndivUsers";
import UserDetails from "./pages/Admin/Forms/UserDetails";
import BrgyUsers from "./pages/Admin/BrgyUsers";
import GovopDetails from "./pages/Admin/Forms/GovOpDetails";
import BrgyAdd from "./pages/Admin/Forms/GovopAdd";
import SensorForm from "./pages/brgy_ops/Forms/SensorForm";
import SMSHistory from "./pages/brgy_ops/SMSHistory";

function App() {
  return (
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

      <Route element={<ProtectedRoute userRole={"indiv"} />}>
        <Route element={<ConstNavbar />}>
          {/* <Route path="/History" element={<History />} /> */}
          <Route path="/Feedback" element={<Feedback />} />{" "}
        </Route>

        {/* <Route element={<AuthNavbar />}>
            <Route path="/Map" element={<Map />} />
          </Route> */}
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
        </Route>

        <Route path="/admin-userDetails/:id" element={<UserDetails />} />
        <Route path="/admin-brgyDetails/:id" element={<GovopDetails />} />
        <Route path="/admin-brgyAdd" element={<BrgyAdd />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<ConstNavbar />}>
          <Route path="/Settings" element={<Settings />} />
          <Route path="/Profile" element={<Profile />} />
          <Route path="/EvacForm" element={<EvacForm />} />
          <Route path="/EvacForm/:id" element={<EvacForm />} />
          <Route path="/HazardForm" element={<HazardForm />} />
          <Route path="/HazardForm/:id" element={<HazardForm />} />
          <Route path="/History" element={<History />} />
        </Route>

        <Route element={<AuthNavbar />}>
          <Route path="/Map" element={<Map />} />
        </Route>
      </Route>

      <Route element={<GuestNavbar />}>
        <Route path="/" element={<Map />} />
      </Route>

      <Route element={<ConstNavbar />}>
        <Route path="/Hotlines" element={<Hotlines />} />
        <Route path="/TermsConditions" element={<TermsConditions />} />
      </Route>
    </Routes>
  );
}

export default App;

import LogIn from "./Authentication/LogIn";
import SplashRegistration from "./Authentication/SplashRegistration";
import FormRegistration from "./Authentication/FormRegistration";
import EmailVerif from "./Authentication/EmailVerif";
import ContactNo from "./Authentication/ContactNo";
import CustomizeProfile from "./Authentication/CustomizeProfile";
import Permissions from "./Authentication/Permissions";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/Login" element={<LogIn />} />

        <Route path="/Registration">
          <Route path="Splash" element={<SplashRegistration />} />
          <Route path="Form" element={<FormRegistration />} />
          <Route path="Verify" element={<EmailVerif />} />
          <Route path="Contact" element={<ContactNo />} />
          <Route path="CustomProfile" element={<CustomizeProfile />} />
          <Route path="Permissions" element={<Permissions />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

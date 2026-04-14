import LogIn from "./Authentication/LogIn";
import SplashRegistration from "./Authentication/SplashRegistration";
import FormRegistration from "./Authentication/FormRegistration";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/Login" element={<LogIn />} />

        <Route path="/Registration">
          <Route path="Splash" element={<SplashRegistration />} />
          <Route path="Form" element={<FormRegistration />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

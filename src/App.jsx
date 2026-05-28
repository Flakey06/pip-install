import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import CreateProfile from "./pages/CreateProfile";
import Home from "./pages/Home";
import EditProfile from "./pages/EditProfile";
import Chat from "./pages/Chat";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/create-profile" element={<CreateProfile />} />
        <Route path="/home" element={<Home />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
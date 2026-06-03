import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useTheme } from "./hooks/useTheme";
import Login from "./pages/Login";
import CreateProfile from "./pages/CreateProfile";
import Home from "./pages/Home";
import EditProfile from "./pages/EditProfile";
import GroupChat from "./pages/GroupChat";
import Groups from "./pages/Groups";
import Friends from "./pages/Friends";
import Explore from "./pages/Explore";
import PrivateChat from "./pages/PrivateChat";

function App() {
  useTheme(); // applies theme CSS vars globally on mount
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/create-profile" element={<CreateProfile />} />
        <Route path="/home" element={<Home />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/chat/:groupId" element={<GroupChat />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/private-chat/:friendId" element={<PrivateChat />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

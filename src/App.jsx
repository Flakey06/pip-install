import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTheme } from "./hooks/useTheme";
import { auth } from "./firebase";
import Login from "./pages/Login";
import CreateProfile from "./pages/CreateProfile";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import EditProfile from "./pages/EditProfile";
import GroupChat from "./pages/GroupChat";
import Groups from "./pages/Groups";
import Friends from "./pages/Friends";
import Explore from "./pages/Explore";
import Search from "./pages/Search";
import PrivateChat from "./pages/PrivateChat";
import GroupCalendar from "./pages/GroupCalendar";
import Calendar from "./pages/Calendar";
import GroupInfo from "./pages/GroupInfo";
import Credits from "./pages/Credits";
import NUSVerify from "./pages/NUSVerify";
import NUSVerifyComplete from "./pages/NUSVerifyComplete";
import LumaEvents from "./pages/LumaEvents";

function ProtectedRoute({ children }) {
  if (!auth.currentUser) return <Navigate to="/" replace />;
  return children;
}

function App() {
  useTheme();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/create-profile" element={<CreateProfile />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        <Route path="/chat/:groupId" element={<ProtectedRoute><GroupChat /></ProtectedRoute>} />
        <Route path="/group-info/:groupId" element={<ProtectedRoute><GroupInfo /></ProtectedRoute>} />
        <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
        <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
        <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="/private-chat/:friendId" element={<ProtectedRoute><PrivateChat /></ProtectedRoute>} />
        <Route path="/calendar/:groupId" element={<ProtectedRoute><GroupCalendar /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
        <Route path="/credits" element={<ProtectedRoute><Credits /></ProtectedRoute>} />
        <Route path="/nus-verify" element={<ProtectedRoute><NUSVerify /></ProtectedRoute>} />
        <Route path="/nus-verify-complete" element={<NUSVerifyComplete />} />
        <Route path="/luma-events" element={<ProtectedRoute><LumaEvents /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

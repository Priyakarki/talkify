import { Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/routing/ProtectedRoute";
import GuestRoute from "./components/routing/GuestRoute";
import ScrollToTop from "./components/routing/ScrollToTop";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Stories from "./pages/Stories";
import StoryReader from "./pages/StoryReader";
import Progress from "./pages/Progress";
import Profile from "./pages/Profile";
import AdminStories from "./pages/admin/AdminStories";
import StoryEditor from "./pages/admin/StoryEditor";
import Speaking from "./pages/Speaking";
import SpeakingAttempt from "./pages/SpeakingAttempt";
import SpeakStory from "./pages/SpeakStory";
import AnalysisResult from "./pages/AnalysisResult";
import PracticeWords from "./pages/PracticeWords";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />

        {/* Only for logged-out users */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Logged-in area with sidebar */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/stories/:id" element={<StoryReader />} />
            <Route path="/stories/:id/speak" element={<SpeakStory />} />
            <Route path="/results/:id" element={<AnalysisResult />} />
            <Route path="/practice-words" element={<PracticeWords />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/speaking" element={<Speaking />} />
            <Route path="/speaking/attempts/:id" element={<SpeakingAttempt />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin/stories" element={<AdminStories />} />
            <Route path="/admin/stories/new" element={<StoryEditor />} />
            <Route path="/admin/stories/:id/edit" element={<StoryEditor />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

import { HashRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import CourseFieldPreview from "./pages/CourseFieldPreview";
import GameplayDecision from "./pages/GameplayDecision";
import TournamentResults from "./pages/TournamentResults";
import TournamentLeaderboard from "./pages/TournamentLeaderboard";
import GolferEditor from "./pages/GolferEditor";
import Career from "./pages/Career";
import TrophyCabinet from "./pages/TrophyCabinet";
import Upgrades from "./pages/Upgrades";
import "./styles/pixelArcade.css";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/course-preview" element={<CourseFieldPreview />} />
        <Route path="/gameplay" element={<GameplayDecision />} />
        <Route path="/results" element={<TournamentResults />} />
        <Route path="/leaderboard" element={<TournamentLeaderboard />} />
        <Route path="/golfer-editor" element={<GolferEditor />} />
        <Route path="/career" element={<Career />} />
        <Route path="/trophy-cabinet" element={<TrophyCabinet />} />
        <Route path="/upgrades" element={<Upgrades />} />
      </Routes>
    </HashRouter>
  );
}

export default App;

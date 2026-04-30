import { Navigate, Route, Routes } from "react-router-dom";
import { AnalyzePage } from "./pages/AnalyzePage";
import { HistoryPage } from "./pages/HistoryPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<AnalyzePage />} />
      <Route path="/analyze" element={<AnalyzePage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

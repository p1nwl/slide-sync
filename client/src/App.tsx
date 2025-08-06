import { Routes, Route, Navigate } from "react-router-dom";
import { LoginScreen } from "./components/LoginScreen";
import { PresentationList } from "./components/PresentationList";
import { PresentationEditor } from "./components/PresentationEditor";
import { usePresentationStore } from "./store/presentationStore";

function App() {
  const { userId, nickname } = usePresentationStore();

  return (
    <Routes>
      <Route
        path="/"
        element={
          userId && nickname ? (
            <Navigate to="/presentations" replace />
          ) : (
            <LoginScreen />
          )
        }
      />
      <Route
        path="/presentations"
        element={
          userId && nickname ? (
            <PresentationList />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route path="/presentation/:id" element={<PresentationEditor />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

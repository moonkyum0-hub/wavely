import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import HealthRecord from "./pages/HealthRecord";
import Statistics from "./pages/Statistics";
import Goals from "./pages/Goals";
import Settings from "./pages/Settings";
import ExerciseCatalog from "./pages/ExerciseCatalog";
import BodyMap from "./pages/BodyMap";
import CognitiveTests from "./pages/CognitiveTests";
import Onboarding from "./pages/Onboarding";
import { ONBOARDING_COMPLETE_KEY } from "./lib/goalTemplates";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import { setErrorReporter } from "./lib/db";
import "./tokens.css";

function ErrorReporterBridge() {
  const { show } = useToast();
  useEffect(() => {
    setErrorReporter((message) => show(message, "error"));
  }, [show]);
  return null;
}

function useOnboardingComplete() {
  const [complete, setComplete] = useState(() => {
    try {
      return localStorage.getItem(ONBOARDING_COMPLETE_KEY) === "true";
    } catch {
      return true;
    }
  });
  return { complete, markComplete: () => setComplete(true) };
}

export default function App() {
  const { complete, markComplete } = useOnboardingComplete();

  return (
    <ThemeProvider>
      <ToastProvider>
        <ErrorReporterBridge />
        {complete ? (
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="record" element={<HealthRecord />} />
                <Route path="stats" element={<Statistics />} />
                <Route path="goals" element={<Goals />} />
                <Route path="exercise" element={<ExerciseCatalog />} />
                <Route path="body" element={<BodyMap />} />
                <Route path="cognitive" element={<CognitiveTests />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </BrowserRouter>
        ) : (
          <Onboarding onComplete={markComplete} />
        )}
      </ToastProvider>
    </ThemeProvider>
  );
}

import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import HealthRecord from "./pages/HealthRecord";
import Statistics from "./pages/Statistics";
import Goals from "./pages/Goals";
import Settings from "./pages/Settings";
import ExerciseCatalog from "./pages/ExerciseCatalog";
import BodyMap from "./pages/BodyMap";
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

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ErrorReporterBridge />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="record" element={<HealthRecord />} />
              <Route path="stats" element={<Statistics />} />
              <Route path="goals" element={<Goals />} />
              <Route path="exercise" element={<ExerciseCatalog />} />
              <Route path="body" element={<BodyMap />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

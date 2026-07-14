import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import HealthRecord from "./pages/HealthRecord";
import Statistics from "./pages/Statistics";
import Goals from "./pages/Goals";
import Settings from "./pages/Settings";
import ExerciseCatalog from "./pages/ExerciseCatalog";
import { ThemeProvider } from "./context/ThemeContext";
import "./tokens.css";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="record" element={<HealthRecord />} />
            <Route path="stats" element={<Statistics />} />
            <Route path="goals" element={<Goals />} />
            <Route path="exercise" element={<ExerciseCatalog />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

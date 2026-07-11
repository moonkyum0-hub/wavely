import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import HealthRecord from "./pages/HealthRecord";
import Statistics from "./pages/Statistics";
import Goals from "./pages/Goals";
import Settings from "./pages/Settings";
import "./tokens.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="record" element={<HealthRecord />} />
          <Route path="stats" element={<Statistics />} />
          <Route path="goals" element={<Goals />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

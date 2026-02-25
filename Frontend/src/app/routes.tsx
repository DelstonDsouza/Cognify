import { createBrowserRouter } from "react-router";
import { Dashboard } from "./pages/Dashboard";
import { Medications } from "./pages/Medications";
import { HealthVitals } from "./pages/HealthVitals";
import { Appointments } from "./pages/Appointments";
import { EmergencyContacts } from "./pages/EmergencyContacts";
import { Activities } from "./pages/Activities";
import { Layout } from "./components/Layout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "medications", Component: Medications },
      { path: "health", Component: HealthVitals },
      { path: "appointments", Component: Appointments },
      { path: "emergency", Component: EmergencyContacts },
      { path: "activities", Component: Activities },
    ],
  },
]);

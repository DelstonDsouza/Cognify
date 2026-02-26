import { createBrowserRouter, Navigate } from "react-router";

// ── Auth ──────────────────────────────────────────────────────────────────────
import { Login } from "./pages/Login";

// ── Elder / Patient app ───────────────────────────────────────────────────────
import { Layout }            from "./components/Layout";
import { Dashboard }         from "./pages/Dashboard";
import { Medications }       from "./pages/Medications";
import { HealthVitals }      from "./pages/HealthVitals";
import { Appointments }      from "./pages/Appointments";
import { EmergencyContacts } from "./pages/EmergencyContacts";
import { Activities }        from "./pages/Activities";
import { RegisterCaregiver } from "./pages/RegisterCaregiver";

// ── Caregiver portal ──────────────────────────────────────────────────────────
import { CaregiverLayout }      from "./pages/caregiver/CaregiverLayout";
import { CaregiverDashboard }   from "./pages/caregiver/CaregiverDashboard";
import { CaregiverMedications } from "./pages/caregiver/CaregiverMedications";
import { CaregiverVitals }      from "./pages/caregiver/CaregiverVitals";
import { CaregiverCheckIns }    from "./pages/caregiver/CaregiverCheckIns";

export const router = createBrowserRouter([

  // ── Login ─────────────────────────────────────────────────────────────────
  { path: "/",             Component: Login },
  { path: "/login",        Component: Login },
  { path: "/caregiver-login", element: <Navigate to="/login" replace /> },

  // ── Elder app — ALL under /dashboard ─────────────────────────────────────
  {
    path: "/dashboard",
    Component: Layout,
    children: [
      { index: true,                Component: Dashboard        },
      { path: "medications",        Component: Medications       },
      { path: "health",             Component: HealthVitals      },
      { path: "appointments",       Component: Appointments      },
      { path: "emergency",          Component: EmergencyContacts },
      { path: "activities",         Component: Activities        },
      { path: "caregiver",          Component: RegisterCaregiver },
    ],
  },

  // ── Caregiver portal ──────────────────────────────────────────────────────
  {
    path: "/caregiver-portal",
    Component: CaregiverLayout,
    children: [
      { index: true,         Component: CaregiverDashboard   },
      { path: "dashboard",   Component: CaregiverDashboard   },
      { path: "medications", Component: CaregiverMedications },
      { path: "vitals",      Component: CaregiverVitals      },
      { path: "checkins",    Component: CaregiverCheckIns    },
    ],
  },
]);
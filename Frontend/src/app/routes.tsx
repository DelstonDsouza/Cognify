import { createBrowserRouter } from "react-router";
import { Dashboard }           from "./pages/Dashboard";
import { Medications }         from "./pages/Medications";
import { HealthVitals }        from "./pages/HealthVitals";
import { Appointments }        from "./pages/Appointments";
import { EmergencyContacts }   from "./pages/EmergencyContacts";
import { Activities }          from "./pages/Activities";
import { Layout }              from "./components/Layout";

// Caregiver portal
import { CaregiverLogin }       from "./pages/caregiver/CaregiverLogin";
import { CaregiverLayout }      from "./pages/caregiver/CaregiverLayout";
import { CaregiverDashboard }   from "./pages/caregiver/CaregiverDashboard";
import { CaregiverMedications } from "./pages/caregiver/CaregiverMedications";
import { CaregiverVitals }      from "./pages/caregiver/CaregiverVitals";
import { CaregiverCheckIns }    from "./pages/caregiver/CaregiverCheckIns";

export const router = createBrowserRouter([
  // ── Patient app ───────────────────────────────────────────────────────────
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true,                Component: Dashboard        },
      { path: "medications",        Component: Medications       },
      { path: "health",             Component: HealthVitals      },
      { path: "appointments",       Component: Appointments      },
      { path: "emergency",          Component: EmergencyContacts },
      { path: "activities",         Component: Activities        },
    ],
  },

  // ── Caregiver portal (separate layout, auth-guarded) ──────────────────────
  {
    path: "/caregiver/login",
    Component: CaregiverLogin,
  },
  {
    path: "/caregiver",
    Component: CaregiverLayout,          // handles auth guard + sidebar
    children: [
      { index: true,               Component: CaregiverDashboard   }, // /caregiver
      { path: "dashboard",         Component: CaregiverDashboard   }, // /caregiver/dashboard
      { path: "medications",       Component: CaregiverMedications }, // /caregiver/medications
      { path: "vitals",            Component: CaregiverVitals      }, // /caregiver/vitals
      { path: "checkins",          Component: CaregiverCheckIns    }, // /caregiver/checkins
    ],
  },
]);

import { createBrowserRouter } from "react-router";

// ── Elder / Patient app ───────────────────────────────────────────────────────
import { Layout }            from "./components/Layout";
import { Dashboard }         from "./pages/Dashboard";
import { Medications }       from "./pages/Medications";
import { HealthVitals }      from "./pages/HealthVitals";
import { Appointments }      from "./pages/Appointments";
import { EmergencyContacts } from "./pages/EmergencyContacts";
import { Activities }        from "./pages/Activities";
import { RegisterCaregiver } from "./pages/RegisterCaregiver";

// ── Caregiver portal (completely separate URL space) ──────────────────────────
import { CaregiverLogin }       from "./pages/caregiver/CaregiverLogin";
import { CaregiverLayout }      from "./pages/caregiver/CaregiverLayout";
import { CaregiverDashboard }   from "./pages/caregiver/CaregiverDashboard";
import { CaregiverMedications } from "./pages/caregiver/CaregiverMedications";
import { CaregiverVitals }      from "./pages/caregiver/CaregiverVitals";
import { CaregiverCheckIns }    from "./pages/caregiver/CaregiverCheckIns";

export const router = createBrowserRouter([

  // ── Elder app — has sidebar, "Caregiver" menu = REGISTER ONLY ──────────────
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true,          Component: Dashboard        },
      { path: "medications",  Component: Medications       },
      { path: "health",       Component: HealthVitals      },
      { path: "appointments", Component: Appointments      },
      { path: "emergency",    Component: EmergencyContacts },
      { path: "activities",   Component: Activities        },
      { path: "caregiver",    Component: RegisterCaregiver }, // ← register only
    ],
  },

  // ── Caregiver login — standalone, NO elder sidebar ─────────────────────────
  //    Caregiver visits this URL directly to sign in
  {
    path: "/caregiver-login",
    Component: CaregiverLogin,
  },

  // ── Caregiver portal — own layout, auth-guarded ────────────────────────────
  //    Only accessible after logging in at /caregiver-login
  {
    path: "/caregiver-portal",
    Component: CaregiverLayout,
    children: [
      { index: true,           Component: CaregiverDashboard   },
      { path: "dashboard",     Component: CaregiverDashboard   },
      { path: "medications",   Component: CaregiverMedications },
      { path: "vitals",        Component: CaregiverVitals      },
      { path: "checkins",      Component: CaregiverCheckIns    },
    ],
  },
]);
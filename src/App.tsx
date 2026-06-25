import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { PageLoader } from "@/components/ui/page-loader";
import Home from "./pages/Home";

// Lazy load non-critical routes for better TTI
const About = lazy(() => import("./pages/About"));
const CorporateCare = lazy(() => import("./pages/CorporateCare"));
const LegalResources = lazy(() => import("./pages/LegalResources"));
const Volunteer = lazy(() => import("./pages/Volunteer"));
const Donate = lazy(() => import("./pages/Donate"));
const Contact = lazy(() => import("./pages/Contact"));
const Games = lazy(() => import("./pages/Games"));
const HPL = lazy(() => import("./pages/HPL"));
const Events = lazy(() => import("./pages/Events"));
const Register = lazy(() => import("./pages/Register"));
const EventRegistration = lazy(() => import("./pages/EventRegistration"));
const MembershipPlansPage = lazy(() => import("./pages/MembershipPlansPage"));
const DailyRoutine = lazy(() => import("./pages/DailyRoutine"));
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminOverview = lazy(() => import("./pages/admin/Overview"));
const AdminMessages = lazy(() => import("./pages/admin/Messages"));
const AdminReports = lazy(() => import("./pages/admin/Reports"));
const AdminVolunteers = lazy(() => import("./pages/admin/Volunteers"));
const AdminPartners = lazy(() => import("./pages/admin/Partners"));
const AdminDonations = lazy(() => import("./pages/admin/Donations"));

const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminTeamManagement = lazy(() => import("./pages/admin/TeamManagement"));
const AdminRegistrations = lazy(() => import("./pages/admin/Registrations"));
const AdminEventManagement = lazy(() => import("./pages/admin/EventManagement"));
const AdminRoutineManagement = lazy(() => import("./pages/admin/RoutineManagement"));
const AdminMemberships = lazy(() => import("./pages/admin/Memberships"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Minimal loading fallback
const RouteLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <PageLoader />
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/corporate-care" element={<CorporateCare />} />
            <Route path="/legal-resources" element={<LegalResources />} />
            <Route path="/volunteer" element={<Volunteer />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/games" element={<Games />} />
            <Route path="/hpl" element={<HPL />} />
            <Route path="/events" element={<Events />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/:slug" element={<EventRegistration />} />
            <Route path="/membership-plans" element={<MembershipPlansPage />} />
            <Route path="/daily-routine" element={<DailyRoutine />} />
            <Route path="/mumbai-health-camp" element={<Navigate to="/register/mumbai-senior-citizens-health-camp" replace />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />}>
              <Route index element={<AdminOverview />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="volunteers" element={<AdminVolunteers />} />
              <Route path="partners" element={<AdminPartners />} />
              <Route path="donations" element={<AdminDonations />} />
              
              <Route path="team" element={<AdminTeamManagement />} />
              <Route path="events" element={<AdminEventManagement />} />
              <Route path="routine" element={<AdminRoutineManagement />} />
              <Route path="registrations" element={<AdminRegistrations />} />
              <Route path="memberships" element={<AdminMemberships />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

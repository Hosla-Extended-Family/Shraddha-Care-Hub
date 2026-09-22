import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { PageLoader } from "@/components/ui/page-loader";
import { useA11yBootstrap } from "@/hooks/use-a11y";
import { I18nProvider } from "@/i18n";
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
const Auth = lazy(() => import("./pages/Auth"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogRead = lazy(() => import("./pages/BlogRead"));
const BlogWrite = lazy(() => import("./pages/BlogWrite"));
const BlogWriteGuest = lazy(() => import("./pages/BlogWriteGuest"));
const Profile = lazy(() => import("./pages/Profile"));
const Author = lazy(() => import("./pages/Author"));
const BlogSubscribed = lazy(() => import("./pages/BlogSubscribed"));
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const AdminBootstrap = lazy(() => import("./pages/admin/Bootstrap"));
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
const AdminPreviewInspector = lazy(() => import("./pages/admin/PreviewInspector"));
const AdminCollaborateContent = lazy(() => import("./pages/admin/CollaborateContent"));
const AdminBlogs = lazy(() => import("./pages/admin/Blogs"));
const AdminWriters = lazy(() => import("./pages/admin/Writers"));
const AdminNewsletters = lazy(() => import("./pages/admin/Newsletters"));
const AdminSubscribers = lazy(() => import("./pages/admin/Subscribers"));
const AdminMembers = lazy(() => import("./pages/admin/Members"));
const AdminCollectFees = lazy(() => import("./pages/admin/CollectFees"));
const AdminHq = lazy(() => import("./pages/admin/hq/Hq"));
const AdminSetup = lazy(() => import("./pages/admin/Setup"));

const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Minimal loading fallback
const RouteLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => {
  useA11yBootstrap();
  return (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
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
            <Route path="/partner" element={<CorporateCare />} />
            <Route path="/corporate-care" element={<Navigate to="/partner" replace />} />
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
            <Route path="/auth" element={<Auth />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/write" element={<BlogWrite />} />
            <Route path="/blog/write-guest" element={<BlogWriteGuest />} />
            <Route path="/blog/my-stories" element={<Navigate to="/profile" replace />} />
            <Route path="/blog/subscribed" element={<BlogSubscribed />} />
            <Route path="/blog/:slug" element={<BlogRead />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/author/:userId" element={<Author />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/recover" element={<AdminBootstrap />} />
            <Route path="/admin/setup" element={<AdminSetup />} />
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
              <Route path="memberships" element={<Navigate to="/admin/dashboard/members" replace />} />
              <Route path="members" element={<AdminMembers />} />
              <Route path="collect" element={<AdminCollectFees />} />
              <Route path="roles" element={<Navigate to="/admin/hq" replace />} />

              <Route path="preview-inspector" element={<AdminPreviewInspector />} />
              <Route path="collaborate" element={<AdminCollaborateContent />} />
              <Route path="blogs" element={<AdminBlogs />} />
              <Route path="writers" element={<AdminWriters />} />
              <Route path="newsletters" element={<AdminNewsletters />} />
              <Route path="subscribers" element={<AdminSubscribers />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            <Route path="/admin/hq" element={<AdminHq />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
    </I18nProvider>
  </QueryClientProvider>
  );
};


export default App;

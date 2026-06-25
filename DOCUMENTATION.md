# Shraddha Welfare Association - Project Documentation

## 📋 Project Overview

**shraddha.hosla.in** is a comprehensive web platform for an NGO (the welfare arm of Hosla) focused on stopping elder abuse and promoting holistic well-being for senior citizens. The platform serves multiple stakeholders including the general public, volunteers, corporate partners, and administrators.

**Live URL:** https://shraddha.hosla.in
**Organization Email:** shraddhawelfareassociation@gmail.com  
**Phone:** 7811009309  
**Location:** Bishnupur

---

## 🆕 Recent Updates (Jan 2026)

1. **Cross-form rate limiting**
        - Added database-backed limits (3 submissions/hour per email) for Donate, Contact, Volunteer, and Partner flows.
        - Added reusable `check_rate_limit` function and frontend guards with destructive toasts.

2. **Donation verification workflow**
        - Introduced `status` on donations (pending/verified/rejected) with admin review actions.
        - Consented donor wall now displays only verified donations.

3. **Wall of Thanks redesign**
        - Added parallax backgrounds, decorative overlays, animated marquee, and new themed assets.
        - Improved donor card styling and responsive layout logic.

4. **Donation celebration**
        - Added confetti burst after successful donation submissions.

5. **Quick report modal**
        - Added a dedicated quick report modal on Legal Resources with improved scroll-to-top UX.

6. **Abuse report UX upgrades**
        - Client-side Zod validation and evidence file type/size checks for quick reports.
        - Confirmation dialog before WhatsApp redirect with focused mobile overlay and media guidance.

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18.3** | UI library |
| **TypeScript** | Type-safe JavaScript |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first CSS framework |
| **shadcn/ui** | Component library (Radix UI based) |
| **React Router DOM 6** | Client-side routing |
| **TanStack React Query 5** | Server state management |
| **React Hook Form + Zod** | Form handling & validation |
| **Lucide React** | Icon library |

### Backend (Supabase)
| Technology | Purpose |
|------------|---------|
| **Supabase Database** | PostgreSQL database |
| **Supabase Auth** | Authentication system |
| **Supabase Storage** | File storage |
| **Supabase Edge Functions** | Serverless backend functions |
| **Row Level Security (RLS)** | Database access control |

### External Services
| Service | Purpose |
|---------|---------|
| **Resend** | Transactional email delivery |
| **Google Maps Embed** | Location display on Contact page |

---

## 📄 Pages & Routes (7 Public + 10 Admin)

### Public Pages (7)

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Home.tsx` | Landing page with hero carousel, services, impact gallery, stats |
| `/about` | `About.tsx` | Organization story, mission, work gallery, success stories, team section |
| `/corporate-care` | `CorporateCare.tsx` | B2B partnership program for employee parent care |
| `/legal-resources` | `LegalResources.tsx` | Legal rights info + elder abuse reporting form |
| `/volunteer` | `Volunteer.tsx` | Volunteer signup with benefits & activities info |
| `/donate` | `Donate.tsx` | Donation page with UPI QR, bank details, impact tiers |
| `/contact` | `Contact.tsx` | Contact form, info cards, social links, map embed |

### Admin Pages (10)

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/login` | `Login.tsx` | Admin authentication page |
| `/admin/dashboard` | `Dashboard.tsx` | Main admin layout with sidebar navigation |
| `/admin/dashboard/` (index) | `Overview.tsx` | Dashboard overview with stats & recent activity |
| `/admin/dashboard/messages` | `Messages.tsx` | Contact message management |
| `/admin/dashboard/reports` | `Reports.tsx` | Abuse report management with evidence download |
| `/admin/dashboard/volunteers` | `Volunteers.tsx` | Volunteer application management |
| `/admin/dashboard/partners` | `Partners.tsx` | Corporate partner inquiry management |
| `/admin/dashboard/donations` | `Donations.tsx` | Donation verification and status management |
| `/admin/dashboard/team` | `TeamManagement.tsx` | Team member CRUD operations |
| `/admin/dashboard/settings` | `Settings.tsx` | Notification email configuration |

### Utility Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `*` | `NotFound.tsx` | 404 error page |

---

## 🗄️ Database Schema (10 Tables)

### 1. `abuse_reports`
Stores elder abuse incident reports with secure admin-only access.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `is_anonymous` | boolean | No | Anonymous submission flag |
| `reporter_name` | text | Yes | Reporter's name |
| `reporter_contact` | text | Yes | Reporter's contact |
| `reporter_relationship` | text | Yes | Relationship to victim |
| `victim_name` | text | No | Victim's name |
| `victim_age` | integer | Yes | Victim's age |
| `victim_location` | text | No | Victim's location |
| `abuse_type` | enum | No | Type of abuse |
| `description` | text | No | Incident description |
| `status` | enum | No | new/investigating/resolved/closed |
| `admin_notes` | text | Yes | Internal admin notes |
| `assigned_to` | UUID | Yes | Assigned admin |
| `created_at` | timestamp | No | Submission timestamp |
| `updated_at` | timestamp | No | Last update timestamp |

**RLS Policies:**
- ✅ Anyone can INSERT (submit reports)
- 🔒 Only admins can SELECT/UPDATE/DELETE

---

### 2. `report_evidence`
Stores metadata for uploaded evidence files linked to abuse reports.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `report_id` | UUID | No | FK to abuse_reports |
| `file_name` | text | No | Original filename |
| `file_path` | text | No | Storage path |
| `file_type` | text | No | MIME type |
| `file_size` | integer | Yes | File size in bytes |
| `created_at` | timestamp | No | Upload timestamp |

**RLS Policies:**
- ✅ Anyone can INSERT (upload evidence)
- 🔒 Only admins can SELECT/DELETE
- ❌ No UPDATE allowed

---

### 3. `volunteer_applications`
Stores volunteer signup submissions.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `name` | text | No | Applicant name |
| `email` | text | No | Email address |
| `phone` | text | No | Phone number |
| `city` | text | No | City of residence |
| `motivation` | text | No | Why they want to volunteer |
| `status` | enum | No | pending/contacted/accepted/rejected |
| `admin_notes` | text | Yes | Internal notes |
| `created_at` | timestamp | No | Submission timestamp |
| `updated_at` | timestamp | No | Last update timestamp |

**RLS Policies:**
- ✅ Anyone can INSERT
- 🔒 Only admins can SELECT/UPDATE/DELETE

---

### 4. `partner_inquiries`
Stores corporate partnership inquiry submissions.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `company_name` | text | No | Company name |
| `contact_name` | text | No | Contact person name |
| `email` | text | No | Contact email |
| `phone` | text | No | Contact phone |
| `employee_count` | text | Yes | Company size |
| `message` | text | No | Inquiry message |
| `status` | text | No | new/contacted/in_progress/converted/closed |
| `admin_notes` | text | Yes | Internal notes |
| `created_at` | timestamp | No | Submission timestamp |
| `updated_at` | timestamp | No | Last update timestamp |

**RLS Policies:**
- ✅ Anyone can INSERT
- 🔒 Only admins can SELECT/UPDATE/DELETE

---

### 5. `contact_messages`
Stores general contact form submissions.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `name` | text | No | Sender name |
| `email` | text | No | Sender email |
| `phone` | text | Yes | Sender phone |
| `message` | text | No | Message content |
| `status` | text | No | new/read/replied/archived |
| `admin_notes` | text | Yes | Internal notes |
| `created_at` | timestamp | No | Submission timestamp |
| `updated_at` | timestamp | No | Last update timestamp |

**RLS Policies:**
- ✅ Anyone can INSERT
- 🔒 Only admins can SELECT/UPDATE/DELETE

---

### 6. `donations`
Stores donation intent records from the donation form.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `name` | text | No | Donor name |
| `email` | text | No | Donor email |
| `phone` | text | No | Donor phone |
| `pan_card` | text | Yes | PAN for 80G receipt |
| `amount` | text | No | Donation amount |
| `consent_to_publish` | boolean | No | Public recognition consent |
| `status` | text | No | pending/verified/rejected |
| `admin_notes` | text | Yes | Internal notes |
| `created_at` | timestamp | No | Submission timestamp |
| `updated_at` | timestamp | No | Last update timestamp |

**RLS Policies:**
- ✅ Anyone can INSERT (submit donation intent)
- 🔒 Only admins can SELECT/UPDATE/DELETE

**Note:** This table tracks donation *intents* (form submissions before payment). Since payments are made externally via UPI/bank transfer, admin verification is required.

---

### 7. `team_members`
Stores organization team member profiles.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `name` | text | No | Member name |
| `role` | text | No | Job title/role |
| `category` | enum | No | founders/advisory/core_team/volunteers |
| `bio` | text | Yes | Biography |
| `photo_url` | text | Yes | Profile photo URL |
| `display_order` | integer | No | Sort order |
| `is_active` | boolean | No | Visibility flag |
| `linkedin_url` | text | Yes | LinkedIn profile |
| `facebook_url` | text | Yes | Facebook profile |
| `instagram_url` | text | Yes | Instagram profile |
| `github_url` | text | Yes | GitHub profile |
| `created_at` | timestamp | No | Creation timestamp |
| `updated_at` | timestamp | No | Last update timestamp |

**RLS Policies:**
- ✅ Anyone can SELECT active members (`is_active = true`)
- 🔒 Only admins can INSERT/UPDATE/DELETE (full management)

---

### 7. `success_stories`
Stores impact stories for the About page.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `title` | text | No | Story title |
| `content` | text | No | Story content |
| `author_name` | text | Yes | Author/subject name |
| `author_role` | text | Yes | Author's role |
| `image_url` | text | Yes | Featured image |
| `is_published` | boolean | No | Publication status |
| `is_featured` | boolean | No | Featured flag |
| `created_at` | timestamp | No | Creation timestamp |
| `updated_at` | timestamp | No | Last update timestamp |

**RLS Policies:**
- ✅ Anyone can SELECT published stories (`is_published = true`)
- 🔒 Only admins have full management access

---

### 8. `notification_emails`
Stores email addresses for admin notifications by category.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `email` | text | No | Email address |
| `notification_type` | text | No | abuse_reports/volunteer_applications/partner_inquiries/donations |
| `is_active` | boolean | No | Active status |
| `created_at` | timestamp | No | Creation timestamp |

**RLS Policies:**
- 🔒 Only admins can manage (ALL operations)

---

### 9. `profiles`
Stores extended user profile information.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `user_id` | UUID | No | Reference to auth.users |
| `email` | text | Yes | User email |
| `full_name` | text | Yes | User's full name |
| `created_at` | timestamp | No | Creation timestamp |
| `updated_at` | timestamp | No | Last update timestamp |

**RLS Policies:**
- 🔒 Users can only access their own profile

---

### 10. `user_roles`
Stores role assignments for access control.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `user_id` | UUID | No | Reference to auth.users |
| `role` | enum | No | admin (expandable) |
| `created_at` | timestamp | No | Creation timestamp |

**RLS Policies:**
- 🔒 Only admins can manage roles

---

## 🔐 Database Functions

### `is_admin()`
Returns `true` if the currently authenticated user has the `admin` role.
```sql
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
```

### `has_role(_user_id, _role)`
Checks if a specific user has a specific role.
```sql
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
```

### `handle_new_user()`
Trigger function that automatically creates a profile when a new user signs up.
```sql
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
```

### `update_updated_at_column()`
Trigger function to auto-update `updated_at` timestamps.
```sql
RETURNS trigger
LANGUAGE plpgsql
```

### `check_rate_limit(p_email, p_table_name, p_max_submissions, p_time_window_minutes)`
Cross-form rate limiter used by public submission flows.
```sql
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
```

### `get_consented_donors()`
Returns distinct, consented donors limited to verified donations.
```sql
RETURNS TABLE (name text, donated_at timestamp with time zone)
LANGUAGE sql STABLE SECURITY DEFINER
```

---

## 📦 Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `abuse-evidence` | ❌ No | Secure storage for abuse report evidence files |
| `team-photos` | ✅ Yes | Public storage for team member photos |

---

## ⚡ Edge Functions (Serverless)

### 1. `send-notification`
**Purpose:** Sends admin notification emails when new submissions occur.

**Triggers:**
- New abuse report submitted
- New volunteer application submitted
- New partner inquiry submitted

**Flow:**
1. Validates notification type
2. Verifies the submission exists and is recent (within 5 minutes - anti-spam)
3. Fetches configured notification emails from `notification_emails` table
4. Sends email via Resend API

**Payload:**
```typescript
{
  type: "abuse_report" | "volunteer_application" | "partner_inquiry",
  reportId?: string,
  applicationId?: string,
  inquiryId?: string,
  email?: string,
  name?: string,
  companyName?: string
}
```

---

### 2. `send-donation-confirmation`
**Purpose:** Sends thank-you emails to donors and admin notifications.

**Flow:**
1. Validates donor information (name, email, amount)
2. Sends styled thank-you email to donor
3. Fetches donation notification emails from `notification_emails` table
4. Sends admin notification with donor details

**Payload:**
```typescript
{
  name: string,
  email: string,
  phone: string,
  panCard?: string,
  amount: string
}
```

---

## 🎨 UI Components Library

### Layout Components
- `Layout.tsx` - Page wrapper with Header/Footer
- `Header.tsx` - Navigation with mobile hamburger menu
- `Footer.tsx` - Site footer with links & social icons

### Home Page Components
- `HeroCarousel.tsx` - Auto-rotating hero image carousel
- `AnimatedHeroText.tsx` - Typewriter text effect
- `FloatingElements.tsx` - Decorative floating icons
- `ServiceCard.tsx` - Service offering cards with hover effects
- `ImpactGallery.tsx` - Masonry image gallery with lightbox
- `StatCard.tsx` - Animated counter statistics

### About Page Components
- `WorkGallery.tsx` - Work showcase gallery
- `TeamSection.tsx` - Team member display grid
- `TeamMemberCard.tsx` - Individual team member card

### Corporate Page Components
- `PartnerContactModal.tsx` - Partnership inquiry form dialog

### Legal Resources Components
- `QuickReportModal.tsx` - Elder abuse quick-report modal with validation and WhatsApp redirect confirmation

### Donation Page Components
- `WallOfThanks.tsx` - Donor recognition wall with parallax backgrounds, marquee, and themed assets

### Shared UI Components (shadcn/ui)
- Full shadcn/ui component library (~50+ components)
- Custom `ScrollReveal.tsx` - Scroll-triggered animations
- Custom `PageLoader.tsx` - Route transition loader
- Custom `Marquee.tsx` - Infinite scroll marquee

---

## 🔄 Custom Hooks

| Hook | Purpose |
|------|---------|
| `use-toast.ts` | Toast notification management |
| `use-mobile.tsx` | Mobile viewport detection |
| `use-scroll-animation.tsx` | Intersection Observer for scroll animations |
| `use-count-up.tsx` | Animated number counting |
| `use-image-upload.tsx` | Image upload with compression |

---

## 🔒 Security Measures

### Row Level Security (RLS)
- All tables have RLS enabled
- Public INSERT allowed for form submissions only
- SELECT/UPDATE/DELETE restricted to authenticated admins
- `is_admin()` function used for role verification

### Input Validation
- Zod schemas for frontend form validation
- Database CHECK constraints for field length limits
- File type validation for uploads

### Form Rate Limiting
- Database-backed rate limiter for public form submissions (Donate, Contact, Volunteer, Partner, and non-anonymous Abuse Reports)
- Default policy: 3 submissions per hour per email
- Blocks rapid repeat submissions and shows a destructive toast

### Authentication
- Email/password authentication via Supabase Auth
- Admin role manually assigned in `user_roles` table
- Session-based access control

### Edge Function Security
- Submission timestamp verification (5-minute window)
- Service role key for database operations
- CORS headers configured

---

## 📊 Admin Dashboard Features

### Overview Dashboard
- Total submission counts (reports, volunteers, partners)
- Status breakdowns
- Recent activity feeds

### Message Management
- View/reply/archive contact messages
- Status tracking (new → read → replied → archived)
- Admin notes

### Report Management
- View abuse reports with full details
- Status workflow (new → investigating → resolved → closed)
- Evidence file download
- Admin notes

### Volunteer Management
- Application review
- Status updates (pending → contacted → accepted/rejected)
- Contact information access

### Partner Management
- Inquiry review and follow-up
- Conversion tracking
- Company details

### Donations Management
- Donation verification workflow (pending → verified/rejected)
- Status filtering and admin notes

### Team Management
- Full CRUD for team members
- Photo uploads
- Category organization
- Social link management

### Settings
- Notification email configuration
- Per-category email lists
- Active/inactive toggles

---

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Collapsible mobile navigation
- Touch-friendly interactions
- Optimized images

---

## 🌓 Theme System

- Light/dark mode support via CSS variables
- HSL color system in `index.css`
- Semantic color tokens (primary, secondary, muted, accent, destructive)
- Consistent design tokens across all components

---

## 📧 Email Notification Flow

```
User Submits Form
        ↓
Frontend validates input (Zod)
        ↓
Data inserted to Supabase table
        ↓
Edge function invoked with submission ID
        ↓
Function verifies submission exists & is recent
        ↓
Fetches recipient emails from notification_emails table
        ↓
Sends email via Resend API
        ↓
Returns success/failure response
```

**Configured Recipients:**
- hosla.dalmadal@gmail.com
- sujalthakkar153@gmail.com
- shraddhawelfareassociation@gmail.com
- hoslacare@gmail.com

---

## 🔗 External Integrations

### Resend (Email)
- Domain: notifications@hosla.in
- Used for all transactional emails

### Google Maps
- Embedded map on Contact page
- Location: Bishnupur

### Social Media Links
- Facebook
- YouTube
- X (Twitter)
- LinkedIn

---

## 📁 Project Structure

```
├── public/
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── src/
│   ├── assets/           # Static images (60+ files)
│   ├── components/
│   │   ├── about/        # About page components
│   │   ├── corporate/    # Corporate page components
│   │   ├── home/         # Home page components
│   │   ├── layout/       # Layout components
│   │   ├── team/         # Team components
│   │   └── ui/           # shadcn/ui components
│   ├── hooks/            # Custom React hooks
│   ├── integrations/
│   │   └── supabase/     # Supabase client & types
│   ├── lib/
│   │   └── utils.ts      # Utility functions
│   ├── pages/
│   │   ├── admin/        # Admin dashboard pages
│   │   └── *.tsx         # Public pages
│   ├── App.tsx           # Main app with routing
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles & tokens
├── supabase/
│   ├── functions/        # Edge functions
│   │   ├── send-notification/
│   │   └── send-donation-confirmation/
│   ├── migrations/       # Database migrations
│   └── config.toml       # Supabase configuration
└── Configuration files...
```

---

## 📈 Key Metrics

| Metric | Count |
|--------|-------|
| Total Pages | 18 |
| Public Pages | 7 |
| Admin Pages | 10 |
| Database Tables | 10 |
| Edge Functions | 2 |
| UI Components | 50+ |
| Static Assets | 60+ |
| Storage Buckets | 2 |

---

## 🚀 Deployment

- **Platform:** Vercel
- **Custom Domain:** shraddha.hosla.in (configured)

---

## 📝 Key Features Summary

1. **Elder Abuse Reporting** - Secure, anonymous reporting with evidence uploads
2. **Volunteer Recruitment** - Application form with admin review workflow
3. **Corporate Partnerships** - B2B inquiry system with CRM-like tracking
4. **Donation System** - UPI & bank transfer with confirmation emails, verification workflow, and donation celebration
5. **Team Showcase** - Dynamic team display with admin management
6. **Impact Stories** - Success story showcase with rich content
7. **Admin Dashboard** - Comprehensive back-office for all operations
8. **Email Notifications** - Real-time alerts for all form submissions
9. **Role-Based Access** - Secure admin authentication and authorization
10. **Responsive Design** - Mobile-optimized across all pages
11. **Form Rate Limiting** - Database-backed limits across public submissions

---

*Documentation Created for Shraddha Welfare Association Project*  
*Last Updated: January 24, 2026*

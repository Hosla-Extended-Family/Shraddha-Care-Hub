import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { formatTime12 } from "@/lib/routine";

export type StudyCircleProgram = "kathamrita" | "pathochokro";

export interface StudyCircleSession {
  id: string;
  program_type: StudyCircleProgram;
  scheduled_date: string;
  start_time: string | null;
  status: "scheduled" | "cancelled";
  title_bn: string;
  title_en?: string | null;
  note: string | null;
  note_en?: string | null;
  meeting_link: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudyCircleRole {
  id: string;
  session_id: string;
  role_name: string;
  role_name_en?: string | null;
  display_order: number;
  created_at: string;
}

export interface StudyCircleRolePerformer {
  id: string;
  role_id: string;
  member_id: string | null;
  performer_name: string;
  performer_name_en?: string | null;
  is_guest: boolean;
  display_order: number;
  created_at: string;
}

export interface StudyCirclePart {
  id: string;
  session_id: string;
  part_number: number | null;
  item_type: "song" | "reading" | "prayer" | "other";
  description: string;
  description_en?: string | null;
  reference_link: string | null;
  display_order: number;
  created_at: string;
}

export interface StudyCirclePartPerformer {
  id: string;
  part_id: string;
  member_id: string | null;
  performer_name: string;
  performer_name_en?: string | null;
  is_guest: boolean;
  display_order: number;
  created_at: string;
}

export interface RoleWithPerformers extends StudyCircleRole {
  performers: StudyCircleRolePerformer[];
}

export interface PartWithPerformers extends StudyCirclePart {
  performers: StudyCirclePartPerformer[];
}

export interface SessionBundle {
  session: StudyCircleSession;
  roles: RoleWithPerformers[];
  parts: PartWithPerformers[];
}

export const PROGRAMS: Record<StudyCircleProgram, {
  labelEn: string;
  labelBn: string;
  shortLabel: string;
  shortLabelEn: string;
  shortLabelBn: string;
  accent: string;
  soft: string;
  dayLabel: string;
  dayLabelEn: string;
  dayLabelBn: string;
  defaultWeekday: number;
  defaultTime: string;
}> = {
  kathamrita: {
    labelEn: "Ramakrishna Kathamrita",
    labelBn: "রামকৃষ্ণ কথামৃত",
    shortLabel: "Kathamrita · Tuesday",
    shortLabelEn: "Kathamrita · Tuesday",
    shortLabelBn: "কথামৃত · মঙ্গলবার",
    accent: "text-orange-600 bg-orange-100 border-orange-300",
    soft: "bg-orange-50 text-orange-700 border-orange-200",
    dayLabel: "Tuesday",
    dayLabelEn: "Tuesday",
    dayLabelBn: "মঙ্গলবার",
    defaultWeekday: 2,
    defaultTime: "17:00",
  },
  pathochokro: {
    labelEn: "Pathochokro Study Circle",
    labelBn: "পাঠচক্র",
    shortLabel: "Pathochokro · Thursday",
    shortLabelEn: "Pathochokro · Thursday",
    shortLabelBn: "পাঠচক্র · বৃহস্পতিবার",
    accent: "text-purple-600 bg-purple-100 border-purple-300",
    soft: "bg-purple-50 text-purple-700 border-purple-200",
    dayLabel: "Thursday",
    dayLabelEn: "Thursday",
    dayLabelBn: "বৃহস্পতিবার",
    defaultWeekday: 4,
    defaultTime: "17:00",
  },
};

export const DEFAULT_ROLES = [
  "President (সভাপতি)",
  "Conductor (সঞ্চালক)",
  "Reader (পাঠক)",
  "Opening Song (উদ্বোধনী সঙ্গীত)",
];

export function formatSessionDate(dateStr: string, lang: "en" | "bn" = "en"): string {
  const d = new Date(dateStr + "T00:00:00");
  if (lang === "bn") {
    return d.toLocaleDateString("bn-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      weekday: "long",
      timeZone: "Asia/Kolkata",
    });
  }
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    weekday: "long",
    timeZone: "Asia/Kolkata",
  });
}

export function displayTime(t: string | null): string {
  return t ? formatTime12(t) : "—";
}

export const DEMO_SESSIONS: Record<StudyCircleProgram, StudyCircleSession> = {
  pathochokro: {
    id: "demo-pathochokro",
    program_type: "pathochokro",
    scheduled_date: "2026-10-22",
    start_time: "17:00",
    status: "scheduled",
    title_en: "Pathochokro Weekly Session — Literature of Sarat Chandra",
    title_bn: "পাঠচক্র সাপ্তাহিক অধিবেশন — শরৎচন্দ্রের সাহিত্য",
    note: "সবাই সময়মতো গুগল মিট লিংকে যুক্ত হবেন।",
    note_en: "Please join on time via Google Meet.",
    meeting_link: "https://meet.google.com/hos-path-ckr",
    is_published: true,
    published_at: "2026-10-18T10:00:00Z",
    created_at: "2026-10-18T10:00:00Z",
    updated_at: "2026-10-18T10:00:00Z",
  },
  kathamrita: {
    id: "demo-kathamrita",
    program_type: "kathamrita",
    scheduled_date: "2026-10-20",
    start_time: "17:00",
    status: "scheduled",
    title_en: "Ramakrishna Kathamrita Reading & Interpretation — Vol 2",
    title_bn: "রামকৃষ্ণ কথামৃত পাঠ ও ব্যাখ্যা — ২য় খণ্ড",
    note: "আজকের পাঠে মাস্টার মহাশয়ের সাথে ঠাকুরের আলোচনা পরিবেশিত হবে।",
    note_en: "Today's discourse features Master Mahashay's dialogue with Thakur Sri Ramakrishna.",
    meeting_link: "https://meet.google.com/hos-kthm-rta",
    is_published: true,
    published_at: "2026-10-18T10:00:00Z",
    created_at: "2026-10-18T10:00:00Z",
    updated_at: "2026-10-18T10:00:00Z",
  },
};

export const DEMO_BUNDLES: Record<string, SessionBundle> = {
  "demo-pathochokro": {
    session: DEMO_SESSIONS.pathochokro,
    roles: [
      {
        id: "r-1",
        session_id: "demo-pathochokro",
        role_name: "President (সভাপতি)",
        role_name_en: "President",
        display_order: 1,
        created_at: "",
        performers: [
          {
            id: "rp-1",
            role_id: "r-1",
            member_id: "m-1",
            performer_name: "ডা. অসীম বন্দ্যোপাধ্যায়",
            performer_name_en: "Dr. Asim Bandyopadhyay",
            is_guest: false,
            display_order: 1,
            created_at: "",
          },
        ],
      },
      {
        id: "r-2",
        session_id: "demo-pathochokro",
        role_name: "Conductor (সঞ্চালক)",
        role_name_en: "Conductor",
        display_order: 2,
        created_at: "",
        performers: [
          {
            id: "rp-2",
            role_id: "r-2",
            member_id: "m-2",
            performer_name: "শ্রীমতী কবিতা রায়",
            performer_name_en: "Smt. Kabita Roy",
            is_guest: false,
            display_order: 1,
            created_at: "",
          },
        ],
      },
      {
        id: "r-3",
        session_id: "demo-pathochokro",
        role_name: "Reader (পাঠক)",
        role_name_en: "Reader",
        display_order: 3,
        created_at: "",
        performers: [
          {
            id: "rp-3",
            role_id: "r-3",
            member_id: "m-3",
            performer_name: "শুভ্রাংশু মুখার্জী",
            performer_name_en: "Subhrangshu Mukherjee",
            is_guest: false,
            display_order: 1,
            created_at: "",
          },
        ],
      },
      {
        id: "r-4",
        session_id: "demo-pathochokro",
        role_name: "Opening Song (উদ্বোধনী সঙ্গীত)",
        role_name_en: "Opening Song",
        display_order: 4,
        created_at: "",
        performers: [
          {
            id: "rp-4",
            role_id: "r-4",
            member_id: null,
            performer_name: "শম্পা মজুমদার",
            performer_name_en: "Shampa Majumdar",
            is_guest: true,
            display_order: 1,
            created_at: "",
          },
        ],
      },
    ],
    parts: [
      {
        id: "p-1",
        session_id: "demo-pathochokro",
        part_number: 1,
        item_type: "song",
        description: "উদ্বোধনী সঙ্গীত — 'আনন্দলোকে মঙ্গলালোকে বিরাজ সত্যসুন্দর'",
        description_en: "Opening Song — 'Anandaloke Mangalaloke Birajo Satyosundaro'",
        reference_link: "https://geetabitan.com",
        display_order: 1,
        created_at: "",
        performers: [
          {
            id: "pp-1",
            part_id: "p-1",
            member_id: null,
            performer_name: "শম্পা মজুমদার",
            performer_name_en: "Shampa Majumdar",
            is_guest: true,
            display_order: 1,
            created_at: "",
          },
        ],
      },
      {
        id: "p-2",
        session_id: "demo-pathochokro",
        part_number: 2,
        item_type: "reading",
        description: "শরৎচন্দ্র চট্টোপাধ্যায়ের 'শ্রীকান্ত' প্রথম পর্ব থেকে নির্বাচিত অংশ পাঠ ও স্মৃতিচারণ",
        description_en: "Reading & Discussion from Sarat Chandra's 'Srikanta' (Part 1)",
        reference_link: null,
        display_order: 2,
        created_at: "",
        performers: [
          {
            id: "pp-2",
            part_id: "p-2",
            member_id: "m-3",
            performer_name: "শুভ্রাংশু মুখার্জী",
            performer_name_en: "Subhrangshu Mukherjee",
            is_guest: false,
            display_order: 1,
            created_at: "",
          },
        ],
      },
      {
        id: "p-3",
        session_id: "demo-pathochokro",
        part_number: 3,
        item_type: "reading",
        description: "শ্রী শ্রী রামকৃষ্ণ লীলাপ্রসঙ্গ — ঠাকুর শ্রীরামকৃষ্ণের সাধক জীবন ও বাণী",
        description_en: "Sri Sri Ramakrishna Lilaprasanga — Sadhana Life & Teachings",
        reference_link: null,
        display_order: 3,
        created_at: "",
        performers: [
          {
            id: "pp-3",
            part_id: "p-3",
            member_id: "m-4",
            performer_name: "দীপক চ্যাটার্জী",
            performer_name_en: "Deepak Chatterjee",
            is_guest: false,
            display_order: 1,
            created_at: "",
          },
        ],
      },
      {
        id: "p-4",
        session_id: "demo-pathochokro",
        part_number: 4,
        item_type: "prayer",
        description: "সমবেত বৈদিক শান্তি পাঠ ও বিশ্বকল্যাণ প্রার্থনা",
        description_en: "Vedic Shanti Path & Collective Community Prayer",
        reference_link: null,
        display_order: 4,
        created_at: "",
        performers: [
          {
            id: "pp-4",
            part_id: "p-4",
            member_id: null,
            performer_name: "সমবেত সদস্যবৃন্দ",
            performer_name_en: "All Community Members",
            is_guest: false,
            display_order: 1,
            created_at: "",
          },
        ],
      },
    ],
  },
  "demo-kathamrita": {
    session: DEMO_SESSIONS.kathamrita,
    roles: [
      {
        id: "rk-1",
        session_id: "demo-kathamrita",
        role_name: "President (সভাপতি)",
        role_name_en: "President",
        display_order: 1,
        created_at: "",
        performers: [
          {
            id: "rpk-1",
            role_id: "rk-1",
            member_id: null,
            performer_name: "স্বামী লোকেশ্বরানন্দজি",
            performer_name_en: "Swami Lokeswaranandaji",
            is_guest: true,
            display_order: 1,
            created_at: "",
          },
        ],
      },
      {
        id: "rk-2",
        session_id: "demo-kathamrita",
        role_name: "Conductor (সঞ্চালক)",
        role_name_en: "Conductor",
        display_order: 2,
        created_at: "",
        performers: [
          {
            id: "rpk-2",
            role_id: "rk-2",
            member_id: "m-5",
            performer_name: "শ্রীমতী আরতি সেনগুপ্ত",
            performer_name_en: "Smt. Arati Sengupta",
            is_guest: false,
            display_order: 1,
            created_at: "",
          },
        ],
      },
      {
        id: "rk-3",
        session_id: "demo-kathamrita",
        role_name: "Reader (পাঠক)",
        role_name_en: "Reader",
        display_order: 3,
        created_at: "",
        performers: [
          {
            id: "rpk-3",
            role_id: "rk-3",
            member_id: "m-6",
            performer_name: "শ্রী শ্যামল ভট্টাচার্য",
            performer_name_en: "Shyamal Bhattacharya",
            is_guest: false,
            display_order: 1,
            created_at: "",
          },
        ],
      },
      {
        id: "rk-4",
        session_id: "demo-kathamrita",
        role_name: "Opening Song (উদ্বোধনী সঙ্গীত)",
        role_name_en: "Opening Song",
        display_order: 4,
        created_at: "",
        performers: [
          {
            id: "rpk-4",
            role_id: "rk-4",
            member_id: "m-7",
            performer_name: "সুমিতা সেন",
            performer_name_en: "Sumita Sen",
            is_guest: false,
            display_order: 1,
            created_at: "",
          },
        ],
      },
    ],
    parts: [
      {
        id: "pk-1",
        session_id: "demo-kathamrita",
        part_number: 1,
        item_type: "song",
        description: "উদ্বোধনী ভক্তিগীতি — 'মন চল রে সুরধুনী তীরে'",
        description_en: "Opening Devotional Song — 'Mon Cholo Re Surodhuni Teere'",
        reference_link: "https://geetabitan.com",
        display_order: 1,
        created_at: "",
        performers: [
          {
            id: "ppk-1",
            part_id: "pk-1",
            member_id: "m-7",
            performer_name: "সুমিতা সেন",
            performer_name_en: "Sumita Sen",
            is_guest: false,
            display_order: 1,
            created_at: "",
          },
        ],
      },
      {
        id: "pk-2",
        session_id: "demo-kathamrita",
        part_number: 2,
        item_type: "reading",
        description: "শ্রী শ্রী রামকৃষ্ণ কথামৃত (২য় খণ্ড) — দক্ষিণেশ্বর মন্দিরে ভক্তসঙ্গে ঠাকুর শ্রীরামকৃষ্ণ",
        description_en: "Sri Ramakrishna Kathamrita (Vol 2) — Discourse at Dakshineswar Temple",
        reference_link: null,
        display_order: 2,
        created_at: "",
        performers: [
          {
            id: "ppk-2",
            part_id: "pk-2",
            member_id: "m-6",
            performer_name: "শ্রী শ্যামল ভট্টাচার্য",
            performer_name_en: "Shyamal Bhattacharya",
            is_guest: false,
            display_order: 1,
            created_at: "",
          },
        ],
      },
      {
        id: "pk-3",
        session_id: "demo-kathamrita",
        part_number: 3,
        item_type: "prayer",
        description: "শ্রীরামকৃষ্ণ স্তোত্র, প্রণাম মন্ত্র ও সমবেত প্রার্থনা",
        description_en: "Sri Ramakrishna Stotram & Collective Evening Prayer",
        reference_link: null,
        display_order: 3,
        created_at: "",
        performers: [
          {
            id: "ppk-3",
            part_id: "pk-3",
            member_id: null,
            performer_name: "সমবেত সদস্যবৃন্দ",
            performer_name_en: "All Community Members",
            is_guest: false,
            display_order: 1,
            created_at: "",
          },
        ],
      },
    ],
  },
};

// Add past session bundles for instant accordion preview
DEMO_BUNDLES["demo-past-p1"] = {
  session: {
    id: "demo-past-p1",
    program_type: "pathochokro",
    scheduled_date: "2026-10-15",
    start_time: "17:00",
    status: "scheduled",
    title_en: "Pathochokro — Sharad Special Literary Session",
    title_bn: "পাঠচক্র — শারদীয় বিশেষ সাহিত্য ও সঙ্গীত আলোচনা",
    note: null,
    note_en: null,
    meeting_link: null,
    is_published: true,
    published_at: "2026-10-15T10:00:00Z",
    created_at: "2026-10-15T10:00:00Z",
    updated_at: "2026-10-15T10:00:00Z",
  },
  roles: [
    {
      id: "rp-p1-1",
      session_id: "demo-past-p1",
      role_name: "President (সভাপতি)",
      role_name_en: "President",
      display_order: 1,
      created_at: "",
      performers: [{ id: "p-p1", role_id: "rp-p1-1", member_id: "m-1", performer_name: "ডা. অসীম বন্দ্যোপাধ্যায়", performer_name_en: "Dr. Asim Bandyopadhyay", is_guest: false, display_order: 1, created_at: "" }],
    },
  ],
  parts: [
    {
      id: "pp-p1-1",
      session_id: "demo-past-p1",
      part_number: 1,
      item_type: "reading",
      description: "রবীন্দ্রনাথের শারদোৎসব নাটকের প্রাসঙ্গিকতা ও পাঠ",
      description_en: "Reading and Discussion: Relevance of Rabindranath's Sharadotsav",
      reference_link: null,
      display_order: 1,
      created_at: "",
      performers: [{ id: "pp-p1", part_id: "pp-p1-1", member_id: "m-3", performer_name: "শুভ্রাংশু মুখার্জী", performer_name_en: "Subhrangshu Mukherjee", is_guest: false, display_order: 1, created_at: "" }],
    },
  ],
};

export const DEMO_PAST_SESSIONS: Record<StudyCircleProgram, StudyCircleSession[]> = {
  pathochokro: [
    {
      id: "demo-past-p1",
      program_type: "pathochokro",
      scheduled_date: "2026-10-15",
      start_time: "17:00",
      status: "scheduled",
      title_en: "Pathochokro — Sharad Special Literary Session",
      title_bn: "পাঠচক্র — শারদীয় বিশেষ সাহিত্য ও সঙ্গীত আলোচনা",
      note: null,
      note_en: null,
      meeting_link: null,
      is_published: true,
      published_at: "2026-10-15T10:00:00Z",
      created_at: "2026-10-15T10:00:00Z",
      updated_at: "2026-10-15T10:00:00Z",
    },
    {
      id: "demo-past-p2",
      program_type: "pathochokro",
      scheduled_date: "2026-10-08",
      start_time: "17:00",
      status: "scheduled",
      title_en: "Pathochokro — Swami Vivekananda's Epistles",
      title_bn: "পাঠচক্র — স্বামীজীর পত্রাবলী ও প্রাচ্য-পাশ্চাত্য",
      note: null,
      note_en: null,
      meeting_link: null,
      is_published: true,
      published_at: "2026-10-08T10:00:00Z",
      created_at: "2026-10-08T10:00:00Z",
      updated_at: "2026-10-08T10:00:00Z",
    },
  ],
  kathamrita: [
    {
      id: "demo-past-k1",
      program_type: "kathamrita",
      scheduled_date: "2026-10-13",
      start_time: "17:00",
      status: "scheduled",
      title_en: "Ramakrishna Kathamrita — Vijaya Sammilani Special",
      title_bn: "রামকৃষ্ণ কথামৃত — বিজয়া সম্মিলনী ও শ্রীরামকৃষ্ণের ভাবধারা",
      note: null,
      note_en: null,
      meeting_link: null,
      is_published: true,
      published_at: "2026-10-13T10:00:00Z",
      created_at: "2026-10-13T10:00:00Z",
      updated_at: "2026-10-13T10:00:00Z",
    },
  ],
};

export async function fetchUpcomingSession(
  program: StudyCircleProgram,
): Promise<StudyCircleSession | null> {
  if (!isSupabaseConfigured) {
    return DEMO_SESSIONS[program] ?? null;
  }

  try {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

    const { data, error } = await Promise.race([
      supabase
        .from("study_circle_sessions")
        .select("*")
        .eq("program_type", program)
        .eq("is_published", true)
        .gte("scheduled_date", today)
        .order("scheduled_date", { ascending: true })
        .limit(1)
        .maybeSingle(),
      new Promise<{ data: null; error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 1500),
      ),
    ]);

    if (error || !data) {
      return DEMO_SESSIONS[program] ?? null;
    }
    return (data as unknown as StudyCircleSession | null) ?? DEMO_SESSIONS[program];
  } catch {
    return DEMO_SESSIONS[program] ?? null;
  }
}

export async function fetchSessionBundle(sessionId: string): Promise<SessionBundle> {
  if (DEMO_BUNDLES[sessionId]) {
    return DEMO_BUNDLES[sessionId];
  }

  if (!isSupabaseConfigured) {
    return DEMO_BUNDLES[sessionId] ?? DEMO_BUNDLES["demo-pathochokro"];
  }

  try {
    const [
      { data: session, error: sErr },
      { data: roles, error: rErr },
      { data: parts, error: pErr },
    ] = await Promise.race([
      Promise.all([
        supabase.from("study_circle_sessions").select("*").eq("id", sessionId).single(),
        supabase.from("study_circle_roles").select("*").eq("session_id", sessionId).order("display_order"),
        supabase.from("study_circle_parts").select("*").eq("session_id", sessionId).order("display_order"),
      ]),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 1500),
      ),
    ]);

    if (sErr || !session) {
      return DEMO_BUNDLES[sessionId] ?? DEMO_BUNDLES["demo-pathochokro"];
    }
    if (rErr) throw rErr;
    if (pErr) throw pErr;

    const roleRows = (roles ?? []) as unknown as StudyCircleRole[];
    const partRows = (parts ?? []) as unknown as StudyCirclePart[];

    const roleIds = roleRows.map((r) => r.id);
    const partIds = partRows.map((p) => p.id);

    const [
      { data: rolePerfs, error: rpErr },
      { data: partPerfs, error: ppErr },
    ] = await Promise.all([
      roleIds.length
        ? supabase.from("study_circle_role_performers").select("*").in("role_id", roleIds).order("display_order")
        : Promise.resolve({ data: [] as unknown as StudyCircleRolePerformer[], error: null }),
      partIds.length
        ? supabase.from("study_circle_part_performers").select("*").in("part_id", partIds).order("display_order")
        : Promise.resolve({ data: [] as unknown as StudyCirclePartPerformer[], error: null }),
    ]);

    if (rpErr) throw rpErr;
    if (ppErr) throw ppErr;

    const rolePerformerRows = (rolePerfs ?? []) as unknown as StudyCircleRolePerformer[];
    const partPerformerRows = (partPerfs ?? []) as unknown as StudyCirclePartPerformer[];

    return {
      session: session as unknown as StudyCircleSession,
      roles: roleRows.map((role) => ({
        ...role,
        performers: rolePerformerRows.filter((p) => p.role_id === role.id),
      })),
      parts: partRows.map((part) => ({
        ...part,
        performers: partPerformerRows.filter((p) => p.part_id === part.id),
      })),
    };
  } catch {
    return DEMO_BUNDLES[sessionId] ?? DEMO_BUNDLES["demo-pathochokro"];
  }
}

export function getPerformerNames(
  performers: { performer_name: string; performer_name_en?: string | null }[],
  lang: "en" | "bn" = "en",
): string {
  if (!performers.length) return "—";
  return performers
    .map((p) => (lang === "bn" ? p.performer_name : (p.performer_name_en || p.performer_name)))
    .join(", ");
}

export function generateWhatsAppMessage(bundle: SessionBundle): string {
  const { session, roles, parts } = bundle;
  const meta = PROGRAMS[session.program_type];

  let msg = `🌸 *শ্রদ্ধা ওয়েলফেয়ার অ্যাসোসিয়েশন* 🌸\n`;
  msg += `📖 *${meta.labelBn}*\n`;
  msg += `📅 ${formatSessionDate(session.scheduled_date)}\n`;
  msg += `⏰ ${displayTime(session.start_time)}\n\n`;

  if (session.status === "cancelled") {
    msg += `⚠️ *বিশেষ বিজ্ঞপ্তি:* আজকের অধিবেশন স্থগিত রাখা হয়েছে।`;
    if (session.note) msg += ` ${session.note}`;
    msg += `\n`;
    return msg;
  }

  if (session.note) {
    msg += `📢 ${session.note}\n\n`;
  }

  msg += `*দায়িত্বপ্রাপ্ত:*\n`;
  for (const r of roles) {
    const names = getPerformerNames(r.performers);
    msg += `• ${r.role_name}: ${names}\n`;
  }

  if (parts.length > 0) {
    msg += `\n*সূচী:*\n`;
    for (const p of parts) {
      const num = p.part_number ? `[${p.part_number}] ` : "";
      const names = p.performers.length
        ? ` — _${getPerformerNames(p.performers)}_`
        : "";
      msg += `${num}${p.description}${names}\n`;
    }
  }

  if (session.meeting_link) {
    msg += `\n🔗 *লিংক:* ${session.meeting_link}\n`;
  }

  return msg;
}

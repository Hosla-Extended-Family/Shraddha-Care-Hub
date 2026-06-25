import { useQuery } from "@tanstack/react-query";
import { Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TeamMemberCard } from "./TeamMemberCard";
import type { Database } from "@/integrations/supabase/types";
import teamHeaderBg from "@/assets/team-header-bg.png";
import hoslaLogo from "@/assets/hosla-logo.png";
import shraddhaLogo from "@/assets/logo-shraddha.png";

type TeamCategory = Database["public"]["Enums"]["team_category"];

interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: TeamCategory;
  photo_url: string | null;
  bio: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  display_order: number;
}

const CATEGORY_CONFIG: Record<TeamCategory, { label: string; order: number }> = {
  president: { label: "President", order: 1 },
  board_member: { label: "Board Member", order: 2 },
  core: { label: "Core Team", order: 3 },
  senior_members: { label: "Senior Members", order: 4 },
  advocates: { label: "Advocates", order: 5 },
  counsellors: { label: "Counsellors", order: 6 },
  volunteers_technical: { label: "Technical Volunteers", order: 7 },
  volunteers_hr: { label: "HR Volunteers", order: 8 },
  volunteers_marketing: { label: "Marketing Volunteers", order: 9 },
  volunteers_social_media: { label: "Social Media Managers", order: 10 },
  volunteers_design: { label: "Design Volunteers", order: 11 },
  interns: { label: "Interns", order: 12 },
};

export function TeamSection() {
  const { data: teamMembers, isLoading, error } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as TeamMember[];
    },
  });

  // Group members by category
  const groupedMembers = teamMembers?.reduce((acc, member) => {
    if (!acc[member.category]) {
      acc[member.category] = [];
    }
    acc[member.category].push(member);
    return acc;
  }, {} as Record<TeamCategory, TeamMember[]>);

  // Sort categories by order
  const sortedCategories = groupedMembers
    ? (Object.keys(groupedMembers) as TeamCategory[]).sort(
        (a, b) => CATEGORY_CONFIG[a].order - CATEGORY_CONFIG[b].order
      )
    : [];

  if (isLoading) {
    return (
      <section className="py-16 lg:py-24 bg-card">
        <div className="container">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (error || !teamMembers || teamMembers.length === 0) {
    return (
      <section className="py-16 lg:py-24 bg-card">
        <div className="container">
          <div className="text-center mb-12">
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Our Team
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The dedicated individuals driving our mission forward.
            </p>
          </div>
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Team information coming soon...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="team" className="py-0 bg-card">
      {/* Animated Gradient Header */}
      <div className="group relative overflow-hidden py-16 lg:py-24">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
          style={{ backgroundImage: `url(${teamHeaderBg})` }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/85 via-teal-500/80 to-green-500/85" />
        
        {/* Animated Overlay Pattern */}
        <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,white_1px,transparent_1px)] bg-[length:20px_20px] animate-pulse" />
        </div>
        
        {/* Floating Decorative Elements */}
        <div className="absolute top-6 left-10 w-16 h-16 border-2 border-white/20 rounded-full transition-transform duration-500 group-hover:scale-125 group-hover:rotate-45" />
        <div className="absolute bottom-8 right-12 w-24 h-24 border-2 border-white/15 rounded-full transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12" />
        <div className="absolute top-1/2 right-1/4 w-8 h-8 bg-white/10 rounded-full transition-all duration-500 group-hover:bg-white/20 group-hover:scale-150" />
        <div className="absolute bottom-1/3 left-1/4 w-6 h-6 bg-white/15 rounded-full transition-all duration-500 group-hover:translate-y-2" />
        <div className="absolute top-10 right-10 w-12 h-12 border border-white/10 rotate-45 transition-transform duration-500 group-hover:rotate-90" />
        
        {/* Content */}
        <div className="container relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-6 transition-transform duration-300 group-hover:scale-110">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h2 className="font-serif text-2xl lg:text-4xl font-bold text-white mb-4 drop-shadow-lg transition-transform duration-300 group-hover:scale-105 flex flex-wrap items-center justify-center gap-2 lg:gap-3">
              <span>Our Team of</span>
              <img src={hoslaLogo} alt="Hosla" className="h-8 lg:h-12 inline-block drop-shadow-lg bg-white/90 rounded-md px-2 py-1" />
              <span className="text-white/80">|</span>
              <img src={shraddhaLogo} alt="Shraddha" className="h-8 lg:h-12 inline-block drop-shadow-lg bg-white/90 rounded-md px-2 py-1" />
            </h2>
            <p className="text-white/90 max-w-2xl mx-auto text-lg">
              The dedicated individuals driving our mission forward.
            </p>
          </div>
        </div>
        
        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 80L60 70C120 60 240 40 360 35C480 30 600 40 720 45C840 50 960 50 1080 45C1200 40 1320 30 1380 25L1440 20V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="hsl(var(--card))"/>
          </svg>
        </div>
      </div>

      {/* Team Content */}
      <div className="container py-8 lg:py-12">

        <div className="space-y-16">
          {sortedCategories.map((category) => (
            <div key={category}>
              {/* Category Header */}
              <div className="text-center mb-8">
                <h3 className="font-serif text-xl lg:text-2xl font-semibold text-foreground">
                  {CATEGORY_CONFIG[category].label}
                </h3>
                <div className="w-16 h-1 bg-primary mx-auto mt-3 rounded-full" />
              </div>

              {/* Members Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
                {groupedMembers![category].map((member) => (
                  <TeamMemberCard
                    key={member.id}
                    name={member.name}
                    role={member.role}
                    photoUrl={member.photo_url}
                    bio={member.bio}
                    facebookUrl={member.facebook_url}
                    instagramUrl={member.instagram_url}
                    linkedinUrl={member.linkedin_url}
                    githubUrl={member.github_url}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

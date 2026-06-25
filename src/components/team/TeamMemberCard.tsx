import { useState } from "react";
import { Facebook, Instagram, Linkedin, Github } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TeamMemberCardProps {
  name: string;
  role: string;
  photoUrl?: string | null;
  bio?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
}

export function TeamMemberCard({
  name,
  role,
  photoUrl,
  bio,
  facebookUrl,
  instagramUrl,
  linkedinUrl,
  githubUrl,
}: TeamMemberCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get social links (max 2)
  const socialLinks = [
    { url: linkedinUrl, icon: Linkedin, label: "LinkedIn" },
    { url: instagramUrl, icon: Instagram, label: "Instagram" },
    { url: facebookUrl, icon: Facebook, label: "Facebook" },
    { url: githubUrl, icon: Github, label: "GitHub" },
  ]
    .filter((link) => link.url)
    .slice(0, 2);

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30">
        {/* Photo Section */}
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              className={cn(
                "w-full h-full object-cover transition-transform duration-500",
                isHovered && "scale-110"
              )}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10">
              <span className="text-4xl font-bold text-primary">
                {getInitials(name)}
              </span>
            </div>
          )}

          {/* Overlay on hover */}
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/60 to-transparent flex flex-col justify-end p-4 transition-opacity duration-300",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          >
            {bio && (
              <p className="text-primary-foreground text-sm line-clamp-3 mb-3">
                {bio}
              </p>
            )}
            
            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex gap-2">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-primary-foreground/20 hover:bg-primary-foreground/30 rounded-full transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon className="h-4 w-4 text-primary-foreground" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="p-4 text-center">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <h3 className="font-semibold text-foreground truncate cursor-default">
                  {name}
                </h3>
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                className="bg-primary text-primary-foreground font-medium px-3 py-1.5 shadow-lg"
              >
                {name}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <p className="text-sm text-muted-foreground truncate">{role}</p>
        </div>
      </div>
    </div>
  );
}

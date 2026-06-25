import { GoogleMeetIcon, YouTubeIcon, FacebookIcon } from "./PlatformIcons";
import type { RoutineSession } from "@/lib/routine";

interface JoinButtonsProps {
  session: RoutineSession;
  size?: "lg" | "md";
}

const sizeClasses = {
  lg: "px-6 py-4 text-lg rounded-2xl",
  md: "px-5 py-3 text-base rounded-xl",
};

const iconSize = {
  lg: "h-7 w-7",
  md: "h-6 w-6",
};

/**
 * Large, high-contrast platform join buttons designed for senior users.
 * Renders only the platforms that have a link configured.
 */
export function JoinButtons({ session, size = "lg" }: JoinButtonsProps) {
  const buttons: { url: string; label: string; icon: JSX.Element; brand: string }[] = [];

  if (session.meet_url) {
    buttons.push({
      url: session.meet_url,
      label: "Join on Google Meet",
      icon: <GoogleMeetIcon className={iconSize[size]} />,
      brand: "bg-white text-[#1a73e8] border-2 border-[#1a73e8]/30 hover:bg-[#1a73e8] hover:text-white hover:border-[#1a73e8]",
    });
  }
  if (session.youtube_url) {
    buttons.push({
      url: session.youtube_url,
      label: "Watch on YouTube",
      icon: <YouTubeIcon className={iconSize[size]} />,
      brand: "bg-white text-[#FF0000] border-2 border-[#FF0000]/30 hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000]",
    });
  }
  if (session.facebook_url) {
    buttons.push({
      url: session.facebook_url,
      label: "Join on Facebook",
      icon: <FacebookIcon className={iconSize[size]} />,
      brand: "bg-white text-[#1877F2] border-2 border-[#1877F2]/30 hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]",
    });
  }

  if (buttons.length === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full">
      {buttons.map((b) => (
        <a
          key={b.label}
          href={b.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`group inline-flex items-center justify-center gap-3 font-semibold shadow-sm transition-all duration-200 active:scale-[0.98] touch-manipulation w-full sm:w-auto ${sizeClasses[size]} ${b.brand}`}
        >
          <span className="shrink-0">{b.icon}</span>
          <span>{b.label}</span>
        </a>
      ))}
    </div>
  );
}

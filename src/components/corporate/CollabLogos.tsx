import logoShraddha from "@/assets/logo-shraddha.png";
import hoslaLogo from "@/assets/hosla-logo.png";
import type { OrgLogo } from "@/hooks/use-collaborate-content";

interface CollabLogosProps {
  orgLogo: OrgLogo;
  collaboratorLogoUrl: string | null;
  collaboratorText: string | null;
  partnerName?: string;
}

/** Renders the Shraddha/Hosla org logos alongside the collaborator's logo or name. */
export function CollabLogos({
  orgLogo,
  collaboratorLogoUrl,
  collaboratorText,
}: CollabLogosProps) {
  const showShraddha = orgLogo === "shraddha" || orgLogo === "both";
  const showHosla = orgLogo === "hosla" || orgLogo === "both";
  const hasOrg = showShraddha || showHosla;
  const hasCollab = !!collaboratorLogoUrl || !!collaboratorText;

  if (!hasOrg && !hasCollab) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4 mb-4">
      {hasOrg && (
        <div className="flex items-center gap-2">
          {showShraddha && (
            <img src={logoShraddha} alt="Shraddha" className="h-8 w-auto object-contain" loading="lazy" />
          )}
          {showHosla && (
            <img src={hoslaLogo} alt="Hosla" className="h-8 w-auto object-contain" loading="lazy" />
          )}
        </div>
      )}

      {hasOrg && hasCollab && (
        <span className="text-lg font-light text-muted-foreground" aria-hidden="true">
          ×
        </span>
      )}

      {hasCollab &&
        (collaboratorLogoUrl ? (
          <img
            src={collaboratorLogoUrl}
            alt={collaboratorText || "Collaborator"}
            className="h-8 w-auto object-contain"
            loading="lazy"
          />
        ) : (
          <span className="text-sm font-semibold text-foreground">{collaboratorText}</span>
        ))}
    </div>
  );
}

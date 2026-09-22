import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveAvatarUrl, getInitials } from "@/lib/avatar";
import { cn } from "@/lib/utils";

interface Props {
  avatarPath?: string | null;
  name?: string | null;
  className?: string;
}

export function AuthorAvatar({ avatarPath, name, className }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    resolveAvatarUrl(avatarPath).then((u) => { if (!cancelled) setUrl(u); });
    return () => { cancelled = true; };
  }, [avatarPath]);

  return (
    <Avatar className={cn("h-10 w-10 border border-border/60", className)}>
      {url && <AvatarImage src={url} alt={name || "Author"} />}
      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

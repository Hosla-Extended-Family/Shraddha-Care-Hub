import { useEffect, useRef, useState } from "react";
import { Search, UserRound, X, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PerformerValue } from "@/lib/studycircle";

type Member = {
  id: string;
  name: string;
  membership_id: string | null;
  phone_digits: string | null;
  status: string;
};

interface Props {
  value: PerformerValue;
  onChange: (value: PerformerValue) => void;
  placeholder?: string;
}

export function MemberSearchCombobox({ value, onChange, placeholder = "Search member…" }: Props) {
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [open, setOpen] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  useEffect(() => {
    if (guestMode || search.trim().length < 2) {
      setMembers([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("member_imports")
        .select("id, name, membership_id, phone_digits, status")
        .ilike("name", `%${search.trim()}%`)
        .order("name")
        .limit(10);
      setLoading(false);
      if (!error) setMembers((data ?? []) as Member[]);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search, guestMode]);

  if (value.displayName) {
    return (
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium">{value.displayName}</span>
          {value.memberId && <Badge variant="outline" className="shrink-0 text-[10px]">Member</Badge>}
          {!value.memberId && <Badge variant="secondary" className="shrink-0 text-[10px]">Guest</Badge>}
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onChange({ memberId: null, guestName: null, displayName: "" })}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      {guestMode ? (
        <div className="flex gap-2">
          <Input
            autoFocus
            value={value.guestName ?? ""}
            placeholder="Guest performer name"
            onChange={(e) => onChange({ memberId: null, guestName: e.target.value, displayName: e.target.value })}
          />
          <Button type="button" variant="outline" onClick={() => { setGuestMode(false); onChange({ memberId: null, guestName: null, displayName: "" }); }}>
            Member
          </Button>
        </div>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            placeholder={placeholder}
            className="pl-9"
            onFocus={() => setOpen(true)}
            onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          />
        </div>
      )}

      {open && !guestMode && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-lg">
          {loading && <div className="px-3 py-2 text-sm text-muted-foreground">Searching…</div>}
          {!loading && search.trim().length < 2 && <div className="px-3 py-2 text-sm text-muted-foreground">Type at least 2 characters.</div>}
          {!loading && search.trim().length >= 2 && members.length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">No member found.</div>}
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              className={cn("w-full rounded-md px-3 py-2 text-left hover:bg-accent")}
              onClick={() => {
                setSearch("");
                setOpen(false);
                onChange({ memberId: member.id, guestName: member.name, displayName: member.name });
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{member.name}</span>
                <Badge variant="outline" className="text-[10px]">{member.status}</Badge>
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {member.membership_id || "No membership ID"}{member.phone_digits ? ` · ****${member.phone_digits.slice(-4)}` : ""}
              </div>
            </button>
          ))}
          <button
            type="button"
            className="mt-1 flex w-full items-center gap-2 rounded-md border-t px-3 py-2 text-sm text-primary hover:bg-accent"
            onClick={() => { setGuestMode(true); setOpen(false); }}
          >
            <UserPlus className="h-4 w-4" />
            Not in member list? Add guest
          </button>
        </div>
      )}
    </div>
  );
}

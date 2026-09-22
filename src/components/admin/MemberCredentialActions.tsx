import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Camera, Eye, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  member: any;
  isMainAdmin: boolean;
  onChanged?: () => void;
}

function suggestPassword() {
  const words = ["Sun", "Moon", "River", "Lotus", "Tiger", "Mango", "Rain", "Star"];
  return `${words[Math.floor(Math.random() * words.length)]}${Math.floor(1000 + Math.random() * 9000)}`;
}

/**
 * Password reveal / reset and photo upload for one member.
 * Regular admins can only ask; the main admin approves in the HQ console.
 */
export default function MemberCredentialActions({ member, isMainAdmin, onChanged }: Props) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const call = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("member-credentials", { body });
    const payload = data as any;
    if (error || payload?.error) {
      toast({ title: "Couldn't do that", description: payload?.error || error?.message, variant: "destructive" });
      return null;
    }
    return payload;
  };

  const reveal = async () => {
    setBusy(true);
    const payload = await call({ action: "reveal_password", user_id: member.user_id });
    setBusy(false);
    if (!payload) return;
    if (payload.requested) {
      return toast({
        title: payload.already ? "Already waiting for approval" : "Approval requested",
        description: "The main admin has to approve this in the HQ console before the password shows.",
      });
    }
    if (!payload.password) {
      return toast({
        title: "No password on file",
        description: "Use “Reset password” to issue a fresh one.",
        variant: "destructive",
      });
    }
    setRevealed(payload.password);
  };

  const openReset = () => {
    setNewPassword(suggestPassword());
    setResetOpen(true);
  };

  const submitReset = async () => {
    if (newPassword.trim().length < 6) {
      return toast({ title: "Use at least 6 characters", variant: "destructive" });
    }
    setBusy(true);
    const payload = await call({ action: "set_password", user_id: member.user_id, password: newPassword.trim() });
    setBusy(false);
    if (!payload) return;
    setResetOpen(false);
    if (payload.requested) {
      return toast({
        title: "Sent for approval",
        description: "The main admin will approve this reset in the HQ console.",
      });
    }
    setRevealed(payload.password ?? newPassword.trim());
    toast({ title: "Password updated", description: "Share it with the member over a call or WhatsApp." });
  };

  const uploadPhoto = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      return toast({ title: "Photo must be under 5 MB", variant: "destructive" });
    }
    setBusy(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${member.user_id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) {
      setBusy(false);
      return toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
    }
    const payload = await call({ action: "set_avatar", user_id: member.user_id, avatar_path: path });
    setBusy(false);
    if (!payload) return;
    toast({ title: "Photo updated", description: "It now shows on the member's profile." });
    onChanged?.();
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = ""; }}
      />

      <Button size="sm" variant="ghost" className="h-10" onClick={reveal} disabled={busy}
        aria-label={`Show password for ${member.full_name}`} title="Show password">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
      </Button>
      <Button size="sm" variant="ghost" className="h-10" onClick={openReset} disabled={busy}
        aria-label={`Reset password for ${member.full_name}`} title="Reset password">
        <KeyRound className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" className="h-10" onClick={() => fileRef.current?.click()} disabled={busy}
        aria-label={`Change photo for ${member.full_name}`} title="Add or change photo">
        <Camera className="h-4 w-4" />
      </Button>

      {/* Revealed password */}
      <Dialog open={!!revealed} onOpenChange={(o) => !o && setRevealed(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{member.full_name}'s password</DialogTitle>
            <DialogDescription>
              Read it out to the member. This view is recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/40 p-4 space-y-1">
            <p className="text-sm text-muted-foreground">Membership ID</p>
            <p className="font-mono text-lg">{member.membership_id}</p>
            <p className="text-sm text-muted-foreground pt-2">Password</p>
            <p className="font-mono text-lg">{revealed}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" className="h-11"
              onClick={() => { navigator.clipboard?.writeText(`${member.membership_id} / ${revealed}`); toast({ title: "Copied" }); }}>
              Copy
            </Button>
            <Button className="h-11" onClick={() => setRevealed(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              {isMainAdmin
                ? `Set a new password for ${member.full_name} (${member.membership_id}).`
                : "This reset needs the main admin's approval before it takes effect."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="member-password">New password</Label>
            <div className="flex gap-2">
              <Input id="member-password" className="h-11 font-mono" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} />
              <Button variant="outline" className="h-11" onClick={() => setNewPassword(suggestPassword())}>
                Suggest
              </Button>
            </div>
            {!isMainAdmin && (
              <p className="text-sm text-muted-foreground flex items-start gap-2 pt-1">
                <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
                The main admin approves it in the HQ console, then it becomes active.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" className="h-11" onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button className="h-11" onClick={submitReset} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isMainAdmin ? "Set password" : "Send for approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

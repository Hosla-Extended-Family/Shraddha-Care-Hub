import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Mail, Plus, Trash2, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newAbuseEmail, setNewAbuseEmail] = useState("");
  const [newVolunteerEmail, setNewVolunteerEmail] = useState("");

  const { data: notificationEmails, isLoading } = useQuery({
    queryKey: ["notification-emails"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_emails")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const addEmailMutation = useMutation({
    mutationFn: async ({ email, type }: { email: string; type: string }) => {
      const { error } = await supabase
        .from("notification_emails")
        .insert({ email, notification_type: type });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-emails"] });
      toast({ title: "Email added successfully" });
    },
    onError: (error) => {
      toast({ title: "Error adding email", description: error.message, variant: "destructive" });
    },
  });

  const toggleEmailMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("notification_emails")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-emails"] });
    },
    onError: (error) => {
      toast({ title: "Error updating email", description: error.message, variant: "destructive" });
    },
  });

  const deleteEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notification_emails")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-emails"] });
      toast({ title: "Email removed successfully" });
    },
    onError: (error) => {
      toast({ title: "Error removing email", description: error.message, variant: "destructive" });
    },
  });

  const handleAddAbuseEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAbuseEmail) {
      addEmailMutation.mutate({ email: newAbuseEmail, type: "abuse_reports" });
      setNewAbuseEmail("");
    }
  };

  const handleAddVolunteerEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (newVolunteerEmail) {
      addEmailMutation.mutate({ email: newVolunteerEmail, type: "volunteer_applications" });
      setNewVolunteerEmail("");
    }
  };

  const abuseEmails = notificationEmails?.filter(e => e.notification_type === "abuse_reports") || [];
  const volunteerEmails = notificationEmails?.filter(e => e.notification_type === "volunteer_applications") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage notification settings and admin preferences.</p>
      </div>

      {/* Abuse Report Notifications */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle className="font-serif">Abuse Report Notifications</CardTitle>
          </div>
          <CardDescription>
            Email addresses that will receive notifications when a new abuse report is submitted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {abuseEmails.length > 0 ? (
                <div className="space-y-2">
                  {abuseEmails.map((email) => (
                    <div key={email.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm text-foreground">{email.email}</span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={email.is_active}
                            onCheckedChange={(checked) => toggleEmailMutation.mutate({ id: email.id, isActive: checked })}
                          />
                          <span className="text-xs text-muted-foreground">
                            {email.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEmailMutation.mutate(email.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No email addresses configured
                </p>
              )}

              <form onSubmit={handleAddAbuseEmail} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Add email address"
                  value={newAbuseEmail}
                  onChange={(e) => setNewAbuseEmail(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={!newAbuseEmail || addEmailMutation.isPending}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>

      {/* Volunteer Application Notifications */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle className="font-serif">Volunteer Application Notifications</CardTitle>
          </div>
          <CardDescription>
            Email addresses that will receive notifications when a new volunteer application is submitted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {volunteerEmails.length > 0 ? (
                <div className="space-y-2">
                  {volunteerEmails.map((email) => (
                    <div key={email.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm text-foreground">{email.email}</span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={email.is_active}
                            onCheckedChange={(checked) => toggleEmailMutation.mutate({ id: email.id, isActive: checked })}
                          />
                          <span className="text-xs text-muted-foreground">
                            {email.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEmailMutation.mutate(email.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No email addresses configured
                </p>
              )}

              <form onSubmit={handleAddVolunteerEmail} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Add email address"
                  value={newVolunteerEmail}
                  onChange={(e) => setNewVolunteerEmail(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={!newVolunteerEmail || addEmailMutation.isPending}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-2">Email Notifications Setup</h3>
          <p className="text-sm text-muted-foreground mb-4">
            To enable email notifications, you'll need to configure a Resend API key. 
            Email notifications will be sent to the active email addresses listed above 
            whenever a new abuse report or volunteer application is submitted.
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Contact the developer to set up the RESEND_API_KEY 
            for email notifications to work.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Search, Eye, Trash2, Loader2, Phone, Mail, IdCard, MapPin, CalendarDays, Droplet,
  Stethoscope, HeartPulse, ShieldCheck, FileText, Download,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";



type MembershipApplication = {
  id: string;
  name: string;
  email: string;
  
  child_contact: string;
  address: string;
  date_of_birth: string;
  blood_group: string;
  major_operation: string;
  chronic_disease: string;
  health_insurance: string;
  plan: string;
  photo_path: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

type AppStatus = "new" | "contacted" | "in_progress" | "approved" | "rejected";

const STATUS_OPTIONS: { value: AppStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "in_progress", label: "In Progress" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function AdminMemberships() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<MembershipApplication | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  const { data: applications, isLoading } = useQuery({
    queryKey: ["admin-membership-applications", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("membership_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data as MembershipApplication[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const payload: Record<string, string> = { status };
      if (notes !== undefined) payload.admin_notes = notes;
      const { error } = await supabase.from("membership_applications").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-membership-applications"] });
      toast({ title: "Application updated" });
    },
    onError: (error) => {
      toast({ title: "Error updating application", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (app: MembershipApplication) => {
      if (app.photo_path) {
        await supabase.storage.from("membership-photos").remove([app.photo_path]);
      }
      const { error } = await supabase.from("membership_applications").delete().eq("id", app.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-membership-applications"] });
      setIsViewOpen(false);
      toast({ title: "Application deleted" });
    },
    onError: (error) => {
      toast({ title: "Error deleting application", description: error.message, variant: "destructive" });
    },
  });

  const openApplication = async (app: MembershipApplication) => {
    setSelected(app);
    setIsViewOpen(true);
    setPhotoUrl(null);
    if (app.photo_path) {
      setPhotoLoading(true);
      const { data, error } = await supabase.storage
        .from("membership-photos")
        .createSignedUrl(app.photo_path, 60 * 10);
      if (!error && data) setPhotoUrl(data.signedUrl);
      setPhotoLoading(false);
    }
  };

  const filtered = applications?.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.child_contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      new: "bg-primary/10 text-primary border-primary/20",
      contacted: "bg-accent text-accent-foreground border-accent-foreground/20",
      in_progress: "bg-warning/10 text-warning border-warning/20",
      approved: "bg-primary/20 text-primary border-primary/30",
      rejected: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return <Badge variant="outline" className={styles[status] || styles.new}>{status.replace("_", " ")}</Badge>;
  };

  const getPlanBadge = (plan: string) => {
    const isPremium = plan === "premium";
    return (
      <Badge
        variant="outline"
        className={isPremium
          ? "bg-amber-500/10 text-amber-600 border-amber-500/30 capitalize"
          : "bg-primary/10 text-primary border-primary/20 capitalize"}
      >
        {plan || "standard"}
      </Badge>
    );
  };

  const isPdf = photoUrl ? selected?.photo_path?.toLowerCase().endsWith(".pdf") : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Membership Applications</h1>
        <p className="text-muted-foreground">Manage Hosla Membership Card applications and follow-ups.</p>
      </div>




      {/* Filters */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered && filtered.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden sm:table-cell">Contact</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{app.email}</TableCell>
                    <TableCell className="hidden sm:table-cell">{app.child_contact}</TableCell>
                    <TableCell>{getPlanBadge(app.plan)}</TableCell>
                    <TableCell>{getStatusBadge(app.status)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{format(new Date(app.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openApplication(app)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-12">No membership applications found</p>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <IdCard className="h-5 w-5" style={{ color: "hsl(250, 70%, 45%)" }} />
              Membership Application
            </DialogTitle>
            <DialogDescription>Hosla Membership Card application details</DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-6">
              {/* Applicant */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold text-foreground">{selected.name}</h3>
                  {getPlanBadge(selected.plan)}
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  <a href={`mailto:${selected.email}`} className="flex items-center gap-2 text-primary hover:underline">
                    <Mail className="h-4 w-4" /> {selected.email}
                  </a>
                  <a href={`tel:${selected.child_contact}`} className="flex items-center gap-2 text-primary hover:underline">
                    <Phone className="h-4 w-4" /> {selected.child_contact} (Son / Daughter)
                  </a>
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" /> {selected.address}
                  </div>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                
                <Detail icon={<CalendarDays className="h-4 w-4" />} label="Date of Birth" value={format(new Date(selected.date_of_birth), "MMM d, yyyy")} />
                <Detail icon={<Droplet className="h-4 w-4" />} label="Blood Group" value={selected.blood_group} />
                <Detail icon={<Stethoscope className="h-4 w-4" />} label="Major Operation" value={selected.major_operation} />
                <Detail icon={<HeartPulse className="h-4 w-4" />} label="Chronic Disease" value={selected.chronic_disease} />
                <Detail icon={<ShieldCheck className="h-4 w-4" />} label="Health Insurance" value={selected.health_insurance} />
              </div>

              {/* Photo */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Photograph</h3>
                {!selected.photo_path ? (
                  <p className="text-sm text-muted-foreground">No file uploaded.</p>
                ) : photoLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading file...
                  </div>
                ) : photoUrl ? (
                  isPdf ? (
                    <a href={photoUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" /> Open PDF
                      </Button>
                    </a>
                  ) : (
                    <div className="space-y-2">
                      <img src={photoUrl} alt={`${selected.name} photograph`} className="max-h-64 rounded-lg border border-border" />
                      <a href={photoUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" /> Open full size
                        </Button>
                      </a>
                    </div>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">Could not load file.</p>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                Submitted on {format(new Date(selected.created_at), "MMMM d, yyyy 'at' h:mm a")}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Update Status</Label>
                <Select
                  value={selected.status}
                  onValueChange={(value) => {
                    updateMutation.mutate({ id: selected.id, status: value });
                    setSelected({ ...selected, status: value });
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Admin Notes</Label>
                <Textarea
                  id="notes"
                  defaultValue={selected.admin_notes || ""}
                  placeholder="Add internal notes about this application..."
                  className="min-h-[100px]"
                  onBlur={(e) => {
                    if (e.target.value !== (selected.admin_notes || "")) {
                      updateMutation.mutate({ id: selected.id, status: selected.status, notes: e.target.value });
                    }
                  }}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-between gap-2 pt-4 border-t border-border">
                <Button variant="outline" asChild>
                  <a href={`mailto:${selected.email}?subject=Your Hosla Membership Application`}>
                    <Mail className="h-4 w-4 mr-2" /> Reply via Email
                  </a>
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this application?")) {
                      deleteMutation.mutate(selected);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <><Trash2 className="h-4 w-4 mr-2" /> Delete</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
        {icon} {label}
      </div>
      <p className="text-sm text-foreground break-words">{value}</p>
    </div>
  );
}

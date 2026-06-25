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
import { Search, Eye, Trash2, Loader2, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type VolunteerApplication = Database["public"]["Tables"]["volunteer_applications"]["Row"];
type VolunteerStatus = Database["public"]["Enums"]["volunteer_status"];

export default function AdminVolunteers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerApplication | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const { data: volunteers, isLoading } = useQuery({
    queryKey: ["admin-volunteers", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("volunteer_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as VolunteerStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as VolunteerApplication[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes, email, name }: { id: string; status: VolunteerStatus; notes?: string; email?: string; name?: string }) => {
      const { error } = await supabase
        .from("volunteer_applications")
        .update({ status, admin_notes: notes })
        .eq("id", id);

      if (error) throw error;

      // Send email notification when accepted or rejected
      if ((status === "accepted" || status === "rejected") && email) {
        try {
          await supabase.functions.invoke("send-volunteer-status", {
            body: { applicationId: id, status },
          });
        } catch (emailError) {
          console.error("Failed to send status email:", emailError);
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-volunteers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-volunteer-stats"] });
      const statusMsg = variables.status === "accepted" ? "accepted (email sent)" 
        : variables.status === "rejected" ? "rejected (email sent)" 
        : "updated";
      toast({ title: `Application ${statusMsg} successfully` });
    },
    onError: (error) => {
      toast({ title: "Error updating application", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("volunteer_applications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-volunteers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-volunteer-stats"] });
      setIsViewOpen(false);
      toast({ title: "Application deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting application", description: error.message, variant: "destructive" });
    },
  });

  const filteredVolunteers = volunteers?.filter((volunteer) =>
    volunteer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    volunteer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    volunteer.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: VolunteerStatus) => {
    const styles = {
      pending: "bg-primary/10 text-primary border-primary/20",
      contacted: "bg-accent text-accent-foreground border-accent-foreground/20",
      accepted: "bg-primary/20 text-primary border-primary/30",
      rejected: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return <Badge variant="outline" className={styles[status]}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Volunteer Applications</h1>
        <p className="text-muted-foreground">Manage volunteer applications and onboarding.</p>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or city..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Volunteers Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredVolunteers && filteredVolunteers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVolunteers.map((volunteer) => (
                  <TableRow key={volunteer.id}>
                    <TableCell className="font-medium">{volunteer.name}</TableCell>
                    <TableCell>{volunteer.email}</TableCell>
                    <TableCell>{volunteer.city}</TableCell>
                    <TableCell>{getStatusBadge(volunteer.status)}</TableCell>
                    <TableCell>{format(new Date(volunteer.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedVolunteer(volunteer);
                          setIsViewOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-12">No applications found</p>
          )}
        </CardContent>
      </Card>

      {/* View Volunteer Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">Volunteer Application</DialogTitle>
            <DialogDescription>
              Application details and contact information
            </DialogDescription>
          </DialogHeader>
          {selectedVolunteer && (
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{selectedVolunteer.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedVolunteer.city}</p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <a 
                    href={`mailto:${selectedVolunteer.email}`}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Mail className="h-4 w-4" />
                    {selectedVolunteer.email}
                  </a>
                  <a 
                    href={`tel:${selectedVolunteer.phone}`}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    {selectedVolunteer.phone}
                  </a>
                </div>
              </div>

              {/* Motivation */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Why they want to volunteer</h3>
                <p className="text-sm p-3 bg-muted/50 rounded-md text-muted-foreground">
                  {selectedVolunteer.motivation}
                </p>
              </div>

              {/* Applied Date */}
              <div className="text-sm text-muted-foreground">
                Applied on {format(new Date(selectedVolunteer.created_at), "MMMM d, yyyy")}
              </div>

              {/* Status Update */}
              <div className="space-y-2">
                <Label>Update Status</Label>
                <Select
                  value={selectedVolunteer.status}
                  onValueChange={(value) => {
                    updateMutation.mutate({ 
                      id: selectedVolunteer.id, 
                      status: value as VolunteerStatus,
                      email: selectedVolunteer.email,
                      name: selectedVolunteer.name,
                    });
                    setSelectedVolunteer({ ...selectedVolunteer, status: value as VolunteerStatus });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Admin Notes</Label>
                <Textarea
                  id="notes"
                  defaultValue={selectedVolunteer.admin_notes || ""}
                  placeholder="Add internal notes about this applicant..."
                  onBlur={(e) => {
                    if (e.target.value !== selectedVolunteer.admin_notes) {
                      updateMutation.mutate({
                        id: selectedVolunteer.id,
                        status: selectedVolunteer.status,
                        notes: e.target.value,
                      });
                    }
                  }}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this application?")) {
                      deleteMutation.mutate(selectedVolunteer.id);
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

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
import { Search, Eye, Trash2, Loader2, Phone, Mail, Building2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type PartnerInquiry = {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  employee_count: string | null;
  message: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

type InquiryStatus = "new" | "contacted" | "in_progress" | "converted" | "closed";

const STATUS_OPTIONS: { value: InquiryStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "in_progress", label: "In Progress" },
  { value: "converted", label: "Converted" },
  { value: "closed", label: "Closed" },
];

export default function AdminPartners() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInquiry, setSelectedInquiry] = useState<PartnerInquiry | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const { data: inquiries, isLoading } = useQuery({
    queryKey: ["admin-partner-inquiries", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("partner_inquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PartnerInquiry[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from("partner_inquiries")
        .update({ status, admin_notes: notes })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-partner-inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["admin-partner-stats"] });
      toast({ title: "Inquiry updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating inquiry", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("partner_inquiries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-partner-inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["admin-partner-stats"] });
      setIsViewOpen(false);
      toast({ title: "Inquiry deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting inquiry", description: error.message, variant: "destructive" });
    },
  });

  const filteredInquiries = inquiries?.filter((inquiry) =>
    inquiry.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inquiry.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inquiry.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      new: "bg-primary/10 text-primary border-primary/20",
      contacted: "bg-accent text-accent-foreground border-accent-foreground/20",
      in_progress: "bg-warning/10 text-warning border-warning/20",
      converted: "bg-primary/20 text-primary border-primary/30",
      closed: "bg-muted text-muted-foreground border-muted-foreground/20",
    };
    return <Badge variant="outline" className={styles[status] || styles.new}>{status.replace("_", " ")}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Partner Inquiries</h1>
        <p className="text-muted-foreground">Manage corporate partnership requests and follow-ups.</p>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by company, contact, or email..."
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
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inquiries Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredInquiries && filteredInquiries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInquiries.map((inquiry) => (
                  <TableRow key={inquiry.id}>
                    <TableCell className="font-medium">{inquiry.company_name}</TableCell>
                    <TableCell>{inquiry.contact_name}</TableCell>
                    <TableCell>{inquiry.email}</TableCell>
                    <TableCell>{getStatusBadge(inquiry.status)}</TableCell>
                    <TableCell>{format(new Date(inquiry.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedInquiry(inquiry);
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
            <p className="text-muted-foreground text-center py-12">No partner inquiries found</p>
          )}
        </CardContent>
      </Card>

      {/* View Inquiry Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <Building2 className="h-5 w-5" style={{ color: 'hsl(250, 70%, 45%)' }} />
              Partner Inquiry
            </DialogTitle>
            <DialogDescription>
              Corporate partnership request details
            </DialogDescription>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-6">
              {/* Company Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{selectedInquiry.company_name}</h3>
                  <p className="text-sm text-muted-foreground">Contact: {selectedInquiry.contact_name}</p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <a 
                    href={`mailto:${selectedInquiry.email}`}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Mail className="h-4 w-4" />
                    {selectedInquiry.email}
                  </a>
                  <a 
                    href={`tel:${selectedInquiry.phone}`}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    {selectedInquiry.phone}
                  </a>
                  {selectedInquiry.employee_count && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {selectedInquiry.employee_count} employees
                    </div>
                  )}
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Inquiry Message</h3>
                <p className="text-sm p-3 bg-muted/50 rounded-md text-muted-foreground whitespace-pre-wrap">
                  {selectedInquiry.message}
                </p>
              </div>

              {/* Submitted Date */}
              <div className="text-sm text-muted-foreground">
                Submitted on {format(new Date(selectedInquiry.created_at), "MMMM d, yyyy 'at' h:mm a")}
              </div>

              {/* Status Update */}
              <div className="space-y-2">
                <Label>Update Status</Label>
                <Select
                  value={selectedInquiry.status}
                  onValueChange={(value) => {
                    updateMutation.mutate({ id: selectedInquiry.id, status: value });
                    setSelectedInquiry({ ...selectedInquiry, status: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Admin Notes</Label>
                <Textarea
                  id="notes"
                  defaultValue={selectedInquiry.admin_notes || ""}
                  placeholder="Add internal notes about this inquiry..."
                  className="min-h-[100px]"
                  onBlur={(e) => {
                    if (e.target.value !== selectedInquiry.admin_notes) {
                      updateMutation.mutate({
                        id: selectedInquiry.id,
                        status: selectedInquiry.status,
                        notes: e.target.value,
                      });
                    }
                  }}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-between gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  asChild
                >
                  <a href={`mailto:${selectedInquiry.email}?subject=Re: Corporate Partnership Inquiry - Shraddha`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Reply via Email
                  </a>
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this inquiry?")) {
                      deleteMutation.mutate(selectedInquiry.id);
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

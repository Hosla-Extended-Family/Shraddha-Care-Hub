import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Eye, Download, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type AbuseReport = Database["public"]["Tables"]["abuse_reports"]["Row"];
type ReportStatus = Database["public"]["Enums"]["report_status"];

export default function AdminReports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<AbuseReport | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-reports", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("abuse_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as ReportStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AbuseReport[];
    },
  });

  const { data: evidence } = useQuery({
    queryKey: ["report-evidence", selectedReport?.id],
    enabled: !!selectedReport?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_evidence")
        .select("*")
        .eq("report_id", selectedReport!.id);

      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: ReportStatus; notes?: string }) => {
      const { error } = await supabase
        .from("abuse_reports")
        .update({ status, admin_notes: notes })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin-report-stats"] });
      toast({ title: "Report updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating report", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("abuse_reports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin-report-stats"] });
      setIsViewOpen(false);
      toast({ title: "Report deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting report", description: error.message, variant: "destructive" });
    },
  });

  const filteredReports = reports?.filter((report) =>
    report.victim_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.victim_location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: ReportStatus) => {
    const styles = {
      new: "bg-destructive/10 text-destructive border-destructive/20",
      investigating: "bg-primary/10 text-primary border-primary/20",
      resolved: "bg-accent text-accent-foreground border-accent-foreground/20",
      archived: "bg-muted text-muted-foreground border-border",
    };
    return <Badge variant="outline" className={styles[status]}>{status}</Badge>;
  };

  const handleDownloadEvidence = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("abuse-evidence")
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({ title: "Download failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Abuse Reports</h1>
        <p className="text-muted-foreground">Manage and review abuse reports.</p>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by victim name or location..."
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
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredReports && filteredReports.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Victim</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.victim_name}</TableCell>
                    <TableCell className="capitalize">{report.abuse_type}</TableCell>
                    <TableCell>{report.victim_location}</TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell>{format(new Date(report.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report);
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
            <p className="text-muted-foreground text-center py-12">No reports found</p>
          )}
        </CardContent>
      </Card>

      {/* View Report Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Report Details</DialogTitle>
            <DialogDescription>
              Full details of the abuse report
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-6">
              {/* Reporter Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Reporter Information</h3>
                {selectedReport.is_anonymous ? (
                  <p className="text-muted-foreground italic">Anonymous report</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Name:</span> {selectedReport.reporter_name || "N/A"}</div>
                    <div><span className="text-muted-foreground">Contact:</span> {selectedReport.reporter_contact || "N/A"}</div>
                    <div><span className="text-muted-foreground">Relationship:</span> {selectedReport.reporter_relationship || "N/A"}</div>
                  </div>
                )}
              </div>

              {/* Victim Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Victim Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Name:</span> {selectedReport.victim_name}</div>
                  <div><span className="text-muted-foreground">Age:</span> {selectedReport.victim_age || "Unknown"}</div>
                  <div className="col-span-2"><span className="text-muted-foreground">Location:</span> {selectedReport.victim_location}</div>
                </div>
              </div>

              {/* Abuse Details */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Abuse Details</h3>
                <div className="text-sm">
                  <div className="mb-2"><span className="text-muted-foreground">Type:</span> <span className="capitalize">{selectedReport.abuse_type}</span></div>
                  <div><span className="text-muted-foreground">Description:</span></div>
                  <p className="mt-1 p-3 bg-muted/50 rounded-md">{selectedReport.description}</p>
                </div>
              </div>

              {/* Evidence */}
              {evidence && evidence.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">Evidence Files</h3>
                  <div className="space-y-2">
                    {evidence.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                        <span className="text-sm truncate">{file.file_name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadEvidence(file.file_path, file.file_name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Update Status</h3>
                <Select
                  value={selectedReport.status}
                  onValueChange={(value) => {
                    updateMutation.mutate({ id: selectedReport.id, status: value as ReportStatus });
                    setSelectedReport({ ...selectedReport, status: value as ReportStatus });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Admin Notes</Label>
                <Textarea
                  id="notes"
                  defaultValue={selectedReport.admin_notes || ""}
                  placeholder="Add internal notes about this case..."
                  onBlur={(e) => {
                    if (e.target.value !== selectedReport.admin_notes) {
                      updateMutation.mutate({
                        id: selectedReport.id,
                        status: selectedReport.status,
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
                    if (confirm("Are you sure you want to delete this report?")) {
                      deleteMutation.mutate(selectedReport.id);
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

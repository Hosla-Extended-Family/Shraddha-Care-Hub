import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Search, Eye, Users, IndianRupee, Calendar, Mail, Phone, Check, X, Clock, CheckCircle, XCircle, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Donation {
  id: string;
  name: string;
  email: string;
  phone: string;
  pan_card: string | null;
  amount: string;
  consent_to_publish: boolean;
  admin_notes: string | null;
  status: 'pending' | 'verified' | 'rejected';
  created_at: string;
}

interface DonorGroup {
  email: string;
  name: string;
  totalAmount: number;
  verifiedAmount: number;
  donationCount: number;
  lastDonation: string;
  consent: boolean;
  hasVerified: boolean;
  donations: Donation[];
}

export default function AdminDonations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [adminNotes, setAdminNotes] = useState("");
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [manualDonation, setManualDonation] = useState({
    name: "",
    email: "",
    phone: "",
    pan_card: "",
    amount: "",
    consent_to_publish: false,
    admin_notes: "Manual entry by Admin",
    status: "verified" as const
  });

  const { data: donations, isLoading } = useQuery({
    queryKey: ["admin-donations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Donation[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("donations")
        .update({ status })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-donations"] });
      queryClient.invalidateQueries({ queryKey: ["consented-donors"] });
      toast({ 
        title: status === 'verified' ? "Donation Verified ✓" : "Donation Rejected",
        description: status === 'verified' 
          ? "This donation will now appear on the Wall of Thanks (if consented)."
          : "This donation has been marked as rejected.",
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("donations")
        .update({ admin_notes: notes })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-donations"] });
      toast({ title: "Notes updated", description: "Admin notes have been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save notes.", variant: "destructive" });
    },
  });

  const addDonationMutation = useMutation({
    mutationFn: async (newDonation: Omit<Donation, 'id' | 'created_at'>) => {
      const { error } = await supabase
        .from("donations")
        .insert([newDonation]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-donations"] });
      queryClient.invalidateQueries({ queryKey: ["consented-donors"] });
      toast({ 
        title: "Success",
        description: "Manual donation entry added successfully.",
      });
      setIsManualEntryOpen(false);
      setManualDonation({
        name: "",
        email: "",
        phone: "",
        pan_card: "",
        amount: "",
        consent_to_publish: false,
        admin_notes: "Manual entry by Admin",
        status: "verified"
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add donation.", variant: "destructive" });
    },
  });

  const handleAddManualDonation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDonation.name || !manualDonation.amount) {
      toast({ title: "Error", description: "Name and Amount are required.", variant: "destructive" });
      return;
    }
    addDonationMutation.mutate(manualDonation);
  };

  // Group donations by email
  const donorGroups: DonorGroup[] = donations ? 
    Object.values(
      donations.reduce((acc, donation) => {
        const email = donation.email.toLowerCase();
        if (!acc[email]) {
          acc[email] = {
            email: donation.email,
            name: donation.name,
            totalAmount: 0,
            verifiedAmount: 0,
            donationCount: 0,
            lastDonation: donation.created_at,
            consent: donation.consent_to_publish,
            hasVerified: false,
            donations: [],
          };
        }
        acc[email].totalAmount += parseFloat(donation.amount) || 0;
        if (donation.status === 'verified') {
          acc[email].verifiedAmount += parseFloat(donation.amount) || 0;
          acc[email].hasVerified = true;
        }
        acc[email].donationCount += 1;
        acc[email].donations.push(donation);
        if (donation.consent_to_publish) {
          acc[email].consent = true;
        }
        if (new Date(donation.created_at) > new Date(acc[email].lastDonation)) {
          acc[email].lastDonation = donation.created_at;
        }
        return acc;
      }, {} as Record<string, DonorGroup>)
    ).sort((a, b) => b.verifiedAmount - a.verifiedAmount) : [];

  // Filter based on search and status
  const filteredDonations = donations?.filter(donation => {
    const matchesSearch = 
      donation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.amount.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || donation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalDonations = donations?.length || 0;
  const pendingCount = donations?.filter(d => d.status === 'pending').length || 0;
  const verifiedCount = donations?.filter(d => d.status === 'verified').length || 0;
  const verifiedAmount = donations?.filter(d => d.status === 'verified')
    .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0) || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500/10 text-green-700 border-green-200 hover:bg-green-600 hover:text-white"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-destructive/10"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline" className="border-amber-300 text-amber-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Donations</h1>
          <p className="text-muted-foreground">Verify donations and manage donor recognition.</p>
        </div>

        <Dialog open={isManualEntryOpen} onOpenChange={setIsManualEntryOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-2">
              <Plus className="h-4 w-4" />
              Manual Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-serif">Add Manual Donation</DialogTitle>
              <DialogDescription>
                Directly add a donation that bypassed the website form (e.g., bank transfer, cash).
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddManualDonation} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="donorName">Name *</Label>
                  <Input 
                    id="donorName" 
                    value={manualDonation.name} 
                    onChange={e => setManualDonation({...manualDonation, name: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹) *</Label>
                  <Input 
                    id="amount" 
                    type="number" 
                    min="1" 
                    value={manualDonation.amount} 
                    onChange={e => setManualDonation({...manualDonation, amount: e.target.value})} 
                    required 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={manualDonation.email} 
                    onChange={e => setManualDonation({...manualDonation, email: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    value={manualDonation.phone} 
                    onChange={e => setManualDonation({...manualDonation, phone: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pan">PAN Card</Label>
                  <Input 
                    id="pan" 
                    value={manualDonation.pan_card} 
                    onChange={e => setManualDonation({...manualDonation, pan_card: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={manualDonation.status} 
                    onValueChange={(val: any) => setManualDonation({...manualDonation, status: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 py-2">
                <Checkbox 
                  id="consent" 
                  checked={manualDonation.consent_to_publish}
                  onCheckedChange={(checked) => setManualDonation({...manualDonation, consent_to_publish: checked === true})}
                />
                <Label htmlFor="consent" className="cursor-pointer text-sm font-normal">
                  Consent to publish name on Wall of Thanks
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_notes">Admin Notes</Label>
                <Textarea 
                  id="admin_notes" 
                  value={manualDonation.admin_notes} 
                  onChange={e => setManualDonation({...manualDonation, admin_notes: e.target.value})} 
                  rows={2}
                />
              </div>
              
              <div className="flex justify-end pt-4 gap-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsManualEntryOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addDonationMutation.isPending}>
                  {addDonationMutation.isPending ? "Saving..." : "Save Donation"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verified Total</CardTitle>
            <IndianRupee className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(verifiedAmount)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verified Donations</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{verifiedCount}</div>
          </CardContent>
        </Card>

        <Card className={pendingCount > 0 ? "border-amber-300" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
            {pendingCount > 0 && <p className="text-xs text-amber-600">Needs verification</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Submissions</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalDonations}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Donations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Donation Submissions</CardTitle>
          <CardDescription>
            Review each submission and verify after checking bank statements. 
            Only verified donations with consent will appear on the Wall of Thanks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDonations && filteredDonations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Consent</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDonations.map((donation) => (
                  <TableRow key={donation.id} className={donation.status === 'pending' ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(donation.created_at), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{donation.name}</p>
                        <p className="text-sm text-muted-foreground">{donation.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      {formatCurrency(parseFloat(donation.amount) || 0)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(donation.status)}
                    </TableCell>
                    <TableCell>
                      {donation.consent_to_publish ? (
                        <Badge variant="outline" className="border-primary/30 text-primary">
                          <Check className="h-3 w-3 mr-1" /> Public OK
                        </Badge>
                      ) : (
                        <Badge variant="outline">Private</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {donation.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => updateStatusMutation.mutate({ id: donation.id, status: 'verified' })}
                              disabled={updateStatusMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateStatusMutation.mutate({ id: donation.id, status: 'rejected' })}
                              disabled={updateStatusMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="font-serif">Donation Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Donor</p>
                                  <p className="font-medium">{donation.name}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Amount</p>
                                  <p className="font-bold text-primary">
                                    {formatCurrency(parseFloat(donation.amount) || 0)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Email</p>
                                  <p>{donation.email}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Phone</p>
                                  <p>{donation.phone}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">PAN Card</p>
                                  <p>{donation.pan_card || "Not provided"}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Date</p>
                                  <p>{format(new Date(donation.created_at), "dd MMM yyyy, hh:mm a")}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Status</p>
                                  {getStatusBadge(donation.status)}
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Public Recognition</p>
                                  <p>
                                    {donation.consent_to_publish ? (
                                      <Badge className="bg-primary/10 text-primary">Consented</Badge>
                                    ) : (
                                      <Badge variant="outline">Private</Badge>
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Admin Notes</p>
                                <Textarea
                                  defaultValue={donation.admin_notes || ""}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Add notes about verification..."
                                  rows={3}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => updateNotesMutation.mutate({ 
                                    id: donation.id, 
                                    notes: adminNotes || donation.admin_notes || ""
                                  })}
                                  disabled={updateNotesMutation.isPending}
                                >
                                  Save Notes
                                </Button>
                              </div>

                              {donation.status === 'pending' && (
                                <div className="flex gap-2 pt-4 border-t">
                                  <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    onClick={() => updateStatusMutation.mutate({ id: donation.id, status: 'verified' })}
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" /> Verify Donation
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => updateStatusMutation.mutate({ id: donation.id, status: 'rejected' })}
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" /> Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">No donations found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

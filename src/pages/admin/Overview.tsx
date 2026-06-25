import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, AlertTriangle, CheckCircle, Clock, TrendingUp, Heart, IndianRupee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminOverview() {
  const { data: reportStats, isLoading: reportsLoading } = useQuery({
    queryKey: ["admin-report-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("abuse_reports")
        .select("status");
      
      if (error) throw error;
      
      const stats = {
        total: data.length,
        new: data.filter(r => r.status === "new").length,
        investigating: data.filter(r => r.status === "investigating").length,
        resolved: data.filter(r => r.status === "resolved").length,
      };
      
      return stats;
    },
  });

  const { data: volunteerStats, isLoading: volunteersLoading } = useQuery({
    queryKey: ["admin-volunteer-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("volunteer_applications")
        .select("status");
      
      if (error) throw error;
      
      const stats = {
        total: data.length,
        pending: data.filter(v => v.status === "pending").length,
        contacted: data.filter(v => v.status === "contacted").length,
        accepted: data.filter(v => v.status === "accepted").length,
      };
      
      return stats;
    },
  });

  const { data: donationStats, isLoading: donationsLoading } = useQuery({
    queryKey: ["admin-donation-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("amount, email")
        .eq("status", "verified");
      
      if (error) throw error;
      
      const totalAmount = data.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
      const uniqueDonors = new Set(data.map(d => d.email.toLowerCase())).size;
      
      return {
        total: data.length,
        totalAmount,
        uniqueDonors,
      };
    },
  });

  const { data: recentReports } = useQuery({
    queryKey: ["admin-recent-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("abuse_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: recentVolunteers } = useQuery({
    queryKey: ["admin-recent-volunteers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("volunteer_applications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome to the Shraddha admin dashboard.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Raised</CardTitle>
            <IndianRupee className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {donationsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-primary">{formatCurrency(donationStats?.totalAmount || 0)}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Donors</CardTitle>
            <Heart className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {donationsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-foreground">{donationStats?.uniqueDonors || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-foreground">{reportStats?.total || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-destructive">{reportStats?.new || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Volunteers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {volunteersLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-foreground">{volunteerStats?.total || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Apps</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {volunteersLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-primary">{volunteerStats?.pending || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-serif">Recent Reports</CardTitle>
            <CardDescription>Latest abuse reports submitted</CardDescription>
          </CardHeader>
          <CardContent>
            {recentReports && recentReports.length > 0 ? (
              <div className="space-y-4">
                {recentReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                    <div>
                      <p className="font-medium text-foreground">{report.victim_name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{report.abuse_type} abuse</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      report.status === 'new' ? 'bg-destructive/10 text-destructive' :
                      report.status === 'investigating' ? 'bg-primary/10 text-primary' :
                      'bg-accent text-accent-foreground'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No reports yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-serif">Recent Applications</CardTitle>
            <CardDescription>Latest volunteer applications</CardDescription>
          </CardHeader>
          <CardContent>
            {recentVolunteers && recentVolunteers.length > 0 ? (
              <div className="space-y-4">
                {recentVolunteers.map((volunteer) => (
                  <div key={volunteer.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                    <div>
                      <p className="font-medium text-foreground">{volunteer.name}</p>
                      <p className="text-sm text-muted-foreground">{volunteer.city}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      volunteer.status === 'pending' ? 'bg-primary/10 text-primary' :
                      volunteer.status === 'contacted' ? 'bg-accent text-accent-foreground' :
                      volunteer.status === 'accepted' ? 'bg-primary/20 text-primary' :
                      'bg-destructive/10 text-destructive'
                    }`}>
                      {volunteer.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No applications yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

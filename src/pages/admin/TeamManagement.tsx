import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ui/image-upload";
import { useImageUpload } from "@/hooks/use-image-upload";
import type { Database } from "@/integrations/supabase/types";

type TeamCategory = Database["public"]["Enums"]["team_category"];

interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: TeamCategory;
  photo_url: string | null;
  bio: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

const CATEGORY_OPTIONS: { value: TeamCategory; label: string }[] = [
  { value: "president", label: "President" },
  { value: "board_member", label: "Board Member" },
  { value: "core", label: "Core Team" },
  { value: "senior_members", label: "Senior Members" },
  { value: "advocates", label: "Advocates" },
  { value: "counsellors", label: "Counsellors" },
  { value: "volunteers_technical", label: "Technical Volunteers" },
  { value: "volunteers_hr", label: "HR Volunteers" },
  { value: "volunteers_marketing", label: "Marketing Volunteers" },
  { value: "volunteers_social_media", label: "Social Media Managers" },
  { value: "volunteers_design", label: "Design Volunteers" },
  { value: "interns", label: "Interns" },
];

const defaultFormData = {
  name: "",
  role: "",
  category: "core" as TeamCategory,
  photo_url: "",
  bio: "",
  facebook_url: "",
  instagram_url: "",
  linkedin_url: "",
  github_url: "",
  display_order: 0,
  is_active: true,
};

export default function TeamManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  
  const { upload: uploadImage, isUploading: isImageUploading } = useImageUpload({
    bucket: "team-photos",
    folder: "members",
  });

  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ["admin-team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("category")
        .order("display_order");

      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("team_members").insert([{
        name: data.name,
        role: data.role,
        category: data.category,
        photo_url: data.photo_url || null,
        bio: data.bio || null,
        facebook_url: data.facebook_url || null,
        instagram_url: data.instagram_url || null,
        linkedin_url: data.linkedin_url || null,
        github_url: data.github_url || null,
        display_order: data.display_order,
        is_active: data.is_active,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-team-members"] });
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast({ title: "Success", description: "Team member added successfully." });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("team_members")
        .update({
          name: data.name,
          role: data.role,
          category: data.category,
          photo_url: data.photo_url || null,
          bio: data.bio || null,
          facebook_url: data.facebook_url || null,
          instagram_url: data.instagram_url || null,
          linkedin_url: data.linkedin_url || null,
          github_url: data.github_url || null,
          display_order: data.display_order,
          is_active: data.is_active,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-team-members"] });
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast({ title: "Success", description: "Team member updated successfully." });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-team-members"] });
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast({ title: "Success", description: "Team member deleted successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleOpenDialog = (member?: TeamMember) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name,
        role: member.role,
        category: member.category,
        photo_url: member.photo_url || "",
        bio: member.bio || "",
        facebook_url: member.facebook_url || "",
        instagram_url: member.instagram_url || "",
        linkedin_url: member.linkedin_url || "",
        github_url: member.github_url || "",
        display_order: member.display_order,
        is_active: member.is_active,
      });
    } else {
      setEditingMember(null);
      setFormData(defaultFormData);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMember(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
      updateMutation.mutate({ id: editingMember.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getCategoryLabel = (category: TeamCategory) => {
    return CATEGORY_OPTIONS.find((opt) => opt.value === category)?.label || category;
  };

  // Group members by category
  const groupedMembers = teamMembers?.reduce((acc, member) => {
    if (!acc[member.category]) {
      acc[member.category] = [];
    }
    acc[member.category].push(member);
    return acc;
  }, {} as Record<TeamCategory, TeamMember[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Management</h1>
          <p className="text-muted-foreground">Add, edit, and manage team members</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMember ? "Edit Team Member" : "Add Team Member"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role/Position *</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: TeamCategory) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Photo</Label>
                <ImageUpload
                  value={formData.photo_url}
                  onChange={(url) => setFormData({ ...formData, photo_url: url })}
                  onUpload={uploadImage}
                  isUploading={isImageUploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Brief description about this team member..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Social Links (Max 2 will be shown)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url" className="text-xs text-muted-foreground">LinkedIn</Label>
                    <Input
                      id="linkedin_url"
                      type="url"
                      value={formData.linkedin_url}
                      onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram_url" className="text-xs text-muted-foreground">Instagram</Label>
                    <Input
                      id="instagram_url"
                      type="url"
                      value={formData.instagram_url}
                      onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook_url" className="text-xs text-muted-foreground">Facebook</Label>
                    <Input
                      id="facebook_url"
                      type="url"
                      value={formData.facebook_url}
                      onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github_url" className="text-xs text-muted-foreground">GitHub</Label>
                    <Input
                      id="github_url"
                      type="url"
                      value={formData.github_url}
                      onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                      placeholder="https://github.com/..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active (visible on website)</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingMember ? "Update" : "Add"} Member
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{teamMembers?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {teamMembers?.filter((m) => m.is_active).length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {teamMembers?.filter((m) => !m.is_active).length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Object.keys(groupedMembers || {}).length}
                </p>
                <p className="text-sm text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members by Category */}
      {groupedMembers && Object.entries(groupedMembers).map(([category, members]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-lg">
              {getCategoryLabel(category as TeamCategory)}
              <Badge variant="secondary" className="ml-2">{members.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.photo_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                    {!member.is_active && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(member)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Team Member</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {member.name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(member.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {(!teamMembers || teamMembers.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No team members yet</p>
            <Button className="mt-4" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Member
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ui/image-upload";
import { useImageUpload } from "@/hooks/use-image-upload";
import { Plus, Pencil, Trash2, Loader2, ExternalLink, Copy, X } from "lucide-react";
import { format } from "date-fns";
import type { Database, Json } from "@/integrations/supabase/types";
import { EventGalleryEditor } from "@/components/admin/EventGalleryEditor";
import { parseGallery, type EventMediaItem } from "@/lib/event-media";

type RegEvent = Database["public"]["Tables"]["registration_events"]["Row"];
type ProjectStatus = Database["public"]["Enums"]["project_status"];
type OrganizationType = Database["public"]["Enums"]["organization_type"];

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
];

const ORG_OPTIONS: { value: OrganizationType; label: string }[] = [
  { value: "shraddha", label: "Shraddha" },
  { value: "hosla", label: "Hosla" },
  { value: "both", label: "Both" },
];

const STATUS_BADGE: Record<ProjectStatus, { className: string; label: string }> = {
  upcoming: { className: "bg-purple-100 text-purple-800 border-purple-200", label: "Upcoming" },
  ongoing: { className: "bg-blue-100 text-blue-800 border-blue-200", label: "Ongoing" },
  completed: { className: "bg-gray-100 text-gray-800 border-gray-200", label: "Completed" },
};



type FieldKey = "mobile" | "age" | "area" | "medical_concerns" | "source";
type FieldSetting = { enabled: boolean; required: boolean };
type FieldConfig = Record<FieldKey, FieldSetting>;

const FIELD_LABELS: Record<FieldKey, string> = {
  mobile: "Mobile Number",
  age: "Age",
  area: "Area / Locality",
  medical_concerns: "Medical Concerns",
  source: "How did you hear about us?",
};

const defaultFieldConfig: FieldConfig = {
  mobile: { enabled: true, required: true },
  age: { enabled: true, required: true },
  area: { enabled: true, required: true },
  medical_concerns: { enabled: true, required: false },
  source: { enabled: true, required: false },
};

interface FormState {
  slug: string;
  title: string;
  description: string;
  status: ProjectStatus;
  organization: OrganizationType;
  resource_link: string;
  location: string;
  event_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  venue_name: string;
  venue_address: string;
  contact_phone: string;
  banner_url: string;
  gallery: EventMediaItem[];
  field_config: FieldConfig;
  enable_registration: boolean;
  registration_open: boolean;
  is_paid: boolean;
  price_inr: number;
  members_free: boolean;
  payment_note: string;
  is_published: boolean;
  display_order: number;
}


const defaultForm: FormState = {
  slug: "",
  title: "",
  description: "",
  status: "upcoming",
  organization: "shraddha",
  resource_link: "",
  location: "",
  event_date: "",
  end_date: "",
  start_time: "",
  end_time: "",
  venue_name: "",
  venue_address: "",
  contact_phone: "",
  banner_url: "",
  gallery: [],
  field_config: defaultFieldConfig,
  enable_registration: false,
  registration_open: true,
  is_paid: false,
  price_inr: 0,
  members_free: true,
  payment_note: "",

  is_published: false,
  display_order: 0,
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

/** Convert "HH:MM" 24-h to "h:mm AM/PM" for display */
const formatTime12 = (t: string) => {
  if (!t) return "";
  const [hStr, mStr] = t.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr ?? "00";
  if (isNaN(h)) return t;           // fallback: show raw value
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

export default function AdminEventManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [slugEdited, setSlugEdited] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");

  const { upload: uploadBanner, isUploading } = useImageUpload({
    bucket: "project-posters",
    folder: "registration-events",
    maxSizeMB: 1.5,
    maxWidthOrHeight: 1600,
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["admin-registration-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registration_events")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as RegEvent[];
    },
  });

  const buildPayload = (data: FormState) => {
    const combinedLocation = [data.venue_name, data.venue_address].filter(Boolean).join(", ");
    
    return {
    slug: data.slug,
    title: data.title,
    description: data.description || null,
    status: data.status,
    organization: data.organization,
    resource_link: data.resource_link || null,
    location: combinedLocation || data.location || null,
    event_date: data.event_date || null,
    end_date: data.end_date || null,
    start_time: data.start_time || null,
    end_time: data.end_time || null,
    venue_name: data.venue_name || null,
    venue_address: data.venue_address || null,
    contact_phone: data.contact_phone || null,
    banner_url: data.banner_url || null,
    gallery: data.gallery as unknown as Json,
    field_config: data.field_config as unknown as Database["public"]["Tables"]["registration_events"]["Insert"]["field_config"],
    enable_registration: data.enable_registration,
    registration_open: data.registration_open,
    is_paid: data.enable_registration && data.is_paid,
    price_inr: data.is_paid ? Math.max(0, Math.round(data.price_inr)) : 0,
    members_free: data.members_free,
    payment_note: data.payment_note || null,

    is_published: data.is_published,
    display_order: data.display_order,
  };
  };

  const saveMutation = useMutation({
    mutationFn: async (data: FormState) => {
      if (editingId) {
        const { error } = await supabase.from("registration_events").update(buildPayload(data)).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("registration_events").insert(buildPayload(data));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-registration-events"] });
      toast({ title: "Success", description: `Event ${editingId ? "updated" : "created"} successfully.` });
      handleClose();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("registration_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-registration-events"] });
      toast({ title: "Deleted", description: "Event deleted successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: "is_published" | "registration_open"; value: boolean }) => {
      const { error } = await supabase.from("registration_events").update({ [field]: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-registration-events"] }),
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const handleClose = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setForm(defaultForm);
    setSlugEdited(false);
    setPhoneInput("");
  };

  const handleEdit = (ev: RegEvent) => {
    setEditingId(ev.id);
    setSlugEdited(true);
    setForm({
      slug: ev.slug,
      title: ev.title,
      description: ev.description || "",
      status: ev.status,
      organization: ev.organization,
      resource_link: ev.resource_link || "",
      location: ev.location || "",
      event_date: ev.event_date || "",
      end_date: ev.end_date || "",
      start_time: ev.start_time || "",
      end_time: ev.end_time || "",
      venue_name: ev.venue_name || "",
      venue_address: ev.venue_address || "",
      contact_phone: ev.contact_phone || "",
      banner_url: ev.banner_url || "",
      gallery: parseGallery(ev.gallery),
      field_config: { ...defaultFieldConfig, ...((ev.field_config as Partial<FieldConfig>) || {}) },
      enable_registration: ev.enable_registration,
      registration_open: ev.registration_open,
      is_paid: ev.is_paid,
      price_inr: ev.price_inr ?? 0,
      members_free: ev.members_free,
      payment_note: ev.payment_note || "",

      is_published: ev.is_published,
      display_order: ev.display_order,
    });
    setIsDialogOpen(true);
  };

  const handleTitleChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: slugEdited ? prev.slug : slugify(value),
    }));
  };

  const setFieldConfig = (key: FieldKey, patch: Partial<FieldSetting>) => {
    setForm((prev) => ({
      ...prev,
      field_config: { ...prev.field_config, [key]: { ...prev.field_config[key], ...patch } },
    }));
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.slug.trim()) {
      toast({ title: "Validation Error", description: "Title and slug are required.", variant: "destructive" });
      return;
    }
    saveMutation.mutate(form);
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/register/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied", description: url });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Events</h1>
          <p className="text-muted-foreground">One place to manage everything: cards on the home page, the Projects &amp; Events page, and event registrations.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No events yet. Click "Add Event" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((ev) => (
                    <TableRow key={ev.id}>
                      <TableCell className="font-medium max-w-[240px]">
                        <div className="truncate" title={ev.title}>{ev.title}</div>
                        {ev.enable_registration ? (
                          <button
                            onClick={() => copyLink(ev.slug)}
                            className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                          >
                            <Copy className="h-3 w-3" />
                            /register/{ev.slug}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Display only</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_BADGE[ev.status].className}>
                          {STATUS_BADGE[ev.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {ev.event_date ? format(new Date(ev.event_date), "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell>
                        {ev.enable_registration ? (
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={ev.registration_open}
                              onCheckedChange={(v) => toggleMutation.mutate({ id: ev.id, field: "registration_open", value: v })}
                            />
                            <span className="text-xs text-muted-foreground">{ev.registration_open ? "Open" : "Closed"}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Off</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={ev.is_published}
                          onCheckedChange={(v) => toggleMutation.mutate({ id: ev.id, field: "is_published", value: v })}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <a href={`/register/${ev.slug}`} target="_blank" rel="noopener noreferrer" title="Preview">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(ev)}>
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
                                <AlertDialogTitle>Delete Event</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Delete "{ev.title}"? Existing registrations will be kept but unlinked. This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(ev.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(o) => (o ? setIsDialogOpen(true) : handleClose())}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Event" : "Add New Event"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Senior Citizens' Health Camp"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => { setSlugEdited(true); setForm({ ...form, slug: slugify(e.target.value) }); }}
                placeholder="health-camp"
              />
              <p className="text-xs text-muted-foreground">Public link: /register/{form.slug || "your-slug"}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the event"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ProjectStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Organization</Label>
                <Select value={form.organization} onValueChange={(v) => setForm({ ...form, organization: v as OrganizationType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORG_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="event_date">Date</Label>
                <Input id="event_date" type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input id="end_date" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue_name">Venue Name</Label>
              <Input id="venue_name" value={form.venue_name} onChange={(e) => setForm({ ...form, venue_name: e.target.value })} placeholder="e.g. New Life Old Age Home" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue_address">Venue Address</Label>
              <Textarea id="venue_address" value={form.venue_address} onChange={(e) => setForm({ ...form, venue_address: e.target.value })} rows={2} placeholder="Full address" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resource_link">"Know More" Link (optional)</Label>
              <Input id="resource_link" value={form.resource_link} onChange={(e) => setForm({ ...form, resource_link: e.target.value })} placeholder="/hpl or https://…" />
              <p className="text-xs text-muted-foreground">Shown when registration is off. Internal pages start with "/".</p>
            </div>

            <div className="space-y-2">
              <Label>Banner / Poster Image</Label>
              <ImageUpload
                value={form.banner_url}
                onChange={(url) => setForm({ ...form, banner_url: url })}
                onUpload={uploadBanner}
                isUploading={isUploading}
              />
            </div>

            <EventGalleryEditor
              value={form.gallery}
              onChange={(gallery) => setForm({ ...form, gallery })}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label htmlFor="published">Published</Label>
                <Switch id="published" checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input id="display_order" type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>

            {/* Registration section */}
            <div className="rounded-lg border border-border p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label className="text-base">Accept Registrations</Label>
                  <p className="text-xs text-muted-foreground">Turn on to collect sign-ups for this event.</p>
                </div>
                <Switch checked={form.enable_registration} onCheckedChange={(v) => setForm({ ...form, enable_registration: v })} />
              </div>

              {form.enable_registration && (
                <div className="space-y-4 border-t border-border/60 pt-4">
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <Label htmlFor="reg_open">Registration Open</Label>
                    <Switch id="reg_open" checked={form.registration_open} onCheckedChange={(v) => setForm({ ...form, registration_open: v })} />
                  </div>

                  {/* Paid entry */}
                  <div className="rounded-lg border border-border p-4 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Label className="text-base">Paid Event</Label>
                        <p className="text-xs text-muted-foreground">
                          Charge non-members a registration fee via Stripe.
                        </p>
                      </div>
                      <Switch
                        checked={form.is_paid}
                        onCheckedChange={(v) => setForm({ ...form, is_paid: v })}
                      />
                    </div>

                    {form.is_paid && (
                      <div className="space-y-4 border-t border-border/60 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="price_inr">Fee for non-members (₹)</Label>
                          <Input
                            id="price_inr"
                            type="number"
                            min={1}
                            value={form.price_inr}
                            onChange={(e) => setForm({ ...form, price_inr: parseInt(e.target.value) || 0 })}
                            placeholder="e.g. 200"
                          />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-border p-3">
                          <div>
                            <Label htmlFor="members_free">Free for Hosla members</Label>
                            <p className="text-xs text-muted-foreground">
                              Approved members skip payment automatically.
                            </p>
                          </div>
                          <Switch
                            id="members_free"
                            checked={form.members_free}
                            onCheckedChange={(v) => setForm({ ...form, members_free: v })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="payment_note">Note shown on the payment prompt</Label>
                          <Textarea
                            id="payment_note"
                            rows={2}
                            value={form.payment_note}
                            onChange={(e) => setForm({ ...form, payment_note: e.target.value })}
                            placeholder="e.g. Fee covers lunch, materials and the activity kit."
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">Public link: /register/{form.slug || "your-slug"}</p>


                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="start_time">Start Time</Label>
                      <Input id="start_time" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_time">End Time</Label>
                      <Input id="end_time" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Contact Phone Numbers</Label>
                    {form.contact_phone && (
                      <div className="flex flex-wrap gap-2">
                        {form.contact_phone.split(",").map((phone, i) => {
                          const trimmed = phone.trim();
                          if (!trimmed) return null;
                          return (
                            <span key={i} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full border border-primary/20">
                              {trimmed}
                              <button
                                type="button"
                                onClick={() => {
                                  const phones = form.contact_phone.split(",").map((p) => p.trim()).filter(Boolean);
                                  phones.splice(i, 1);
                                  setForm({ ...form, contact_phone: phones.join(", ") });
                                }}
                                className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <Input
                      id="contact_phone"
                      value={phoneInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.includes(",")) {
                          const parts = val.split(",");
                          const newPhone = parts[0].trim();
                          if (newPhone) {
                            const existing = form.contact_phone ? form.contact_phone.split(",").map((p) => p.trim()).filter(Boolean) : [];
                            existing.push(newPhone);
                            setForm({ ...form, contact_phone: existing.join(", ") });
                          }
                          setPhoneInput(parts.slice(1).join(","));
                        } else {
                          setPhoneInput(val);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const newPhone = phoneInput.trim();
                          if (newPhone) {
                            const existing = form.contact_phone ? form.contact_phone.split(",").map((p) => p.trim()).filter(Boolean) : [];
                            existing.push(newPhone);
                            setForm({ ...form, contact_phone: existing.join(", ") });
                            setPhoneInput("");
                          }
                        }
                        if (e.key === "Backspace" && !phoneInput) {
                          const phones = form.contact_phone ? form.contact_phone.split(",").map((p) => p.trim()).filter(Boolean) : [];
                          if (phones.length) {
                            const removed = phones.pop()!;
                            setForm({ ...form, contact_phone: phones.join(", ") });
                            setPhoneInput(removed);
                          }
                        }
                      }}
                      placeholder={form.contact_phone ? "Add another number…" : "e.g. 78110 09309"}
                    />
                    <p className="text-xs text-muted-foreground">Press comma or Enter after each number to add it.</p>
                  </div>

                  <div className="space-y-3 rounded-lg border border-border p-4">
                    <div>
                      <Label className="text-base">Registration Form Fields</Label>
                      <p className="text-xs text-muted-foreground">Name and Email are always collected. Toggle the rest below.</p>
                    </div>
                    {(Object.keys(FIELD_LABELS) as FieldKey[]).map((key) => (
                      <div key={key} className="flex items-center justify-between gap-3 border-t border-border/60 pt-3 first:border-t-0 first:pt-0">
                        <span className="text-sm font-medium text-foreground">{FIELD_LABELS[key]}</span>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Switch
                              checked={form.field_config[key].enabled}
                              onCheckedChange={(v) => setFieldConfig(key, { enabled: v, required: v ? form.field_config[key].required : false })}
                            />
                            Show
                          </label>
                          <label className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Switch
                              checked={form.field_config[key].required}
                              disabled={!form.field_config[key].enabled}
                              onCheckedChange={(v) => setFieldConfig(key, { required: v })}
                            />
                            Required
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Save Changes" : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

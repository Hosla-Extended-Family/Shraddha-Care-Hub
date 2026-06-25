import { useState, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import imageCompression from "browser-image-compression";
import {
  Loader2, Send, User, Mail, IdCard, Phone, MapPin, CalendarDays, Droplet,
  Stethoscope, HeartPulse, ShieldCheck, Upload, X, FileText, ImageIcon, CheckCircle2,
} from "lucide-react";

const ACCENT = "hsl(250, 70%, 45%)";
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Don't know"];

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().trim().email("Enter a valid email").max(255, "Email is too long"),
  voterId: z.string().trim().min(1, "Voter ID is required").max(50, "Voter ID is too long"),
  childContact: z
    .string()
    .trim()
    .min(10, "Enter a valid contact number")
    .max(15, "Number is too long")
    .regex(/^[0-9+\-\s()]+$/, "Enter a valid contact number"),
  address: z.string().trim().min(1, "Address is required").max(500, "Address is too long"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  bloodGroup: z.string().min(1, "Select a blood group"),
  majorOperation: z.string().trim().min(1, "This field is required").max(300, "Too long"),
  chronicDisease: z.string().trim().min(1, "This field is required").max(300, "Too long"),
  healthInsurance: z.string().trim().min(1, "This field is required").max(300, "Too long"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: "standard" | "premium";
}

const PLAN_LABELS: Record<string, string> = {
  standard: "Standard Plan",
  premium: "Premium Plan",
};

export function HoslaMembershipModal({ open, onOpenChange, plan = "standard" }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      voterId: "",
      childContact: "",
      address: "",
      dateOfBirth: "",
      bloodGroup: "",
      majorOperation: "",
      chronicDisease: "",
      healthInsurance: "",
    },
  });

  const handleFile = (selected: File | null) => {
    setFileError(null);
    if (!selected) {
      setFile(null);
      return;
    }
    const isImage = selected.type.startsWith("image/");
    if (!isImage) {
      setFileError("Please upload an image file.");
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setFileError("File is too large. Maximum size is 5 MB.");
      return;
    }
    setFile(selected);
  };

  const resetAll = () => {
    form.reset();
    setFile(null);
    setFileError(null);
    setSubmitted(false);
  };

  const handleClose = (next: boolean) => {
    if (!next && isSubmitting) return;
    if (!next) {
      // reset after close animation
      setTimeout(resetAll, 200);
    }
    onOpenChange(next);
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const applicationId = crypto.randomUUID();
      let photoPath: string | null = null;

      if (file) {
        let fileToUpload = file;
        
        // Compress image before upload
        if (file.type !== "image/gif") {
          try {
            const options = {
              maxSizeMB: 1,
              maxWidthOrHeight: 800,
              useWebWorker: true,
            };
            fileToUpload = await imageCompression(file, options);
          } catch (error) {
            console.warn("Compression failed, using original:", error);
          }
        }

        const ext = file.name.split(".").pop() || "jpeg";
        photoPath = `${applicationId}/photo.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("membership-photos")
          .upload(photoPath, fileToUpload, { upsert: false });
        if (uploadError) {
          console.error("Photo upload error:", uploadError);
          toast({
            title: "Photo upload failed",
            description: "We couldn't upload your photo. Please try a smaller file or continue without it.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      const { error } = await supabase.from("membership_applications").insert({
        id: applicationId,
        name: data.name,
        email: data.email,
        voter_id: data.voterId,
        child_contact: data.childContact,
        address: data.address,
        date_of_birth: data.dateOfBirth,
        blood_group: data.bloodGroup,
        major_operation: data.majorOperation,
        chronic_disease: data.chronicDisease,
        health_insurance: data.healthInsurance,
        photo_path: photoPath,
        plan,
      });

      if (error) throw error;

      // Send confirmation email (non-blocking for the user)
      try {
        await supabase.functions.invoke("send-membership-confirmation", {
          body: { applicationId, name: data.name, email: data.email },
        });
      } catch (emailErr) {
        console.error("Email error:", emailErr);
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting membership application:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again or call us at 7811009309.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelClass = "flex items-center gap-2 text-sm font-medium";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="p-0 gap-0 w-[calc(100vw-1.5rem)] sm:max-w-[560px] max-h-[92vh] overflow-hidden flex flex-col rounded-2xl [&>button:last-child]:hidden">
        {/* Header */}
        <DialogHeader className="px-5 sm:px-6 pt-6 pb-4 text-left border-b border-border bg-card sticky top-0 z-10 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-serif">
                <IdCard className="h-5 w-5 flex-shrink-0" style={{ color: ACCENT }} />
                Hosla Membership Card
              </DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: ACCENT }}
                >
                  {PLAN_LABELS[plan]}
                </span>
              </div>
              <DialogDescription className="text-sm">
                Fill in your details below. Our care team will reach out to you to complete your membership.
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full flex-shrink-0 text-muted-foreground hover:bg-muted"
              onClick={() => handleClose(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>

        {submitted ? (
          <div className="px-6 py-10 text-center space-y-4 flex-1 overflow-y-auto min-h-0">
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: "hsl(250,70%,45%,0.1)" }}
            >
              <CheckCircle2 className="h-9 w-9" style={{ color: ACCENT }} />
            </div>
            <h3 className="text-xl font-serif font-bold text-foreground">Application Received! 🌿</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Thank you! We've sent a confirmation to your email. Our team will reach out to you shortly to
              complete your Hosla Membership.
            </p>
            <Button
              className="mt-2 text-white"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, hsl(220, 70%, 50%))` }}
              onClick={() => handleClose(false)}
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 min-h-0 px-5 sm:px-6 py-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Personal details */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>
                        <User className="h-4 w-4 text-muted-foreground" /> Name <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Full name" autoComplete="name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>
                        <Mail className="h-4 w-4 text-muted-foreground" /> Email ID <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="email" inputMode="email" placeholder="you@example.com" autoComplete="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="voterId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>
                        <IdCard className="h-4 w-4 text-muted-foreground" /> Voter ID <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Voter ID number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="childContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>
                        <Phone className="h-4 w-4 text-muted-foreground" /> Son / Daughter Contact Number <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="tel" inputMode="tel" placeholder="+91 98765 43210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>
                        <MapPin className="h-4 w-4 text-muted-foreground" /> Address <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea placeholder="Full residential address" className="min-h-[80px] resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>
                          <CalendarDays className="h-4 w-4 text-muted-foreground" /> Date of Birth <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="date" max={new Date().toISOString().split("T")[0]} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bloodGroup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>
                          <Droplet className="h-4 w-4 text-muted-foreground" /> Blood Group <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {bloodGroups.map((bg) => (
                              <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Health details */}
                <FormField
                  control={form.control}
                  name="majorOperation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>
                        <Stethoscope className="h-4 w-4 text-muted-foreground" /> Major Operation <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., None / Bypass surgery (2019)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="chronicDisease"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>
                        <HeartPulse className="h-4 w-4 text-muted-foreground" /> Chronic Disease <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., None / Diabetes, Hypertension" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="healthInsurance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" /> Health Insurance <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Insurance name and number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Photo upload */}
                <div className="space-y-2">
                  <label className={labelClass}>
                    <ImageIcon className="h-4 w-4 text-muted-foreground" /> Passport-size Photograph
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                  />

                  {file ? (
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "hsl(250,70%,45%,0.1)" }}>
                        <ImageIcon className="h-5 w-5" style={{ color: ACCENT }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.size < 1024 * 1024
                            ? `${(file.size / 1024).toFixed(1)} KB`
                            : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => {
                          setFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 px-4 py-6 text-center transition-colors hover:border-[hsl(250,70%,45%)]/50 hover:bg-muted/50"
                    >
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Tap to upload</span>
                      <span className="text-xs text-muted-foreground">1 file — Image only. Max 5 MB.</span>
                    </button>
                  )}
                  {fileError && <p className="text-sm font-medium text-destructive">{fileError}</p>}
                </div>

                {/* Submit */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 pb-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleClose(false)}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 text-white"
                    disabled={isSubmitting}
                    style={{ background: `linear-gradient(135deg, ${ACCENT}, hsl(220, 70%, 50%))` }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" /> Submit Application
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

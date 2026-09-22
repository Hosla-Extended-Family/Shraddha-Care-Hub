import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { checkRateLimit } from "@/lib/rate-limit";
import { Loader2, Send, Building2, User, Mail, Phone, MessageSquare, Globe, Handshake, Clock } from "lucide-react";

const ORGANIZATION_TYPES = [
  "Hospital / Healthcare",
  "NGO / Community Group",
  "Faith / Spiritual Organization",
  "Corporate / CSR",
  "Educational Institution",
  "Donor / Sponsor",
  "Individual",
  "Other",
] as const;

const COLLABORATION_AREAS = [
  "Medical",
  "Legal Awareness",
  "Mental Health",
  "Events",
  "Other",
] as const;

const CONTACT_TIMES = [
  "Morning (9 AM – 12 PM)",
  "Afternoon (12 PM – 4 PM)",
  "Evening (4 PM – 7 PM)",
  "Anytime",
] as const;

const partnerFormSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, "Organization name is required")
    .max(100, "Organization name must be less than 100 characters"),
  organizationType: z
    .string()
    .trim()
    .min(1, "Please select an organization type"),
  contactName: z
    .string()
    .trim()
    .min(1, "Contact name is required")
    .max(100, "Contact name must be less than 100 characters"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  phone: z
    .string()
    .trim()
    .min(10, "Please enter a valid phone number")
    .max(15, "Phone number must be less than 15 characters")
    .regex(/^[0-9+\-\s()]+$/, "Please enter a valid phone number"),
  website: z
    .string()
    .trim()
    .max(255, "Website must be less than 255 characters")
    .optional()
    .or(z.literal("")),
  collaborationArea: z
    .string()
    .trim()
    .min(1, "Please select a collaboration area"),
  preferredContactTime: z
    .string()
    .trim()
    .optional(),
  message: z
    .string()
    .trim()
    .min(1, "A short project description is required")
    .max(1000, "Description must be less than 1000 characters"),
});

type PartnerFormValues = z.infer<typeof partnerFormSchema>;

interface PartnerContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PartnerContactModal({ open, onOpenChange }: PartnerContactModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerFormSchema),
    defaultValues: {
      companyName: "",
      organizationType: "",
      contactName: "",
      email: "",
      phone: "",
      website: "",
      collaborationArea: "",
      preferredContactTime: "",
      message: "",
    },
  });

  const onSubmit = async (data: PartnerFormValues) => {
    setIsSubmitting(true);

    try {
      // Check rate limit
      const rateLimitResult = await checkRateLimit(data.email, 'partner_inquiries');
      if (!rateLimitResult.allowed) {
        toast({
          title: "Too many submissions",
          description: rateLimitResult.message,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Save to database
      const inquiryId = crypto.randomUUID();
      const { error } = await supabase
        .from("partner_inquiries")
        .insert({
          id: inquiryId,
          company_name: data.companyName,
          organization_type: data.organizationType,
          contact_name: data.contactName,
          email: data.email,
          phone: data.phone,
          website: data.website || null,
          collaboration_area: data.collaborationArea,
          preferred_contact_time: data.preferredContactTime || null,
          message: data.message,
        });

      if (error) throw error;

      // Send notification email
      await supabase.functions.invoke("send-notification", {
        body: {
          type: "partner_inquiry",
          inquiryId: inquiryId,
          companyName: data.companyName,
          name: data.contactName,
          email: data.email,
        },
      });

      toast({
        title: "Partnership inquiry submitted!",
        description: "Thank you for your interest. Our team will contact you within 24-48 hours.",
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again or contact us directly at shraddhawelfareassociation@gmail.com",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-serif">
            <Building2 className="h-5 w-5" style={{ color: 'hsl(250, 70%, 45%)' }} />
            Partner & Collaborate With Us
          </DialogTitle>
          <DialogDescription>
            Tell us about your organization and how you'd like to collaborate — hospitals, wellness groups, companies, NGOs, institutions or individuals are all welcome. Our team will get back to you within 24-48 hours.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      Organization Name *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Your organization or company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Handshake className="h-4 w-4 text-muted-foreground" />
                      Organization Type *
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ORGANIZATION_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Contact Person *
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Email *
                    </FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@organization.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      Phone *
                    </FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+91 98765 43210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    Website (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="https://yourorganization.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="collaborationArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Handshake className="h-4 w-4 text-muted-foreground" />
                      Collaboration Area *
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select area" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COLLABORATION_AREAS.map((a) => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredContactTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Preferred Contact Time
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONTACT_TIMES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    Short Project Description *
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Briefly describe what you'd like to collaborate on and the impact you hope to create..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
                style={{
                  background: 'linear-gradient(135deg, hsl(250, 70%, 45%), hsl(220, 70%, 50%))',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Inquiry
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

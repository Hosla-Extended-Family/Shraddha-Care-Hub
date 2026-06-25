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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { checkRateLimit } from "@/lib/rate-limit";
import { Loader2, Send, Building2, User, Mail, Phone, MessageSquare } from "lucide-react";

const partnerFormSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, "Company name is required")
    .max(100, "Company name must be less than 100 characters"),
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
  employeeCount: z
    .string()
    .trim()
    .optional(),
  message: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(1000, "Message must be less than 1000 characters"),
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
      contactName: "",
      email: "",
      phone: "",
      employeeCount: "",
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
          contact_name: data.contactName,
          email: data.email,
          phone: data.phone,
          employee_count: data.employeeCount || null,
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-serif">
            <Building2 className="h-5 w-5" style={{ color: 'hsl(250, 70%, 45%)' }} />
            Partner With Us
          </DialogTitle>
          <DialogDescription>
            Fill out the form below and our team will get back to you within 24-48 hours to discuss a customized Corporate Parental Care program.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Company Name *
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Your company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      <Input type="email" placeholder="you@company.com" {...field} />
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
              name="employeeCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Employees (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 100-500" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    Message *
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about your organization and what you're looking for..."
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

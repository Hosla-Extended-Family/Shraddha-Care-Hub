import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  AlertTriangle, 
  X, 
  Camera, 
  Video, 
  MapPin, 
  Loader2,
  FileText,
  Trash2,
  Image as ImageIcon,
  Smartphone,
  Send,
  ImagePlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

// Shraddha emergency WhatsApp number
const EMERGENCY_WHATSAPP = "917811009309";

// WhatsApp Logo SVG Component
function WhatsAppLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

interface QuickReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Desktop message component - simple WhatsApp redirect
function DesktopMessage({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  
  const handleGoToForm = () => {
    onClose();
    navigate("/legal-resources#report-elder-abuse");
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      "[URGENT] ELDER ABUSE REPORT\n\n" +
      "I want to report an incident of elder abuse.\n\n" +
      "Please contact me for details."
    );
    window.open(`https://wa.me/${EMERGENCY_WHATSAPP}?text=${message}`, "_blank");
  };

  // Freeze background scrolling
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="bg-destructive text-destructive-foreground p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6" />
              <h2 className="font-bold text-lg">Report Elder Abuse</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <p className="text-center text-muted-foreground">
            Choose how you'd like to report the incident:
          </p>

          {/* WhatsApp Option - Highlighted */}
          <div className="p-4 bg-green-50 dark:bg-green-950/30 border-2 border-green-500/30 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-500 rounded-full flex-shrink-0">
                <WhatsAppLogo className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-1">WhatsApp (Fastest)</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Send instant message with photos/videos directly to our emergency response team.
                </p>
                <Button 
                  onClick={handleWhatsApp} 
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <WhatsAppLogo className="h-4 w-4 mr-2" />
                  Message on WhatsApp
                </Button>
              </div>
            </div>
          </div>

          {/* Detailed Form Option */}
          <div className="p-4 bg-accent/50 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-full flex-shrink-0">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-1">Detailed Report Form</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Submit a comprehensive report with file uploads for thorough documentation.
                </p>
                <Button onClick={handleGoToForm} variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Go to Report Form
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile tip */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Smartphone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              <strong>Tip:</strong> Use your phone for quick reporting with camera and GPS location.
            </p>
          </div>

          <Button variant="ghost" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

export function QuickReportModal({ isOpen, onClose }: QuickReportModalProps) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const [capturedMedia, setCapturedMedia] = useState<{ type: "photo" | "video"; file: File; url: string } | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [abuseType, setAbuseType] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Get location on mount (only for mobile)
  useEffect(() => {
    if (isOpen && !location && isMobile) {
      getLocation();
    }
  }, [isOpen, isMobile]);

  // Freeze background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      if (capturedMedia?.url) {
        URL.revokeObjectURL(capturedMedia.url);
      }
      setCapturedMedia(null);
      setDescription("");
      setAbuseType("");
    }
  }, [isOpen]);

  const getLocation = useCallback(async () => {
    setLocationLoading(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        
        // Try to get address using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          if (data.display_name) {
            setLocation(prev => prev ? { ...prev, address: data.display_name } : null);
          }
        } catch (e) {
          console.log("Could not fetch address");
        }
        
        setLocationLoading(false);
      },
      () => {
        setLocationError("Could not get location. Please enable location access.");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Save captured photo to device storage so it appears in gallery/downloads
  // Videos are auto-saved by the native camera app, but photos captured via
  // <input type="file" capture> on newer Android Chrome are only kept as
  // temporary files and NOT saved to the gallery automatically.
  const savePhotoToDevice = useCallback((file: File) => {
    try {
      const downloadUrl = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `shraddha-report-${Date.now()}.jpg`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
      }, 150);
    } catch (err) {
      console.log("Could not auto-save photo to device");
    }
  }, []);

  // Handle native file input for photo capture
  const handlePhotoCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCapturedMedia({ type: "photo", file, url });
      savePhotoToDevice(file);
    }
    if (photoInputRef.current) photoInputRef.current.value = "";
  }, [savePhotoToDevice]);

  // Handle native file input for video capture
  const handleVideoCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCapturedMedia({ type: "video", file, url });
    }
    if (videoInputRef.current) videoInputRef.current.value = "";
  }, []);

  const clearMedia = useCallback(() => {
    if (capturedMedia?.url) {
      URL.revokeObjectURL(capturedMedia.url);
    }
    setCapturedMedia(null);
  }, [capturedMedia]);

  // Build WhatsApp message text
  const buildMessage = useCallback(() => {
    let message = "[URGENT] ELDER ABUSE REPORT\n\n";
    
    if (abuseType) {
      const typeLabels: Record<string, string> = {
        physical: "Physical Abuse",
        emotional: "Emotional/Verbal Abuse",
        financial: "Financial Exploitation",
        neglect: "Neglect",
        other: "Other"
      };
      message += `Type: ${typeLabels[abuseType] || abuseType}\n\n`;
    }
    
    if (description) {
      message += `Description:\n${description}\n\n`;
    }
    
    if (location) {
      if (location.address) {
        message += `Location: ${location.address}\n`;
      }
      message += `GPS: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}\n`;
      message += `Maps: https://maps.google.com/?q=${location.lat},${location.lng}\n\n`;
    }
    
    message += "Please help!";
    
    return message;
  }, [abuseType, description, location]);

  // Show confirmation before sending
  const handleSendClick = useCallback(() => {
    setShowConfirmDialog(true);
  }, []);

  // Send via WhatsApp - opens directly to org's chat
  const handleConfirmSend = useCallback(() => {
    setShowConfirmDialog(false);
    setIsSending(true);
    
    let message = buildMessage();
    
    // If media was captured, add instruction to attach it
    if (capturedMedia) {
      message += `\n\n---\n[I have ${capturedMedia.type === "photo" ? "a photo" : "a video"} to share - will attach after sending this message]`;
    }
    
    // Open WhatsApp directly with the organization's number
    const whatsappUrl = `https://wa.me/${EMERGENCY_WHATSAPP}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    
    if (capturedMedia) {
      toast({
        title: "WhatsApp Chat Opened",
        description: "After sending the message, tap the attachment icon (📎) and select the photo/video from your gallery to send it.",
        duration: 8000,
      });
    } else {
      toast({
        title: "WhatsApp Chat Opened",
        description: "Send the message to report the incident.",
      });
    }
    
    setIsSending(false);
    onClose();
  }, [buildMessage, capturedMedia, toast, onClose]);

  if (!isOpen) return null;

  // Show desktop message on non-mobile devices
  if (!isMobile) {
    return <DesktopMessage onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card rounded-2xl shadow-2xl border border-border">
        {/* Header - Red like desktop */}
        <div className="sticky top-0 z-10 bg-destructive text-destructive-foreground p-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6" />
              <div>
                <h2 className="font-bold text-lg">Quick Report</h2>
                <p className="text-sm opacity-90">Send directly via WhatsApp</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-4 space-y-5">
          {/* Location */}
          <div className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg">
            <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Location</p>
              {locationLoading ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Getting location...
                </p>
              ) : locationError ? (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-destructive">{locationError}</p>
                  <button 
                    onClick={getLocation}
                    className="text-xs text-primary underline"
                  >
                    Retry
                  </button>
                </div>
              ) : location ? (
                <p className="text-xs text-muted-foreground truncate">
                  {location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
                </p>
              ) : (
                <button 
                  onClick={getLocation}
                  className="text-xs text-primary underline"
                >
                  Get my location
                </button>
              )}
            </div>
          </div>

          {/* Camera Section - Using Native Inputs */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Capture Evidence (Optional)</p>
            
            {/* Hidden native file inputs */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              capture="environment"
              onChange={handleVideoCapture}
              className="hidden"
            />
            
            {!capturedMedia && (
              <>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Record Video
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Photos/videos are saved to your gallery. You'll attach them in WhatsApp after sending the message.
                </p>
              </>
            )}

            {/* Captured Media Preview */}
            {capturedMedia && (
              <div className="relative rounded-lg overflow-hidden">
                {capturedMedia.type === "photo" ? (
                  <img 
                    src={capturedMedia.url} 
                    alt="Captured" 
                    className="w-full aspect-video object-cover"
                  />
                ) : (
                  <video 
                    src={capturedMedia.url} 
                    controls 
                    className="w-full aspect-video object-cover"
                  />
                )}
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 rounded-full"
                  onClick={clearMedia}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="absolute bottom-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  {capturedMedia.type === "photo" ? <ImageIcon className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                  Saved to gallery - attach in WhatsApp
                </div>
              </div>
            )}
          </div>

          {/* Abuse Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Type of Abuse (Optional)</label>
            <Select value={abuseType} onValueChange={setAbuseType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="z-[200]" position="popper" sideOffset={4}>
                <SelectItem value="physical">Physical Abuse</SelectItem>
                <SelectItem value="emotional">Emotional/Verbal Abuse</SelectItem>
                <SelectItem value="financial">Financial Exploitation</SelectItem>
                <SelectItem value="neglect">Neglect</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Brief Description (Optional)
            </label>
            <Textarea
              placeholder="Describe what you witnessed or what's happening..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Send Button */}
          <div className="flex flex-col gap-3 pt-2">
            <Button 
              onClick={handleSendClick} 
              disabled={isSending}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Opening WhatsApp...
                </>
              ) : (
                <>
                  <WhatsAppLogo className="h-5 w-5 mr-2" />
                  Send via WhatsApp
                </>
              )}
            </Button>
            
            <Link to="/legal-resources#report-elder-abuse" onClick={onClose}>
              <Button variant="ghost" className="w-full text-muted-foreground">
                <FileText className="h-4 w-4 mr-2" />
                Need detailed form instead?
              </Button>
            </Link>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Your report will be sent directly to our emergency WhatsApp. 
            We'll respond as quickly as possible.
          </p>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] transition-opacity ${showConfirmDialog ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
        <AlertDialogContent className="max-w-md z-[200]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-green-600" />
              Ready to Send Report?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  You're about to open WhatsApp to send your abuse report directly to our emergency response team.
                </p>
                
                {capturedMedia && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <ImagePlus className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800 dark:text-amber-200">
                          Important: Attach your {capturedMedia.type}
                        </p>
                        <p className="text-amber-700 dark:text-amber-300 mt-1">
                          After sending the message, tap the <strong>📎 attachment icon</strong> in WhatsApp and select the {capturedMedia.type} you just captured from your gallery.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!capturedMedia && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Tip:</strong> If you have photos or videos as evidence, you can attach them in WhatsApp after sending the initial message.
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSend}
              className="bg-green-600 hover:bg-green-700"
            >
              <WhatsAppLogo className="h-4 w-4 mr-2" />
              Open WhatsApp
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

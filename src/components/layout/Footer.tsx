import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, ExternalLink, Youtube, Linkedin } from "lucide-react";
import logoShraddha from "@/assets/logo-shraddha.png";
import hoslaLogo from "@/assets/hosla-logo.png";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center">
              <img src={logoShraddha} alt="Shraddha" className="h-10" width={158} height={40} loading="lazy" />
            </Link>
            <p className="text-sm text-muted-foreground">
              Providing dignity, protection, and care for our beloved seniors. Backed by Hosla.
            </p>
            <a
              href="https://www.hosla.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Visit Hosla <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Quick Links</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                About Us
              </Link>
              <Link to="/membership-plans" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Membership Plans
              </Link>
              <Link to="/corporate-care" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Corporate Parental Care
              </Link>
              <Link
                to="/legal-resources"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Legal Resources
              </Link>
              <Link to="/volunteer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Volunteer
              </Link>
              <Link to="/games" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Games
              </Link>
              <Link to="/donate" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Donate
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Contact Us</h3>
            <div className="flex flex-col gap-3">
              <a
                href="tel:7811009309"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Phone className="h-4 w-4" />
                7811009309
              </a>
              <a
                href="mailto:shraddhawelfareassociation@gmail.com"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors break-all"
              >
                <Mail className="h-4 w-4" />
                shraddhawelfareassociation@gmail.com
              </a>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Bishnupur, West Bengal
                  <br />
                  Expanding to: Kolkata, Delhi, Mumbai
                </span>
              </div>
            </div>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Follow Us</h3>
            <div className="flex flex-col gap-2">
              <a
                href="https://www.facebook.com/shraddhawelfareassociation"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Facebook className="h-5 w-5" />
                Facebook
              </a>
              <a
                href="https://www.youtube.com/@hoslaextendedfamily"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Youtube className="h-5 w-5" />
                YouTube
              </a>
              <a
                href="https://x.com/FamilyHosla"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                X (Twitter)
              </a>
              <a
                href="https://www.linkedin.com/in/hosla-extendedfamily-507155229/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Linkedin className="h-5 w-5" />
                LinkedIn
              </a>
            </div>
            <p className="text-sm text-muted-foreground">Follow us for updates on our work and impact stories.</p>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground inline-flex items-center justify-center gap-1.5 flex-wrap">
            © {new Date().getFullYear()} Shraddha. All rights reserved. | Powered by{" "}
            <img src={hoslaLogo} alt="Hosla" className="h-4 inline-block" width={36} height={16} loading="lazy" />
          </p>
        </div>
      </div>
    </footer>
  );
}

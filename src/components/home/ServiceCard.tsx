import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface ServiceCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  linkTo: string;
  linkText: string;
  hoverImage?: string;
}

const ServiceCard = ({ icon, title, description, linkTo, linkText, hoverImage }: ServiceCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      className="border-border hover:border-primary/50 transition-colors relative overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background image overlay with crossfade */}
      {hoverImage && (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-500 ease-in-out z-0"
            style={{ 
              backgroundImage: `url(${hoverImage})`,
              opacity: isHovered ? 1 : 0
            }}
          />
          {/* Dark overlay for text readability */}
          <div 
            className="absolute inset-0 bg-foreground/50 transition-opacity duration-500 ease-in-out z-[5]"
            style={{ opacity: isHovered ? 1 : 0 }}
          />
          {/* Gradient overlay from bottom */}
          <div 
            className="absolute inset-0 bg-gradient-to-t from-primary via-primary/70 to-transparent transition-opacity duration-500 ease-in-out z-10"
            style={{ opacity: isHovered ? 1 : 0 }}
          />
        </>
      )}
      
      {/* Card content */}
      <div className="relative z-20">
        <CardHeader>
          <div 
            className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors duration-300 ${
              isHovered && hoverImage ? 'bg-background/20' : 'bg-primary/10'
            }`}
          >
            <div className={`transition-colors duration-300 ${isHovered && hoverImage ? 'text-white' : 'text-primary'}`}>
              {icon}
            </div>
          </div>
          <CardTitle 
            className={`font-serif transition-colors duration-300 ${
              isHovered && hoverImage ? 'text-white' : ''
            }`}
          >
            {title}
          </CardTitle>
          <CardDescription 
            className={`transition-colors duration-300 ${
              isHovered && hoverImage ? 'text-white/90' : ''
            }`}
          >
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            to={linkTo}
            className={`text-sm font-medium hover:underline inline-flex items-center transition-colors duration-300 ${
              isHovered && hoverImage ? 'text-white' : 'text-primary'
            }`}
          >
            {linkText} <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </CardContent>
      </div>
    </Card>
  );
};

export default ServiceCard;

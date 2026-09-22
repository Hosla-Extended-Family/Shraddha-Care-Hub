import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, Users, Megaphone, Building2, ArrowRight, HandHeart, Heart, UserCheck, MapPin, Star } from "lucide-react";
import hoslaLogo from "@/assets/hosla-logo.png";
import knowMoreBubble from "@/assets/know-more-bubble.jpg";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { FloatingElements } from "@/components/home/FloatingElements";
import { AnimatedHeroText } from "@/components/home/AnimatedHeroText";
import ServiceCard from "@/components/home/ServiceCard";
import { ImpactGallery } from "@/components/home/ImpactGallery";
import { StatCard } from "@/components/home/StatCard";
import { ProjectsEventsSection } from "@/components/corporate/ProjectsEventsSection";

// Import hover images
import legalAwarenessHover from "@/assets/legal-awareness-hover.jpg";
import holisticWellbeingHover from "@/assets/holistic-wellbeing-hover.jpg";
import publicSensitizationHover from "@/assets/public-sensitization-hover.jpg";
import corporateCareIllustration from "@/assets/corporate-care-illustration.png";
import corporateCareHover from "@/assets/corporate-care-hover.jpg";
import volunteerElderlyCare from "@/assets/volunteer-elderly-care.jpg";
import missionWatercolorBg from "@/assets/mission-watercolor-bg.png";
import { useState } from "react";

export default function Home() {
  const [isCorporateHovered, setIsCorporateHovered] = useState(false);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-4rem)] bg-gradient-to-br from-accent via-background to-accent/50 py-12 sm:py-16 lg:py-24 overflow-hidden">
        {/* Animated background elements */}
        <FloatingElements />

        <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Text content with animations */}
            <div className="space-y-5 sm:space-y-6 animate-fade-in">
              <div className="relative inline-flex items-center">
                <a
                  href="https://hosla.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary/10 px-3 sm:px-4 py-2 rounded-full text-sm font-medium border border-primary/20 transition-all duration-300 hover:bg-primary/20 hover:border-primary/40 hover:scale-105 hover:shadow-md cursor-pointer"
                >
                  <span className="text-muted-foreground">Backed by</span>
                  <img src={hoslaLogo} alt="Hosla" className="h-5 w-auto" width={45} height={20} />
                </a>
                {/* Know More bubble - hidden on small screens, repositioned on medium */}
                <a
                  href="https://hosla.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:block absolute -right-24 md:-right-28 -top-8 md:-top-10 w-20 md:w-24 h-auto transition-all duration-300 hover:scale-110 hover:brightness-110 drop-shadow-lg"
                >
                  <img src={knowMoreBubble} alt="Click to Know More" className="w-32 md:w-40 h-auto animate-float-bounce" width={128} height={128} loading="lazy" />
                </a>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Dignity and Protection for <br className="hidden sm:inline lg:hidden" /><AnimatedHeroText />
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-lg">
                Shraddha is dedicated to protecting, supporting, and empowering senior citizens across India. Together,
                we're building an extended family for those who need it most.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
                <Button asChild size="lg" className="group w-full sm:w-auto">
                  <Link to="/about">
                    Learn About Shraddha
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="group w-full sm:w-auto">
                  <Link to="/donate">
                    <Heart className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                    Support Our Cause
                  </Link>
                </Button>
              </div>
            </div>

            {/* Carousel */}
            <div className="relative animate-scale-in mt-4 lg:mt-0">
              <HeroCarousel />

              {/* Decorative elements around carousel - hidden on mobile */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-xl hidden sm:block" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-accent rounded-full blur-2xl hidden sm:block" />
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        {/* Parallax Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: `url(${volunteerElderlyCare})` }}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 via-foreground/30 to-foreground/50" />
        
        {/* Top Wave */}
        <div className="absolute top-0 left-0 right-0 -mt-px">
          <svg 
            viewBox="0 0 1440 80" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-full h-auto block"
            preserveAspectRatio="none"
          >
            <path 
              d="M0 0H1440V40C1200 80 960 0 720 20C480 40 240 80 0 40V0Z" 
              className="fill-background"
            />
          </svg>
        </div>
        
        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0 -mb-px">
          <svg 
            viewBox="0 0 1440 80" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-full h-auto block"
            preserveAspectRatio="none"
          >
            <path 
              d="M0 40C240 0 480 80 720 60C960 40 1200 0 1440 40V80H0V40Z" 
              className="fill-card"
            />
          </svg>
        </div>
        
        <div className="container relative z-10">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-white mb-4 drop-shadow-lg">Our Services</h2>
            <p className="text-white/90 max-w-2xl mx-auto drop-shadow-md">
              Comprehensive support for seniors through awareness, care, and advocacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ServiceCard
              icon={<Scale className="h-6 w-6" />}
              title="Legal Awareness"
              description="Educating seniors about their legal rights and protections under Indian law."
              linkTo="/legal-resources"
              linkText="Learn about your rights"
              hoverImage={legalAwarenessHover}
            />

            <ServiceCard
              icon={<HandHeart className="h-6 w-6" />}
              title="Holistic Well-being"
              description="Mental health support, companionship programs, and wellness activities for seniors."
              linkTo="/about"
              linkText="Explore programs"
              hoverImage={holisticWellbeingHover}
            />

            <ServiceCard
              icon={<Megaphone className="h-6 w-6" />}
              title="Public Sensitization"
              description="Campaigns and awareness programs against elder abuse in communities."
              linkTo="/volunteer"
              linkText="Join the movement"
              hoverImage={publicSensitizationHover}
            />
          </div>

          {/* Membership Plans CTA */}
          <div className="text-center mt-10">
            <Button asChild variant="heroOutline" size="lg" className="group">
              <Link to="/membership-plans">
                <Star className="mr-2 h-4 w-4" />
                Explore Membership Plans
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Impact Gallery */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">Our Impact</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Making a difference in the lives of seniors across communities.
            </p>
          </div>

          <ImpactGallery />
        </div>
      </section>

      {/* Projects & Events Preview */}
      <ProjectsEventsSection limit={3} showViewAll />

      {/* Corporate Care CTA */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <div 
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent via-accent/80 to-primary/10 cursor-pointer"
            onMouseEnter={() => setIsCorporateHovered(true)}
            onMouseLeave={() => setIsCorporateHovered(false)}
            onClick={() => setIsCorporateHovered(prev => !prev)}
            onTouchStart={() => setIsCorporateHovered(prev => !prev)}
          >
            {/* Hover overlay - background image */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-500 ease-in-out z-0"
              style={{ 
                backgroundImage: `url(${corporateCareHover})`,
                opacity: isCorporateHovered ? 1 : 0
              }}
            />
            {/* Hover overlay - dark layer for text readability */}
            <div 
              className="absolute inset-0 bg-foreground/40 transition-opacity duration-500 ease-in-out z-[5]"
              style={{ opacity: isCorporateHovered ? 1 : 0 }}
            />
            {/* Hover overlay - horizontal blue to green gradient */}
            <div 
              className="absolute inset-0 transition-opacity duration-500 ease-in-out z-10"
              style={{ 
                background: 'linear-gradient(90deg, hsl(200 80% 40% / 0.7) 0%, hsl(161 93% 30% / 0.8) 100%)',
                opacity: isCorporateHovered ? 1 : 0
              }}
            />
            
            {/* Content wrapper */}
            <div className="relative z-20 flex flex-col lg:flex-row items-center">
              {/* Text content - left side */}
              <div className="flex-1 p-8 lg:p-12 lg:pr-0 space-y-5">
                <div 
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
                    isCorporateHovered 
                      ? 'bg-background/20 text-white' 
                      : 'bg-foreground/10 text-foreground'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  For Businesses
                </div>
                
                <h2 
                  className={`font-serif text-3xl lg:text-4xl font-bold leading-tight transition-colors duration-300 ${
                    isCorporateHovered ? 'text-white' : 'text-foreground'
                  }`}
                >
                  Corporate Parental<br />Care Program
                </h2>
                
                <p 
                  className={`max-w-md leading-relaxed transition-colors duration-300 ${
                    isCorporateHovered ? 'text-white/90' : 'text-muted-foreground'
                  }`}
                >
                  Partner with Shraddha to support the parents of your employees. We provide mental health support, companionship, and engagement programs for the senior family members of your workforce.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button 
                    asChild 
                    size="lg" 
                    className={`group transition-colors duration-300 ${
                      isCorporateHovered 
                        ? 'bg-white hover:bg-white/90 text-foreground' 
                        : 'bg-foreground hover:bg-foreground/90 text-background'
                    }`}
                  >
                    <Link to="/partner#corporate-plan">
                      Explore Corporate Care
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button 
                    asChild 
                    size="lg"
                    variant="outline"
                    className={`group transition-colors duration-300 bg-transparent ${
                      isCorporateHovered 
                        ? 'border-white text-white hover:bg-white/20' 
                        : 'border-foreground/20 text-foreground hover:bg-foreground/5'
                    }`}
                  >
                    <Link to="/membership-plans">
                      View Individual Plans
                    </Link>
                  </Button>
                </div>
              </div>
              
              {/* Illustration - right side with gradient overlay */}
              <div 
                className={`flex-shrink-0 w-full lg:w-1/2 flex justify-center lg:justify-end relative transition-opacity duration-500 ${
                  isCorporateHovered ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <div className="relative w-full max-w-lg lg:max-w-none lg:w-full">
                  <img 
                    src={corporateCareIllustration} 
                    alt="Corporate partnership illustration" 
                    className="w-full h-auto object-contain relative z-10"
                    loading="lazy"
                    width={636}
                    height={646}
                  />
                  {/* Gradient overlay effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent rounded-2xl pointer-events-none" />
                  <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 via-accent/20 to-transparent rounded-full blur-2xl -z-10" />
                </div>
              </div>
            </div>
            
            {/* Decorative sparkle elements */}
            <div className={`absolute top-8 right-8 transition-colors duration-300 ${isCorporateHovered ? 'text-white/30' : 'text-primary/30'}`}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"/>
              </svg>
            </div>
            <div className={`absolute bottom-8 left-8 transition-colors duration-300 ${isCorporateHovered ? 'text-white/20' : 'text-primary/20'}`}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 lg:py-24 relative overflow-hidden">
        {/* Parallax Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: `url(${missionWatercolorBg})` }}
        />
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-card/70" />
        
        {/* Top Wave */}
        <div className="absolute top-0 left-0 right-0 -mt-px">
          <svg 
            viewBox="0 0 1440 80" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-full h-auto block"
            preserveAspectRatio="none"
          >
            <path 
              d="M0 0H1440V40C1200 80 960 0 720 20C480 40 240 80 0 40V0Z" 
              className="fill-card"
            />
          </svg>
        </div>
        
        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0 -mb-px">
          <svg 
            viewBox="0 0 1440 80" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-full h-auto block"
            preserveAspectRatio="none"
          >
            <path 
              d="M0 40C240 0 480 80 720 60C960 40 1200 0 1440 40V80H0V40Z" 
              fill="hsl(161, 93%, 30%)"
            />
          </svg>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/30 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        
        <div className="container relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Header with decorative lines */}
            <div className="text-center mb-12 animate-fade-in">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/50" />
                <span className="text-primary font-medium uppercase tracking-widest text-sm">What Drives Us</span>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/50" />
              </div>
              <h2 className="font-serif text-3xl lg:text-5xl font-bold text-foreground mb-6">Our Mission</h2>
              <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto italic">
                "To create a society where every senior citizen lives with dignity, free from abuse, neglect, and
                isolation. We believe in building an extended family that cares, protects, and empowers our elders."
              </p>
            </div>

            {/* Impact Stats with enhanced cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 pt-8">
              <StatCard value={500} label="Seniors Supported" Icon={Users} index={0} />
              <StatCard value={50} label="Legal Awareness Camps" Icon={Scale} index={1} />
              <StatCard value={100} label="Active Volunteers" Icon={UserCheck} index={2} />
              <StatCard value={10} label="Cities Reached" Icon={MapPin} index={3} />
            </div>

            {/* Decorative sparkles */}
            <div className="absolute top-20 right-20 text-primary/20 animate-pulse hidden lg:block">
              <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"/>
              </svg>
            </div>
            <div className="absolute bottom-32 left-16 text-accent animate-pulse hidden lg:block" style={{ animationDelay: '1s' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="container text-center space-y-6">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold">Ready to Make a Difference?</h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto">
            Join our mission to protect and support senior citizens. Whether you volunteer, donate, or partner with us,
            every contribution matters.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild variant="secondary" size="lg">
              <Link to="/volunteer">Become a Volunteer</Link>
            </Button>
            <Button asChild variant="heroOutline" size="lg">
              <Link to="/donate">Donate Now</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}

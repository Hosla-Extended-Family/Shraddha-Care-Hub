import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Heart, Target, Award, Quote, Star, Facebook, ExternalLink, BookOpen, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TeamSection } from "@/components/team/TeamSection";
import { WorkGallery } from "@/components/about/WorkGallery";

// Import real images
import orgCollage from "@/assets/org-collage.png";
import shraddhaBanner from "@/assets/shraddha-care-banner.jpg";

// Import success story images
import successStory1 from "@/assets/success-story-1.jpg";
import successStory2a from "@/assets/success-story-2a.jpg";
import successStory2b from "@/assets/success-story-2b.jpg";
import successStory3 from "@/assets/success-story-3.jpg";

// Full story content for each impact story
const impactStories = [
  {
    title: "A Stream of Joy Through Service",
    shortContent: "Through Hosla and Shraddha, we experience the eternal truths of Existence, Consciousness, and Bliss. Those connected to our organization not just by work, but by heart and action, are truly experiencing the blissful nature of the soul.",
    fullContent: `"আনন্দধারা বহিছে ভুবনে…"

Every object and every human being in this world carries five dimensions. Among them, Existence (Sat), Consciousness (Chit), and Bliss (Ananda) are the eternal truths.

Through Hosla and Shraddha, we—those connected to the organization not just by work, but by heart and action—are truly experiencing this blissful nature of the soul.

For an organization, what greater success can there be than helping people realize inner joy and purpose?

We are truly blessed, by the grace of God.

এই জগতে প্রত্যেক বস্তু ও প্রত্যেক মানুষের মধ্যে পাঁচটি দিক বা স্তর রয়েছে— অস্তিত্ব (Sat), চেতনা বা আলোক (Chit) এবং আনন্দ (Ananda)—এই তিনটিই তার মধ্যে সত্য ও চিরন্তন।

হসলা ও শ্রদ্ধার মাধ্যমে আমরা—যাঁরা সংস্থার কাজের সঙ্গে হৃদয় ও কর্মের মাধ্যমে যুক্ত—সত্যিই আনন্দঘন আত্মার স্বরূপ উপলব্ধি করতে পারছি।

একটি সংস্থার ক্ষেত্রে এর থেকে বড় সাফল্য আর কি-ই বা হতে পারে?

আমরা ধন্য ঈশ্বরের আশীর্বাদে।`,
    author: "Shraddha Team",
    role: "Hosla Care Family",
    images: [successStory1],
    fbLink: "https://www.facebook.com/share/p/1DjtNL59nX/"
  },
  {
    title: "Spreading Warmth in Tribal Villages",
    shortContent: "Winter essentials were distributed at Rupur and Jharul villages in Burdwan. The simplicity of the tribal families — and the happiness they felt receiving warm clothes, fruits, and food — reminded us what real humanity looks like.",
    fullContent: `With grace on our side, Shraddha & Hosla felt that joy once again.

Winter essentials were distributed at Rupur and Jharul villages in Burdwan district.

The simplicity of the tribal families — and the happiness they felt receiving warm clothes, fruits, and food — reminded us what real humanity looks like.

Moments like these widen not just our reach, but our hearts too.

---

ঈশ্বরের কৃপায় শ্রদ্ধা ও হসলা পরিবার আবারও মহানন্দ লাভ করলো।

এবারে শীতবস্ত্র বিতরণ করা হলো বর্ধমান জেলার রূপপুর ও ঝাড়ুল গ্রামে।

আদিবাসী বাসিন্দাদের সরলতা এবং সামান্য শীতবস্ত্র, ফল ও খাদ্যসামগ্রী পেয়ে যে আনন্দ—তা আমাদের আবারও মানবতার শিক্ষা দিলো।

হসলা পরিবারের পরিসর ও হৃদয় বৃদ্ধি পেলো।

Contact: 7811009309`,
    author: "Shraddha & Hosla Team",
    role: "Winter Relief Drive, Burdwan",
    images: [successStory2a, successStory2b],
    fbLink: "https://www.facebook.com/share/p/17ixHymTaY/"
  },
  {
    title: "Shri Amiya Dasgupta's Testimonial",
    shortContent: "At 86 years old, when my son and daughter-in-law had to leave for my granddaughter's treatment, I felt anxious being alone. Hosla immediately assured me — 'We're here with you in every way.'",
    fullContent: `Message from Shri Amiya Dasgupta (Age 86)

"I extend my warm Diwali wishes to all members of the Hosla organization.

On 14th October, my son and daughter-in-law left for Vellore for my granddaughter's treatment, for a few days keeping me and my wife alone at home. Within just a few days, I began to feel physically and mentally vulnerable. I worried — what if I fell sick at night?

So, I informed Hosla about my concern. They immediately assured me — 'We're here with you in every way.'

To ease my anxiety, Hosla arranged for a trusted night caregiver. Talking with the young volunteer before sleep brought me comfort, and I could finally rest peacefully knowing someone was nearby.

Hosla also promised to continue this support till my family returns, and their team calls regularly to check on me morning, evening, and night.

From the very beginning, Hosla's slogan has been 'Serving seniors in their time of need.' They truly live by it. I'm proud to be a member of such an organization.

I feel deeply grateful and blessed that the organizations I'm connected with treat me with care and respect.

Once again, my heartfelt thanks to Hosla. May their noble work grow and spread far and wide. May God always guide and bless them.

Jai Hosla! Zindabad Hosla!"

---

আমি অমিয় দাশগুপ্ত বলছি...

আমার হসলা সংগঠনের সমস্ত সদস্য-সদস্যাকে জানাই শুভ দীপাবলির শুভেচ্ছা।

১৪ অক্টোবর ভেলোরে নাতনির চিকিৎসার জন্য ছেলে-বৌমারা যায়, আর তাই বাড়িতে বুড়ো-বুড়ি আমরা কয়েকদিন একা আছি। আমার বয়স ৮৬ বছর — মানসিক ও শারীরিকভাবে একটু অসহায় বোধ করতে শুরু করি।

আশ্বস্ত করে হসলা — "আমরা আছি সবরকমভাবে আপনার পাশে।"

কাজের মাধ্যমে সেটাই তারা করে যাচ্ছে, আর তাই আমি গর্বিত যে আমি হসলার একজন সদস্য।

জয় হসলা, জিন্দাবাদ হসলা!`,
    author: "Shri Amiya Dasgupta",
    role: "Hosla Member, Age 86",
    images: [successStory3],
    fbLink: "https://www.facebook.com/share/p/1DonFcT5pS/"
  }
];

interface ImpactStory {
  title: string;
  shortContent: string;
  fullContent: string;
  author: string;
  role: string;
  images: string[];
  fbLink: string;
}

export default function About() {
  const [selectedStory, setSelectedStory] = useState<ImpactStory | null>(null);
  
  const { data: successStories } = useQuery({
    queryKey: ["success-stories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("success_stories")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src={shraddhaBanner} 
            alt="" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/75 to-primary/90" />
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-primary-foreground/20 rounded-full animate-float-bounce" />
        <div className="absolute bottom-16 right-16 w-32 h-32 border-2 border-primary-foreground/10 rounded-full" />
        <div className="absolute top-1/4 right-10 w-4 h-4 bg-primary-foreground/30 rounded-full animate-pulse" />
        <div className="absolute bottom-1/3 left-16 w-6 h-6 bg-primary-foreground/20 rounded-full animate-pulse" />
        <div className="absolute top-20 right-1/4 w-16 h-16 border border-primary-foreground/15 rotate-45" />
        <div className="absolute bottom-10 left-1/4 w-12 h-12 border border-primary-foreground/10 rotate-12 rounded-lg" />
        
        {/* Content */}
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground px-4 py-2 rounded-full text-sm font-medium border border-primary-foreground/20">
              <Heart className="h-4 w-4" />
              Serving Seniors Since 2021
            </div>
            <h1 className="font-serif text-4xl lg:text-6xl font-bold text-primary-foreground drop-shadow-lg">
              About Shraddha
            </h1>
            <p className="text-lg lg:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Our journey, our mission, and the impact we're creating together for elderly welfare across India.
            </p>
          </div>
        </div>
        
        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0 -mb-px">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
          </svg>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                <Heart className="h-4 w-4" />
                Our Story
              </div>
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground">
                Born from Compassion, Backed by Hosla
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                The <strong className="text-foreground">Shraddha Welfare Association</strong> was founded by the core team of 
                <a href="https://hosla.in" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 font-semibold"> Hosla (Hosla Care)</a>, a senior care startup established in 2021. 
                The NGO was formed as a strategic pivot in Hosla's mission to address sensitive issues 
                that a private startup model could not easily scale — specifically, <em>the domestic abuse of the elderly</em>.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                It began as a <strong className="text-foreground">Public-Private Partnership (PPP)</strong> project between Hosla and the 
                <a href="https://bankurapolice.wb.gov.in/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 font-semibold"> Bankura District Police</a> to provide free protection and care for senior citizens facing abuse. 
                Following the success of this model, it was officially converted into the Shraddha Welfare Association.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Today, Hosla and Shraddha operate as two separate but collaborative entities focused on the 
                protection and well-being of India's senior citizens, with active chapters in <strong className="text-foreground">Bishnupur</strong> and <strong className="text-foreground">Varanasi</strong>.
              </p>
              <a 
                href="https://www.facebook.com/100090887343887/about/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
              >
                <Facebook className="h-4 w-4" />
                Follow us on Facebook
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="relative">
              <img 
                src={orgCollage} 
                alt="Shraddha Welfare Association activities and team" 
                className="rounded-2xl shadow-lg w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* The Why */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Target className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
                The "Why" Behind Our Mission
              </h2>
            </div>
            
            <Card className="border-primary/20">
              <CardContent className="p-8 space-y-6">
                <div className="flex gap-4">
                  <Quote className="h-8 w-8 text-primary flex-shrink-0" />
                  <p className="text-lg text-muted-foreground italic leading-relaxed">
                    "The pandemic showed us how isolated our seniors truly are. Locked away from 
                    their families, many faced not just physical challenges, but profound loneliness 
                    and fear. We realized then that our elders needed more than occasional visits - 
                    they needed an extended family."
                  </p>
                </div>
                <p className="text-muted-foreground leading-relaxed pl-12">
                  This realization became the driving force behind Shraddha. We're not just an 
                  organization - we're a movement to rebuild the bonds of care, respect, and 
                  protection that every senior deserves. We stand against elder abuse, fight 
                  for their rights, and provide the companionship that makes life meaningful.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Photo Gallery */}
      <WorkGallery />

      {/* Success Stories */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container">
          <div className="text-center mb-12">
            <Star className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Success Stories
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Real stories of impact from the seniors and families we've had the privilege to support.
            </p>
          </div>

          {successStories && successStories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {successStories.map((story) => (
                <Card key={story.id} className="border-border hover:border-primary/50 transition-colors">
                  {story.image_url && (
                    <div className="aspect-video overflow-hidden rounded-t-lg">
                      <img 
                        src={story.image_url} 
                        alt={story.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-serif text-lg font-semibold text-foreground">
                      {story.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-4">
                      {story.content}
                    </p>
                    {story.author_name && (
                      <div className="pt-4 border-t border-border">
                        <p className="text-sm font-medium text-foreground">{story.author_name}</p>
                        {story.author_role && (
                          <p className="text-xs text-muted-foreground">{story.author_role}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {impactStories.map((story, index) => (
                <Card key={index} className="group relative border-border hover:border-primary/50 transition-colors overflow-hidden cursor-pointer" onClick={() => setSelectedStory(story)}>
                  <div className="relative aspect-video overflow-hidden rounded-t-lg">
                    {story.images.length > 1 ? (
                      <div className="grid grid-cols-2 h-full">
                        {story.images.map((img, imgIdx) => (
                          <img 
                            key={imgIdx}
                            src={img} 
                            alt={`${story.title} - ${imgIdx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ))}
                      </div>
                    ) : (
                      <img 
                        src={story.images[0]} 
                        alt={story.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Facebook Hover Overlay */}
                    <a 
                      href={story.fbLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/70 to-primary/50 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out translate-y-2 group-hover:translate-y-0"
                    >
                      <div className="flex items-center gap-2 bg-background/20 backdrop-blur-sm px-4 py-2 rounded-full border border-primary-foreground/30">
                        <Facebook className="h-5 w-5 text-primary-foreground" />
                        <span className="text-primary-foreground font-medium text-sm">View on Facebook</span>
                        <ExternalLink className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <p className="text-primary-foreground/80 text-xs">See proof of our impact</p>
                    </a>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-serif text-lg font-semibold text-foreground">
                      {story.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      {story.shortContent}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-2 text-primary hover:text-primary/80 p-0 h-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStory(story);
                      }}
                    >
                      <BookOpen className="h-4 w-4" />
                      Read Full Story
                    </Button>
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm font-medium text-foreground">{story.author}</p>
                      <p className="text-xs text-muted-foreground">{story.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Story Dialog */}
      <Dialog open={!!selectedStory} onOpenChange={(open) => !open && setSelectedStory(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-foreground pr-8">
              {selectedStory?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedStory && (
            <div className="space-y-6">
              {/* Images */}
              <div className="rounded-lg overflow-hidden">
                {selectedStory.images.length > 1 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedStory.images.map((img, imgIdx) => (
                      <img 
                        key={imgIdx}
                        src={img} 
                        alt={`${selectedStory.title} - ${imgIdx + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                ) : (
                  <img 
                    src={selectedStory.images[0]} 
                    alt={selectedStory.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                )}
              </div>
              
              {/* Full Content */}
              <div className="prose prose-sm max-w-none">
                {selectedStory.fullContent.split('\n').map((paragraph, idx) => (
                  paragraph.trim() ? (
                    <p key={idx} className="text-muted-foreground leading-relaxed mb-3">
                      {paragraph}
                    </p>
                  ) : (
                    <br key={idx} />
                  )
                ))}
              </div>
              
              {/* Author & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-border">
                <div>
                  <p className="font-semibold text-foreground">{selectedStory.author}</p>
                  <p className="text-sm text-muted-foreground">{selectedStory.role}</p>
                </div>
                <a 
                  href={selectedStory.fbLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <Facebook className="h-4 w-4" />
                  View on Facebook
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Achievements */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <Award className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Our Achievements
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Milestones we've reached together with our community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { number: "500+", label: "Seniors Supported", description: "Direct care and support" },
              { number: "50+", label: "Legal Awareness Camps", description: "Educating communities" },
              { number: "100+", label: "Active Volunteers", description: "Dedicated team members" },
              { number: "10+", label: "Cities Reached", description: "Expanding our presence" },
            ].map((stat, index) => (
              <Card key={index} className="text-center border-border">
                <CardContent className="p-6 space-y-2">
                  <div className="text-4xl font-bold text-primary">{stat.number}</div>
                  <div className="font-semibold text-foreground">{stat.label}</div>
                  <div className="text-sm text-muted-foreground">{stat.description}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <TeamSection />
    </Layout>
  );
}

import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MailCheck, AlertCircle, ArrowRight, BellRing } from "lucide-react";

export default function BlogSubscribed() {
  const [params] = useSearchParams();
  const status = params.get("status") || "verified";
  const email = params.get("email") || "";

  useEffect(() => {
    document.title = "Subscription confirmed · Shraddha Blogs";
  }, []);

  const invalid = status === "invalid";
  const already = status === "already";

  return (
    <Layout>
      <section className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-lg p-8 sm:p-12 text-center">
          {invalid ? (
            <>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="font-serif text-3xl font-bold mb-3">Link not recognized</h1>
              <p className="text-muted-foreground mb-8">
                This confirmation link may have expired or already been used. Try subscribing again from the blog page.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                {already ? <MailCheck className="h-8 w-8 text-primary" /> : <CheckCircle2 className="h-8 w-8 text-primary" />}
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-3">
                {already ? "You're already in! 💚" : "You're all set! 🎉"}
              </h1>
              {email && (
                <p className="text-base sm:text-lg mb-2">
                  <span className="text-muted-foreground">We'll send new blogs to </span>
                  <span className="font-semibold text-foreground break-all">{email}</span>
                </p>
              )}
              <p className="text-muted-foreground mb-6">
                {already
                  ? "This email is already subscribed to Shraddha Blogs. No further action needed."
                  : "Your email is verified. You'll now get notified whenever a new blog drops."}
              </p>
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 mb-8 text-left flex gap-3">
                <BellRing className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Stay tuned 😉</p>
                  <p className="text-muted-foreground mt-1">
                    Keep an eye on your inbox for emails from <span className="font-medium text-foreground">Shraddha Blogs</span>. Every new story, poem, and recitation will land there — you can unsubscribe with one click anytime.
                  </p>
                </div>
              </div>
            </>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/blog">Read the latest blogs <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}

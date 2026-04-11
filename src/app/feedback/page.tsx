"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "general", label: "General Feedback" },
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "content", label: "Content Suggestion" },
];

export default function FeedbackPage() {
  const router = useRouter();
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to submit feedback");
        return;
      }

      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="mx-auto max-w-lg px-4 py-12">
        {submitted ? (
          <Card>
            <CardContent className="flex flex-col items-center p-10 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <h1 className="mb-2 text-xl font-bold">Thank You!</h1>
              <p className="mb-6 text-sm text-muted-foreground">
                Your feedback has been submitted. We appreciate you taking
                the time to help us improve.
              </p>
              <Button onClick={() => router.push("/")} variant="outline">
                Back to Home
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900">
                <MessageSquare className="h-6 w-6 text-yellow-400" />
              </div>
              <h1 className="text-2xl font-bold">Submit Feedback</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Have a suggestion, found a bug, or want to request a feature?
                <br />
                We&apos;d love to hear from you.
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Category */}
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setCategory(cat.value)}
                          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                            category === cat.value
                              ? "border-yellow-400 bg-yellow-50 text-slate-900"
                              : "border-slate-200 text-muted-foreground hover:border-slate-300"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Your Feedback</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what's on your mind..."
                      rows={5}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full gap-2"
                    disabled={submitting || !message.trim()}
                  >
                    <Send className="h-4 w-4" />
                    {submitting ? "Submitting..." : "Submit Feedback"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </>
  );
}

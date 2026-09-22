import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export type Lang = "en" | "bn";
const KEY = "app_lang";

// Blog-area translation dictionary. Keys are English fallbacks; missing keys fall back to English.
// Blog *content* (title, body) is never translated — those are original writings.
const dict: Record<string, Record<Lang, string>> = {
  // Blog listing page
  "Blogs": { en: "Blogs", bn: "ব্লগ" },
  "Stories, poems, recitations & reflections from our community.": {
    en: "Stories, poems, recitations & reflections from our community.",
    bn: "আমাদের সম্প্রদায়ের গল্প, কবিতা, আবৃত্তি ও প্রতিফলন।",
  },
  "Become a writer": { en: "Become a writer", bn: "লেখক হোন" },
  "Write as guest": { en: "Write as guest", bn: "অতিথি হিসেবে লিখুন" },
  "Write a blog": { en: "Write a blog", bn: "একটি ব্লগ লিখুন" },
  "My profile": { en: "My profile", bn: "আমার প্রোফাইল" },
  "Writer application pending admin approval.": {
    en: "Writer application pending admin approval.",
    bn: "লেখক আবেদন অ্যাডমিন অনুমোদনের অপেক্ষায়।",
  },
  "Write as guest meanwhile": { en: "Write as guest meanwhile", bn: "ইতিমধ্যে অতিথি হিসেবে লিখুন" },
  "Write as guest instead": { en: "Write as guest instead", bn: "পরিবর্তে অতিথি হিসেবে লিখুন" },
  "Your writer application was declined. Contact an admin for details.": {
    en: "Your writer application was declined. Contact an admin for details.",
    bn: "আপনার লেখক আবেদন প্রত্যাখ্যান করা হয়েছে। বিস্তারিত জানতে অ্যাডমিনের সাথে যোগাযোগ করুন।",
  },
  "Search blogs": { en: "Search blogs", bn: "ব্লগ খুঁজুন" },
  "All": { en: "All", bn: "সব" },
  "No blogs yet. Be the first to share yours!": {
    en: "No blogs yet. Be the first to share yours!",
    bn: "এখনও কোনো ব্লগ নেই। আপনিই প্রথম শেয়ার করুন!",
  },
  "By": { en: "By", bn: "লিখেছেন" },
  "Guest Blogger": { en: "Guest Blogger", bn: "অতিথি ব্লগার" },
  "Anonymous": { en: "Anonymous", bn: "অজ্ঞাত" },
  "Previous": { en: "Previous", bn: "পূর্ববর্তী" },
  "Next": { en: "Next", bn: "পরবর্তী" },
  "Page {n} of {t}": { en: "Page {n} of {t}", bn: "পৃষ্ঠা {n} / {t}" },
  "Live Community Impact": { en: "Live Community Impact", bn: "জীবন্ত সম্প্রদায় প্রভাব" },
  "Stories that inspire, connect & heal": {
    en: "Stories that inspire, connect & heal",
    bn: "গল্প যা অনুপ্রাণিত করে, সংযোগ ঘটায় ও আরোগ্য দেয়",
  },
  "Published Stories": { en: "Published Stories", bn: "প্রকাশিত গল্প" },
  "By community seniors": { en: "By community seniors", bn: "প্রবীণদের অভিজ্ঞতালব্ধ" },
  "Contributing Writers": { en: "Contributing Writers", bn: "অবদানকারী লেখক" },
  "Senior voices & guests": { en: "Senior voices & guests", bn: "প্রবীণ কণ্ঠ ও অতিথি" },
  "Genres Explored": { en: "Genres Explored", bn: "অন্বেষিত বিষয়ধারা" },
  "Unique themes": { en: "Unique themes", bn: "অনন্য বিষয়ধারা" },
  "Reader Loves": { en: "Reader Loves", bn: "পাঠকদের ভালোবাসা" },
  "Community appreciations": { en: "Community appreciations", bn: "সম্প্রদায়ের প্রশংসা" },
  "Words of Wisdom": { en: "Words of Wisdom", bn: "জ্ঞানের বাণী" },
  "Shared reflections": { en: "Shared reflections", bn: "ভাগ করা ভাবনা" },

  // Blog read
  "Back to blogs": { en: "Back to blogs", bn: "ব্লগে ফিরে যান" },
  "All blogs": { en: "All blogs", bn: "সব ব্লগ" },
  "min read": { en: "min read", bn: "মিনিট পড়া" },
  "Listen": { en: "Listen", bn: "শুনুন" },
  "Pause": { en: "Pause", bn: "থামান" },
  "Play": { en: "Play", bn: "চালান" },
  "Read aloud": { en: "Read aloud", bn: "পড়ে শোনান" },
  "Read-aloud unavailable": { en: "Read-aloud unavailable", bn: "পড়ে শোনানো অনুপলব্ধ" },
  "Please try again later.": { en: "Please try again later.", bn: "পরে আবার চেষ্টা করুন।" },
  "Share": { en: "Share", bn: "শেয়ার করুন" },
  "Comments": { en: "Comments", bn: "মন্তব্য" },
  "You may also like": { en: "You may also like", bn: "আপনার পছন্দ হতে পারে" },
  "Explore more blogs": { en: "Explore more blogs", bn: "আরও ব্লগ দেখুন" },
  "Leave a Reply": { en: "Leave a Reply", bn: "একটি মন্তব্য করুন" },
  "Name": { en: "Name", bn: "নাম" },
  "Email address": { en: "Email address", bn: "ইমেইল ঠিকানা" },
  "Website": { en: "Website", bn: "ওয়েবসাইট" },
  "Comment": { en: "Comment", bn: "মন্তব্য" },
  "Post comment": { en: "Post comment", bn: "মন্তব্য জমা দিন" },
  "Like": { en: "Like", bn: "পছন্দ" },
  "Likes": { en: "Likes", bn: "পছন্দসমূহ" },
  "Blog not found": { en: "Blog not found", bn: "ব্লগ পাওয়া যায়নি" },
  "This blog may have been unpublished or removed.": {
    en: "This blog may have been unpublished or removed.",
    bn: "এই ব্লগটি অপ্রকাশিত বা মুছে ফেলা হয়েছে।",
  },
  "Browse other blogs": { en: "Browse other blogs", bn: "অন্য ব্লগ দেখুন" },
  "Written by": { en: "Written by", bn: "লিখেছেন" },
  "View all blogs by this author →": {
    en: "View all blogs by this author →",
    bn: "এই লেখকের সব ব্লগ দেখুন →",
  },

  // Writer / guest form
  "Title": { en: "Title", bn: "শিরোনাম" },
  "Your title": { en: "Your title", bn: "আপনার শিরোনাম" },
  "Cover image": { en: "Cover image", bn: "কভার ছবি" },
  "Upload cover": { en: "Upload cover", bn: "কভার আপলোড করুন" },
  "Add cover photo": { en: "Add cover photo", bn: "কভার ছবি যুক্ত করুন" },
  "Change cover photo": { en: "Change cover photo", bn: "কভার ছবি পরিবর্তন" },
  "Uploading {p}%": { en: "Uploading {p}%", bn: "আপলোড হচ্ছে {p}%" },
  "Uploading cover photo": { en: "Uploading cover photo", bn: "কভার ছবি আপলোড হচ্ছে" },
  "Submit for review": { en: "Submit for review", bn: "পর্যালোচনার জন্য জমা দিন" },
  "Submit for publishing": { en: "Submit for publishing", bn: "প্রকাশের জন্য জমা দিন" },
  "Save draft": { en: "Save draft", bn: "খসড়া সংরক্ষণ" },
  "Language": { en: "Language", bn: "ভাষা" },
  "English": { en: "English", bn: "ইংরেজি" },
  "Bengali": { en: "Bengali", bn: "বাংলা" },
  "Story": { en: "Story", bn: "গল্প" },
  "Poem": { en: "Poem", bn: "কবিতা" },
  "Recitation": { en: "Recitation", bn: "আবৃত্তি" },
  "Essay": { en: "Essay", bn: "প্রবন্ধ" },
  "Other": { en: "Other", bn: "অন্যান্য" },
  "This is a:": { en: "This is a:", bn: "এটি একটি:" },
  "Full name": { en: "Full name", bn: "পূর্ণ নাম" },
  "Phone number": { en: "Phone number", bn: "ফোন নম্বর" },
  "Continue": { en: "Continue", bn: "চালিয়ে যান" },
  "Cancel": { en: "Cancel", bn: "বাতিল" },
  "Back": { en: "Back", bn: "পিছনে" },
  "Submit": { en: "Submit", bn: "জমা দিন" },
  "PIN": { en: "PIN", bn: "পিন" },
  "Set a PIN": { en: "Set a PIN", bn: "একটি পিন সেট করুন" },
  "Enter your PIN": { en: "Enter your PIN", bn: "আপনার পিন লিখুন" },
  "Welcome back": { en: "Welcome back", bn: "আবার স্বাগতম" },
  "Go back to blog page": { en: "Go back to blog page", bn: "ব্লগ পৃষ্ঠায় ফিরে যান" },
  "Tell your story": { en: "Tell your story", bn: "আপনার কথা বলুন" },
  "Write in whichever language feels natural. We'll take care of the rest.": {
    en: "Write in whichever language feels natural. We'll take care of the rest.",
    bn: "যে ভাষায় স্বচ্ছন্দ, সেই ভাষায় লিখুন। বাকিটা আমরা দেখব।",
  },
  "Not sure where to start? Try one of these.": {
    en: "Not sure where to start? Try one of these.",
    bn: "কোথা থেকে শুরু করবেন বুঝতে পারছেন না? এগুলির একটি চেষ্টা করুন।",
  },
  "Show writing tips & prompts": { en: "Show writing tips & prompts", bn: "লেখার টিপস ও প্রম্পট দেখুন" },
  "Hide tips": { en: "Hide tips", bn: "টিপস লুকান" },
  "A memory from my youth": { en: "A memory from my youth", bn: "আমার যৌবনের একটি স্মৃতি" },
  "A person who shaped me": { en: "A person who shaped me", bn: "যে আমাকে গড়েছেন" },
  "A day I'll never forget": { en: "A day I'll never forget", bn: "যে দিনটি ভুলব না" },
  "What Hosla means to me": { en: "What Hosla means to me", bn: "আমার কাছে হোসলা কী" },
  "Advice for younger people": { en: "Advice for younger people", bn: "তরুণদের জন্য পরামর্শ" },
  "Something I'm proud of": { en: "Something I'm proud of", bn: "যা নিয়ে আমি গর্বিত" },
  "Write like you're telling a friend. Simple words are best.": {
    en: "Write like you're telling a friend. Simple words are best.",
    bn: "বন্ধুকে বলার মতো করে লিখুন। সহজ শব্দই সেরা।",
  },
  "Don't worry about spelling — you can fix it later with one tap.": {
    en: "Don't worry about spelling — you can fix it later with one tap.",
    bn: "বানান নিয়ে চিন্তা করবেন না — এক ট্যাপে পরে ঠিক করা যায়।",
  },
  "Pick one memory and describe what you saw, heard, or felt.": {
    en: "Pick one memory and describe what you saw, heard, or felt.",
    bn: "একটি স্মৃতি বেছে নিন — কী দেখেছেন, শুনেছেন বা অনুভব করেছেন লিখুন।",
  },
  "You can save and come back anytime. Nothing is lost.": {
    en: "You can save and come back anytime. Nothing is lost.",
    bn: "যেকোনো সময় সংরক্ষণ করে ফিরে আসতে পারেন। কিছুই হারাবে না।",
  },
  "Check my writing": { en: "Check my writing", bn: "আমার লেখা যাচাই করুন" },
  "AI check failed": { en: "AI check failed", bn: "AI যাচাই ব্যর্থ" },
  "Please try again.": { en: "Please try again.", bn: "আবার চেষ্টা করুন।" },
  "Your writing looks great!": { en: "Your writing looks great!", bn: "আপনার লেখা দুর্দান্ত!" },
  "No suggestions.": { en: "No suggestions.", bn: "কোনো পরামর্শ নেই।" },
  "Nothing to check yet": { en: "Nothing to check yet", bn: "যাচাই করার মতো কিছু নেই" },
  "Write something first.": { en: "Write something first.", bn: "প্রথমে কিছু লিখুন।" },
  "{n} suggestion to review": { en: "{n} suggestion to review", bn: "{n}টি পরামর্শ পর্যালোচনার জন্য" },
  "{n} suggestions to review": { en: "{n} suggestions to review", bn: "{n}টি পরামর্শ পর্যালোচনার জন্য" },
  "Your original words stay unless you accept a change. Compare before and after below.": {
    en: "Your original words stay unless you accept a change. Compare before and after below.",
    bn: "আপনি না মানলে আপনার মূল কথাগুলি অপরিবর্তিত থাকবে। নীচে আগে ও পরে তুলনা করুন।",
  },
  "Full compare": { en: "Full compare", bn: "সম্পূর্ণ তুলনা" },
  "Changes only": { en: "Changes only", bn: "শুধু পরিবর্তন" },
  "Reject all": { en: "Reject all", bn: "সব প্রত্যাখ্যান" },
  "Accept all": { en: "Accept all", bn: "সব গ্রহণ" },
  "Use this": { en: "Use this", bn: "এটি নিন" },
  "Keep mine": { en: "Keep mine", bn: "আমারটাই রাখুন" },
  "Add a title and story": { en: "Add a title and story", bn: "শিরোনাম ও লেখা যোগ করুন" },
  "Add a title and blog": { en: "Add a title and blog", bn: "শিরোনাম ও ব্লগ যোগ করুন" },
  "Please fill in both before submitting.": {
    en: "Please fill in both before submitting.",
    bn: "জমা দেওয়ার আগে দুটোই পূরণ করুন।",
  },
  "Story submitted!": { en: "Story submitted!", bn: "লেখা জমা হয়েছে!" },
  "We'll review it shortly and let you know.": {
    en: "We'll review it shortly and let you know.",
    bn: "আমরা শীঘ্রই পর্যালোচনা করে জানাবো।",
  },
  "Submit failed": { en: "Submit failed", bn: "জমা ব্যর্থ" },
  "Couldn't save": { en: "Couldn't save", bn: "সংরক্ষণ করা যায়নি" },
  "Saving…": { en: "Saving…", bn: "সংরক্ষণ হচ্ছে…" },
  "Saved": { en: "Saved", bn: "সংরক্ষিত" },
  "Save failed": { en: "Save failed", bn: "সংরক্ষণ ব্যর্থ" },
  "{n} words": { en: "{n} words", bn: "{n} শব্দ" },
  "Restore unsaved changes?": { en: "Restore unsaved changes?", bn: "অসংরক্ষিত পরিবর্তন ফিরিয়ে আনবেন?" },
  "We found a newer local backup that wasn't uploaded.": {
    en: "We found a newer local backup that wasn't uploaded.",
    bn: "আমরা একটি নতুন স্থানীয় ব্যাকআপ পেয়েছি যা আপলোড হয়নি।",
  },
  "Restore": { en: "Restore", bn: "ফিরিয়ে আনুন" },
  "Discard": { en: "Discard", bn: "বাতিল করুন" },
  "Restored": { en: "Restored", bn: "ফেরানো হয়েছে" },
  "Your unsaved changes are back.": {
    en: "Your unsaved changes are back.",
    bn: "আপনার অসংরক্ষিত পরিবর্তনগুলি ফিরে এসেছে।",
  },
  "Small edits needed": { en: "Small edits needed", bn: "সামান্য সম্পাদনা প্রয়োজন" },
  "You're editing a published blog. Saving will take it off the public site and send it back for admin review before it can be republished.": {
    en: "You're editing a published blog. Saving will take it off the public site and send it back for admin review before it can be republished.",
    bn: "আপনি একটি প্রকাশিত ব্লগ সম্পাদনা করছেন। সংরক্ষণ করলে এটি পাবলিক সাইট থেকে সরিয়ে ফের অ্যাডমিন পর্যালোচনার জন্য পাঠানো হবে।",
  },
  "Published blogs can't be edited": { en: "Published blogs can't be edited", bn: "প্রকাশিত ব্লগ সম্পাদনা করা যাবে না" },
  "Contact an admin if this blog needs changes.": {
    en: "Contact an admin if this blog needs changes.",
    bn: "এই ব্লগে পরিবর্তন দরকার হলে অ্যাডমিনের সাথে যোগাযোগ করুন।",
  },

  // Guest writer page
  "Writing as a guest": { en: "Writing as a guest", bn: "অতিথি হিসেবে লেখা" },
  "Share your blog": { en: "Share your blog", bn: "আপনার ব্লগ শেয়ার করুন" },
  "Write freely — no account needed. After you're done, we'll ask for your name and phone so we can credit you. If you'd like your blogs saved to a profile, you can set a PIN then. It's optional.": {
    en: "Write freely — no account needed. After you're done, we'll ask for your name and phone so we can credit you. If you'd like your blogs saved to a profile, you can set a PIN then. It's optional.",
    bn: "নির্দ্বিধায় লিখুন — অ্যাকাউন্ট লাগবে না। শেষ হলে আমরা আপনার নাম ও ফোন চাইব যাতে আপনাকে ক্রেডিট দিতে পারি। ব্লগগুলি প্রোফাইলে রাখতে চাইলে তখন একটি পিন সেট করতে পারেন। এটি ঐচ্ছিক।",
  },
  "Guest writing — how it works": { en: "Guest writing — how it works", bn: "অতিথি লেখা — কীভাবে কাজ করে" },
  "Your writing is saved locally on this device while you type. Nothing goes to us until you submit.": {
    en: "Your writing is saved locally on this device while you type. Nothing goes to us until you submit.",
    bn: "লেখার সময় আপনার লেখা এই ডিভাইসেই সংরক্ষিত থাকে। জমা না দেওয়া পর্যন্ত কিছু আমাদের কাছে যায় না।",
  },
  "On submit, you'll fill a short form (name + phone) so the admin team knows who wrote this.": {
    en: "On submit, you'll fill a short form (name + phone) so the admin team knows who wrote this.",
    bn: "জমা দেওয়ার সময় একটি ছোট ফর্ম (নাম + ফোন) পূরণ করবেন যাতে অ্যাডমিন টিম জানে কে লিখেছে।",
  },
  "If your phone is already registered, we'll ask for your PIN to link this blog to your profile.": {
    en: "If your phone is already registered, we'll ask for your PIN to link this blog to your profile.",
    bn: "আপনার ফোন আগেই নিবন্ধিত থাকলে, প্রোফাইলের সাথে যুক্ত করতে PIN চাইবো।",
  },
  "Otherwise you can set a PIN (recommended!) or continue as a one-time guest.": {
    en: "Otherwise you can set a PIN (recommended!) or continue as a one-time guest.",
    bn: "নতুবা একটি PIN সেট করুন (সুপারিশকৃত!) বা এককালীন অতিথি হিসেবে চালিয়ে যান।",
  },
  "Continue to submit": { en: "Continue to submit", bn: "জমা দিতে এগিয়ে যান" },
  "Blog content": { en: "Blog content", bn: "ব্লগের বিষয়বস্তু" },
  "Write your blog here…": { en: "Write your blog here…", bn: "এখানে আপনার ব্লগ লিখুন…" },
  "Write your poem here — every line break is preserved…": {
    en: "Write your poem here — every line break is preserved…",
    bn: "এখানে কবিতা লিখুন — প্রতিটি লাইন বিরতি রক্ষিত হবে…",
  },

  // Guest submit dialog
  "Almost there — a few quick details": { en: "Almost there — a few quick details", bn: "প্রায় শেষ — কিছু দ্রুত বিবরণ" },
  "Tell us who you are so we can credit your blog when it's reviewed.": {
    en: "Tell us who you are so we can credit your blog when it's reviewed.",
    bn: "আপনি কে বলুন যাতে পর্যালোচনার সময় আপনার ব্লগে ক্রেডিট দিতে পারি।",
  },
  "Your name": { en: "Your name", bn: "আপনার নাম" },
  "Please enter your name": { en: "Please enter your name", bn: "আপনার নাম লিখুন" },
  "Enter exactly {n} digits — one per box.": {
    en: "Enter exactly {n} digits — one per box.",
    bn: "ঠিক {n}টি সংখ্যা লিখুন — প্রতি বক্সে একটি।",
  },
  "Check phone number": { en: "Check phone number", bn: "ফোন নম্বর যাচাই করুন" },
  "Couldn't verify phone": { en: "Couldn't verify phone", bn: "ফোন যাচাই করা যায়নি" },
  "Wrong PIN": { en: "Wrong PIN", bn: "ভুল PIN" },
  "That PIN doesn't match this phone number.": {
    en: "That PIN doesn't match this phone number.",
    bn: "এই ফোন নম্বরের সাথে PIN মেলেনি।",
  },
  "PIN must be 4 digits": { en: "PIN must be 4 digits", bn: "PIN অবশ্যই ৪ সংখ্যার হতে হবে" },
  "PINs don't match": { en: "PINs don't match", bn: "PIN মিলছে না" },
  "Approval still pending": { en: "Approval still pending", bn: "অনুমোদন এখনও বাকি" },
  "Become a writer?": { en: "Become a writer?", bn: "লেখক হবেন?" },
  "Your PIN": { en: "Your PIN", bn: "আপনার PIN" },
  "Create a 4-digit PIN": { en: "Create a 4-digit PIN", bn: "একটি ৪ সংখ্যার PIN তৈরি করুন" },
  "Confirm PIN": { en: "Confirm PIN", bn: "PIN নিশ্চিত করুন" },
  "Set PIN & submit": { en: "Set PIN & submit", bn: "PIN সেট করে জমা দিন" },
  "Stay as a guest & submit anyway": { en: "Stay as a guest & submit anyway", bn: "অতিথি হিসেবেই জমা দিন" },
  "Verify PIN & submit": { en: "Verify PIN & submit", bn: "PIN যাচাই করে জমা দিন" },
  "Verify PIN & attach blog": { en: "Verify PIN & attach blog", bn: "PIN যাচাই করে ব্লগ যুক্ত করুন" },
  "Forgot your PIN?": { en: "Forgot your PIN?", bn: "PIN ভুলে গেছেন?" },
  "Contact an admin": { en: "Contact an admin", bn: "অ্যাডমিনের সাথে যোগাযোগ" },
  "— we'll reset it for you.": { en: "— we'll reset it for you.", bn: "— আমরা রিসেট করে দেব।" },
  "Submitted as guest": { en: "Submitted as guest", bn: "অতিথি হিসেবে জমা হয়েছে" },
  "Done": { en: "Done", bn: "সম্পন্ন" },
  "Close": { en: "Close", bn: "বন্ধ" },
  "Blog linked to your account": { en: "Blog linked to your account", bn: "ব্লগ আপনার অ্যাকাউন্টের সাথে যুক্ত হয়েছে" },
  "We attached this submission to your existing writer profile. Sign in to see it under My blogs.": {
    en: "We attached this submission to your existing writer profile. Sign in to see it under My blogs.",
    bn: "এই জমাটি আপনার বিদ্যমান লেখক প্রোফাইলে যুক্ত হয়েছে। My blogs–এ দেখতে সাইন ইন করুন।",
  },
  "Sign in to your profile": { en: "Sign in to your profile", bn: "প্রোফাইলে সাইন ইন করুন" },
  "Submission and writer request sent": {
    en: "Submission and writer request sent",
    bn: "জমা ও লেখক অনুরোধ পাঠানো হয়েছে",
  },
  "Your blog has been submitted for review, and your request to become a writer has also gone to the admin team. You won't get profile access yet. The Hosla / Shraddha team will inform you after your writer account is approved.": {
    en: "Your blog has been submitted for review, and your request to become a writer has also gone to the admin team. You won't get profile access yet. The Hosla / Shraddha team will inform you after your writer account is approved.",
    bn: "আপনার ব্লগ পর্যালোচনার জন্য জমা হয়েছে, এবং লেখক হওয়ার আবেদনও অ্যাডমিন টিমের কাছে পাঠানো হয়েছে। এখনই প্রোফাইল অ্যাক্সেস পাবেন না। অনুমোদনের পরে হোসলা / শ্রদ্ধা টিম আপনাকে জানাবে।",
  },
  "Setting a PIN only creates a request. Profile, draft management and writer tools unlock only after admin approval.": {
    en: "Setting a PIN only creates a request. Profile, draft management and writer tools unlock only after admin approval.",
    bn: "PIN সেট করা মানে শুধু একটি অনুরোধ। অ্যাডমিন অনুমোদনের পরই প্রোফাইল, খসড়া পরিচালনা ও লেখক সরঞ্জাম চালু হয়।",
  },
  "Couldn't create account": { en: "Couldn't create account", bn: "অ্যাকাউন্ট তৈরি করা যায়নি" },
  "Couldn't sign you in": { en: "Couldn't sign you in", bn: "সাইন ইন করা যায়নি" },
  "This phone already has a PIN": { en: "This phone already has a PIN", bn: "এই ফোনের জন্য ইতিমধ্যেই PIN আছে" },
  "Enter the PIN set earlier, or contact an admin to delete/reset this phone.": {
    en: "Enter the PIN set earlier, or contact an admin to delete/reset this phone.",
    bn: "আগে সেট করা PIN দিন, অথবা এই ফোন রিসেট/মুছতে অ্যাডমিনের সাথে যোগাযোগ করুন।",
  },
  "Thanks {name}! Your blog is now with the review team. Since this was a guest submission, it won't appear in any personal profile — but we'll credit you as the author if it's published.": {
    en: "Thanks {name}! Your blog is now with the review team. Since this was a guest submission, it won't appear in any personal profile — but we'll credit you as the author if it's published.",
    bn: "ধন্যবাদ {name}! আপনার ব্লগ পর্যালোচনা টিমের কাছে। এটি অতিথি জমা ছিল বলে কোনো ব্যক্তিগত প্রোফাইলে দেখা যাবে না — তবে প্রকাশিত হলে আমরা লেখক হিসেবে আপনার নাম দেব।",
  },

  // Profile page
  "Profile": { en: "Profile", bn: "প্রোফাইল" },
  "Manage your details, PIN and blogs.": {
    en: "Manage your details, PIN and blogs.",
    bn: "আপনার বিবরণ, PIN ও ব্লগ পরিচালনা করুন।",
  },
  "Write blog": { en: "Write blog", bn: "ব্লগ লিখুন" },
  "Drafts": { en: "Drafts", bn: "খসড়া" },
  "Pending": { en: "Pending", bn: "অপেক্ষমাণ" },
  "Published": { en: "Published", bn: "প্রকাশিত" },
  "Log out": { en: "Log out", bn: "লগ আউট" },
  "Signed out": { en: "Signed out", bn: "সাইন আউট হয়েছেন" },
  "Change PIN": { en: "Change PIN", bn: "PIN পরিবর্তন" },
  "Current PIN": { en: "Current PIN", bn: "বর্তমান PIN" },
  "New PIN": { en: "New PIN", bn: "নতুন PIN" },
  "Confirm new PIN": { en: "Confirm new PIN", bn: "নতুন PIN নিশ্চিত করুন" },
  "Update PIN": { en: "Update PIN", bn: "PIN আপডেট" },
  "PINs must be 4 digits": { en: "PINs must be 4 digits", bn: "PIN অবশ্যই ৪ সংখ্যার হতে হবে" },
  "New PINs don't match": { en: "New PINs don't match", bn: "নতুন PIN মিলছে না" },
  "Pick a different new PIN": { en: "Pick a different new PIN", bn: "একটি ভিন্ন নতুন PIN বেছে নিন" },
  "Current PIN is wrong": { en: "Current PIN is wrong", bn: "বর্তমান PIN ভুল" },
  "PIN updated": { en: "PIN updated", bn: "PIN আপডেট হয়েছে" },
  "Use your new PIN next time you log in.": {
    en: "Use your new PIN next time you log in.",
    bn: "পরের বার লগইনে আপনার নতুন PIN ব্যবহার করুন।",
  },
  "Couldn't change PIN": { en: "Couldn't change PIN", bn: "PIN পরিবর্তন করা যায়নি" },
  "Edit": { en: "Edit", bn: "সম্পাদনা" },
  "View": { en: "View", bn: "দেখুন" },
  "Delete": { en: "Delete", bn: "মুছুন" },
  "Deleted": { en: "Deleted", bn: "মুছে ফেলা হয়েছে" },
  "Delete failed": { en: "Delete failed", bn: "মুছে ফেলা ব্যর্থ" },
  "Delete this draft? This cannot be undone.": {
    en: "Delete this draft? This cannot be undone.",
    bn: "এই খসড়াটি মুছবেন? এটি পুনরুদ্ধার করা যাবে না।",
  },
  "Save changes": { en: "Save changes", bn: "পরিবর্তন সংরক্ষণ" },
  "Basic info": { en: "Basic info", bn: "মৌলিক তথ্য" },
  "Add photo": { en: "Add photo", bn: "ছবি যোগ" },
  "Change photo": { en: "Change photo", bn: "ছবি পরিবর্তন" },
  "JPG or PNG, up to 5 MB.": { en: "JPG or PNG, up to 5 MB.", bn: "JPG বা PNG, ৫ MB পর্যন্ত।" },
  "Please pick an image file": { en: "Please pick an image file", bn: "একটি ছবির ফাইল বেছে নিন" },
  "Image too large": { en: "Image too large", bn: "ছবি অতি বড়" },
  "Please pick an image under 5 MB.": { en: "Please pick an image under 5 MB.", bn: "৫ MB এর নিচে ছবি বেছে নিন।" },
  "Upload failed": { en: "Upload failed", bn: "আপলোড ব্যর্থ" },
  "Photo updated": { en: "Photo updated", bn: "ছবি আপডেট হয়েছে" },
  "Profile updated": { en: "Profile updated", bn: "প্রোফাইল আপডেট হয়েছে" },
  "Name can't be empty": { en: "Name can't be empty", bn: "নাম খালি রাখা যাবে না" },
  "Short bio (optional)": { en: "Short bio (optional)", bn: "সংক্ষিপ্ত পরিচিতি (ঐচ্ছিক)" },
  "A line or two about yourself — this appears on your author page.": {
    en: "A line or two about yourself — this appears on your author page.",
    bn: "নিজেকে নিয়ে এক-দুই লাইন — এটি আপনার লেখক পৃষ্ঠায় দেখাবে।",
  },
  "Phone (used to log in)": { en: "Phone (used to log in)", bn: "ফোন (লগইনে ব্যবহৃত)" },
  "Phone can't be changed. Contact an admin if you need to update it.": {
    en: "Phone can't be changed. Contact an admin if you need to update it.",
    bn: "ফোন পরিবর্তন করা যাবে না। প্রয়োজন হলে অ্যাডমিনের সাথে যোগাযোগ করুন।",
  },
  "Account status": { en: "Account status", bn: "অ্যাকাউন্ট স্ট্যাটাস" },
  "My blogs": { en: "My blogs", bn: "আমার ব্লগ" },
  "You haven't written any blogs yet.": {
    en: "You haven't written any blogs yet.",
    bn: "আপনি এখনও কোনো ব্লগ লেখেননি।",
  },
  "Start writing": { en: "Start writing", bn: "লেখা শুরু করুন" },
  "Drafts & edits needed ({n})": { en: "Drafts & edits needed ({n})", bn: "খসড়া ও প্রয়োজনীয় সম্পাদনা ({n})" },
  "Awaiting review ({n})": { en: "Awaiting review ({n})", bn: "পর্যালোচনার অপেক্ষায় ({n})" },
  "Published ({n})": { en: "Published ({n})", bn: "প্রকাশিত ({n})" },
  "Draft": { en: "Draft", bn: "খসড়া" },
  "Under review": { en: "Under review", bn: "পর্যালোচনায়" },
  "Edits needed": { en: "Edits needed", bn: "সম্পাদনা প্রয়োজন" },
  "Approved": { en: "Approved", bn: "অনুমোদিত" },
  "Archived": { en: "Archived", bn: "আর্কাইভ" },
  "approved": { en: "approved", bn: "অনুমোদিত" },
  "pending": { en: "pending", bn: "অপেক্ষমাণ" },
  "rejected": { en: "rejected", bn: "প্রত্যাখ্যাত" },
  "unknown": { en: "unknown", bn: "অজানা" },
  "Updated {d}": { en: "Updated {d}", bn: "আপডেট {d}" },
  "Writer approval pending": { en: "Writer approval pending", bn: "লেখক অনুমোদন অপেক্ষমাণ" },
  "Profile access opens after the admin team approves your writer account.": {
    en: "Profile access opens after the admin team approves your writer account.",
    bn: "অ্যাডমিন টিম আপনার লেখক অ্যাকাউন্ট অনুমোদন করার পরে প্রোফাইল অ্যাক্সেস চালু হবে।",
  },
  "You can write as a guest until the admin team approves your writer account.": {
    en: "You can write as a guest until the admin team approves your writer account.",
    bn: "অ্যাডমিন টিম অনুমোদন না দেওয়া পর্যন্ত আপনি অতিথি হিসেবে লিখতে পারেন।",
  },

  // Author page
  "Author not found": { en: "Author not found", bn: "লেখক পাওয়া যায়নি" },
  "{n} published blog": { en: "{n} published blog", bn: "{n}টি প্রকাশিত ব্লগ" },
  "{n} published blogs": { en: "{n} published blogs", bn: "{n}টি প্রকাশিত ব্লগ" },
  "No published blogs yet.": { en: "No published blogs yet.", bn: "এখনও কোনো প্রকাশিত ব্লগ নেই।" },

  // Auth menu label
  "Language / ভাষা": { en: "Language / ভাষা", bn: "ভাষা / Language" },
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nCtx>({ lang: "en", setLang: () => {}, t: (k) => k });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    const stored = localStorage.getItem(KEY);
    return stored === "bn" ? "bn" : "en";
  });

  useEffect(() => {
    localStorage.setItem(KEY, lang);
    document.documentElement.lang = lang === "bn" ? "bn" : "en";
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const entry = dict[key];
      let out = entry ? entry[lang] || entry.en || key : key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          out = out.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return out;
    },
    [lang],
  );

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  return useContext(Ctx);
}

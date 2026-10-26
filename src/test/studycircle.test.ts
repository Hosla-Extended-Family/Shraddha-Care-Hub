import { describe, it, expect } from "vitest";
import {
  formatSessionDate,
  displayTime,
  getPerformerNames,
  generateWhatsAppMessage,
  PROGRAMS,
  type SessionBundle,
} from "@/lib/studycircle";

describe("StudyCircle Helpers", () => {
  it("formats date in Indian English format with day of week", () => {
    const formatted = formatSessionDate("2026-10-22");
    expect(formatted).toContain("2026");
    expect(formatted).toContain("Oct");
    expect(formatted).toContain("22");
  });

  it("formats 24h time to 12h display", () => {
    expect(displayTime("17:00")).toBe("5:00 PM");
    expect(displayTime(null)).toBe("—");
  });

  it("joins performer names cleanly", () => {
    expect(getPerformerNames([])).toBe("—");
    expect(
      getPerformerNames([
        { performer_name: "John Doe" },
        { performer_name: "Jane Smith" },
      ]),
    ).toBe("John Doe, Jane Smith");
  });

  it("generates formatted Bengali WhatsApp message for scheduled session", () => {
    const bundle: SessionBundle = {
      session: {
        id: "sess-1",
        program_type: "pathochokro",
        scheduled_date: "2026-10-22",
        start_time: "17:00",
        status: "scheduled",
        title_bn: "পাঠচক্র সাপ্তাহিক অধিবেশন",
        note: "সবাই সময়মতো উপস্থিত থাকবেন।",
        meeting_link: "https://meet.google.com/abc-def-ghi",
        is_published: true,
        published_at: null,
        created_at: "",
        updated_at: "",
      },
      roles: [
        {
          id: "r1",
          session_id: "sess-1",
          role_name: "সভাপতি",
          display_order: 1,
          created_at: "",
          performers: [
            {
              id: "rp1",
              role_id: "r1",
              member_id: null,
              performer_name: "মিতা সরকার",
              is_guest: true,
              display_order: 1,
              created_at: "",
            },
          ],
        },
      ],
      parts: [
        {
          id: "p1",
          session_id: "sess-1",
          part_number: 1,
          item_type: "song",
          description: "উদ্বোধনী সঙ্গীত - ভব সাগর",
          reference_link: null,
          display_order: 1,
          created_at: "",
          performers: [
            {
              id: "pp1",
              part_id: "p1",
              member_id: null,
              performer_name: "বৈশাখী ঘোষ",
              is_guest: false,
              display_order: 1,
              created_at: "",
            },
          ],
        },
      ],
    };

    const msg = generateWhatsAppMessage(bundle);
    expect(msg).toContain("শ্রদ্ধা ওয়েলফেয়ার অ্যাসোসিয়েশন");
    expect(msg).toContain("পাঠচক্র");
    expect(msg).toContain("মিতা সরকার");
    expect(msg).toContain("ভব সাগর");
    expect(msg).toContain("https://meet.google.com/abc-def-ghi");
  });

  it("generates formatted cancellation notice for cancelled session", () => {
    const bundle: SessionBundle = {
      session: {
        id: "sess-2",
        program_type: "kathamrita",
        scheduled_date: "2026-10-20",
        start_time: "17:00",
        status: "cancelled",
        title_bn: "রামকৃষ্ণ কথামৃত",
        note: "অনিবার্য কারণে অধিবেশন বাতিল করা হল।",
        meeting_link: null,
        is_published: true,
        published_at: null,
        created_at: "",
        updated_at: "",
      },
      roles: [],
      parts: [],
    };

    const msg = generateWhatsAppMessage(bundle);
    expect(msg).toContain("*বিশেষ বিজ্ঞপ্তি:* আজকের অধিবেশন স্থগিত রাখা হয়েছে");
    expect(msg).toContain("অনিবার্য কারণে অধিবেশন বাতিল করা হল");
  });
});

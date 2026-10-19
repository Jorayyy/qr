/**
 * Visitor-facing reference content for the public entry page.
 *
 * Contact details are from evsu.edu.ph (main campus). Office hours are still
 * PLACEHOLDERS — confirm them with the university before going live.
 */
export const SITE = {
  university: "Eastern Visayas State University",
  shortName: "EVSU",
  address: "Archbishop Lino R. Gonzaga Avenue, Tacloban City, Philippines 6500",
  contactPhone: "+63 53 888 2565",
  contactEmail: "info@evsu.edu.ph",
  officeHours: [
    { days: "Monday – Friday", hours: "7:00 AM – 6:00 PM" },
    { days: "Saturday", hours: "8:00 AM – 12:00 NN" },
    { days: "Sunday & holidays", hours: "Closed" },
  ],
} as const;

export const ENTRY_STEPS = [
  {
    title: "Scan the entry QR",
    body: "Point your phone camera at the QR code posted at the gate to open this page.",
  },
  {
    title: "Go to the Front Desk",
    body: "Present a valid ID to the guard or receptionist so they can register your visit and take your photo.",
  },
  {
    title: "Get your QR pass",
    body: "We email you a personal pass — a scannable QR image plus a pass code. No email? The Front Desk can print a copy.",
  },
  {
    title: "Scan to enter",
    body: "Scan your pass at the entrance, or check in on this page with just your pass code. Passes are valid for 7 days.",
  },
  {
    title: "Scan to exit",
    body: "Scan your pass again on the way out, or check out on this same page, so the system records that you have left.",
  },
] as const;

export const ENTRY_REQUIREMENTS = [
  "A valid ID — SSS, TIN, Passport, or Student ID (we photograph it and you for your pass)",
  "The name of the person or office you are visiting",
  "The purpose of your visit",
  "An email address to receive your QR pass (optional — the Front Desk can print a copy instead)",
] as const;

export const PRIVACY_NOTICE =
  "We record your name, contact details, ID type and number, a photo of you and your ID, and visit details to manage entry and keep the campus safe. We use this information only for visitor management and keep it according to the university's records policy. For questions or requests about your data, please contact the Front Desk.";

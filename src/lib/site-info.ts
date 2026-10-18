/**
 * Visitor-facing reference content for the public entry page.
 *
 * NOTE: the contact details and office hours below are PLACEHOLDERS — replace
 * them with the university's real front-desk information before going live.
 */
export const SITE = {
  university: "Eastern Visayas State University",
  shortName: "EVSU",
  address: "Main Campus, Tacloban City, Leyte",
  contactPhone: "(053) 000-0000",
  contactEmail: "frontdesk@example.edu.ph",
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
    body: "Our staff issues your personal QR pass with a pass code — it can be emailed to you if you give an address.",
  },
  {
    title: "Scan to enter",
    body: "Scan your pass at the entrance, or check yourself in with your pass code and ID number on the check-in page.",
  },
  {
    title: "Scan to exit",
    body: "Scan your pass again on the way out, or use the check-in page, so the system records that you have left.",
  },
] as const;

export const ENTRY_REQUIREMENTS = [
  "A valid ID — SSS, TIN, Passport, or Student ID (we photograph it and you for your pass)",
  "The name of the person or office you are visiting",
  "The purpose of your visit",
  "An email address if you would like your pass emailed (optional)",
] as const;

export const PRIVACY_NOTICE =
  "We record your name, contact details, ID type and number, a photo of you and your ID, and visit details to manage entry and keep the campus safe. This information is used only for visitor management and kept according to the university's records policy. For questions or requests about your data, please contact the Front Desk.";

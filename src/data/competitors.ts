// src/data/competitors.ts
export const competitors = [
  {
    name: "Yuka",
    isUs: false,
    bullets: [
      "Universal score. Same verdict for every user.",
      "No skin-type awareness, no concern-aware ratings.",
    ],
  },
  {
    name: "Think Dirty",
    isUs: false,
    bullets: [
      "Barcode-based, not camera-first.",
      "Hazard ratings are static, not contextual to your skin.",
    ],
  },
  {
    name: "INCI Decoder",
    isUs: false,
    bullets: [
      "Deep ingredient data, zero personalization.",
      "You're left to interpret what any of it means for you.",
    ],
  },
  {
    name: "EWG Skin Deep",
    isUs: false,
    bullets: [
      "Database-first, not scan-first.",
      "Hazard scores don't change with your profile or concerns.",
    ],
  },
  {
    name: "Curae",
    isUs: true,
    bullets: [
      "Camera scan identifies any product in seconds.",
      "Flags what matters for your profile: your allergens, concerns and skin type.",
      "Ingredient rules name a source: an EU annex entry, a CIR review, or an FDA rule.",
      "Unknown products auto-catalog for the next person who scans them.",
    ],
  },
];

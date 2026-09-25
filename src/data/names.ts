// Lightweight name pools for procedural AI golfer generation.
// Not exhaustive — enough variety for 999 golfers without visible repetition
// once combined with the deterministic-but-varied picker in aiGeneration.ts.

export interface NationalityPool {
  code: string;
  label: string;
  firstNames: string[];
  lastNames: string[];
}

export const nationalities: NationalityPool[] = [
  {
    code: "JP",
    label: "Japan",
    firstNames: ["Haruto", "Yuki", "Sora", "Ren", "Aoi", "Mei", "Kaito", "Riko"],
    lastNames: ["Tanaka", "Sato", "Suzuki", "Nakamura", "Kobayashi", "Yamamoto"],
  },
  {
    code: "US",
    label: "United States",
    firstNames: ["Jack", "Ellis", "Marcus", "Owen", "Grace", "Aiden", "Chloe", "Wyatt"],
    lastNames: ["Miller", "Smith", "Boone", "Fitzgerald", "Walsh", "Doyle"],
  },
  {
    code: "ZA",
    label: "South Africa",
    firstNames: ["Naledi", "Kwame", "Thabo", "Amara", "Sipho", "Lindiwe"],
    lastNames: ["Dube", "Asante", "Okonkwo", "Ndlovu", "Mokoena"],
  },
  {
    code: "SE",
    label: "Sweden",
    firstNames: ["Freya", "Sven", "Astrid", "Elias", "Sara", "Linnea"],
    lastNames: ["Lindqvist", "Eriksson", "Lindgren", "Bergman", "Nystrom"],
  },
  {
    code: "IN",
    label: "India",
    firstNames: ["Ravi", "Priya", "Arjun", "Meera", "Vikram", "Anika"],
    lastNames: ["Chandran", "Anand", "Rao", "Mehta", "Iyer"],
  },
  {
    code: "PL",
    label: "Poland",
    firstNames: ["Tomasz", "Zofia", "Jakub", "Karolina", "Marek"],
    lastNames: ["Wozniak", "Kowalski", "Nowak", "Zielinski"],
  },
  {
    code: "IE",
    label: "Ireland",
    firstNames: ["Liam", "Connor", "Aoife", "Cian", "Niamh"],
    lastNames: ["O'Connor", "Doyle", "Byrne", "Walsh", "Murphy"],
  },
  {
    code: "MX",
    label: "Mexico",
    firstNames: ["Diego", "Andres", "Sofia", "Mateo", "Valentina"],
    lastNames: ["Ramirez", "Villalobos", "Torres", "Fernandez"],
  },
  {
    code: "CN",
    label: "China",
    firstNames: ["Mei", "Wei", "Lin", "Xiu", "Jian"],
    lastNames: ["Lin", "Chen", "Wang", "Zhang", "Liu"],
  },
  {
    code: "IT",
    label: "Italy",
    firstNames: ["Luca", "Giulia", "Marco", "Chiara", "Matteo"],
    lastNames: ["Bianchi", "Ricci", "Romano", "Colombo"],
  },
  {
    code: "KR",
    label: "South Korea",
    firstNames: ["Grace", "Min-jun", "Ji-woo", "Seo-yeon"],
    lastNames: ["Kim", "Park", "Lee", "Jung"],
  },
  {
    code: "NG",
    label: "Nigeria",
    firstNames: ["Amara", "Chinedu", "Ngozi", "Emeka"],
    lastNames: ["Okonkwo", "Adeyemi", "Okafor", "Eze"],
  },
  {
    code: "GB",
    label: "United Kingdom",
    firstNames: ["Ash", "Freddie", "Eleanor", "Tom", "Isla"],
    lastNames: ["Nakai", "Garcia", "Fischer", "Kent", "Avery"],
  },
];

export function nationalityByCode(code: string): NationalityPool {
  const found = nationalities.find((n) => n.code === code);
  return found ?? nationalities[0];
}

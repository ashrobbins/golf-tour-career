import type { CourseTemplate, CourseType } from "../types";
import { buildHoles, parPattern70, parPattern71, parPattern72 } from "./holeArchetypes";

// 30 static course templates, bundled with the app — never persisted
// per-player. Course *names* are always generated; only the location
// is allowed to be a real place (see design discussion: no real course
// names, ever). Course type is chosen to fit its location:
// Links -> coastal Scotland/Ireland/Wales/coastal US/South Africa
// Heathland -> England/Netherlands/Belgium heath country
// Parkland -> temperate inland England/Ireland/US Pacific NW/Australia
// Desert -> US Southwest / Australian outback

interface Seed {
  id: string;
  name: string;
  location: string;
  courseType: CourseType;
  parTotal: 70 | 71 | 72;
  baseDifficulty: number; // 1-5
}

const seeds: Seed[] = [
  { id: "dunbrae-links", name: "Dunbrae Links", location: "Scotland", courseType: "links", parTotal: 71, baseDifficulty: 3 },
  { id: "thornfield-manor", name: "Thornfield Manor", location: "England", courseType: "parkland", parTotal: 72, baseDifficulty: 4 },
  { id: "kestrel-heath", name: "Kestrel Heath", location: "England", courseType: "heathland", parTotal: 70, baseDifficulty: 3 },
  { id: "saguaro-ridge", name: "Saguaro Ridge", location: "Arizona, USA", courseType: "desert", parTotal: 72, baseDifficulty: 4 },
  { id: "kilbrannan-point", name: "Kilbrannan Point", location: "Ireland", courseType: "links", parTotal: 71, baseDifficulty: 4 },
  { id: "ashcombe-park", name: "Ashcombe Park", location: "England", courseType: "parkland", parTotal: 71, baseDifficulty: 2 },
  { id: "red-mesa-springs", name: "Red Mesa Springs", location: "Nevada, USA", courseType: "desert", parTotal: 71, baseDifficulty: 3 },
  { id: "birchwood-common", name: "Birchwood Common", location: "England", courseType: "heathland", parTotal: 72, baseDifficulty: 3 },
  { id: "moray-firth-links", name: "Moray Firth Links", location: "Scotland", courseType: "links", parTotal: 72, baseDifficulty: 5 },
  { id: "carrigrue-downs", name: "Carrigrue Downs", location: "Ireland", courseType: "parkland", parTotal: 70, baseDifficulty: 2 },
  { id: "sandpiper-dunes", name: "Sandpiper Dunes", location: "California, USA", courseType: "links", parTotal: 71, baseDifficulty: 3 },
  { id: "palo-verde-canyon", name: "Palo Verde Canyon", location: "New Mexico, USA", courseType: "desert", parTotal: 72, baseDifficulty: 4 },
  { id: "whinstone-heath", name: "Whinstone Heath", location: "England", courseType: "heathland", parTotal: 71, baseDifficulty: 3 },
  { id: "larkspur-hollow", name: "Larkspur Hollow", location: "Victoria, Australia", courseType: "parkland", parTotal: 72, baseDifficulty: 3 },
  { id: "cape-bellara", name: "Cape Bellara", location: "South Africa", courseType: "links", parTotal: 71, baseDifficulty: 4 },
  { id: "ochre-valley", name: "Ochre Valley", location: "Western Australia", courseType: "desert", parTotal: 70, baseDifficulty: 3 },
  { id: "fennmoor-common", name: "Fennmoor Common", location: "Netherlands", courseType: "heathland", parTotal: 70, baseDifficulty: 2 },
  { id: "glenavon-bay", name: "Glenavon Bay", location: "Scotland", courseType: "links", parTotal: 72, baseDifficulty: 4 },
  { id: "stonepine-meadows", name: "Stonepine Meadows", location: "Oregon, USA", courseType: "parkland", parTotal: 71, baseDifficulty: 2 },
  { id: "marram-grass-links", name: "Marram Grass Links", location: "Wales", courseType: "links", parTotal: 70, baseDifficulty: 3 },
  { id: "kaimana-head-links", name: "Kaimana Head Links", location: "New Zealand", courseType: "links", parTotal: 71, baseDifficulty: 4 },
  { id: "fyneglen-point", name: "Fyneglen Point", location: "Scotland", courseType: "links", parTotal: 70, baseDifficulty: 4 },
  { id: "blackthorn-grove", name: "Blackthorn Grove", location: "Ireland", courseType: "parkland", parTotal: 72, baseDifficulty: 3 },
  { id: "bellbird-ridge", name: "Bellbird Ridge", location: "New South Wales, Australia", courseType: "parkland", parTotal: 71, baseDifficulty: 3 },
  { id: "totara-ridge", name: "Totara Ridge", location: "New Zealand", courseType: "parkland", parTotal: 70, baseDifficulty: 2 },
  { id: "gorseacre-common", name: "Gorseacre Common", location: "England", courseType: "heathland", parTotal: 71, baseDifficulty: 2 },
  { id: "ardenwood-heath", name: "Ardenwood Heath", location: "Belgium", courseType: "heathland", parTotal: 70, baseDifficulty: 2 },
  { id: "millbrook-common", name: "Millbrook Common", location: "England", courseType: "heathland", parTotal: 72, baseDifficulty: 3 },
  { id: "coyote-wash-preserve", name: "Coyote Wash Preserve", location: "California, USA", courseType: "desert", parTotal: 71, baseDifficulty: 3 },
  { id: "karoo-flats", name: "Karoo Flats", location: "South Africa", courseType: "desert", parTotal: 72, baseDifficulty: 4 },
];

const patternFor = (par: 70 | 71 | 72) =>
  par === 72 ? parPattern72 : par === 71 ? parPattern71 : parPattern70;

export const courseTemplates: CourseTemplate[] = seeds.map((s) => ({
  id: s.id,
  name: s.name,
  location: s.location,
  courseType: s.courseType,
  parTotal: s.parTotal,
  baseDifficulty: s.baseDifficulty,
  holes: buildHoles(s.id, patternFor(s.parTotal)),
}));

export function getCourseTemplate(id: string): CourseTemplate {
  const course = courseTemplates.find((c) => c.id === id);
  if (!course) throw new Error(`Unknown course template: ${id}`);
  return course;
}

import type { CourseType } from "../types";

// Shared ground/sky palette per course type — used by the Gameplay Decision
// scene so a desert round actually looks and feels different from a lush
// parkland one, not just in the course-preview banner.
export interface CourseTypePalette {
  sky: [string, string];
  fairway: [string, string];
  /** What "missed it" looks like — sand/scrub for desert, not the same green. */
  rough: [string, string];
  roughIsSand: boolean;
}

export const courseTypePalettes: Record<CourseType, CourseTypePalette> = {
  parkland: {
    sky: ["#7ec8e3", "#8fd0e6"],
    fairway: ["#4d9a52", "#58a75d"],
    rough: ["#3a7d40", "#4a8f4f"],
    roughIsSand: false,
  },
  links: {
    sky: ["#9fd4ea", "#aedcef"],
    fairway: ["#7fa85c", "#8fb96c"],
    rough: ["#6b8f4a", "#7a9e57"],
    roughIsSand: false,
  },
  heathland: {
    sky: ["#b8a8d0", "#c4b6d8"],
    fairway: ["#7d8f4a", "#8a9c57"],
    rough: ["#6a5a3a", "#7a6a48"],
    roughIsSand: false,
  },
  desert: {
    // Washed-out, desaturated turf and a hazy warm sky — deliberately less
    // vivid than the others — plus sand instead of green rough, since a
    // missed shot off a desert fairway lands in native terrain, not grass.
    sky: ["#eee4cc", "#f4ecd8"],
    fairway: ["#9ba668", "#a8b378"],
    rough: ["#d4b878", "#dcc48c"],
    roughIsSand: true,
  },
};

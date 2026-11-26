import { addDays, inSeason, type Crop, type Day } from './calendar.ts';
import type { ForecastDay } from './weather.ts';

export const ROTATION_SOURCE = 'https://www.rhs.org.uk/vegetables/crop-rotation';
export const SPACING_SOURCE = 'https://www.rhs.org.uk/education-learning/school-gardening/resources/food-growing/vegetable-crop-planner';
export const COMPANION_SOURCE = 'https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/companion-planting-in-home-gardens';
export const CAUTION_SOURCE = 'https://www.pubs.ext.vt.edu/SPES/spes-620.html';

export const plantFamilies = {
  brassica: 'Ristõielised', carrot: 'Sarikalised', legume: 'Liblikõielised',
  lettuce: 'Korvõielised', tomato: 'Maavitsalised', cucumber: 'Kõrvitsalised',
  onion: 'Laugu perekond', other: 'Muu või teadmata',
} as const;
export type PlantFamily = keyof typeof plantFamilies;
export type PlantPart = 'root' | 'leaf' | 'flower' | 'fruit';
export type GrowingSite = 'outdoor' | 'greenhouse';
export type PlantProfile = {
  family: PlantFamily; part: PlantPart; minAir: number; minSoil: number;
  spacing: number; rowSpacing: number; harvestAfter: number; thinAfter?: number; feedAfter: number;
};
export type CustomCrop = Crop & { profile: PlantProfile };
export type Planting = { id: string; cropId: string; bed: string; day: Day; completed: string[] };
export type Garden = { crops: CustomCrop[]; plantings: Planting[]; greenhouseMin: number };

export const emptyGarden: Garden = { crops: [], plantings: [], greenhouseMin: 5 };

// Editable thresholds for custom crops and indicative defaults for built-in varieties.
const profiles: Record<string, PlantProfile> = {
  redis: { family: 'brassica', part: 'root', minAir: 2, minSoil: 5, spacing: 5, rowSpacing: 15, harvestAfter: 28, thinAfter: 10, feedAfter: 14 },
  porgand: { family: 'carrot', part: 'root', minAir: 2, minSoil: 7, spacing: 5, rowSpacing: 30, harvestAfter: 80, thinAfter: 18, feedAfter: 30 },
  hernes: { family: 'legume', part: 'fruit', minAir: 2, minSoil: 7, spacing: 8, rowSpacing: 45, harvestAfter: 65, thinAfter: 14, feedAfter: 28 },
  salat: { family: 'lettuce', part: 'leaf', minAir: 3, minSoil: 7, spacing: 25, rowSpacing: 30, harvestAfter: 50, thinAfter: 14, feedAfter: 21 },
  tomat: { family: 'tomato', part: 'fruit', minAir: 10, minSoil: 12, spacing: 50, rowSpacing: 75, harvestAfter: 65, feedAfter: 14 },
  kurk: { family: 'cucumber', part: 'fruit', minAir: 12, minSoil: 15, spacing: 45, rowSpacing: 90, harvestAfter: 55, feedAfter: 14 },
  kaalikas: { family: 'brassica', part: 'root', minAir: 3, minSoil: 6, spacing: 25, rowSpacing: 50, harvestAfter: 120, thinAfter: 20, feedAfter: 30 },
  peakapsas: { family: 'brassica', part: 'leaf', minAir: 5, minSoil: 7, spacing: 50, rowSpacing: 60, harvestAfter: 100, feedAfter: 21 },
  sibul: { family: 'onion', part: 'root', minAir: 3, minSoil: 7, spacing: 10, rowSpacing: 30, harvestAfter: 120, feedAfter: 30 },
  tippsibul: { family: 'onion', part: 'root', minAir: 3, minSoil: 7, spacing: 10, rowSpacing: 30, harvestAfter: 100, feedAfter: 30 },
  till: { family: 'carrot', part: 'leaf', minAir: 3, minSoil: 7, spacing: 10, rowSpacing: 30, harvestAfter: 45, thinAfter: 14, feedAfter: 28 },
  spinat: { family: 'other', part: 'leaf', minAir: 2, minSoil: 5, spacing: 10, rowSpacing: 30, harvestAfter: 45, thinAfter: 14, feedAfter: 21 },
  soogipeet: { family: 'other', part: 'root', minAir: 4, minSoil: 8, spacing: 10, rowSpacing: 30, harvestAfter: 90, thinAfter: 21, feedAfter: 30 },
  paprika: { family: 'tomato', part: 'fruit', minAir: 12, minSoil: 15, spacing: 40, rowSpacing: 60, harvestAfter: 70, feedAfter: 14 },
  suhkrumais: { family: 'other', part: 'fruit', minAir: 10, minSoil: 10, spacing: 30, rowSpacing: 75, harvestAfter: 80, feedAfter: 21 },
};

export const plantParts: Record<PlantPart, string> = { root: 'Juured või mugul', leaf: 'Lehed', flower: 'Õied', fruit: 'Viljad või seemned' };

// Built-in variants such as "tomat-kasvuhoone" share the base crop profile.
export function plantProfile(crop: Crop): PlantProfile {
  return crop.profile ?? profiles[crop.careId ?? crop.id] ?? profiles[crop.id.split('-')[0]];
}

export function forecastFit(crop: Crop, day: ForecastDay | undefined, site: GrowingSite, greenhouseMin: number) {
  if (!day || !inSeason(crop, day.day)) return 'outside';
  if (day.low == null || day.soilTemperature == null) return 'unknown';
  const profile = plantProfile(crop);
  const airMin = site === 'greenhouse' ? greenhouseMin : profile.minAir;
  return day.low >= airMin && day.soilTemperature >= profile.minSoil ? 'suitable' : 'cold';
}

export function forecastWindows(crop: Crop, days: ForecastDay[], from: Day, site: GrowingSite, greenhouseMin: number) {
  const windows: { start: Day; end: Day }[] = [];
  for (const weather of days) {
    if (weather.day < from || forecastFit(crop, weather, site, greenhouseMin) !== 'suitable') continue;
    const last = windows.at(-1);
    if (last && addDays(last.end, 1) === weather.day) last.end = weather.day;
    else windows.push({ start: weather.day, end: weather.day });
  }
  return windows;
}

export function sameBed(left: string, right: string): boolean {
  return left.trim().toLocaleLowerCase('et-EE') === right.trim().toLocaleLowerCase('et-EE');
}

export function rotationConflicts(plantings: Planting[], candidate: Pick<Planting, 'id' | 'bed' | 'day'>, crop: Crop, crops: Crop[]) {
  const family = plantProfile(crop).family;
  const year = Number(candidate.day.slice(0, 4));
  return plantings.filter((planting) => {
    if (planting.id === candidate.id || !sameBed(planting.bed, candidate.bed)) return false;
    const yearsApart = Math.abs(year - Number(planting.day.slice(0, 4)));
    if (yearsApart < 1 || yearsApart > 2) return false;
    const previous = crops.find(({ id }) => id === planting.cropId);
    return previous && (family === 'other' ? previous.id === crop.id : plantProfile(previous).family === family);
  });
}

export const taskLabels = {
  water: 'Kontrolli kastmisvajadust', thin: 'Kontrolli harvendamise vajadust',
  feed: 'Kontrolli väetamisvajadust', harvest: 'Kontrolli, kas saak on valmis',
} as const;
export type GardenTaskKind = keyof typeof taskLabels;

export function plantingTasks(planting: Planting, crop: Crop) {
  const profile = plantProfile(crop);
  const checks: [GardenTaskKind, number][] = [
    ['water', 0], ['feed', profile.feedAfter], ['harvest', profile.harvestAfter],
  ];
  if (profile.thinAfter !== undefined) checks.push(['thin', profile.thinAfter]);
  return checks.map(([kind, offset]) => {
    const day = addDays(planting.day, offset);
    const id = `${kind}:${day}`;
    return { id, kind, day, done: planting.completed.includes(id) };
  }).sort((left, right) => left.day.localeCompare(right.day));
}

const suitableNeighbors: Record<string, string> = {
  redis: 'Porgand. Redis valmib varem ja vabastab porgandile kasvuruumi.',
  porgand: 'Redis. Kiire redis kasutab ära ruumi, mida porgand veel ei vaja.',
  hernes: 'Redis. Kiire redis sobib aeglasema herne vahele, kui vahekaugused jäävad piisavaks.',
  salat: 'Tomat või toestatud kurk. Palaval ajal võib kõrgem taim pakkuda salatile kerget varju.',
  tomat: 'Aedsalat või basiilik. Salat jõuab sageli valmida enne tomati täiskasvamist.',
  kurk: 'Aedsalat. Toestatud kurgi kerge vari võib kuumal ajal aidata.',
};
const unsuitableNeighbors: Partial<Record<PlantFamily, string>> = {
  tomato: 'Kartul. Tomatil ja kartulil esineb ühiseid haigusi, sealhulgas lehemädanik.',
  cucumber: 'Kartul. Aiandusjuhend soovitab jätta need eri peenardesse.',
  legume: 'Sibul ja teised laugud. Aiandusjuhend soovitab neid herne kõrval vältida.',
  onion: 'Hernes ja uba. Aiandusjuhend soovitab neid laukudest eraldi kasvatada.',
};

export function neighborAdvice(crop: Crop) {
  const family = plantProfile(crop).family;
  return { suitable: suitableNeighbors[crop.id], unsuitable: unsuitableNeighbors[family] };
}

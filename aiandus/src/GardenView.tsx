import { useState } from 'react';
import * as Crypto from 'expo-crypto';
import { Text, TextInput, View } from 'react-native';
import { formatDay, parseDayInput, validDay, type Crop, type Day, type Method } from './calendar';
import { Button, Choice, Sheet, Source } from './components';
import {
  CAUTION_SOURCE, COMPANION_SOURCE, ROTATION_SOURCE, SPACING_SOURCE, neighborAdvice,
  plantFamilies, plantParts, plantProfile, plantingTasks, rotationConflicts, sameBed, taskLabels,
  type CustomCrop, type Garden, type PlantFamily, type PlantPart, type Planting,
} from './garden';
import { color, s } from './theme';


type SaveGarden = (change: (current: Garden) => Garden) => Promise<void>;

function Field({ label, value, onChange, hint, length, number }: {
  label: string; value: string; onChange: (value: string) => void; hint?: string; length?: number; number?: boolean;
}) {
  return <View style={s.stack}>
    <Text style={s.strong}>{label}</Text>
    <TextInput style={s.field} accessibilityLabel={label} value={value} onChangeText={onChange}
      placeholder={hint} placeholderTextColor={color.muted} maxLength={length} keyboardType={number ? 'numbers-and-punctuation' : 'default'} />
  </View>;
}

function numberIn(value: string, min: number, max: number) {
  if (!/^-?\d+(?:[.,]\d+)?$/.test(value.trim())) return undefined;
  const number = Number(value.trim().replace(',', '.'));
  return number >= min && number <= max ? number : undefined;
}

function seasonDay(value: string) {
  const match = /^(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return undefined;
  const date = `${match[2]}-${match[1]}`;
  return validDay(`2027-${date}`) ? date : undefined;
}

const partOptions = Object.entries(plantParts) as [PlantPart, string][];
const familyOptions = Object.entries(plantFamilies) as [PlantFamily, string][];
const methodOptions: ReadonlyArray<readonly [Method, string]> = [['outdoor', 'Avamaale'], ['indoors', 'Ettekasvatus']];
const cropFields = [
  ['start', 'Tavalise külviakna algus', 'PP-KK'], ['end', 'Tavalise külviakna lõpp', 'PP-KK'],
  ['minAir', 'Õhu miinimumtemperatuur avamaal (°C)', 'Näiteks 3'],
  ['minSoil', 'Mulla keskmine miinimumtemperatuur (°C)', 'Näiteks 7'],
  ['spacing', 'Taimede vahe reas (cm)', 'Näiteks 10'], ['rowSpacing', 'Ridade vahe (cm)', 'Näiteks 25'],
  ['harvestAfter', 'Päevi saagiküpsuse kontrollini', 'Näiteks 60'],
  ['feedAfter', 'Päevi väetamisvajaduse kontrollini', 'Näiteks 20'],
  ['thinAfter', 'Päevi harvendamisvajaduse kontrollini (valikuline)', 'Näiteks 14'],
] as const;

function CropForm({ close, save, crops }: { close: () => void; save: SaveGarden; crops: Crop[] }) {
  const [name, setName] = useState('');
  const [method, setMethod] = useState<Method>('outdoor');
  const [family, setFamily] = useState<PlantFamily>('other');
  const [part, setPart] = useState<PlantPart>('leaf');
  const [fields, setFields] = useState({ start: '', end: '', minAir: '', minSoil: '', spacing: '', rowSpacing: '', harvestAfter: '', feedAfter: '', thinAfter: '' });
  const [error, setError] = useState('');

  async function submit() {
    const start = seasonDay(fields.start);
    const end = seasonDay(fields.end);
    const minAir = numberIn(fields.minAir, -30, 40);
    const minSoil = numberIn(fields.minSoil, -10, 40);
    const spacing = numberIn(fields.spacing, 1, 1000);
    const rowSpacing = numberIn(fields.rowSpacing, 1, 1000);
    const harvestAfter = numberIn(fields.harvestAfter, 1, 365);
    const feedAfter = numberIn(fields.feedAfter, 1, 365);
    const thinAfter = numberIn(fields.thinAfter, 1, 365);
    const cropName = name.trim();
    if (!cropName || crops.some((crop) => sameBed(crop.name, cropName))) {
      setError('Sisesta uus kultuuri nimi.');
      return;
    }
    if (!start || !end || end < start) {
      setError('Sisesta sama kalendriaasta külviakna algus ja lõpp kujul PP-KK.');
      return;
    }
    if (minAir === undefined || minSoil === undefined || spacing === undefined || rowSpacing === undefined ||
      harvestAfter === undefined || !Number.isInteger(harvestAfter) || feedAfter === undefined ||
      !Number.isInteger(feedAfter) || feedAfter > harvestAfter ||
      (fields.thinAfter.trim() && (thinAfter === undefined || !Number.isInteger(thinAfter) || thinAfter > harvestAfter))) {
      setError('Kontrolli temperatuure, istutusvahesid ja täispäevades tööaegu. Hooldustööd peavad jääma saagikontrolli päevaks või sellest varasemaks.');
      return;
    }
    try {
      const crop: CustomCrop = {
        id: Crypto.randomUUID(), name: cropName, icon: '🌱', method, start, end,
        lunar: part === 'root' ? 'waning' : 'waxing', advice: 'Külviaken ja lävendid põhinevad sinu sisestatud andmetel.',
        profile: { family, part, minAir, minSoil, spacing, rowSpacing, harvestAfter, feedAfter, thinAfter },
      };
      await save((current) => ({ ...current, crops: [...current.crops, crop] }));
      close();
    } catch {
      setError('Kultuuri ei õnnestunud salvestada. Proovi uuesti.');
    }
  }

  return <Sheet title="Lisa oma kultuur" close={close}>
    <Field label="Kultuuri nimi" value={name} onChange={setName} length={60} />
    <Text style={s.strong}>Külviviis</Text>
    <Choice value={method} options={methodOptions} onChange={setMethod} />
    <Text style={s.strong}>Taimesugukond külvikorra jaoks</Text>
    <Choice value={family} options={familyOptions} onChange={setFamily} />
    <Text style={s.strong}>Saagiks on</Text>
    <Choice value={part} options={partOptions} onChange={setPart} />
    {cropFields.map(([key, label, hint]) => <Field key={key} label={label} value={fields[key]}
      onChange={(value) => setFields((previous) => ({ ...previous, [key]: value }))} hint={hint} length={6} number={key !== 'start' && key !== 'end'} />)}
    {!!error && <Text style={s.error} accessibilityLiveRegion="polite">{error}</Text>}
    <Button title="Salvesta kultuur" primary onPress={() => { void submit(); }} />
  </Sheet>;
}

function GreenhouseForm({ value, close, save }: { value: number; close: () => void; save: SaveGarden }) {
  const [input, setInput] = useState(String(value));
  const [error, setError] = useState('');

  async function submit() {
    const greenhouseMin = numberIn(input, -25, 25);
    if (greenhouseMin === undefined) {
      setError('Sisesta välisõhu külmapiir vahemikus −25 kuni +25 °C.');
      return;
    }
    try {
      await save((current) => ({ ...current, greenhouseMin }));
      close();
    } catch {
      setError('Külmapiiri ei õnnestunud salvestada. Proovi uuesti.');
    }
  }

  return <Sheet title="Kasvuhoone külmapiir" close={close}>
    <Text style={s.body}>Määra välisõhu madalaim temperatuur, mille juures sinu kasvuhoone hoiab taimi piisavalt soojas.</Text>
    <Field label="Välisõhu külmapiir (°C)" value={input} onChange={setInput} number length={6} />
    {!!error && <Text style={s.error} accessibilityLiveRegion="polite">{error}</Text>}
    <Button title="Salvesta külmapiir" primary onPress={() => { void submit(); }} />
  </Sheet>;
}

function PlantingForm({ crops, garden, initialCrop, today, existing, save, close }: {
  crops: Crop[]; garden: Garden; initialCrop: Crop; today: Day; existing?: Planting; save: SaveGarden; close: () => void;
}) {
  const [cropId, setCropId] = useState(existing?.cropId ?? initialCrop.id);
  const [bed, setBed] = useState(existing?.bed ?? '');
  const [date, setDate] = useState(formatDay(existing?.day ?? today));
  const [error, setError] = useState('');
  const crop = crops.find(({ id }) => id === cropId) ?? initialCrop;
  const day = parseDayInput(date);
  const bedName = bed.trim();
  const profile = plantProfile(crop);
  const beds = garden.plantings.map((item) => item.bed).filter((name, index, names) => names.findIndex((other) => sameBed(name, other)) === index);
  const conflicts = day && bedName ? rotationConflicts(garden.plantings, { id: existing?.id ?? '', bed: bedName, day }, crop, crops) : [];
  const otherBeds = day && conflicts.length ? beds.filter((name) => !sameBed(name, bedName) &&
    !rotationConflicts(garden.plantings, { id: existing?.id ?? '', bed: name, day }, crop, crops).length) : [];

  async function submit() {
    if (!day || !bedName) {
      setError('Sisesta peenra nimi ja kehtiv kuupäev kujul PP-KK-AAAA või PP-KK-AA.');
      return;
    }
    try {
      const planting: Planting = {
        id: existing?.id ?? Crypto.randomUUID(), cropId, bed: bedName, day,
        completed: existing?.cropId === cropId && existing.day === day ? existing.completed : [],
      };
      await save((current) => ({ ...current, plantings: [...current.plantings.filter(({ id }) => id !== planting.id), planting] }));
      close();
    } catch {
      setError('Istutust ei õnnestunud salvestada. Proovi uuesti.');
    }
  }

  return <Sheet title={existing ? 'Muuda istutust' : 'Lisa istutus või otsekülv'} close={close}>
    <Text style={s.strong}>Kultuur</Text>
    <Choice value={cropId} options={crops.map(({ id, name }) => [id, name] as const)} onChange={setCropId} />
    <Text style={s.small}>Taimede vahe reas {profile.spacing} cm · ridade vahe {profile.rowSpacing} cm.</Text>
    <Field label="Peenra nimi" value={bed} onChange={setBed} hint="Näiteks Peenar 1" length={60} />
    {beds.length > 0 && <Choice value={beds.find((name) => sameBed(name, bedName)) ?? ''} options={beds.map((name) => [name, name] as const)} onChange={setBed} />}
    <Field label="Istutuse või otsekülvi kuupäev" value={date} onChange={setDate} hint="PP-KK-AAAA või PP-KK-AA" length={10} />
    {conflicts.length > 0 && <Text style={s.error}>Sama taimesugukond on sellesse peenrasse märgitud lähedasel aastal ({[...new Set(conflicts.map((item) => item.day.slice(0, 4)))].join(', ')}). Vali võimalusel teine peenar.</Text>}
    {otherBeds.length > 0 && <Text style={s.small}>Senise ajaloo põhjal sobivad ka {otherBeds.join(', ')}.</Text>}
    {existing && (existing.cropId !== cropId || existing.day !== day) && <Text style={s.small}>Kultuuri või kuupäeva muutmisel arvutatakse tööd uuesti.</Text>}
    {!!error && <Text style={s.error} accessibilityLiveRegion="polite">{error}</Text>}
    <Button title="Salvesta istutus" primary onPress={() => { void submit(); }} />
  </Sheet>;
}

export function GardenView({ crops, crop, selectCrop, garden, ready, today, save, openGreenhouse, initialDay }: {
  crops: Crop[]; crop: Crop; selectCrop: (crop: Crop) => void; garden: Garden; ready: boolean; today: Day;
  save: SaveGarden; openGreenhouse: () => void; initialDay?: Day;
}) {
  const [addingCrop, setAddingCrop] = useState(false);
  const [editor, setEditor] = useState<{ existing?: Planting; day?: Day } | undefined>(initialDay ? { day: initialDay } : undefined);
  const [active, setActive] = useState<string>();
  const [deleting, setDeleting] = useState<string>();
  const [error, setError] = useState('');
  const profile = plantProfile(crop);
  const neighbors = neighborAdvice(crop);
  const plantings = [...garden.plantings].sort((left, right) => right.day.localeCompare(left.day));

  async function change(changeGarden: (current: Garden) => Garden) {
    try {
      await save(changeGarden);
      setError('');
    } catch {
      setError('Aiaplaani ei õnnestunud salvestada. Proovi uuesti.');
    }
  }

  return <>
    <Text accessibilityRole="header" style={s.heading}>Minu aed</Text>
    <View style={s.card}>
      <Text accessibilityRole="header" style={s.subheading}>Kultuurid</Text>
      <Choice value={crop.id} options={crops.map(({ id, name }) => [id, name] as const)}
        onChange={(id) => { const selected = crops.find((item) => item.id === id); if (selected) selectCrop(selected); }} />
      <Text style={s.strong}>{crop.name} · {plantFamilies[profile.family]}</Text>
      <Text style={s.body}>Taimede vahe reas {profile.spacing} cm · ridade vahe {profile.rowSpacing} cm.</Text>
      <Text style={s.small}>Vahed on orienteeruvad. Arvesta sordi ja seemnepakil toodud juhistega.</Text>
      {neighbors.suitable && <Text style={s.body}>Sobib naabriks · {neighbors.suitable}</Text>}
      {neighbors.unsuitable && <Text style={s.body}>Väldi samas peenras · {neighbors.unsuitable}</Text>}
      {!neighbors.suitable && !neighbors.unsuitable && <Text style={s.small}>Selle kultuuri kohta puuduvad naabertaimede soovitused.</Text>}
      {!crop.profile && <View style={s.wrap}><Source url={SPACING_SOURCE} title="RHS-i istutusvahed" />
        <Source url={COMPANION_SOURCE} title="Naabertaimed" /><Source url={CAUTION_SOURCE} title="Mittesobivad naabrid" />
      </View>}
      <Button title="Lisa oma kultuur" icon="add-outline" disabled={!ready} onPress={() => setAddingCrop(true)} />
    </View>
    <View style={s.card}>
      <Text accessibilityRole="header" style={s.subheading}>Kasvuhoone</Text>
      <Text style={s.body}>Välisõhu külmapiir · {garden.greenhouseMin} °C</Text>
      <Button title="Muuda külmapiiri" disabled={!ready} onPress={openGreenhouse} />
    </View>
    <View style={s.card}>
      <Text accessibilityRole="header" style={s.subheading}>Peenrad ja külvikord</Text>
      <Text style={s.small}>Sama peenra nimega kirjed moodustavad peenra ajaloo. Külvikorra soovitus kontrollib kaht naaberaastat mõlemas suunas.</Text>
      <Source url={ROTATION_SOURCE} title="RHS-i külvikorra juhis" />
      <Button title="Lisa istutus või otsekülv" icon="add-outline" primary disabled={!ready} onPress={() => setEditor({})} />
      {!!error && <Text style={s.error} accessibilityLiveRegion="polite">{error}</Text>}
      {ready && !plantings.length && <Text style={s.small}>Istutusi veel pole.</Text>}
    </View>
    {plantings.map((planting) => {
      const plant = crops.find(({ id }) => id === planting.cropId);
      if (!plant) return null;
      const tasks = plantingTasks(planting, plant);
      const conflicts = rotationConflicts(plantings, planting, plant, crops);
      return <View key={planting.id} style={s.card}>
        <Text style={s.strong}>{planting.bed} · {plant.name}</Text>
        <Text style={s.body}>{planting.day > today ? 'Plaanis' : 'Istutus või otsekülv'} · {formatDay(planting.day)}</Text>
        {conflicts.length > 0 && <Text style={s.small}>Sama taimesugukond samal peenral · {[...new Set(conflicts.map((item) => item.day.slice(0, 4)))].join(', ')}</Text>}
        <View style={s.wrap}>
          <Button title={active === planting.id ? 'Peida hooldustööd' : `Hooldustööd (${tasks.filter(({ done }) => done).length}/${tasks.length})`}
            onPress={() => setActive(active === planting.id ? undefined : planting.id)} />
          <Button title="Muuda" onPress={() => setEditor({ existing: planting })} />
          <Button title="Kustuta" onPress={() => setDeleting(planting.id)} />
        </View>
        {deleting === planting.id && <View style={s.wrap}>
          <Button title="Kinnita kustutamine" primary onPress={() => {
            void change((current) => ({ ...current, plantings: current.plantings.filter(({ id }) => id !== planting.id) }));
          }} />
          <Button title="Loobu" onPress={() => setDeleting(undefined)} />
        </View>}
        {active === planting.id && <>
          <Text style={s.small}>Kuupäevad on orienteeruvad. Lähtu mulla niiskusest, taime arengust ja sordist.</Text>
          {tasks.map((task) => <View key={task.id} style={s.between}>
            <Text style={[s.body, s.grow]}>{formatDay(task.day)} · {taskLabels[task.kind]}{task.done ? ' · tehtud' : ''}</Text>
            <Button title={task.done ? 'Taasta' : 'Märgi tehtuks'} onPress={() => {
              void change((current) => ({
                ...current, plantings: current.plantings.map((item) => item.id === planting.id ? {
                  ...item, completed: item.completed.includes(task.id) ? item.completed.filter((id) => id !== task.id) : [...item.completed, task.id],
                } : item),
              }));
            }} />
          </View>)}
        </>}
      </View>;
    })}
    {editor && <PlantingForm crops={crops} initialCrop={crop} garden={garden} today={editor.day ?? today}
      existing={editor.existing} save={save} close={() => setEditor(undefined)} />}
    {addingCrop && <CropForm crops={crops} save={save} close={() => setAddingCrop(false)} />}
  </>;
}

export { GreenhouseForm };

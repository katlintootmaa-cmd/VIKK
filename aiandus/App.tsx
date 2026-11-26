import { useCallback, useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Crypto from 'expo-crypto';
import { StatusBar } from 'expo-status-bar';
import { AccessibilityInfo, ActivityIndicator, AppState, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { CareView } from './src/CareView';
import { CARE_TRADITION } from './src/care';
import { ForecastWindow, type ForecastSite } from './src/ForecastWindow';
import { GardenView, GreenhouseForm } from './src/GardenView';
import {
  CROPS, LUNAR_PERIOD_NAME, METHOD, PHASE_NAMES, TIME_ZONE, TRADITION, USNO, changeMonth, formatDay, inSeason, localDay,
  calendarSeason, cropChoice, isPlanting, lunarPeriod, monthGrid, moonEvent, nextWindow, recommended, sowingWindow, sowingWindowCoverage, tallinnTime, upcomingLunarRanges, withSowingPeriod, type Crop, type Day, type LunarPeriod,
} from './src/calendar';
import { Button, Choice, EntryEditor, IconButton, PlacePicker, Source, WeatherDay, degrees, weatherIcon, type EditorRequest, type Icon } from './src/components';
import { emptyGarden, plantingTasks, taskLabels, type Garden } from './src/garden';
import type { Entry } from './src/journal';
import { enableReminders, syncReminders } from './src/reminders';
import { read, write } from './src/storage';
import { color, s } from './src/theme';
import { useWeather } from './src/useWeather';
import { DEFAULT_PLACE, WEATHER_SOURCE, weatherLabel, type Place } from './src/weather';

const tabs = [
  { id: 'today', name: 'Täna', icon: 'sunny-outline' },
  { id: 'calendar', name: 'Kalender', icon: 'calendar-outline' },
  { id: 'care', name: 'Hooldus', icon: 'leaf-outline' },
  { id: 'journal', name: 'Päevik', icon: 'book-outline' },
  { id: 'garden', name: 'Aed', icon: 'grid-outline' },
] as const;
type Tab = typeof tabs[number]['id'];
const journalTabs = [{ id: 'done', name: 'Tehtud tööd' }, { id: 'planned', name: 'Plaanid' }] as const;
const filters = [
  ['all', 'Kõik'], ['outdoor', 'Avamaale külv'], ['indoors', 'Ettekasvatus'],
  ['greenhouse-sow', 'Kasvuhoonesse külv'], ['greenhouse-plant', 'Kasvuhoonesse istutamine'],
  ['outdoor-plant', 'Avamaale istutamine'],
] as const;
type CropFilter = typeof filters[number][0];
const matchesFilter = (crop: Crop, filter: CropFilter) => filter === 'all' || crop.method === filter;
const availableFilters = filters.filter(([filter]) => CROPS.some((crop) => matchesFilter(crop, filter)));
const moonGlyph: Record<string, string> = { 'New Moon': '○', 'First Quarter': '◑', 'Full Moon': '●', 'Last Quarter': '◐' };
const weekdayName = new Intl.DateTimeFormat('et-EE', { weekday: 'long', timeZone: 'UTC' });
const fullDay = (day: Day) => `${weekdayName.format(new Date(day))}, ${formatDay(day)}`;
const monthOn = ['jaanuaril', 'veebruaril', 'märtsil', 'aprillil', 'mail', 'juunil', 'juulil', 'augustil', 'septembril', 'oktoobril', 'novembril', 'detsembril'];
type PressableHandle = ComponentRef<typeof Pressable>;

function formatDayOn(day: Day) {
  return `${Number(day.slice(8))}. ${monthOn[Number(day.slice(5, 7)) - 1]}`;
}
const phaseClock = new Intl.DateTimeFormat('et-EE', {
  timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
const sowingTradition = {
  waxing: 'Pärimuse järgi külvatakse maapealse saagiga taimi kasvava kuu ajal.',
  waning: 'Pärimuse järgi külvatakse maa-aluse saagiga taimi kahaneva kuu ajal.',
};
const sowingPeriods = [['default', 'Kultuuri vaikevalik'], ['waxing', 'Kasvav kuu'], ['waning', 'Kahanev kuu']] as const;
type SowingPreference = typeof sowingPeriods[number][0];
const calendarViews = [['calendar', 'Vali kuupäev'], ['phase', 'Vali kuufaas']] as const;
type CalendarView = typeof calendarViews[number][0];
const lunarChoices = [['waxing', 'Kasvav kuu'], ['waning', 'Kahanev kuu']] as const;
const dayCount = (start: Day, end: Day) => Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000) + 1;
const recommendationLabel = (crop: Crop) => isPlanting(crop.method) ? 'Pärimuslik soovitus' : 'Kuufaasi soovitus';

function Disclosure({ title, children }: { title: string; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return <View style={s.stack}>
    <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ expanded }}
      style={s.button} onPress={() => setExpanded(!expanded)}>
      <Text style={[s.buttonText, s.grow]}>{title}</Text>
      <Ionicons accessible={false} name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={color.green} />
    </Pressable>
    {expanded && children}
  </View>;
}

function DayDetails({ day, crop, showWindow = false }: { day: Day; crop: Crop; showWindow?: boolean }) {
  const phase = moonEvent(day);
  const period = lunarPeriod(day);
  const planting = isPlanting(crop.method);
  const activityTime = planting ? 'istutusaeg' : 'külviaeg';
  const isRecommended = recommended(crop, day);
  const window = showWindow ? sowingWindow(crop, day.slice(0, 4)) : undefined;
  return <>
    <Text accessibilityRole="header" style={s.subheading}>{fullDay(day)} · {crop.name}</Text>
    <Text style={s.small}>{METHOD[crop.method]} · {inSeason(crop, day) ? activityTime : `väljaspool ${activityTime}a`}</Text>
    {window && <Text style={s.small}>Ligikaudne {activityTime} {formatDay(window.start)} – {formatDay(window.end)}</Text>}
    {isRecommended && <Text style={s.badge}>{recommendationLabel(crop)}</Text>}
    {!planting && period && <Text style={s.strong}>Kuu kell 12 Eesti aja järgi · {LUNAR_PERIOD_NAME[period]}</Text>}
    {!period && crop.lunar && <Text style={s.small}>Selle päeva kuufaasiandmed puuduvad.</Text>}
    <Disclosure title={isRecommended ? 'Miks see päev sobib?' : 'Kuufaas ja allikad'}>
      {isRecommended && crop.lunar && <Text style={s.body}>{planting
        ? 'See päev jääb istutusaega. Pärimuses seostatakse ümberistutamist kasvava kuuga.'
        : 'Kuu seis kell 12 Eesti aja järgi vastab valitud kuufaasile ja päev jääb külviaega.'}</Text>}
      {planting && period && <Text style={s.small}>Kuu keskpäeval · {LUNAR_PERIOD_NAME[period]}</Text>}
      {phase && <Text style={s.small}>{PHASE_NAMES[phase.phase]} kell {phaseClock.format(new Date(phase.instant))} Eesti aja järgi</Text>}
      <View style={s.wrap}>
        {crop.source && <Source title={planting ? 'Istutusaja allikas' : 'Külviaja allikas'} url={crop.source} />}
        <Source title="Kuufaaside allikas (USNO)" url={USNO} />
        {planting && crop.lunar && <Source title="Pärimusreegli allikas" url={CARE_TRADITION} />}
      </View>
    </Disclosure>
    {!planting && <Disclosure title="Külvipärimus">
      <Text style={s.body}>{sowingTradition.waxing} {sowingTradition.waning}</Text>
      <Text style={s.small}>Kuufaasi mõju külvi õnnestumisele või saagile pole usaldusväärselt tõendatud.</Text>
      <View style={s.wrap}>
        <Source title="Külvipärimuse allikas" url={TRADITION} />
        <Source title="Teaduskirjanduse ülevaade" url="https://doi.org/10.3390/agronomy10070955" />
      </View>
    </Disclosure>}
    <Disclosure title={planting ? 'Istutusnõuanded' : 'Külvinõuanded'}>
      <Text style={s.body}>{crop.advice}</Text>
      <Text style={s.small}>Töö aega mõjutavad ka sort, mulla temperatuur ja öökülmaoht.</Text>
    </Disclosure>
  </>;
}

function focusControl(control: PressableHandle | null) {
  if (!control) return;
  if (Platform.OS === 'web') control.focus();
  else AccessibilityInfo.sendAccessibilityEvent(control, 'focus');
}

const forecastWeekday = new Intl.DateTimeFormat('et-EE', { weekday: 'narrow', timeZone: 'UTC' });
const calendarMonth = new Intl.DateTimeFormat('et-EE', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const forecastTime = new Intl.DateTimeFormat('et-EE', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit' });

function WeatherCard({ place, currentDay, selectDay, choosePlace, weather }: {
  place: Place; currentDay: Day; selectDay: (day: Day) => void; choosePlace: () => void; weather: ReturnType<typeof useWeather>;
}) {
  const { forecast, error, loading, refresh } = weather;
  const weatherToday = forecast?.days.find(({ day }) => day === currentDay);
  const days = forecast?.days.filter(({ day }) => day >= currentDay) ?? [];
  const loadedAt = forecast && new Date(forecast.loadedAt);
  const loadedTime = loadedAt && `${formatDay(localDay(loadedAt))} ${forecastTime.format(loadedAt)}`;
  return <View style={s.hero}>
    <View pointerEvents="none" style={s.orbit} /><View pointerEvents="none" style={s.orbitInner} />
    <View style={s.between}>
      <Pressable style={[s.row, { minHeight: 44 }]} onPress={choosePlace} accessibilityRole="button" accessibilityLabel={`Muuda ilma asukohta, ${place.name}`}>
        <Ionicons name="location-outline" size={18} color={color.leaf} />
        <Text style={[s.strong, s.white]}>{place.name}</Text>
        <Ionicons name="chevron-down" size={15} color={color.leaf} />
      </Pressable>
      <IconButton label="Uuenda ilmaprognoosi" icon="refresh-outline" light onPress={refresh} />
    </View>
    {weatherToday ? <View style={s.between}>
      <View style={[s.grow, s.stack]}>
        <Text style={s.temperature}>{degrees(error ? weatherToday.high : forecast?.temperature ?? weatherToday.high)}</Text>
        <Text style={[s.small, s.onGreen]}>{error ? 'Prognoositud maksimum' : weatherLabel(forecast?.code ?? weatherToday.code)}</Text>
      </View>
      <Ionicons name={weatherIcon(forecast?.code ?? weatherToday.code)} size={58} color={color.leaf} />
    </View> : <View style={s.stack}>
      <Text style={[s.subheading, s.white]}>Kohalik ilm</Text>
      <Text accessibilityLiveRegion="polite" style={[s.small, s.onGreen]}>
        {loading ? 'Laadin ilmaprognoosi…' : 'Tänase päeva prognoos pole saadaval.'}
      </Text>
    </View>}
    {days.length > 0 && <View style={s.forecastStrip}>{days.map(({ day, high, code }) => (
      <Pressable key={day} accessibilityRole="button" accessibilityLabel={`${formatDay(day)}, ${weatherLabel(code)}, ${degrees(high)}`}
        onPress={() => selectDay(day)} style={[s.forecastCell, day === currentDay && s.forecastSelected]}>
        <Text style={[s.small, s.onGreen]}>{forecastWeekday.format(new Date(day))}</Text>
        <Ionicons name={weatherIcon(code)} size={17} color={color.white} />
        <Text style={[s.small, s.white]}>{degrees(high)}</Text>
      </Pressable>
    ))}</View>}
    {!!loadedTime && days.length > 0 && <Text style={[s.small, s.onGreen]}>{error ? 'Viimati laaditud prognoos' : 'Laaditud'} · {loadedTime}</Text>}
  </View>;
}

function CropRow({ crop, detail, onPress, disabled }: { crop: Crop; detail: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable onPress={onPress} accessibilityRole="button" disabled={disabled}
    style={({ pressed }) => [s.item, (pressed || disabled) && s.disabled]}>
    <View style={s.thumb}><Text style={s.emoji}>{crop.icon}</Text></View>
    <View style={s.grow}>
      <Text style={s.strong}>{crop.name}</Text>
      <Text style={s.small}>{detail}</Text>
    </View>
    <Ionicons name="chevron-forward-outline" size={18} color={color.muted} />
  </Pressable>;
}

function Month({ day, crop, entries, select }: {
  day: Day; crop: Crop; entries: Entry[]; select: (day: Day) => void;
}) {
  return <View style={s.card}>
    <View style={s.between}>
      <IconButton label="Eelmine kuu" icon="chevron-back" onPress={() => select(changeMonth(day, -1))} />
      <Text accessibilityRole="header" style={[s.strong, { textAlign: 'center', flexShrink: 1 }]}>{calendarMonth.format(new Date(day))}</Text>
      <IconButton label="Järgmine kuu" icon="chevron-forward" onPress={() => select(changeMonth(day, 1))} />
    </View>
    <View style={s.grid}>
      {['E', 'T', 'K', 'N', 'R', 'L', 'P'].map((label) => <Text key={label} style={[s.small, { width: '14.285%', textAlign: 'center', marginBottom: 4 }]}>{label}</Text>)}
      {monthGrid(day).map((date) => {
        const otherMonth = date.slice(0, 7) !== day.slice(0, 7);
        const event = moonEvent(date);
        const suggested = recommended(crop, date);
        const activities = entries.filter((entry) => entry.day <= date && (entry.end ?? entry.day) >= date);
        const mark = [event && moonGlyph[event.phase], suggested && '✦', activities.length > 0 && '•'].filter(Boolean).join(' ');
        const label = [fullDay(date), event && PHASE_NAMES[event.phase], inSeason(crop, date) && (isPlanting(crop.method) ? 'istutusaeg' : 'külviaeg'), suggested && recommendationLabel(crop),
          activities.length > 0 && `Päevikukirjeid ${activities.length}`].filter(Boolean).join(', ');
        return <Pressable key={date} accessibilityRole="button" accessibilityLabel={label}
          accessibilityState={{ selected: date === day }} onPress={() => select(date)}
          style={[s.dateCell, otherMonth && s.dateOther, suggested && s.dateRecommended, date === day && s.dateSelected]}>
          <Text style={[s.dayNumber, date === day && s.white]}>{Number(date.slice(8))}</Text>
          {!!mark && <Text style={[s.dayMark, date === day && s.white]}>{mark}</Text>}
        </Pressable>;
      })}
    </View>
    <View style={s.wrap}>
      <Text style={s.badge}>✦ Kuu järgi soovitatud</Text>
      <Text style={s.small}>○ ◑ ● ◐ Kuufaas · • Päevikukirje</Text>
    </View>
  </View>;
}

function AppContent() {
  const [today, setToday] = useState(localDay);
  const [tab, setTab] = useState<Tab>('today');
  const [journalKind, setJournalKind] = useState<Entry['kind']>('done');
  const [day, setDay] = useState(today);
  const [calendarView, setCalendarView] = useState<CalendarView>('calendar');
  const [phaseOverride, setPhaseOverride] = useState<{ cropId: string; period: LunarPeriod }>();
  const [detailDay, setDetailDay] = useState<Day>();
  const detailsTrigger = useRef<PressableHandle>(null);
  const nextDayTrigger = useRef<PressableHandle>(null);
  const closeDetails = useRef<PressableHandle>(null);
  const [selectedCrop, setCrop] = useState(CROPS[0]);
  const [sowingPreference, setSowingPreference] = useState<SowingPreference>('default');
  const crop = withSowingPreference(selectedCrop);
  const [method, setMethod] = useState<CropFilter>('all');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [ready, setReady] = useState(false);
  const [garden, setGarden] = useState(emptyGarden);
  const [gardenReady, setGardenReady] = useState(false);
  const [greenhouseEditor, setGreenhouseEditor] = useState(false);
  const [plantingDay, setPlantingDay] = useState<Day>();
  const [siteOverride, setSiteOverride] = useState<{ cropId: string; site: ForecastSite }>();
  const [notice, setNotice] = useState('');
  const [place, setPlace] = useState<Place>();
  const [choosingPlace, setChoosingPlace] = useState(false);
  const [editor, setEditor] = useState<EditorRequest>();
  const [deleting, setDeleting] = useState<string>();
  const saving = useRef(false);
  const latestEntries = useRef<Entry[]>([]);
  const latestGarden = useRef(emptyGarden);
  const savingGarden = useRef(false);
  const reminderQueue = useRef<Promise<void>>(Promise.resolve());
  const weather = useWeather(place);
  const crops = [...CROPS, ...garden.crops];

  const sync = useCallback(() => {
    const next = reminderQueue.current.catch(() => undefined)
      .then(() => syncReminders(latestEntries.current, [...CROPS, ...latestGarden.current.crops]));
    reminderQueue.current = next;
    return next;
  }, []);

  useEffect(() => {
    let active = true;
    void read<Entry[]>('journal').then((journal) => {
      if (!active) return;
      latestEntries.current = journal ?? [];
      setEntries(latestEntries.current);
      setReady(true);
    }).catch(() => { if (active) setNotice('Külvipäevikut ei õnnestunud avada. Proovi äpp uuesti käivitada.'); });
    void read<Garden>('garden').then((saved) => {
      if (!active) return;
      latestGarden.current = saved ?? emptyGarden;
      setGarden(latestGarden.current);
      setGardenReady(true);
    }).catch(() => { if (active) setNotice('Aiaplaani ei õnnestunud avada. Proovi äpp uuesti käivitada.'); });
    void read<Place>('place').catch(() => null).then((saved) => { if (active) setPlace(saved ?? DEFAULT_PLACE); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (ready && gardenReady) void sync().catch(() => undefined);
    const update = () => setToday(localDay());
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      update();
      if (ready && gardenReady) void sync().catch(() => undefined);
    });
    const timer = setInterval(update, 60_000);
    return () => { subscription.remove(); clearInterval(timer); };
  }, [ready, gardenReady, sync]);

  function openDay(date: Day, selectedCrop?: Crop) {
    if (selectedCrop) {
      setCrop(selectedCrop);
      if (!matchesFilter(selectedCrop, method)) setMethod('all');
    }
    setCalendarView('calendar');
    setDay(date);
    setTab('calendar');
  }

  function withSowingPreference(item: Crop): Crop {
    return withSowingPeriod(item, sowingPreference === 'default' ? undefined : sowingPreference);
  }

  function selectCalendarFilter(filter: CropFilter) {
    setMethod(filter);
    if (matchesFilter(crop, filter)) return;
    const first = crops.find((item) => matchesFilter(item, filter));
    if (first) setCrop(first);
  }

  function selectJournalKind(kind: Entry['kind']) {
    setDeleting(undefined);
    setJournalKind(kind);
  }

  function openJournal(kind: Entry['kind'] = 'done') {
    selectJournalKind(kind);
    setTab('journal');
  }

  function openPlanting(date: Day, plant: Crop) {
    setCrop(plant);
    setPlantingDay(date);
    setTab('garden');
  }

  async function persistJournal(next: Entry[]) {
    await write('journal', next);
    latestEntries.current = next;
    setEntries(next);
  }

  async function saveGarden(change: (current: Garden) => Garden) {
    if (!gardenReady || savingGarden.current) throw new Error('Garden is busy');
    savingGarden.current = true;
    try {
      const next = change(latestGarden.current);
      await write('garden', next);
      latestGarden.current = next;
      setGarden(next);
    } finally {
      savingGarden.current = false;
    }
  }

  async function saveEntry(value: Omit<Entry, 'id'>, existingId?: string) {
    if (!ready || saving.current) throw new Error('Journal is busy');
    saving.current = true;
    try {
      let message = value.kind === 'done' ? 'Külv salvestatud.' : 'Külviplaan salvestatud.';
      if (value.reminder) {
        if (tallinnTime(value.day, 9).getTime() <= Date.now()) {
          value = { ...value, reminder: false };
          message = 'Plaan salvestatud. Meeldetuletuse kellaaeg on möödunud.';
        } else {
          const allowed = await enableReminders().catch(() => false);
          if (!allowed) {
            value = { ...value, reminder: false };
            message = 'Plaan salvestatud. Teavitus pole aktiivne.';
          }
        }
      }
      const entry: Entry = { ...value, id: existingId ?? Crypto.randomUUID() };
      await persistJournal([...latestEntries.current.filter(({ id }) => id !== entry.id), entry]);
      await sync().catch(() => { message = 'Kirje salvestatud. Meeldetuletuste uuendamine ebaõnnestus.'; });
      setNotice(message);
      setEditor(undefined);
      if (editor?.fromRecommendation) {
        openDay(entry.day, crops.find(({ id }) => id === entry.cropId));
      } else {
        openJournal(entry.kind);
      }
    } finally {
      saving.current = false;
    }
  }

  async function deleteEntry(id: string) {
    if (saving.current) return;
    saving.current = true;
    try {
      await persistJournal(latestEntries.current.filter((entry) => entry.id !== id));
      setDeleting(undefined);
      let message = 'Kirje kustutatud.';
      await sync().catch(() => { message = 'Kirje kustutatud. Meeldetuletust ei õnnestunud tühistada.'; });
      setNotice(message);
    } catch {
      setNotice('Kirje kustutamine ebaõnnestus. Proovi uuesti.');
    } finally {
      saving.current = false;
    }
  }

  const filtered = crops.filter((item) => matchesFilter(item, method));
  const activeCrops = filtered.filter((item) => inSeason(item, today));
  const cropsForDay = filtered.filter((item) => inSeason(item, day));
  const upcoming = filtered.map((item) => ({ crop: item, start: nextWindow(item, today).start }))
    .sort((a, b) => a.start.localeCompare(b.start));
  const selectedWeather = weather.forecast?.days.find((item) => item.day === day && day >= today);
  const calendarYear = day.slice(0, 4);
  const season = tab === 'calendar' ? calendarSeason(crop, calendarYear, today) : undefined;
  const coverage = season && crop.lunar ? sowingWindowCoverage(crop, calendarYear) : undefined;
  const planting = isPlanting(crop.method);
  const seasonLabel = planting ? 'Istutusaeg' : 'Külviaeg';
  const dayLabel = planting ? 'istutuspäev' : 'külvipäev';
  const phasePeriod: LunarPeriod = phaseOverride?.cropId === crop.id ? phaseOverride.period : crop.lunar ?? 'waxing';
  const phaseRanges = tab === 'calendar' && calendarView === 'phase' ? upcomingLunarRanges(crop, phasePeriod, today) : undefined;
  const defaultSite: ForecastSite = crop.method === 'indoors' ? 'indoors'
    : crop.method === 'greenhouse-sow' || crop.method === 'greenhouse-plant' ? 'greenhouse' : 'outdoor';
  const forecastSite = siteOverride?.cropId === crop.id ? siteOverride.site : defaultSite;
  const dayEntries = entries.filter((entry) => entry.day <= day && (entry.end ?? entry.day) >= day);
  const dayTasks = garden.plantings.flatMap((planting) => {
    const plant = crops.find(({ id }) => id === planting.cropId);
    return plant ? plantingTasks(planting, plant).filter((task) => task.day === day)
      .map((task) => ({ ...task, key: `${planting.id}:${task.id}`, name: plant.name, bed: planting.bed })) : [];
  });
  const journalEntries = entries.filter((entry) => entry.kind === journalKind)
    .sort((a, b) => journalKind === 'planned' ? a.day.localeCompare(b.day) : b.day.localeCompare(a.day));

  function dismissDayDetails() {
    setDetailDay(undefined);
    if (Platform.OS !== 'ios') requestAnimationFrame(() => focusControl(detailsTrigger.current));
  }

  return <SafeAreaView style={s.safe}>
    <View style={s.shell}>
      <View style={s.header}>
        <View style={s.row}>
          <View style={s.logo}><Ionicons name="leaf-outline" size={20} color={color.leaf} /></View>
          <Text accessibilityRole="header" style={s.wordmark}>Kuukülv</Text>
        </View>
        <Text style={[s.small, { textAlign: 'right', flexShrink: 1 }]}>{formatDay(today)}</Text>
      </View>
      <ScrollView key={tab === 'journal' ? journalKind : tab} contentContainerStyle={s.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {!!notice && <View style={[s.card, s.between]}>
          <Text accessibilityLiveRegion="polite" style={[s.body, s.grow]}>{notice}</Text>
          <IconButton label="Sulge teade" icon="close" onPress={() => setNotice('')} />
        </View>}
        {tab === 'today' && <>
          <Text accessibilityRole="header" style={s.heading}>{fullDay(today)}</Text>
          {place ? <WeatherCard place={place} currentDay={today} selectDay={openDay} choosePlace={() => setChoosingPlace(true)} weather={weather} /> : <ActivityIndicator color={color.green} />}
          <View style={s.section}>
            <Text accessibilityRole="header" style={s.subheading}>Mida täna külvata või istutada?</Text>
            <Choice value={method} options={availableFilters} onChange={selectCalendarFilter} />
            {activeCrops.length ? <View style={s.card}>{activeCrops.map((item) => <CropRow key={item.id} crop={item}
              detail={`${METHOD[item.method]}${recommended(withSowingPreference(item), today) ? ' · kuu järgi soovitatud' : ''}`} onPress={() => openDay(today, item)} />)}</View>
              : <Text style={s.small}>Täna ei ole valitud tööde aeg.</Text>}
            {activeCrops.length === 0 && <>
              <Text accessibilityRole="header" style={s.subheading}>Järgmised külvi- ja istutustööd</Text>
              <View style={s.card}>{upcoming.slice(0, 3).map(({ crop: item, start }) => <CropRow key={item.id} crop={item}
                detail={`${formatDay(start)} · ${METHOD[item.method]}`} onPress={() => openDay(start, item)} />)}</View>
            </>}
          </View>
          <Source url={WEATHER_SOURCE} title="Ilmaandmed: Open-Meteo" />
        </>}
        {tab === 'calendar' && season && <>
          <View style={s.between}>
            <Text accessibilityRole="header" style={[s.heading, s.grow]}>Külvikalender</Text>
            <Button title="Täna" onPress={() => setDay(today)} />
          </View>
          <Choice value={method} options={availableFilters} onChange={selectCalendarFilter} />
          <Choice value={crop.id} options={filtered.map(cropChoice)} onChange={(id) => {
            setCrop(filtered.find((item) => item.id === id) ?? selectedCrop);
          }} />
          <View style={s.card}>
            <Text accessibilityRole="header" style={s.subheading}>{crop.name} · {METHOD[crop.method]}</Text>
            {!planting && crop.lunar && <>
              <Text style={s.strong}>Külvi kuufaas · {LUNAR_PERIOD_NAME[crop.lunar]}</Text>
              <Disclosure title="Muuda külvi kuufaasi">
                <Choice value={sowingPreference} options={sowingPeriods} onChange={setSowingPreference} />
                <Text style={s.small}>Valik rakendub kõigile külvidele ja ettekasvatusele äpi sellel avamiskorral.</Text>
              </Disclosure>
            </>}
            <Text style={s.body}>Ligikaudne {seasonLabel.toLowerCase()} {formatDay(season.window.start)} – {formatDay(season.window.end)}</Text>
            <Text accessibilityLiveRegion="polite" style={s.strong}>{season.status === 'upcoming'
              ? `${seasonLabel} algab ${formatDayOn(season.window.start)}`
              : season.status === 'active'
                ? `${seasonLabel} kestab ${formatDayOn(season.window.end)}`
                : `${calendarYear === today.slice(0, 4) ? 'Selle aasta' : `${calendarYear}. aasta`} ${seasonLabel.toLowerCase()} on möödas`}</Text>
            {crop.source && <Source title={planting ? 'Istutusaja allikas' : 'Külviaja allikas'} url={crop.source} />}
            {season.suggestion.status === 'found' && <>
              <Text style={s.strong}>{season.suggestion.earlierDataMissing
                ? 'Esimene teadaolev' : 'Järgmine'} {planting ? 'pärimuslik istutuspäev' : 'külvipäev kuufaasi järgi'} · {formatDay(season.suggestion.day)}</Text>
              <Pressable ref={nextDayTrigger} accessibilityRole="button" style={s.button} onPress={() => {
                detailsTrigger.current = nextDayTrigger.current;
                setDetailDay(season.days[0]);
              }}>
                <Text style={s.buttonText}>Vaata päeva</Text>
              </Pressable>
            </>}
            {season.suggestion.status === 'missing-data' && <Text style={s.small}>{coverage?.status === 'missing'
              ? `Selle ${seasonLabel.toLowerCase()}a kohta puuduvad kuufaasiandmed.`
              : `Järelejäänud ${dayLabel}ade kohta on kuufaasiandmed puudulikud.`}</Text>}
            {season.suggestion.status === 'no-match' && <Text style={s.small}>{planting
              ? 'Järelejäänud istutuspäevade seas pärimuslikku soovitust ei ole.'
              : 'Järelejäänud külvipäevadel ei esine kell 12 valitud kuufaasi.'}</Text>}
            {season.suggestion.status === 'no-rule' && <Text style={s.small}>Selle kultuuri ja tööviisi kohta pärimuslikku soovitust ei ole.</Text>}
            {season.status === 'ended' && <Button
              title={`Vaata ${season.followingWindow.start.slice(0, 4)}. aasta ${seasonLabel.toLowerCase()}a`}
              onPress={() => setDay(season.followingWindow.start)}
            />}
            {coverage?.status === 'missing' && season.status === 'ended' && <Text style={s.small}>Selle {seasonLabel.toLowerCase()}a kohta puuduvad kuufaasiandmed.</Text>}
            {coverage?.status === 'partial' && <Disclosure key={`${crop.id}-${calendarYear}`} title="Kuufaasiandmed katavad osa perioodist">
              <Text style={s.small}>Soovitusi saab arvutada neil päevadel: {coverage.coveredRanges.map(({ start, end }) =>
                start === end ? formatDay(start) : `${formatDay(start)} – ${formatDay(end)}`).join(', ')}.</Text>
            </Disclosure>}
          </View>
          <Choice value={calendarView} options={calendarViews} onChange={setCalendarView} />
          {phaseRanges ? <View style={s.card}>
            <Text accessibilityRole="header" style={s.subheading}>Sobivad ajad kuufaasi järgi</Text>
            <Choice value={phasePeriod} options={lunarChoices} onChange={(period) => setPhaseOverride({ cropId: crop.id, period })} />
            <Text style={s.small}>{crop.name} · {METHOD[crop.method]}. Kolm järgmist vahemikku alates tänasest, mil kell 12 Eesti aja järgi on {LUNAR_PERIOD_NAME[phasePeriod]} ja päev jääb {seasonLabel.toLowerCase()}a.</Text>
            {crop.lunar && crop.lunar !== phasePeriod && <Text style={s.small}>Selle kultuuri vaikevalik on {LUNAR_PERIOD_NAME[crop.lunar]}.</Text>}
            {phaseRanges.ranges.map(({ start, end }) => <View key={start} style={s.item}>
              <View style={s.grow}>
                <Text style={s.strong}>{start === end ? formatDay(start) : `${formatDay(start)} – ${formatDay(end)}`}</Text>
                <Text style={s.small}>{dayCount(start, end) === 1 ? '1 päev' : `${dayCount(start, end)} päeva`}</Text>
              </View>
              <View style={s.wrap}>
                <Button title="Vaata kalendris" subtle onPress={() => { setDay(start); setCalendarView('calendar'); }} />
                <Button title="Planeeri" icon="add-outline" disabled={!ready}
                  onPress={() => setEditor({ kind: 'planned', cropId: crop.id, day: start, end: end === start ? undefined : end })} />
              </View>
            </View>)}
            {phaseRanges.ranges.length < 3 && <Text style={s.small}>{phaseRanges.missingData
              ? `Kuufaasiandmed on äpis 2031. aasta lõpuni, seega ${phaseRanges.ranges.length ? 'rohkem' : 'sobivaid'} vahemikke ei saa arvutada.`
              : `Järgmise kolme aasta jooksul ${phaseRanges.ranges.length ? 'rohkem sobivaid vahemikke' : 'sobivaid vahemikke'} ei leitud.`}</Text>}
          </View> : <Month day={day} crop={crop} entries={entries} select={setDay} />}
          <View style={s.card}>
            <DayDetails key={`${crop.id}-${day}`} day={day} crop={crop} />
            <Button title="Hooldus sellel päeval" icon="leaf-outline" onPress={() => setTab('care')} />
          </View>
          <View style={s.card}>
            <Text accessibilityRole="header" style={s.subheading}>Ilm{place ? ` · ${place.name}` : ''}</Text>
            {selectedWeather ? <WeatherDay weather={selectedWeather} /> : <Text style={s.small}>{weather.loading ? 'Laadin prognoosi…' : 'Selle päeva prognoos pole saadaval.'}</Text>}
            {selectedWeather && weather.error && <Text style={s.small}>Viimati laaditud prognoos</Text>}
          </View>
          <ForecastWindow crop={crop} day={day} today={today} forecast={weather.forecast} site={forecastSite}
            selectSite={(site) => setSiteOverride({ cropId: crop.id, site })} greenhouseMin={garden.greenhouseMin} stale={weather.error}
            loading={weather.loading} ready={ready && gardenReady} openGreenhouse={() => setGreenhouseEditor(true)}
            plan={(start, end) => setEditor({ kind: 'planned', cropId: crop.id, day: start, end: end === start ? undefined : end })} />
          <View style={s.wrap}>
            <Button title={planting ? 'Lisa istutusplaan' : 'Lisa külviplaan'} icon="add-outline" primary disabled={!ready} onPress={() => setEditor({ kind: 'planned', cropId: crop.id, day })} />
            <Button title={planting ? 'Märgi istutatuks' : 'Märgi külvatuks'} icon="checkmark-outline" disabled={!ready || day > today} onPress={() => setEditor({ kind: 'done', cropId: crop.id, day })} />
            <Button title="Lisa istutus aeda" disabled={!gardenReady} onPress={() => openPlanting(day, crop)} />
          </View>
          <View style={s.card}>
            <Text accessibilityRole="header" style={s.subheading}>Mida sel päeval külvata või istutada?</Text>
            {cropsForDay.length ? cropsForDay.map((item) => <CropRow key={item.id} crop={item}
              detail={`${METHOD[item.method]}${recommended(withSowingPreference(item), day) ? ' · kuu järgi soovitatud' : ''}`}
              disabled={!ready} onPress={() => {
                setCrop(item);
                setEditor({ kind: 'planned', cropId: item.id, day, fromRecommendation: true });
              }} />)
              : <Text style={s.small}>Valitud taimede külvi- ja istutusajad sellele päevale ei jää.</Text>}
          </View>
          {!!dayEntries.length && <View style={s.card}>
            <Text accessibilityRole="header" style={s.subheading}>Selle päeva kirjed</Text>
            {dayEntries.map((entry) => {
              const plant = crops.find((item) => item.id === entry.cropId);
              return plant && <Text key={entry.id} style={s.body}>
                {[plant.name, METHOD[plant.method], entry.variety, entry.kind === 'done' ? 'Tehtud' : 'Plaanis'].filter(Boolean).join(' · ')}
              </Text>;
            })}
            <Button title="Ava päevik" onPress={() => openJournal(dayEntries.some(({ kind }) => kind === 'done') ? 'done' : 'planned')} />
          </View>}
          {dayTasks.length > 0 && <View style={s.card}>
            <Text accessibilityRole="header" style={s.subheading}>Selle päeva hooldustööd</Text>
            {dayTasks.map((task) => <Text key={task.key} style={s.body}>{task.bed} · {task.name} · {taskLabels[task.kind]}{task.done ? ' · tehtud' : ''}</Text>)}
            <Button title="Ava aed" onPress={() => { setPlantingDay(undefined); setTab('garden'); }} />
          </View>}
        </>}
        {tab === 'care' && <CareView crop={selectedCrop} crops={crops} setCrop={(item) => {
          setCrop(item);
          if (!matchesFilter(item, method)) setMethod('all');
        }} day={day} today={today} selectDay={setDay} openCalendar={() => setTab('calendar')} />}
        {tab === 'garden' && <GardenView crops={crops} crop={crop} selectCrop={setCrop} garden={garden} ready={gardenReady} today={today}
          save={saveGarden} openGreenhouse={() => setGreenhouseEditor(true)} initialDay={plantingDay} />}
        {tab === 'journal' && <>
          <Text accessibilityRole="header" style={s.heading}>Külvipäevik</Text>
          <View accessibilityRole="tablist" accessibilityLabel="Külvipäeviku vaated" style={s.wrap}>
            {journalTabs.map(({ id, name }) => <Pressable key={id} accessibilityRole="tab" aria-selected={journalKind === id}
              onPress={() => selectJournalKind(id)} style={[s.button, journalKind === id && s.selected]}>
              <Text style={s.buttonText}>{name}</Text>
            </Pressable>)}
          </View>
          <View style={s.wrap}>
            <Button title="Uus töökanne" icon="add-outline" primary disabled={!ready} onPress={() => setEditor({ kind: 'done', cropId: crop.id, day: today })} />
            <Button title="Planeeri töö" icon="calendar-outline" disabled={!ready} onPress={() => setEditor({ kind: 'planned', cropId: crop.id, day: today })} />
          </View>
          {ready && !journalEntries.length && <Text style={s.small}>{journalKind === 'done' ? 'Tehtud töid veel pole.' : 'Plaane veel pole.'}</Text>}
          {journalEntries.map((entry) => {
            const plant = crops.find((item) => item.id === entry.cropId);
            if (!plant) return null;
            return <View key={entry.id} style={s.card}>
              <View style={s.item}>
                <View style={s.thumb}><Text style={s.emoji}>{plant.icon}</Text></View>
                <View style={s.grow}>
                  <Text style={s.strong}>{plant.name} · {METHOD[plant.method]}</Text>
                  {!!entry.variety && <Text style={s.small}>Sort · {entry.variety}</Text>}
                  <Text style={s.small}>{formatDay(entry.day)}{entry.end ? ` – ${formatDay(entry.end)}` : ''}</Text>
                </View>
              </View>
              {entry.plannedDay && <Text style={s.small}>Algne plaan · {formatDay(entry.plannedDay)}</Text>}
              {!!entry.note && <Text style={s.body}>{entry.note}</Text>}
              {entry.reminder && <Text style={s.small}>{tallinnTime(entry.day, 9).getTime() > Date.now() ? 'Meeldetuletus kell 9 Eesti aja järgi' : 'Meeldetuletuse aeg möödunud'}</Text>}
              {deleting === entry.id ? <View style={s.wrap}>
                <Button title="Kinnita kustutamine" primary onPress={() => { void deleteEntry(entry.id); }} />
                <Button title="Loobu" onPress={() => setDeleting(undefined)} />
              </View> : <View style={s.wrap}>
                {entry.kind === 'planned' && <Button title={isPlanting(plant.method) ? 'Märgi istutatuks' : 'Märgi külvatuks'} icon="checkmark-outline" subtle onPress={() => setEditor({ kind: 'done', cropId: plant.id, day: today, entry, completing: true })} />}
                {entry.kind === 'done' && <Button title="Lisa aeda" disabled={!gardenReady} onPress={() => openPlanting(entry.day, plant)} />}
                <Button title="Muuda" onPress={() => setEditor({ kind: entry.kind, cropId: plant.id, day: entry.day, entry })} />
                <Button title="Kustuta" onPress={() => setDeleting(entry.id)} />
              </View>}
            </View>;
          })}
        </>}
      </ScrollView>
      <View style={s.nav}>
        {tabs.map(({ id, name, icon }) => <Pressable key={id} accessibilityRole="tab" accessibilityState={{ selected: tab === id }}
          onPress={() => {
            setPlantingDay(undefined);
            if (id === 'journal') openJournal();
            else setTab(id);
          }} style={s.navItem}>
          <View style={[s.navIcon, tab === id && s.navActive]}><Ionicons name={icon as Icon} size={20} color={color.green} /></View>
          <Text style={[s.navText, tab === id && s.navTextActive]}>{name}</Text>
        </Pressable>)}
      </View>
      <Modal visible={detailDay !== undefined} transparent onRequestClose={dismissDayDetails}
        onShow={() => focusControl(closeDetails.current)} onDismiss={() => focusControl(detailsTrigger.current)}>
        {detailDay && <View style={s.overlay}>
          <View style={s.modal} accessibilityViewIsModal>
            <ScrollView contentContainerStyle={s.modalContent}>
              <Pressable ref={closeDetails} accessibilityRole="button" style={s.button} onPress={dismissDayDetails}>
                <Text style={s.buttonText}>Tagasi kalendrisse</Text>
              </Pressable>
              <DayDetails day={detailDay} crop={crop} showWindow />
            </ScrollView>
          </View>
        </View>}
      </Modal>
      {editor && <EntryEditor request={editor} crops={crops} today={today} close={() => setEditor(undefined)} save={saveEntry} />}
      {greenhouseEditor && <GreenhouseForm value={garden.greenhouseMin} close={() => setGreenhouseEditor(false)} save={saveGarden} />}
      {place && choosingPlace && <PlacePicker place={place} close={() => setChoosingPlace(false)} select={(selected) => {
        setPlace(selected);
        setChoosingPlace(false);
        void write('place', selected).catch(() => setNotice('Asukohta ei õnnestunud püsivalt salvestada.'));
      }} />}
    </View>
  </SafeAreaView>;
}

export default function App() {
  return <SafeAreaProvider><StatusBar style="dark" /><AppContent /></SafeAreaProvider>;
}

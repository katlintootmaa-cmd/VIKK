import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { addDays, cropChoice, formatDay, parseDayInput, type Crop, type Day } from './calendar';
import { CARE, CARE_RESEARCH, CARE_TASKS, CARE_TRADITION, TOMATO_TOPPING, careMoonDays, nextFeedingRange, type CareTask } from './care';
import { Button, Choice, IconButton, Source } from './components';
import { color, s } from './theme';

export function CareView({ crop, crops, setCrop, day, today, selectDay, openCalendar }: {
  crop: Crop; crops: Crop[]; setCrop: (crop: Crop) => void; day: Day; today: Day; selectDay: (day: Day) => void; openCalendar: () => void;
}) {
  return <>
    <Text accessibilityRole="header" style={s.heading}>Taimehooldus</Text>
    <Choice value={crop.id} options={crops.map(cropChoice)} onChange={(id) => setCrop(crops.find((item) => item.id === id) ?? crop)} />
    <CareGuide key={crop.id} crop={crop} day={day} today={today} selectDay={selectDay} openCalendar={openCalendar} />
  </>;
}

function CareGuide({ crop, day, today, selectDay, openCalendar }: {
  crop: Crop; day: Day; today: Day; selectDay: (day: Day) => void; openCalendar: () => void;
}) {
  const careId = crop.careId ?? crop.id;
  const greenhouse = crop.method === 'greenhouse-sow' || crop.method === 'greenhouse-plant';
  const [task, setTask] = useState<CareTask>(careId === 'tomat' ? 'topping' : crop.method === 'greenhouse-plant' ? 'transplanting' : 'thinning');
  const [lastFed, setLastFed] = useState('');
  const guide = CARE[careId];
  const feedingDay = parseDayInput(lastFed);
  const range = feedingDay && nextFeedingRange(careId, feedingDay);
  const taskOptions = (Object.keys(CARE_TASKS) as CareTask[]).filter((item) => item !== 'topping' || careId === 'tomat');
  const moonDays = careMoonDays(task, day);

  return <>
    {(greenhouse || !guide) && <View style={s.card}>
      <Text accessibilityRole="header" style={s.subheading}>{greenhouse ? 'Kasvuhoonetööd' : 'Kasvatusjuhis'}</Text>
      <Text style={s.body}>{crop.advice}</Text>
      {crop.source && <Source title="Kasvatusjuhis" url={crop.source} />}
      {!guide && <Text style={s.small}>Istutuse kuupäeva järgi arvutatud hooldustööd näed vaates „Aed“.</Text>}
    </View>}
    {guide && <View style={s.card}>
      <Text accessibilityRole="header" style={s.subheading}>Väetamine kasvufaasi järgi</Text>
      {guide.stages.map(({ title, advice }) => <View key={title} style={s.stack}>
        <Text style={s.strong}>{title}</Text>
        <Text style={s.body}>{advice}</Text>
      </View>)}
      <Text style={s.small}>Järgi väetise pakendil toodud kogust ja kasutussagedust.</Text>
      <View style={s.wrap}>{guide.sources.map(({ title, url }) => <Source key={url} title={title} url={url} />)}</View>
    </View>}
    {guide?.containerInterval && <View style={s.card}>
      <Text accessibilityRole="header" style={s.subheading}>Millal potitaime uuesti väetada?</Text>
      <Text style={s.small}>Arvutus lähtub {guide.containerInterval.join('–')}-päevasest vahest juba väetatavale potitaimele.</Text>
      <View style={s.stack}>
        <Text style={s.strong}>Viimase väetamise kuupäev</Text>
        <TextInput accessibilityLabel="Viimase väetamise kuupäev" style={s.field} value={lastFed} onChangeText={setLastFed}
          placeholder="PP-KK-AAAA või PP-KK-AA" placeholderTextColor={color.muted} maxLength={10} autoCapitalize="none" />
      </View>
      {range ? <Text accessibilityLiveRegion="polite" style={s.strong}>
        Järgmine võimalik väetamine · {formatDay(range.start)} – {formatDay(range.end)}
      </Text> : (lastFed.length === 8 || lastFed.length === 10) && !feedingDay &&
        <Text accessibilityLiveRegion="polite" style={s.error}>Sisesta kehtiv kuupäev kujul PP-KK-AAAA või PP-KK-AA.</Text>}
    </View>}
    {careId === 'tomat' && <View style={s.card}>
      <Text accessibilityRole="header" style={s.subheading}>{TOMATO_TOPPING.title}</Text>
      <Text style={s.body}>{TOMATO_TOPPING.advice}</Text>
      <Source title="RHS-i juhis tomati kujundamiseks" url="https://www.rhs.org.uk/vegetables/tomatoes/grow-your-own" />
    </View>}
    <View style={s.card}>
      <Text accessibilityRole="header" style={s.subheading}>Aiatööd kuu järgi</Text>
      <Choice value={task} options={taskOptions.map((item) => [item, CARE_TASKS[item].label] as const)} onChange={setTask} />
      <Text style={s.badge}>Pärimuslik soovitus</Text>
      <Text style={s.body}>{CARE_TASKS[task].advice}</Text>
      <Text style={s.small}>Kui taim või peenar vajab tööd, tee see sobivates kasvutingimustes. Kuu mõju nende aiatööde tulemusele pole usaldusväärselt tõendatud.</Text>
      <View style={s.between}>
        <IconButton label="Eelmine päev" icon="chevron-back" onPress={() => selectDay(addDays(day, -1))} />
        <Text style={[s.strong, { textAlign: 'center', flexShrink: 1 }]}>{formatDay(day)} – {formatDay(moonDays[6].day)}</Text>
        <IconButton label="Järgmine päev" icon="chevron-forward" onPress={() => selectDay(addDays(day, 1))} />
      </View>
      {moonDays.map(({ day: date, period, matches }) => <View key={date} style={s.between}>
        <Text style={s.strong}>{formatDay(date)}</Text>
        <Text style={matches ? s.badge : s.small}>{period === undefined ? 'Kuufaasi andmed puuduvad' :
          `${period === 'waxing' ? 'Kasvav kuu' : 'Kahanev kuu'}${matches ? ' · sobib pärimuse järgi' : ''}`}</Text>
      </View>)}
      <View style={s.wrap}>
        <Button title="Täna" onPress={() => selectDay(today)} />
        <Button title="Vali päev kalendrist" icon="calendar-outline" onPress={openCalendar} />
      </View>
      <View style={s.wrap}><Source title="Kuuaianduse pärimus" url={CARE_TRADITION} /><Source title="Teaduskirjanduse ülevaade" url={CARE_RESEARCH} /></View>
    </View>
  </>;
}

import { Text, View } from 'react-native';
import { formatDay, inSeason, type Crop, type Day } from './calendar';
import { Button, Choice, Source } from './components';
import { forecastFit, forecastWindows, plantProfile, type GrowingSite } from './garden';
import { s } from './theme';
import type { Forecast } from './weather';

export type ForecastSite = GrowingSite | 'indoors';
const siteOptions: ReadonlyArray<readonly [ForecastSite, string]> = [
  ['outdoor', 'Avamaa'], ['greenhouse', 'Kasvuhoone'], ['indoors', 'Toas'],
];

export function ForecastWindow({ crop, day, today, forecast, site, selectSite, greenhouseMin, stale, loading, openGreenhouse, plan, ready }: {
  crop: Crop; day: Day; today: Day; forecast: Forecast | undefined; site: ForecastSite; selectSite: (site: ForecastSite) => void;
  greenhouseMin: number; stale: boolean; loading: boolean; openGreenhouse: () => void; plan: (start: Day, end: Day) => void; ready: boolean;
}) {
  const days = forecast?.days.filter((item) => item.day >= today) ?? [];
  const inWindow = days.filter((item) => inSeason(crop, item.day));
  const windows = site === 'indoors' ? [] : forecastWindows(crop, days, today, site, greenhouseMin);
  const selected = days.find((item) => item.day === day);
  const fit = site !== 'indoors' && selected ? forecastFit(crop, selected, site, greenhouseMin) : undefined;
  const profile = plantProfile(crop);
  const minAir = site === 'greenhouse' ? greenhouseMin : profile.minAir;

  return <View style={s.card}>
    <Text accessibilityRole="header" style={s.subheading}>Külviaken ilmaprognoosi järgi</Text>
    <Choice value={site} options={siteOptions} onChange={selectSite} />
    {site === 'indoors' ? <Text style={s.body}>Toas ettekasvatamisel lähtu külviaknast ning ruumi ja külvimulla temperatuurist.</Text> : <>
      <Text style={s.body}>Välisõhu ööpäevane miinimum vähemalt {minAir} °C. Mulla ööpäevane keskmine 6 cm sügavusel vähemalt {profile.minSoil} °C.</Text>
      {site === 'greenhouse' && <>
        <Text style={s.small}>Ilmaprognoos kirjeldab välisõhku ja õuemulda. Mõõda kasvuhoone tegelik temperatuur kohapeal.</Text>
        <Button title="Muuda kasvuhoone külmapiiri" disabled={!ready} onPress={openGreenhouse} />
      </>}
      <Text style={s.small}>Arvutus kontrollib seitsme päeva prognoosi tavapärase külviakna sees. Kontrolli peenra olusid enne külvamist.</Text>
      {!crop.profile && <Text style={s.small}>Temperatuurilävendid on orienteeruvad ja võivad sorditi erineda.</Text>}
      {stale && days.length > 0 && <Text style={s.small}>Arvutus kasutab viimati laaditud prognoosi.</Text>}
      {!days.length ? <Text style={s.body}>{loading ? 'Laadin ilmaprognoosi…' : 'Ilmaprognoos puudub.'}</Text>
        : !inWindow.length ? <Text style={s.body}>Prognoosipäevad jäävad selle kultuuri tavalisest külviaknast välja.</Text>
        : !windows.length && <Text style={s.body}>{inWindow.some((item) => item.low == null || item.soilTemperature == null)
          ? 'Sobiv aken jäi kinnitamata. Mõnel päeval puuduvad õhu- või mullaandmed.'
          : 'Prognoosis ei ole päeva, mis vastaks mõlemale temperatuurilävendile.'}</Text>}
      {fit === 'cold' && <Text style={s.small}>Valitud päev on prognoosi järgi külviks liiga jahe.</Text>}
      {fit === 'unknown' && <Text style={s.small}>Valitud päeva kohta puudub osa vajalikest andmetest.</Text>}
      {windows.map(({ start, end }) => <Button key={start} disabled={!ready}
        title={`Plaani külv · ${formatDay(start)}${end === start ? '' : ` – ${formatDay(end)}`}`}
        onPress={() => plan(start, end)} />)}
      <Source url="https://open-meteo.com/en/docs" title="Open-Meteo andmed ja sügavused" />
      {crop.source && <Source url={crop.source} title="Kultuuri külviakna allikas" />}
    </>}
  </View>;
}

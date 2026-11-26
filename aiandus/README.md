# Kuukülv

## Eesmärk

Kuukülv leiab kuufaasi järgi külvi- ja ettekasvatuspäevi Eesti oludes. Kalender kuvab ka taime kogu külviaja, mille piires äpp soovitusi otsib.

## Kellele Kuukülv mõeldud on

Kuukülv on koduaednikule, kes kasvatab köögivilju aias, rõdul või kasvuhoones. Algaja saab kalendrist vaadata, millal esimeste külvidega alustada. Kui külviajad on juba tuttavad, saab äppi kasutada oma külvide planeerimiseks ja kirja panemiseks.

## Mida Kuukülv teeb

- Vaadata avamaa, ettekasvatuse ja kütteta kasvuhoone külvi- ning istutusaegu. Näiteks saab redist ja aedsalatit külvata otse kasvuhoonesse ning tomatile, kurgile ja paprikale valida kasvuhoonesse istutamise aja.
- Planeerida kaalika ja valge peakapsa ettekasvatust ja väljaistutamist, porgandi külvi kasvuhoonesse, sibula ettekasvatust ja tippsibula istutamist ning tilli, spinati ja söögipeedi otsekülvi.
- Vaadata suhkrumaisi ettekasvatuse ja avamaale istutamise ligikaudseid aegu.
- Vaadata 2025.–2031. aasta kuufaase ning leida külviaknas päev, mil kell 12 Eesti aja järgi kehtib valitud kuufaas.
- Valida kalendris kas kuupäev koos selle kuufaasiga või kuufaas (kasvav või kahanev kuu), mille järgi äpp näitab kolm järgmist sobivat kuupäevavahemikku.
- Salvestada külviplaan valitud kuupäevaks või külviperioodiks ja lülitada telefonis sisse meeldetuletus.
- Pidada külvipäevikut, märkida plaan tehtuks või lisada külv tagantjärele koos sordi ja märkmetega.
- Kasutada külvikalendrit ja külvipäevikut ka võrguühenduseta.
- Vaadata valitud Eesti asula seitsme päeva ilmaprognoosi, võimalikku öökülmaohtu ning mulla temperatuuri ja niiskust.
- Leida tavapärase külviakna sees prognoosi järgi päevad, mil õhu ja mulla temperatuur vastavad kultuuri lävenditele, ning plaanida nende põhjal külv.
- Lisada oma kultuure, pidada vaates „Aed“ peenarde ajalugu, saada külvikorra ja naabertaimede soovitusi ning jälgida istutuse hooldustöid.
- Lugeda taimehoolduse juhiseid, arvutada potitomati ja potikurgi järgmist väetamisaega ning vaadata aiatööde pärimuslikke soovitusi.

## Tehnoloogiad

Kirjutan äppi TypeScriptis ning kasutan React Native'i ja Expot, et sama koodibaas töötaks Androidis, iOS-is ja veebis. Mobiilis salvestab SQLite külviplaanid, päevikukirjed ja viimati laaditud prognoosi. Meeldetuletusi ajastab `expo-notifications`. Külviaknad ja kuufaasid on äpiga kaasas. Kuufaaside andmed pärinevad [US Naval Observatorylt](https://aa.usno.navy.mil/data/MoonPhases) ning asulaotsing ja ilmaprognoos [Open-Meteolt](https://open-meteo.com/).

## Teostusplaan

1. Panen paika kalendri, päeviku ja hooldusvaate ning kogun külviajad ja kuufaasid koos allikaviidetega.
2. Ehitan kalendri ja külviviisi filtri ning lisan päeva vaatesse selgituse, miks äpp seda päeva kuufaasi järgi soovitab.
3. Lisan külviplaanid, päeviku ja telefonis ajastatavad meeldetuletused. Plaanid ja päevik salvestan kohapeal, et neid saaks kasutada ka internetita.
4. Ühendan asulaotsingu ja ilmaprognoosi ning lisan hooldusjuhised ja väetamiskalkulaatori.
5. Kontrollin külviakende piire, Eesti ajavööndit ja seda, kuidas äpp võrguvea korral käitub. Päevikut proovin lennurežiimis ning meeldetuletusi Androidi ja iOS-i seadmetel.

## Millal äpp on valmis

- Äpp käivitub Androidil ja iOS-il ning põhivaated on eestikeelsed.
- Külvi- ja istutusaegadel on allikaviide. Tööviisi filter kuvab vastavad kultuurid. Kõik külvi- ja ettekasvatussoovitused jäävad töö ajavahemikku ja vastavad valitud kuufaasile. Puuduvate kuufaasiandmete korral jääb ajavahemik nähtavale.
- Valitud kuufaasi kuupäevad vastavad US Naval Observatory andmetele Eesti ajavööndis, sh kuupäevavahetuse lähedal.
- Külviplaani saab salvestada ja tehtuks märkida tegeliku külvikuupäevaga. Sort ja märkmed säilivad ning päevikukirje on alles ka pärast äpi taaskäivitamist. Kalendri ja päeviku põhitoimingud töötavad lennurežiimis.
- Teavitusloa korral saabub valitud kuupäeval või külviperioodi alguspäeval üks meeldetuletus kell 9.00 Eesti aja järgi. Kuupäeva muutmisel ajastatakse see ümber ning kirje kustutamisel või tehtuks märkimisel tühistatakse.
- Valitud asula seitsme päeva prognoosi saab uuendada. Võrguvea korral on olemasoleval salvestatud prognoosil märge „Viimati laaditud prognoos“.
- Kõigil kuuel taimel on hooldusjuhised. Potitomati ja potikurgi kalkulaator näitab järgmist väetamisvahemikku ning kuu järgi esile tõstetud aiatööd on märgitud pärimuslikuna.
- README juhiste järgi saab projekti käivitada. Tüübikontroll ja automaattestid läbivad kontrolli.

Prototüübi senised kontrollid ja ootel seadmekatsed on kirjas [arenduslogis](arendus/logi.md).

## Käivitamine

Käivita projekti kaustas `aiandus`:

```sh
npm ci
npm start
```

Ava Expo QR-kood Androidi või iOS-i telefonis projektiga ühilduva Expo Go versiooniga. Brauseris proovimiseks käivita `npm run web`. Veebivaade salvestab päeviku brauserisse. Telefoniteavitusi saab proovida mobiiliäpis. Asulaotsing ja prognoosi uuendamine vajavad internetiühendust.

Tüübikontrolli käivitab `npm run typecheck` ja testid käivitab `npm test`.

## Arenduse käik

- [Arenduslogi](arendus/logi.md) koondab tehtud töö, otsused ja kontrollide tulemused.
- [Arendusblogis](arendus/blogi/README.md) on pikemad postitused prototüübi arendusetappidest.

## Kuidas äpp töötab

### Külvikalender

Kalender näitab valitud taime ja töö ajavahemikku koos allikaviitega. Otsekülvil, ettekasvatusel ja istutamisel on eraldi ajad. Päeva vaates on vajaduse korral ka märkus mulla temperatuuri või öökülma kohta. Sordist ja kohalikest oludest sõltuvad täpsemad tingimused on kirjas töö juures.

Äpp kasutab külvi- ja ettekasvatussoovitustes astronoomilist Kuu seisu kell 12.00 Eesti aja järgi. Kasvav periood algab noorkuu hetkel ja kahanev täiskuu hetkel. Kui vahetus toimub täpselt keskpäeval, kehtib juba algav periood. Kalender soovitab ainult valitud kuufaasile vastavaid päevi kasvatusjuhise külviaknas.

Äpi vaikevalik on maapealse saagiga kultuuridel kasvav kuu ning redise ja porgandi puhul kahanev kuu. Vaikevaliku taust on külvipärimus. Kalendris saab kõigi külvide ja ettekasvatuse jaoks valida kasvava või kahaneva kuu äpi selleks avamiskorraks. Teaduskirjanduse ülevaade ei leidnud usaldusväärset alust kuufaaside järgi külvamisele saagi parandamiseks. [Külvipärimus](https://www.almanac.com/planting-by-the-moon) · [Mayoral jt, 2020](https://doi.org/10.3390/agronomy10070955)

Faasihetked on andmetes UTC-s ja kalender kuvab need ajavööndis `Europe/Tallinn`. Soovitust saab arvutada päevaks, mille kohalik keskpäev jääb teadaolevasse noor- ja täiskuu faasihetkede vahemikku. Kogu külviaken jääb nähtavale ka siis, kui osa kuufaasiandmeid on puudu. Kalender näitab, kui järelejäänud külvipäevade andmed puuduvad või kui järelejäänud päevadel valitud kuufaasi keskpäeval ei esine. [USNO kuufaaside andmestik](https://aa.usno.navy.mil/data/MoonPhases)

### Külviplaanid ja päevik

Kuukülv kasutab oma kalendrit. Soovitustel, külviplaanidel ja tehtud külvidel on eraldi tekstisildid. Äpp küsib teavitusluba siis, kui kasutaja lülitab meeldetuletuse sisse. Teavitus ajastatakse telefonis ja tühistatakse, kui külv märgitakse tehtuks. Möödunud plaan jääb kalendrisse ja selle kuupäeva saab muuta.

Plaani tehtuks märkimisel pakub päevik tänast kuupäeva. Kui külv toimus mõnel muul päeval, saab enne salvestamist valida tegeliku külvikuupäeva.

### Ilmaprognoos

Äpp salvestab valitud asula ja selle koordinaadid ning seob prognoosi asula ja kuupäevadega. Prognoos uueneb asula vahetamisel või käsitsi. Äpi avamisel ja esiplaanile naasmisel küsitakse uus prognoos siis, kui viimasest edukast laadimisest on möödas vähemalt tund.

Kui kohaliku öö tunniprognoos näitab 0 °C või vähem, kuvatakse märkus võimaliku öökülma kohta. Külviaken ja kuufaasi soovitus on nähtaval ka väljaspool prognoosiperioodi.

### Ilmapõhine külviaken

Seitsme päeva prognoosist moodustatakse tavapärase külviakna sees järjestikuste päevade vahemikud. Sobiv päev vastab välisõhu miinimumi ja mulla temperatuuri lävendile. Kasvuhoonerežiimis saab seadistada välisõhu külmapiiri. Prognoos kuvab õuemulla temperatuuri 6 cm sügavusel ja mahulist niiskust 3–9 cm sügavusel ööpäeva keskmistena. Sisseehitatud kultuuride lävendid on orienteeruvad.

### Aed

Kasutaja saab lisada oma kultuuri koos külvihooaja, istutusvahede, lävendite, taimesugukonna ja hooldustööde ajastusega. Peenra ajalugu arvestab sama taimesugukonna istutusi kahe aasta kaugusel. Istutuse või otsekülvi kuupäevast tekivad kastmise, vajaduse korral harvendamise, väetamise ja saagiküpsuse kontrollid, mille saab tehtuks märkida. [RHS-i külvikorra juhis](https://www.rhs.org.uk/vegetables/crop-rotation) · [RHS-i istutusvahed](https://www.rhs.org.uk/education-learning/school-gardening/resources/food-growing/vegetable-crop-planner)

### Kuupäevad

Äpp kuvab täiskuupäevad kujul `PP-KK-AAAA`. Kuupäevavälja saab sisestada ka kujul `PP-KK-AA`, mis tähistab aastaid 2000–2099.

### Taimehooldus

- Väetamine sõltub taime kasvufaasist, mulla viljakusest, kasvukohast ja valitud väetise pakendijuhisest. Potitaime kalkulaator on mõeldud juba väetatavale taimele. [Maaelu Teadmuskeskuse tomatijuhis](https://metk.agri.ee/uudised/tomatid-vajavad-tahelepanu-ja-hoolt) · [RHS-i tomatijuhis](https://www.rhs.org.uk/vegetables/tomatoes/grow-your-own) · [RHS-i kurgijuhis](https://www.rhs.org.uk/vegetables/cucumbers/grow-your-own).
- Kuuvaade rakendab pärimuslikku kärpimise reeglit tomati ladva eemaldamisele. See soovitus eeldab, et taim on tööks valmis. Sama kuuvaade seob harvendamise ja rohimise kahaneva kuuga ning ümberistutamise kasvava kuuga. [Kuuaianduse pärimus](https://www.almanac.com/farming-moon) · [Teaduskirjanduse ülevaade](https://doi.org/10.3390/agronomy10070955).

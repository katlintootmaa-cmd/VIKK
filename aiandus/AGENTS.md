# Aiandusäpi arendusjuhised

## Projekt

Kuukülv on Expo ja React Native'iga tehtud eestikeelne külvikalender Androidile, iOS-ile ja veebile. Äpi põhifunktsioon on kuufaaside järgi soovitatud külvipäevade leidmine Eesti kasvutingimustes. Loe enne muudatusi [projekti kirjeldust](README.md).

- `App.tsx` sisaldab vaateid Täna, Kalender, Hooldus, Päevik ja Aed ning äpi olekut.
- `src/calendar.ts` sisaldab kultuure, külviaknaid, kuufaaside arvutust, kuupäevade vormindamist ja soovituste otsingut. `src/data/extraCrops.ts` sisaldab lisakultuure ja `src/data/moon-phases.json` USNO faasihetki aastateks 2025–2031.
- `src/garden.ts` ja `src/GardenView.tsx` sisaldavad aiaprofiile, külvikorda ja hooldustöid. `src/ForecastWindow.tsx` leiab ilmapõhise külviakna.
- `src/care.ts` ja `src/CareView.tsx` sisaldavad hooldusjuhiseid. `src/weather.ts` ja `src/useWeather.ts` sisaldavad Open-Meteo prognoosi ja asulaotsingut.
- `src/journal.ts`, `src/storage*.ts` ja `src/reminders*.ts` sisaldavad päevikut, kohalikku salvestust ja telefoni meeldetuletusi. `.native.ts` failid on telefoni jaoks.
- `tests/` sisaldab Node'i teste. `arendus/logi.md` on arenduslogi ja `arendus/blogi/` arendusblogi.

## Käsud ja koodistiil

- Käivita käsud kaustas `aiandus`. Paigalda sõltuvused käsuga `npm ci`. Käivita äpp käsuga `npm start` ja veebivaade käsuga `npm run web`. Windowsi PowerShellis kasuta vajaduse korral `npm.cmd` ja `npx.cmd`.
- Kontrolli muudatusi käskudega `npm run typecheck` ja `npm test`. Kasutajaliidese muudatust proovi ka veebivaates või Expo Go-s ning nimeta lõpetamisel teekonnad, mida seadmel ei proovitud.
- Kasuta ühekordseid jutumärke, kahe tühikuga taanet ja lõpukomasid mitmerealistes loendites. Lisa lühike kommentaar ainult siis, kui arvutuse põhjus pole koodist näha.
- Hoia külvisoovituse arvutus kasutajaliidesest sõltumatu ja deterministlik. Lisa uus arvutus faili `src/calendar.ts` või `src/garden.ts` ning kata see testiga.
- Lisa sõltuvus ainult siis, kui ülesanne seda vajab. Kontrolli enne ühilduvust Expo SDK versiooniga ja lukusta versioon.
- Kasuta põhiteekonnas kohalikku andmestikku ja küsi õigusi ainult funktsiooni jaoks, mis neid vajab. Arvesta Androidi ja iOS-i ligipääsetavusega.

## Säilitatav käitumine

- Soovitus kehtib ainult kultuuri ja tööviisi külviakna sees. Kuufaas määratakse kell 12 Eesti aja järgi (`Europe/Tallinn`). Faasihetked jäävad andmetesse UTC-s.
- Iga soovitus viitab külviakna allikale, kuufaasi allikale ning rakendunud pärimusreeglile. Märgi pärimuslik soovitus sellisena. Külviaeg sõltub ka sordist, mulla temperatuurist ja öökülmaohust.
- Kui kuufaasiandmed puuduvad, jääb külviaken nähtavale ja äpp ütleb, et andmed puuduvad.
- Kuva täiskuupäevad kujul `PP-KK-AAAA`. Luba kuupäeva sisestada ka kujul `PP-KK-AA`, mis tähistab aastaid 2000–2099. Salvesta kuupäevad kujul `AAAA-KK-PP`.
- Kuufaasi vaade näitab kolme järgmist sobivat vahemikku ega muuda kalendri soovitusi.
- Igal sisseehitatud kultuuril on aiaprofiil. Kasvuhoone- ja istutusvariandid kasutavad põhikultuuri profiili.
- Kalender, päevik ja aed töötavad ilma võrguühenduseta. Meeldetuletus saabub kell 9 Eesti aja järgi.
- Thuni päevatüübid ja põllukultuurid on teadlikult välja jäetud. Lisa need ainult siis, kui seda palutakse.

## Arenduslogi

- Uuenda pärast iga sisulist arendussammu, otsust või kontrolli automaatselt faili [`arendus/logi.md`](arendus/logi.md), ka siis, kui kasutaja seda eraldi ei palu. Lisa Eesti kuupäeva (`AAAA-KK-PP`) alla tehtud töö, muudetud failid või mõjutatud funktsioonid ning kontrolli tegelik tulemus.
- Märgi pooleli jäänud töö või takistus, kui see on oluline. Lisa sama päeva tegevused olemasoleva kuupäeva alla ja säilita varasemad sissekanded, et neist saaks koostada päevakokkuvõtteid ja blogipostitusi.
- Esita lõpetamisel tegelikult käivitatud kontrollid ning nimeta asjakohased kontrollid, mida keskkonnas teha ei saanud.

## GitHubi töövoog

- Enne äpi muutmist loo GitHubi issue, mis selgitab muudatust ja selle vajadust. Lisa kontrollitavate vastuvõtukriteeriumide kontrollnimekiri. Funktsiooni ja muu töö pealkiri on kujul `<Rollina> soovin <funktsiooni>, et <kasu>`, näiteks `Koduaednikuna soovin näha kolme järgmist sobivat vahemikku, et külvi planeerida`.
- Vea korral kasuta silti `bug` ja lühikest probleemi kirjeldavat pealkirja. Lisa:
  - **Kordamise sammud.**
  - **Oodatud käitumine.**
  - **Tegelik käitumine:** mis juhtub selle asemel, koos täpse veateksti või väljundiga, kui see on olemas.
  - **Keskkond:** käsu `node --version` väljund, Expo SDK versioon failist `package.json`, seade või brauser ja operatsioonisüsteem.
- Vastuvõtukriteeriumid kehtivad ka vigade kohta. Sõnasta need jälgitava parandusena, näiteks „Ülaltoodud sammude järel näitab kuufaasi vaade kolme vahemikku“.
- Projekt ei kasuta pull requeste. Tee töö issue järgi nimetatud funktsiooniharus, näiteks `feature/3-kuufaasi-vahemikud`. Viita commit'is issue numbrile. Alusta commit'i pealkirja eesliitega `Kuukülv:` ja jaota mitut funktsiooni puudutava commit'i kirjeldus funktsioonide kaupa.
- Kui hooldaja kinnitab, et funktsioon on valmis, tee haru squash-merge harusse `main` ja push'i `main`. Ära tee merge'i omal algatusel ega enne seda kinnitust.
- Pärast squash-merge'i harusse `main` sulge funktsiooni issue (`gh issue close <number>`) ja lisa sulgemiskommentaari squash-commit'i viide. Kustuta haru kohalikult (`git branch -D <haru>`) ja harust `origin`, kui see seal olemas on (`git push origin --delete <haru>`). Enne kustutamist kontrolli, et haru sisaldab ainult ühendatud tööd ja et ükski worktree seda ei kasuta. Hooldaja on need sammud ette heaks kiitnud, tee need ilma küsimata.
- Hoia muudatused väikesed ja piiritletud. Ära lisa raamistikke, seadistusfaile ega abstraktsioonikihte, mida ülesanne ei vaja.
- Ära lisa commit'i faile `märkmed.txt`, `dist/`, `.expo/` ega `node_modules/`. Vaata enne commit'i diff üle.

## Agendid

| Agent | Ülesanne ja tulemus |
| --- | --- |
| [Tootedisainer](.codex/agents/tootedisainer.toml) | Kavandab vaated ja kasutajateekonnad. Sõnastab issue kasutajaloo ja vastuvõtukriteeriumid. Annab arendajale üle kasutajatekstid ja vaadete olekud. |
| [Andmeanalüütik](.codex/agents/andmeanaluutik.toml) | Kontrollib külviaknaid, kuufaase ja pärimusreegleid. Annab üle allikad, andmed ja arvutuse kontrollnäited. Kirjutab andmevigade kohta `bug`-issue'd. |
| [Mobiiliarendaja](.codex/agents/mobiiliarendaja.toml) | Rakendab issue'ga kokkulepitud muudatuse issue järgi nimetatud funktsiooniharus. Annab üle muudetud failid, kontrollide tulemused ja issue'le viitava commit'i. Merge'i ei tee. |
| [Testija](.codex/agents/testija.toml) | Kontrollib muudatust sõltumatult issue vastuvõtukriteeriumide järgi. Annab üle leiud koos mõju, asukoha ja kordamise sammudega. |

Delegeerimisel kasuta sobivat rolli kaustast `.codex/agents` ja TOML-failis olevat nime. Määra igale ülesandele seotud issue, oodatav tulemus ja failid, mida tohib muuta. Väldi sama faili samaaegset muutmist. Lase soovitusloogika enne avaldamist sõltumatult üle kontrollida. Peaagent koondab tulemused, lisab ühise arenduslogi sissekande ja teeb pärast hooldaja kinnitust squash-merge'i, sulgeb issue ning koristab harud.

# Aiandusäpi arendusjuhised

- Loe enne muudatusi [projekti kirjeldust](README.md). Äpi põhifunktsioon on kuufaaside järgi soovitatud külvipäevade leidmine Eesti kasvutingimustes.
- Tee külvisoovituse arvutus kontrollitavaks. Iga soovitus peab viitama kultuuri ja külviviisi külviaknale, kuufaasi allikale ning rakendunud pärimusreeglile.
- Kasuta eestikeelses kasutajaliideses arusaadavaid olekuid ja kuupäevi. Märgi pärimuslik soovitus sellisena. Külviaeg sõltub ka sordist, mulla temperatuurist ja öökülmaohust.
- Kasuta põhiteekonnas kohalikku andmestikku ja küsi õigusi ainult funktsiooni jaoks, mis neid vajab. Arvesta Androidi ja iOS-i ligipääsetavusega.
- Delegeerimisel kasuta sobivat rolli kaustast `.codex/agents`. Anna igale agendile selge tulemus ja tööpiir. Väldi sama faili samaaegset muutmist. Lase soovitusloogika enne avaldamist sõltumatult üle kontrollida.
- Esita lõpetamisel tegelikult käivitatud kontrollid ning nimeta asjakohased kontrollid, mida keskkonnas teha ei saanud.
- Uuenda pärast iga sisulist arendussammu, otsust või kontrolli automaatselt faili [`arendus/logi.md`](arendus/logi.md), ka siis, kui kasutaja seda eraldi ei palu. Lisa Eesti kuupäeva (`AAAA-KK-PP`) alla tehtud töö, muudetud failid või mõjutatud funktsioonid ning kontrolli tegelik tulemus. Märgi pooleli jäänud töö või takistus, kui see on oluline. Lisa sama päeva tegevused olemasoleva kuupäeva alla ja säilita varasemad sissekanded, et neist saaks koostada päevakokkuvõtteid ja blogipostitusi.


## Agendid

| Agent | Ülesanne ja tulemus |
| --- | --- |
| [Kasutuskogemuse disainer](.codex/agents/kasutuskogemuse_disainer.toml) | Kavandab vaated ja kasutajateekonnad. Annab arendajale üle kasutajatekstid, vaadete olekud ja kontrollitavad vastuvõtukriteeriumid. |
| [Külviandmete spetsialist](.codex/agents/kulviandmete_spetsialist.toml) | Kontrollib külviaknaid, kuufaase ja pärimusreegleid. Annab üle allikad, andmed ja arvutuse kontrollnäited. |
| [Rakenduse arendaja](.codex/agents/rakenduse_arendaja.toml) | Rakendab kokkulepitud muudatuse Expo äpis ning annab üle muudetud failid ja kontrollide tulemused. |
| [Kvaliteedi ülevaataja](.codex/agents/kvaliteedi_ulevaataja.toml) | Kontrollib muudatust sõltumatult. Annab üle leiud koos mõju, asukoha ja kordamise sammudega. |

Kasuta ülesande andmisel TOML-failis olevat nime. Määra igale ülesandele oodatav tulemus ja failid, mida tohib muuta. Peaagent koondab tulemused ja lisab ühise arenduslogi sissekande.

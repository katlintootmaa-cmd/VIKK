# Guess the Number

Buniga terminalis töötav TypeScripti mäng. Arvuti valib ühe juhusliku täisarvu vahemikus 1–10. Sisesta oma nimi ja paku numbreid. `Higher` tähendab, et õige number on suurem, ning `Lower`, et see on väiksem. Väljumiseks sisesta `q` või `quit`.

Iga vale pakkumine vähendab skoori ühe võrra. Esimesel katsel arvates on skoor 0, mis on parim võimalik tulemus. Vigased sisestused skoori ei mõjuta. Mäng läheb arvesse pärast esimest kehtivat pakkumist ka siis, kui lahkud enne õige numbri leidmist.

Edetabel kuvab kümme parimat mängijat. Kui sinu koht jääb esikümnest välja, kuvatakse see eraldusjoone all. `leaderboard.json` sisaldab alguses näidisandmeid ning salvestab iga mängija parima skoori, mängude arvu ja viimase mängu aja. Nime suurtähed ja väiketähed kuuluvad samale mängijale. Varasem eestikeelne versioon salvestas punktid faili `edetabel.json` teisel skaalal.

Käivita hoidla juurkaustast PowerShellis järgmiste käskudega.

```powershell
Set-Location 'Sissejuhatus programmeerimisse/numbrimang'
bun start
```

Samas kaustas töötab ka `bun run index.ts`.

import type { Crop } from '../calendar.ts';

const springGreenhouse = 'https://jardin.ee/koogiviljade-kulvikalender-millal-on-oige-aeg-kulvata/';
const springGrains = 'https://www.yara.ee/siteassets/tools/teatmik/teatmik_2024-06web.pdf';
const paprika = 'https://aianduskool.ee/katrinu/Paprika_katmikalal.pdf';
const sweetCorn = 'https://www.kekkila.ee/taimeraamat/mais/';
const localSwede = 'https://metk.agri.ee/kohalik-sinine';
const vegetableGuide = 'https://dspace.emu.ee/server/api/core/bitstreams/4722c2e5-7b08-438c-b103-82edfce86b88/content';
const onion = 'https://www.eestiloodus.ee/arhiiv/EL01-2024.pdf';
const springGrainAdvice = 'Aprilli lõpp ja mai algus on tavapärane külviaeg. Vali päev põllu haritavuse ja mullaniiskuse järgi.';

// Month parts are represented by inclusive calendar dates. Local growing conditions determine the actual day.
export const EXTRA_CROPS: Crop[] = [
  {
    id: 'kaalikas', name: 'Kaalikas', icon: '🌱', method: 'outdoor',
    lunar: 'waning', start: '05-11', end: '05-31',
    advice: 'Säilituskaalikas külva otse peenrasse umbes 1,5–2 cm sügavusele.',
    source: 'https://aianduskool.ee/katrinu/Kaalikas.pdf',
  },
  {
    id: 'kaalikas-ettekasvatus', name: 'Kaalikas', icon: '🌱', method: 'indoors',
    lunar: 'waning', start: '05-11', end: '05-20',
    advice: 'Säilitussordi „Kohalik sinine“ istikute jaoks külva mai keskpaiku. Teiste sortide puhul vaata seemnepakendit.',
    source: localSwede,
  },
  {
    id: 'kaalikas-istutamine', name: 'Kaalikas', icon: '🌱', method: 'outdoor-plant',
    start: '06-11', end: '06-20',
    advice: 'Säilitussordi „Kohalik sinine“ ettekasvatatud taimed istuta avamaale juuni keskpaiku.',
    source: localSwede,
  },
  {
    id: 'peakapsas-ettekasvatus', name: 'Valge peakapsas', icon: '🥬', method: 'indoors',
    lunar: 'waxing', start: '03-01', end: '04-30',
    advice: 'Külva varajased sordid märtsi esimesel kahel kolmandikul, hilised aprilli esimesel kahel kolmandikul ja keskvalmivad aprilli teisel poolel.',
    source: vegetableGuide,
  },
  {
    id: 'peakapsas-istutamine', name: 'Valge peakapsas', icon: '🥬', method: 'outdoor-plant',
    lunar: 'waxing', start: '04-21', end: '06-07',
    advice: 'Karasta istikud. Varajane kapsas istuta aprilli lõpus või mai alguses, hiline mai keskel ja keskvalmiv hiljemalt juuni esimesel nädalal.',
    source: vegetableGuide,
  },
  {
    id: 'porgand-kasvuhoone', careId: 'porgand', name: 'Porgand', icon: '🥕', method: 'greenhouse-sow',
    lunar: 'waning', start: '04-01', end: '04-30',
    advice: 'Varajase saagi jaoks külva varajane sort otse kasvuhoone peenrasse, kui muld on haritav.',
    source: 'https://ehitusest.ee/uudis/2025/04/07/kannatust-rohenapud-kevadel-ei-maksa-liigselt-kiirustada/',
  },
  {
    id: 'sibul-ettekasvatus', name: 'Sibul', icon: '🧅', method: 'indoors',
    lunar: 'waning', start: '03-01', end: '03-31',
    advice: 'Tarbesibula kasvatamiseks külva seemned toas umbes 50–60 päeva enne plaanitud avamaale istutamist.',
    source: onion,
  },
  {
    id: 'tippsibul-istutamine', name: 'Tippsibul', icon: '🧅', method: 'outdoor-plant',
    start: '05-01', end: '05-10',
    advice: 'Pane tippsibulad peenrasse, kui suurem öökülmaoht on möödas ja muld on haritav.',
    source: onion,
  },
  {
    id: 'till', name: 'Till', icon: '🌿', method: 'outdoor',
    lunar: 'waxing', start: '04-01', end: '04-30',
    advice: 'Varajase saagi jaoks külva aprillis otse peenrasse. Külma kevade korral kasuta katteloori või oota mulla soojenemist.',
    source: 'https://www.maheseemned.ee/et/artiklid-nipid-taimekasvatuse-opetused/1478-millsieid-maitsetaimi-kylvata-aprillis',
  },
  {
    id: 'spinat', name: 'Spinat', icon: '🥬', method: 'outdoor',
    lunar: 'waxing', start: '04-01', end: '04-30',
    advice: 'Külva kevadel otse peenrasse, kui muld on haritav. Spinat kasvab hästi jahedas.',
    source: 'https://www.maheseemned.ee/et/artiklid-nipid-taimekasvatuse-opetused/1477-milliseid-koogivilju-kylvata-aprillis',
  },
  {
    id: 'soogipeet', name: 'Söögipeet', icon: '🌱', method: 'outdoor',
    lunar: 'waning', start: '05-11', end: '05-31',
    advice: 'Külva otse peenrasse, kui muld on soojenenud 8–10 °C-ni.',
    source: vegetableGuide,
  },
  {
    id: 'redis-kasvuhoone', careId: 'redis', name: 'Redis', icon: '🌱', method: 'greenhouse-sow',
    lunar: 'waning', start: '04-01', end: '04-30',
    advice: 'Külva kevadel otse kasvuhoone peenrasse, kui ilm lubab ja muld on haritav.',
    source: springGreenhouse,
  },
  {
    id: 'salat-kasvuhoone', careId: 'salat', name: 'Aedsalat', icon: '🥬', method: 'greenhouse-sow',
    lunar: 'waxing', start: '04-01', end: '04-30',
    advice: 'Külva otse kasvuhoone peenrasse, kui ilm lubab. Varajane salat jõuab kasvada enne tomatite istutamist.',
    source: springGreenhouse,
  },
  {
    id: 'tomat-kasvuhoone', careId: 'tomat', name: 'Tomat', icon: '🍅', method: 'greenhouse-plant',
    lunar: 'waxing', start: '05-11', end: '05-31',
    advice: 'Istuta taimed kütteta kasvuhoonesse, kui muld on soojenenud ja suurem öökülmaoht möödas. Pärast istutamist kasta.',
    source: 'https://aianduskool.ee/katrinu/Tomat_katmikalal.pdf',
  },
  {
    id: 'kurk-kasvuhoone', careId: 'kurk', name: 'Kurk', icon: '🥒', method: 'greenhouse-plant',
    lunar: 'waxing', start: '05-21', end: '06-10',
    advice: 'Istuta kütteta kasvuhoonesse sooja mulda pärast öökülmaohu möödumist. Toesta kasvama hakkavad taimed nööriga.',
    source: 'https://seminar.balticagro.ee/lessons/kurgi-kasvatusjuhis/',
  },
  {
    id: 'paprika-ettekasvatus', name: 'Paprika', icon: '🫑', method: 'indoors',
    lunar: 'waxing', start: '03-01', end: '03-20',
    advice: 'Külva sooja kohta. Arvesta istikute ettekasvatuseks umbes 60–70 päeva ja taga piisav valgus.',
    source: paprika,
  },
  {
    id: 'paprika-kasvuhoone', name: 'Paprika', icon: '🫑', method: 'greenhouse-plant',
    lunar: 'waxing', start: '05-21', end: '06-10',
    advice: 'Istuta kütteta kasvuhoonesse pärast mulla soojenemist. Jäta taim samale sügavusele, kus see potis kasvas.',
    source: paprika,
  },
  {
    id: 'suvioder', name: 'Suvioder', icon: '🌾', category: 'field', method: 'outdoor',
    lunar: 'waxing',
    start: '04-21', end: '05-10', advice: springGrainAdvice, source: springGrains,
  },
  {
    id: 'kaer', name: 'Kaer', icon: '🌾', category: 'field', method: 'outdoor',
    lunar: 'waxing',
    start: '04-21', end: '05-10', advice: springGrainAdvice, source: springGrains,
  },
  {
    id: 'suvinisu', name: 'Suvinisu', icon: '🌾', category: 'field', method: 'outdoor',
    lunar: 'waxing',
    start: '04-21', end: '05-10', advice: springGrainAdvice, source: springGrains,
  },
  {
    id: 'talirukis', name: 'Talirukis', icon: '🌾', category: 'field', method: 'outdoor',
    lunar: 'waxing',
    start: '08-25', end: '09-05',
    advice: 'Külviaeg peab jätma rukkile sügisel võrsumiseks aega. Saartel võib sobida hilisem külv.',
    source: 'https://www.maheklubi.ee/upload/Editor/New%20Folder/mahepollumajanduse_alused.pdf',
  },
  {
    id: 'silomais', name: 'Silomais', icon: '🌽', category: 'field', method: 'outdoor',
    lunar: 'waxing',
    start: '05-08', end: '05-14',
    advice: 'Mai teine nädal on Eestis tavapärane. Külviaja määrab mulla soojus külvisügavusel. Oota, kui muld on veel külm.',
    source: 'https://metk.agri.ee/sites/default/files/documents/2025-11/Jatkusuutlik-silotootmine-kasiraamat_0.pdf',
  },
  {
    id: 'suhkrumais-ettekasvatus', name: 'Suhkrumais', icon: '🌽', category: 'field', method: 'indoors',
    lunar: 'waxing',
    start: '05-11', end: '05-27',
    advice: 'Vali varajane sort ja külva potti 2–3 nädalat enne plaanitud väljaistutamist. Nihuta külviaega, kui öökülmaoht lükkab istutamise edasi.',
    source: sweetCorn,
  },
  {
    id: 'suhkrumais-istutamine', name: 'Suhkrumais', icon: '🌽', category: 'field', method: 'outdoor-plant',
    start: '06-01', end: '06-10',
    advice: 'Karasta taimi enne istutamist. Istuta päikeselisse, sooja kasvukohta pärast öökülmaohu möödumist.',
    source: sweetCorn,
  },
];

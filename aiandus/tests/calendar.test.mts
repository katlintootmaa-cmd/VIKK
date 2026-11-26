import assert from 'node:assert/strict';
import test from 'node:test';
import { CROPS, addDays, calendarSeason, formatDay, inSeason, isPlanting, localDay, lunarPeriod, monthGrid, moonEvent, nextSuggestedDay, nextWindow, parseDayInput, recommended, sowingWindowCoverage, tallinnTime, upcomingLunarRanges, validDay, withSowingPeriod } from '../src/calendar.ts';

test('calendar season uses today and lists only upcoming recommended days in order', () => {
  const tomato = CROPS.find(({ id }) => id === 'tomat')!;
  assert.equal(calendarSeason(tomato, '2027', '2027-02-28').status, 'upcoming');
  const active = calendarSeason(tomato, '2027', '2027-03-21');
  assert.equal(active.status, 'active');
  assert.deepEqual(active.days, ['2027-03-21', '2027-03-22']);
  assert.deepEqual(active.suggestion, { status: 'found', day: '2027-03-21', earlierDataMissing: false });
  assert.deepEqual(calendarSeason(tomato, '2027', '2027-03-23').suggestion, { status: 'no-match' });
});

test('calendar season ignores past data gaps and opens the following year for the same crop', () => {
  const tomato = CROPS.find(({ id }) => id === 'tomat')!;
  const shortWindow = { ...tomato, start: '01-13', end: '01-14' };
  assert.deepEqual(calendarSeason(shortWindow, '2025', '2025-01-13').suggestion, { status: 'missing-data' });
  assert.deepEqual(calendarSeason(shortWindow, '2025', '2025-01-14').suggestion, { status: 'no-match' });
  const ended = calendarSeason(tomato, '2027', '2027-12-31');
  assert.equal(ended.status, 'ended');
  assert.deepEqual(ended.days, []);
  assert.deepEqual(ended.followingWindow, { start: '2028-03-01', end: '2028-03-31' });
  assert.deepEqual(calendarSeason(tomato, '2028', '2028-01-01').window, ended.followingWindow);
});

test('Tallinn civil dates and reminder times respect summer time and midnight', () => {
  assert.equal(localDay(new Date('2027-01-07T22:05:00Z')), '2027-01-08');
  assert.equal(tallinnTime('2027-03-27', 9).toISOString(), '2027-03-27T07:00:00.000Z');
  assert.equal(tallinnTime('2027-03-28', 9).toISOString(), '2027-03-28T06:00:00.000Z');
  assert.equal(tallinnTime('2027-10-31', 9).toISOString(), '2027-10-31T07:00:00.000Z');
});

test('calendar handles leap years, Monday weeks, and year boundaries', () => {
  assert.equal(validDay('2027-02-29'), false);
  assert.equal(validDay('2028-02-29'), true);
  assert.equal(addDays('2027-12-31', 1), '2028-01-01');
  assert.equal(monthGrid('2027-05-12')[0], '2027-04-26');
  assert.equal(monthGrid('2027-05-12').at(-1), '2027-06-06');
});

test('date fields accept both day-first formats and display stored dates with four-digit years', () => {
  assert.equal(formatDay('2028-02-09'), '09-02-2028');
  assert.equal(parseDayInput('09-02-2028'), '2028-02-09');
  assert.equal(parseDayInput('09-02-28'), '2028-02-09');
  assert.equal(parseDayInput('29-02-00'), '2000-02-29');
  assert.equal(parseDayInput('31-12-1999'), '1999-12-31');
  assert.equal(parseDayInput('29-02-27'), undefined);
  assert.equal(parseDayInput('31-04-2028'), undefined);
  assert.equal(parseDayInput('2028-02-09'), undefined);
});
test('moon phase display and lunar sowing classification use the published instant', () => {
  assert.equal(moonEvent('2027-01-07')?.instant, '2027-01-07T20:24:00Z');
  assert.equal(lunarPeriod('2027-01-07'), 'waning');
  assert.equal(lunarPeriod('2027-01-08'), 'waxing');
  assert.equal(lunarPeriod('2032-01-01'), undefined);
  const tomato = CROPS.find(({ id }) => id === 'tomat')!;
  assert.equal(inSeason(tomato, '2027-03-01'), true);
  assert.equal(inSeason(tomato, '2027-03-31'), true);
  assert.equal(recommended(tomato, '2027-04-01'), false);
  assert.equal(recommended(tomato, '2032-03-15'), false);
  assert.deepEqual(nextWindow(tomato, '2027-04-01'), { start: '2028-03-01', end: '2028-03-31' });
});

test('a full moon after Tallinn noon affects recommendations starting the next day', () => {
  const tomato = CROPS.find(({ id }) => id === 'tomat')!;
  assert.equal(moonEvent('2027-03-22')?.instant, '2027-03-22T10:44:00Z');
  assert.equal(lunarPeriod('2027-03-22'), 'waxing');
  assert.equal(recommended(tomato, '2027-03-22'), true);
  assert.equal(lunarPeriod('2027-03-23'), 'waning');
  assert.equal(recommended(tomato, '2027-03-23'), false);
});

test('a late UTC full moon appears on the next civil day in Tallinn', () => {
  const carrot = CROPS.find(({ id }) => id === 'porgand')!;
  assert.equal(moonEvent('2027-04-20'), undefined);
  assert.equal(moonEvent('2027-04-21')?.instant, '2027-04-20T22:27:00Z');
  assert.equal(recommended(carrot, '2027-04-21'), true);
});

test('next suggested day distinguishes a match, no match, missing data, and the end of the window', () => {
  const tomato = CROPS.find(({ id }) => id === 'tomat')!;
  assert.deepEqual(nextSuggestedDay(tomato, '2027-02-28'), { status: 'found', day: '2027-03-08', earlierDataMissing: false });
  assert.deepEqual(nextSuggestedDay(tomato, '2027-03-22'), { status: 'found', day: '2027-03-22', earlierDataMissing: false });
  assert.deepEqual(nextSuggestedDay(tomato, '2027-03-23'), { status: 'no-match' });
  assert.deepEqual(nextSuggestedDay(tomato, '2032-03-15'), { status: 'missing-data' });
  assert.deepEqual(nextSuggestedDay(tomato, '2027-04-01'), { status: 'season-ended' });
});

test('crops keep their growing window outside lunar data coverage', () => {
  const spinach = CROPS.find(({ id }) => id === 'spinat')!;
  const season = calendarSeason(spinach, '2032', '2032-03-20');
  assert.equal(season.status, 'upcoming');
  assert.deepEqual(season.suggestion, { status: 'missing-data' });
  assert.deepEqual(season.days, []);
  assert.equal(inSeason(spinach, season.window.start), true);
  assert.equal(recommended(spinach, season.window.start), false);
});

test('every sowing window uses its selected lunar period, including greenhouse work', () => {
  for (const crop of CROPS.filter(({ method }) => !isPlanting(method))) {
    const season = calendarSeason(crop, '2027', '2027-01-01');
    assert.ok(crop.lunar, crop.id);
    for (let day = season.window.start; day <= season.window.end; day = addDays(day, 1)) {
      assert.equal(recommended(crop, day), lunarPeriod(day) === crop.lunar, `${crop.id} ${day}`);
    }
    assert.notEqual(season.suggestion.status, 'no-rule', crop.id);
  }
});

test('sowing preference changes eligible days while preserving the original window and planting', () => {
  const dill = CROPS.find(({ id }) => id === 'till')!;
  const changed = withSowingPeriod(dill, 'waning');
  assert.equal(dill.lunar, 'waxing');
  const season = calendarSeason(changed, '2027', '2027-04-21');
  assert.equal(season.window.start, '2027-04-01');
  assert.equal(season.window.end, '2027-04-30');
  assert.equal(recommended(dill, '2027-04-21'), false);
  assert.equal(recommended(changed, '2027-04-21'), true);
  const planting = CROPS.find(({ id }) => id === 'tomat-kasvuhoone')!;
  assert.equal(withSowingPeriod(planting, 'waning'), planting);
});

test('greenhouse planting uses its own window and keeps existing crop entries distinct', () => {
  const sowing = CROPS.find(({ id }) => id === 'tomat')!;
  const planting = CROPS.find(({ id }) => id === 'tomat-kasvuhoone')!;
  assert.equal(sowing.method, 'indoors');
  assert.equal(planting.method, 'greenhouse-plant');
  assert.equal(planting.careId, sowing.id);
  const season = calendarSeason(planting, '2027', '2027-05-01');
  assert.equal(inSeason(planting, season.window.start), true);
  assert.equal(inSeason(planting, season.window.end), true);
  assert.equal(inSeason(planting, addDays(season.window.end, 1)), false);
  assert.ok(season.days.length);
  assert.ok(season.days.every((date) => lunarPeriod(date) === 'waxing' && inSeason(planting, date)));
  assert.equal(new Set(CROPS.map(({ id }) => id)).size, CROPS.length);
});

test('a partly covered window reports missing data when no match can be calculated', () => {
  const tomato = CROPS.find(({ id }) => id === 'tomat')!;
  const window = { ...tomato, start: '01-13', end: '01-14' };
  assert.deepEqual(nextSuggestedDay(window, '2025-01-13'), { status: 'missing-data' });
  assert.deepEqual(nextSuggestedDay(window, '2025-01-14'), { status: 'no-match' });
});

test('coverage describes the entire sowing window independently of the selected day', () => {
  const tomato = CROPS.find(({ id }) => id === 'tomat')!;
  assert.deepEqual(sowingWindowCoverage(tomato, '2027'), {
    status: 'complete', coveredRanges: [{ start: '2027-03-01', end: '2027-03-31' }],
  });
  assert.deepEqual(sowingWindowCoverage(tomato, '2032'), { status: 'missing', coveredRanges: [] });

  const window = { ...tomato, start: '01-13', end: '01-15' };
  assert.deepEqual(sowingWindowCoverage(window, '2025'), {
    status: 'partial', coveredRanges: [{ start: '2025-01-14', end: '2025-01-15' }],
  });
  assert.deepEqual(nextSuggestedDay(window, '2025-01-14'), { status: 'no-match' });
});

test('a known match after a date with missing data remains available with a coverage warning', () => {
  const carrot = CROPS.find(({ id }) => id === 'porgand')!;
  const window = { ...carrot, start: '01-13', end: '01-14' };
  assert.deepEqual(nextSuggestedDay(window, '2025-01-13'), {
    status: 'found', day: '2025-01-14', earlierDataMissing: true,
  });
  assert.deepEqual(nextSuggestedDay(window, '2025-01-14'), {
    status: 'found', day: '2025-01-14', earlierDataMissing: false,
  });
});

test('chosen lunar period lists the next three ranges inside the crop window', () => {
  const tomato = CROPS.find(({ id }) => id === 'tomat')!;
  const waxing = upcomingLunarRanges(tomato, 'waxing', '2027-01-01');
  assert.equal(waxing.ranges.length, 3);
  assert.deepEqual(waxing.ranges[0], { start: '2027-03-08', end: '2027-03-22' });
  assert.equal(waxing.missingData, false);
  for (const [index, { start, end }] of waxing.ranges.entries()) {
    for (let day = start; day <= end; day = addDays(day, 1)) {
      assert.ok(inSeason(tomato, day) && lunarPeriod(day) === 'waxing', day);
    }
    assert.ok(!inSeason(tomato, addDays(end, 1)) || lunarPeriod(addDays(end, 1)) !== 'waxing', end);
    if (index > 0) assert.ok(start > addDays(waxing.ranges[index - 1].end, 1));
  }
  assert.ok(waxing.ranges[1].start.startsWith('2028-03'));
  const waning = upcomingLunarRanges(tomato, 'waning', '2027-03-01');
  assert.deepEqual(waning.ranges.slice(0, 2), [{ start: '2027-03-01', end: '2027-03-07' }, { start: '2027-03-23', end: '2027-03-31' }]);
  assert.deepEqual(upcomingLunarRanges(tomato, 'waxing', '2027-03-10').ranges[0], { start: '2027-03-10', end: '2027-03-22' });
});

test('chosen lunar period reports when moon phase data runs out', () => {
  const tomato = CROPS.find(({ id }) => id === 'tomat')!;
  const result = upcomingLunarRanges(tomato, 'waxing', '2031-06-01');
  assert.deepEqual(result.ranges, []);
  assert.equal(result.missingData, true);
});

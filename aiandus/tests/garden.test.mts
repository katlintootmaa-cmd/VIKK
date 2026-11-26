import assert from 'node:assert/strict';
import test from 'node:test';
import { CROPS } from '../src/calendar.ts';
import { forecastFit, forecastWindows, plantProfile, plantingTasks, rotationConflicts, type CustomCrop } from '../src/garden.ts';
import type { ForecastDay } from '../src/weather.ts';

const radish = CROPS[0];
const custom: CustomCrop = { ...radish, id: 'kaalikas', name: 'Kaalikas', profile: { ...plantProfile(radish), minAir: 6 } };
const readings = (day: string, low: number, soilTemperature?: number): ForecastDay => ({
  day, low, soilTemperature, high: 15, rain: null, wind: null, code: null, frost: low <= 0,
});

test('temperature windows stay within the crop season and split at cold or incomplete days', () => {
  const forecast = [
    readings('2027-04-19', 8, 9), readings('2027-04-20', 4, 7), readings('2027-04-21', 5, 9),
    readings('2027-04-22', 8), readings('2027-04-23', 8, 3), readings('2027-04-24', 5, 7),
  ];
  assert.deepEqual(forecastWindows(radish, forecast, '2027-04-19', 'outdoor', 5), [
    { start: '2027-04-20', end: '2027-04-21' }, { start: '2027-04-24', end: '2027-04-24' },
  ]);
  assert.equal(forecastFit(radish, forecast[1], 'greenhouse', 5), 'cold');
  assert.equal(forecastFit(radish, forecast[1], 'greenhouse', 4), 'suitable');
  assert.equal(forecastFit(custom, forecast[2], 'outdoor', 5), 'cold');
  assert.equal(forecastFit(radish, forecast[3], 'outdoor', 5), 'unknown');
});

test('rotation compares crop families within two seasons in the same named bed', () => {
  const history = [
    { id: 'near', cropId: radish.id, bed: 'Peenar 1', day: '2026-05-01', completed: [] },
    { id: 'old', cropId: radish.id, bed: 'Peenar 1', day: '2024-05-01', completed: [] },
    { id: 'other', cropId: radish.id, bed: 'Peenar 2', day: '2026-05-01', completed: [] },
  ];
  const candidate = { id: '', bed: ' peenar 1 ', day: '2027-05-01' };
  assert.deepEqual(rotationConflicts(history, candidate, custom, [...CROPS, custom]).map(({ id }) => id), ['near']);
  assert.equal(rotationConflicts(history, candidate, CROPS[1], CROPS).length, 0);
});

test('planting dates generate the right care tasks across years and preserve completion by task date', () => {
  const planting = { id: '1', cropId: radish.id, bed: 'Peenar 1', day: '2027-12-31', completed: ['water:2027-12-31'] };
  assert.deepEqual(plantingTasks(planting, radish).map(({ kind, day, done }) => [kind, day, done]), [
    ['water', '2027-12-31', true], ['thin', '2028-01-10', false], ['feed', '2028-01-14', false],
    ['harvest', '2028-01-28', false],
  ]);
  assert.equal(plantingTasks(planting, CROPS[4]).some(({ kind }) => kind === 'thin'), false);
});


test('every built-in crop has a garden profile for forecasts and care tasks', () => {
  for (const crop of CROPS) assert.ok(plantProfile(crop), crop.id);
});

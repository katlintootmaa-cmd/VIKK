import assert from 'node:assert/strict';
import test from 'node:test';
import { CARE, careMoonDays, nextFeedingRange } from '../src/care.ts';
import { CROPS } from '../src/calendar.ts';

test('all detailed guides are sourced and linked from their crop variants', () => {
  for (const [id, guide] of Object.entries(CARE)) {
    assert.ok(CROPS.some((crop) => crop.id === id), id);
    assert.ok(guide.stages.length >= 3, id);
    assert.ok(guide.sources.length, id);
  }
  for (const crop of CROPS.filter(({ careId }) => careId !== undefined)) {
    assert.ok(crop.careId && CARE[crop.careId], crop.id);
  }
});

test('feeding intervals apply to container tomatoes and cucumbers across calendar boundaries', () => {
  assert.deepEqual(nextFeedingRange('tomat', '2026-12-25'), { start: '2027-01-04', end: '2027-01-08' });
  assert.deepEqual(nextFeedingRange('kurk', '2028-02-29'), { start: '2028-03-10', end: '2028-03-14' });
  assert.equal(nextFeedingRange('kurk', '2027-02-29'), undefined);
  assert.equal(nextFeedingRange('hernes', '2027-04-15'), undefined);
});

test('care recommendations follow lunar phase without inventing uncovered dates', () => {
  const days = careMoonDays('topping', '2027-01-07');
  assert.equal(days.length, 7);
  assert.equal(days[0].matches, true);
  assert.equal(days[1].matches, false);
  assert.equal(careMoonDays('transplanting', '2027-01-07')[1].matches, true);
  assert.ok(careMoonDays('weeding', '2032-01-01').every(({ period, matches }) => period === undefined && !matches));
});

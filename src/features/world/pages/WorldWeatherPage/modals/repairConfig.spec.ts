import { describe, it, expect } from 'vitest';
import { mergeRepairConfig } from './repairConfig';
import type { WeatherGeneratorConfig } from '@/shared/types';

// Bázový stav: typický "rozbitý" generátor bez klimatu (Ghana, Praha…)
function brokenConfig(
  overrides: Partial<WeatherGeneratorConfig> = {},
): WeatherGeneratorConfig {
  return {
    tempMin: 0,
    tempMax: 25,
    tempUnit: 'C',
    weatherTypes: [
      {
        type: 'clear',
        label: 'Slunečno',
        icon: 'sun',
        probability: 60,
        cloudRange: [0, 2],
        precipRange: [0, 0],
      },
    ],
    windMin: 0,
    windMax: 30,
    windGustMultiplier: 1.5,
    pressureMin: 990,
    pressureMax: 1030,
    humidityMin: 30,
    humidityMax: 90,
    customFields: [],
    ...overrides,
  };
}

function ghanaPreset(): WeatherGeneratorConfig {
  return {
    tempMin: 19,
    tempMax: 34,
    tempUnit: 'C',
    weatherTypes: [
      {
        type: 'rain',
        label: 'Déšť',
        icon: 'cloud-rain',
        probability: 18,
        cloudRange: [5, 8],
        precipRange: [2, 20],
      },
    ],
    windMin: 0,
    windMax: 40,
    windGustMultiplier: 1.6,
    pressureMin: 990,
    pressureMax: 1030,
    humidityMin: 30,
    humidityMax: 95,
    customFields: [
      { label: 'Prach v ovzduší', possibleValues: ['nízký'], probability: 25 },
    ],
    monthlyTemps: [27, 28, 28, 28, 28, 27, 26, 25, 26, 27, 28, 27],
    monthlyStdDev: [2.5, 2.5, 2.8, 2.8, 2.5, 2.2, 2.2, 2.2, 2.5, 2.5, 2.8, 2.5],
    climateZone: 'Aw',
  };
}

describe('mergeRepairConfig (9.4-J)', () => {
  it('doplní monthlyTemps/StdDev/climateZone z presetu', () => {
    const out = mergeRepairConfig(brokenConfig(), ghanaPreset());
    expect(out.monthlyTemps).toEqual([
      27, 28, 28, 28, 28, 27, 26, 25, 26, 27, 28, 27,
    ]);
    expect(out.monthlyStdDev).toHaveLength(12);
    expect(out.climateZone).toBe('Aw');
  });

  it('zachová weatherTypes, customFields, wind/pressure/humidity z původního configu', () => {
    const current = brokenConfig({
      weatherTypes: [
        {
          type: 'clear',
          label: 'Vlastní jasno',
          icon: 'sun',
          probability: 80,
          cloudRange: [0, 1],
          precipRange: [0, 0],
        },
      ],
      windMin: 5,
      windMax: 20,
      humidityMin: 40,
      humidityMax: 70,
      customFields: [
        { label: 'Vlastní jev', possibleValues: ['ano'], probability: 50 },
      ],
    });
    const out = mergeRepairConfig(current, ghanaPreset());
    expect(out.weatherTypes[0].label).toBe('Vlastní jasno');
    expect(out.windMin).toBe(5);
    expect(out.windMax).toBe(20);
    expect(out.humidityMin).toBe(40);
    expect(out.humidityMax).toBe(70);
    expect(out.customFields).toHaveLength(1);
    expect(out.customFields[0].label).toBe('Vlastní jev');
  });

  it('přepíše tempMin/tempMax když je current = default 0/25', () => {
    const out = mergeRepairConfig(brokenConfig(), ghanaPreset());
    expect(out.tempMin).toBe(19);
    expect(out.tempMax).toBe(34);
  });

  it('zachová tempMin/tempMax když user ručně needitoval (≠ 0/25)', () => {
    const current = brokenConfig({ tempMin: 5, tempMax: 35 });
    const out = mergeRepairConfig(current, ghanaPreset());
    expect(out.tempMin).toBe(5);
    expect(out.tempMax).toBe(35);
  });

  it('nemutuje původní config', () => {
    const current = brokenConfig();
    const before = JSON.stringify(current);
    mergeRepairConfig(current, ghanaPreset());
    expect(JSON.stringify(current)).toBe(before);
  });
});

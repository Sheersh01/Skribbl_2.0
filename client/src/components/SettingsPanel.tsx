import { useEffect, useRef, useState } from 'react';
import {
  CUSTOM_ONLY_MIN_WORDS,
  SETTING_LIMITS,
  parseCustomWords,
  type Settings,
} from '@skribbl/shared';
import { updateSettings } from '../store';

interface Props {
  settings: Settings;
  editable: boolean;
  playerCount: number;
}

const range = (min: number, max: number, step: number) => {
  const out: number[] = [];
  for (let v = min; v <= max; v += step) out.push(v);
  return out;
};

type NumericKey = keyof typeof SETTING_LIMITS;

const ROWS: { key: NumericKey; label: string; format?: (v: number) => string }[] = [
  { key: 'rounds', label: 'Rounds' },
  { key: 'drawTime', label: 'Draw time', format: (v) => `${v} s` },
  { key: 'wordChoices', label: 'Word choices' },
  { key: 'hints', label: 'Hints' },
  { key: 'maxPlayers', label: 'Max players' },
];

export function SettingsPanel({ settings, editable, playerCount }: Props) {
  const [wordsText, setWordsText] = useState(settings.customWords.join(', '));
  const focused = useRef(false);

  // Keep the textarea in sync with the server, except while the host is typing.
  useEffect(() => {
    if (!focused.current) setWordsText(settings.customWords.join(', '));
  }, [settings.customWords]);

  const wordCount = parseCustomWords(wordsText).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ROWS.map(({ key, label, format }) => {
          const L = SETTING_LIMITS[key];
          const min = key === 'maxPlayers' ? Math.max(L.min, playerCount) : L.min;
          return (
            <label key={key} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <span className="font-medium text-slate-700">{label}</span>
              <select
                value={settings[key]}
                disabled={!editable}
                onChange={(e) => updateSettings({ [key]: Number(e.target.value) })}
                className="rounded-lg border-2 border-slate-200 bg-white px-2 py-1 font-semibold disabled:opacity-70"
              >
                {range(min, L.max, L.step).map((v) => (
                  <option key={v} value={v}>
                    {format ? format(v) : v}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
      </div>

      <label className="flex flex-col gap-1">
        <span className="flex items-baseline justify-between font-medium text-slate-700">
          Custom words
          <span className="text-xs font-normal text-slate-500">
            {wordCount} word{wordCount === 1 ? '' : 's'} · comma-separated
          </span>
        </span>
        <textarea
          value={wordsText}
          disabled={!editable}
          onFocus={() => (focused.current = true)}
          onChange={(e) => setWordsText(e.target.value)}
          onBlur={() => {
            focused.current = false;
            updateSettings({ customWords: parseCustomWords(wordsText) });
          }}
          rows={3}
          placeholder={editable ? 'pizza, rocket, grandma, ice cream…' : 'No custom words'}
          className="resize-y rounded-xl border-2 border-slate-200 px-3 py-2 outline-none focus:border-indigo-400 disabled:bg-slate-50"
        />
      </label>

      <label className="flex items-center gap-2 font-medium text-slate-700">
        <input
          type="checkbox"
          checked={settings.customOnly}
          disabled={!editable}
          onChange={(e) => updateSettings({ customOnly: e.target.checked })}
          className="h-5 w-5 accent-indigo-500"
        />
        Use custom words only
        {settings.customOnly && settings.customWords.length < CUSTOM_ONLY_MIN_WORDS && (
          <span className="text-xs font-normal text-rose-600">(needs {CUSTOM_ONLY_MIN_WORDS}+)</span>
        )}
      </label>
    </div>
  );
}

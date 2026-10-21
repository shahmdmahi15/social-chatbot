import React, { useState } from 'react';
import type { PersonaConfig, ChatLanguage } from '../../../types';
import {
  Sparkles,
  Languages,
  Sliders,
  Smile,
  Bot,
  Terminal,
  Info,
  Check,
} from 'lucide-react';

interface Props {
  persona: PersonaConfig;
  onChange: (persona: Partial<PersonaConfig>) => void;
}

export const PersonaTab: React.FC<Props> = ({ persona, onChange }) => {
  const [saved, setSaved] = useState(false);

  const handleManualSave = () => {
    onChange({ ...persona });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  return (
    <div className="space-y-4">
      {/* 1. Multi-Language Intelligence Selector */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md space-y-2.5">
        <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
          <Languages className="w-4 h-4 text-cyan-400" />
          Language & Dialect Strategy
        </label>

        <p className="text-[11px] text-slate-400">
          The bot will automatically mirror your friend&apos;s language or follow your preference:
        </p>

        <div className="grid grid-cols-2 gap-1.5 pt-1">
          {[
            { id: 'auto', label: 'Auto-Detect (Adaptive)', desc: 'Matches Bangla, Banglish, or English' },
            { id: 'banglish', label: 'Banglish Only', desc: 'e.g., "ki obstha bro, kemon acho"' },
            { id: 'bangla', label: 'Bangla (বাংলা)', desc: 'বাংলা বর্ণমালায় স্বাভাবিক কথোপকথন' },
            { id: 'english', label: 'English Only', desc: 'Casual texting English' },
          ].map((lang) => (
            <button
              key={lang.id}
              onClick={() => onChange({ languagePreference: lang.id as ChatLanguage })}
              className={`p-2 rounded-lg text-left border transition-all ${
                persona.languagePreference === lang.id
                  ? 'bg-cyan-950/70 border-cyan-500 text-white shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <p className="text-xs font-semibold">{lang.label}</p>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{lang.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Real-Time Command / Live Instructions */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-emerald-400" />
            Live Directive / Command Box
          </label>
          <span className="text-[10px] text-emerald-400 font-medium">Applied Immediately</span>
        </div>

        <p className="text-[11px] text-slate-400">
          Tell the LLM what specific goal or boundary to follow for upcoming replies:
        </p>

        <textarea
          rows={3}
          value={persona.customInstructions}
          onChange={(e) => onChange({ customInstructions: e.target.value })}
          placeholder="e.g. Tell him I'm driving right now. If he asks to hang out tonight, say I can only meet after 9:30 PM..."
          className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* 3. Base Identity & Persona Description */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md space-y-2">
        <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
          <Bot className="w-4 h-4 text-indigo-400" />
          Base Persona & Vibe (Your personality & tone)
        </label>

        <textarea
          rows={3}
          value={persona.userPersona}
          onChange={(e) => onChange({ userPersona: e.target.value })}
          placeholder="Casual, friendly tone, chatting naturally with friends on Messenger. Authentic, warm, busy tech enthusiast..."
          className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* 4. Fine-Tuning Style Sliders */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
        <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-yellow-400" />
          Texting Style & Formatting
        </label>

        {/* Reply Length */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Reply Length:</span>
            <span className="text-cyan-400 font-medium capitalize">{persona.replyLength}</span>
          </div>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            {(['short', 'medium', 'detailed'] as const).map((len) => (
              <button
                key={len}
                onClick={() => onChange({ replyLength: len })}
                className={`py-1 rounded text-center transition-all capitalize ${
                  persona.replyLength === len
                    ? 'bg-slate-800 text-white font-medium shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {len}
              </button>
            ))}
          </div>
        </div>

        {/* Emojis toggle */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-slate-300 flex items-center gap-1.5">
            <Smile className="w-3.5 h-3.5 text-yellow-400" />
            Use Emojis (Natural texting style)
          </span>
          <input
            type="checkbox"
            checked={persona.useEmojis}
            onChange={(e) => onChange({ useEmojis: e.target.checked })}
            className="w-4 h-4 rounded text-cyan-600 bg-slate-950 border-slate-700"
          />
        </div>
      </div>

      {/* Explicit Save Persona Button */}
      <button
        type="button"
        onClick={handleManualSave}
        className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md transition-all ${
          saved
            ? 'bg-emerald-600 text-white shadow-emerald-500/20'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
        }`}
      >
        {saved ? (
          <>
            <Check className="w-4 h-4" />
            ✓ Persona & Instructions Saved!
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5" />
            Save Persona & Instructions
          </>
        )}
      </button>
    </div>
  );
};

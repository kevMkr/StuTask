"use client"

import { SKILL_OPTIONS } from "../constants/skills"

export function SkillPicker({ selected = [], onToggle }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {SKILL_OPTIONS.map((skill) => {
        const active = selected.includes(skill)
        return (
          <button
            type="button"
            key={skill}
            onClick={() => onToggle?.(skill)}
            className={`flex items-center justify-between px-4 py-3 rounded-2xl border text-left transition ${
              active ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-blue-200"
            }`}
          >
            <span className="text-sm font-medium">{skill}</span>
            {active && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 13l4 4L19 7" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        )
      })}
    </div>
  )
}

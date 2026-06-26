// fileuse: apply and persist colour theme via CSS variables + localStorage
import { useState, useEffect } from "react";

export const THEMES = [
  { id: "violet", label: "Violet", emoji: "💜", h: 250, s: 80, dark: 48 },
  { id: "ocean", label: "Ocean", emoji: "🔵", h: 218, s: 75, dark: 45 },
  { id: "emerald", label: "Emerald", emoji: "💚", h: 152, s: 65, dark: 40 },
  { id: "rose", label: "Rose", emoji: "🌸", h: 340, s: 75, dark: 48 },
  { id: "amber", label: "Amber", emoji: "🟡", h: 38, s: 90, dark: 45 },
  { id: "crimson", label: "Crimson", emoji: "❤️", h: 0, s: 75, dark: 45 },
  { id: "teal", label: "Teal", emoji: "🩵", h: 174, s: 65, dark: 42 },
  { id: "slate", label: "Slate", emoji: "🩶", h: 215, s: 35, dark: 40 },
];

export function applyTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const { h, s, dark } = theme;
  const root = document.documentElement;

  root.style.setProperty("--purple",       `hsl(${h}, ${s}%, 62%)`);
  root.style.setProperty("--purple-dark",  `hsl(${h}, ${s-10}%, ${dark}%)`);
  root.style.setProperty("--purple-mid",   `hsl(${h}, ${s-5}%, 70%)`);
  root.style.setProperty("--purple-light", `hsl(${h}, ${s}%, 96%)`);
  root.style.setProperty("--bg",           `hsl(${h}, 30%, 97%)`);
  root.style.setProperty("--border",       `hsla(${h}, ${s}%, 55%, 0.16)`);
  root.style.setProperty("--border-sketch",`hsla(${h}, ${s}%, 45%, 0.30)`);
  root.style.setProperty("--text",         `hsl(${h}, 40%, 12%)`);
  root.style.setProperty("--text-muted",   `hsl(${h}, 20%, 50%)`);

  root.style.setProperty("--grid-color",   `hsla(${h}, ${s}%, 50%, 0.07)`);
  root.style.setProperty("--mesh1",        `hsla(${h}, ${s}%, 62%, 0.22)`);
  root.style.setProperty("--mesh2",        `hsla(${h + 30}, ${s}%, 65%, 0.14)`);
}

export function useTheme() {
  const [themeId, setThemeId] = useState(() => {
    const saved = localStorage.getItem("pip-theme") || "violet";
    applyTheme(saved); 
    return saved;
  });

  const setTheme = (id) => {
    applyTheme(id);
    localStorage.setItem("pip-theme", id);
    setThemeId(id);
  };

  return { themeId, setTheme, themes: THEMES };
}

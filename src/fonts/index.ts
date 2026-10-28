import localFont from "next/font/local";

// Every font ships with the app (PRD RES-7), so nothing is fetched from a font
// CDN and the app and its PDFs work offline. See README.md in this folder.
//
// Each font sets a --typeface-* variable on <html>; globals.css maps them to
// Tailwind's font-* utilities, and the resume themes use them directly.

/** UI text. */
export const geist = localFont({
  src: "./geist/Geist-Variable.woff2",
  weight: "100 900",
  variable: "--typeface-geist",
  fallback: ["Helvetica", "Arial", "sans-serif"],
});

/** Page and section titles; also a resume theme font. */
export const newsreader = localFont({
  src: [
    { path: "./newsreader/Newsreader-Variable.woff2", weight: "200 800", style: "normal" },
    { path: "./newsreader/Newsreader-Italic-Variable.woff2", weight: "200 800", style: "italic" },
  ],
  variable: "--typeface-newsreader",
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});

// The remaining fonts are only used on some screens (code-like values, resume
// themes), so they load when a page uses them instead of being preloaded.

export const plexSans = localFont({
  src: "./ibm-plex-sans/IBMPlexSans-Variable.woff2",
  weight: "100 700",
  variable: "--typeface-plex-sans",
  fallback: ["Helvetica", "Arial", "sans-serif"],
  preload: false,
});

export const plexMono = localFont({
  src: [
    { path: "./ibm-plex-mono/IBMPlexMono-Regular.woff2", weight: "400", style: "normal" },
    { path: "./ibm-plex-mono/IBMPlexMono-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--typeface-plex-mono",
  fallback: ["ui-monospace", "monospace"],
  adjustFontFallback: false,
  preload: false,
});

export const ebGaramond = localFont({
  src: "./eb-garamond/EBGaramond-Variable.woff2",
  weight: "400 800",
  variable: "--typeface-eb-garamond",
  fallback: ["Garamond", "Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
  preload: false,
});

// More resume theme fonts: serifs, then sans, then mono.

export const sourceSerif = localFont({
  src: "./source-serif-4/SourceSerif4-Variable.woff2",
  weight: "200 900",
  variable: "--typeface-source-serif",
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
  preload: false,
});

export const lora = localFont({
  src: "./lora/Lora-Variable.woff2",
  weight: "400 700",
  variable: "--typeface-lora",
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
  preload: false,
});

export const libreCaslon = localFont({
  src: "./libre-caslon-text/LibreCaslonText-Variable.woff2",
  weight: "400 700",
  variable: "--typeface-libre-caslon",
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
  preload: false,
});

export const playfair = localFont({
  src: "./playfair-display/PlayfairDisplay-Variable.woff2",
  weight: "400 900",
  variable: "--typeface-playfair",
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
  preload: false,
});

export const fraunces = localFont({
  src: "./fraunces/Fraunces-Variable.woff2",
  weight: "100 900",
  variable: "--typeface-fraunces",
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
  preload: false,
});

export const inter = localFont({
  src: "./inter/Inter-Variable.woff2",
  weight: "100 900",
  variable: "--typeface-inter",
  fallback: ["Helvetica", "Arial", "sans-serif"],
  preload: false,
});

export const manrope = localFont({
  src: "./manrope/Manrope-Variable.woff2",
  weight: "200 800",
  variable: "--typeface-manrope",
  fallback: ["Helvetica", "Arial", "sans-serif"],
  preload: false,
});

export const workSans = localFont({
  src: "./work-sans/WorkSans-Variable.woff2",
  weight: "100 900",
  variable: "--typeface-work-sans",
  fallback: ["Helvetica", "Arial", "sans-serif"],
  preload: false,
});

export const spaceGrotesk = localFont({
  src: "./space-grotesk/SpaceGrotesk-Variable.woff2",
  weight: "300 700",
  variable: "--typeface-space-grotesk",
  fallback: ["Helvetica", "Arial", "sans-serif"],
  preload: false,
});

export const jetbrainsMono = localFont({
  src: "./jetbrains-mono/JetBrainsMono-Variable.woff2",
  weight: "100 800",
  variable: "--typeface-jetbrains-mono",
  fallback: ["ui-monospace", "monospace"],
  adjustFontFallback: false,
  preload: false,
});

// Fallbacks for the scripts the theme fonts don't cover, so documents in
// Greek, Arabic, Persian, Hindi, Chinese, Japanese or Korean never depend on
// the fonts a system happens to have (E5-8). Each face only claims its own
// script's characters (unicode-range): documents list them before the theme
// font, Latin text skips them, and a browser downloads one only for text that
// needs it. Their variables name the face alone, without system fallbacks.
// (next/font only takes literal options, so the ranges are spelled out.)

/** Greek for serif themes: Newsreader has none, EB Garamond does. */
export const greekSerif = localFont({
  src: "./eb-garamond/EBGaramond-Variable.woff2",
  weight: "400 800",
  variable: "--typeface-greek-serif",
  adjustFontFallback: false,
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0370-03FF, U+1F00-1FFF" }],
});

/** Greek for sans and mono themes: Geist and Plex Mono have none, Plex Sans does. */
export const greekSans = localFont({
  src: "./ibm-plex-sans/IBMPlexSans-Variable.woff2",
  weight: "100 700",
  variable: "--typeface-greek-sans",
  adjustFontFallback: false,
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0370-03FF, U+1F00-1FFF" }],
});

/** Arabic and Persian. */
export const plexSansArabic = localFont({
  src: [
    { path: "./ibm-plex-sans-arabic/IBMPlexSansArabic-Regular.woff2", weight: "400" },
    { path: "./ibm-plex-sans-arabic/IBMPlexSansArabic-Medium.woff2", weight: "500" },
    { path: "./ibm-plex-sans-arabic/IBMPlexSansArabic-SemiBold.woff2", weight: "600" },
  ],
  variable: "--typeface-plex-sans-arabic",
  adjustFontFallback: false,
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0600-06FF, U+0750-077F, U+0870-08FF, U+FB50-FDFF, U+FE70-FEFF, U+200C-200F" }],
});

/** Hindi. */
export const plexSansDevanagari = localFont({
  src: [
    { path: "./ibm-plex-sans-devanagari/IBMPlexSansDevanagari-Regular.woff2", weight: "400" },
    { path: "./ibm-plex-sans-devanagari/IBMPlexSansDevanagari-Medium.woff2", weight: "500" },
    { path: "./ibm-plex-sans-devanagari/IBMPlexSansDevanagari-SemiBold.woff2", weight: "600" },
  ],
  variable: "--typeface-plex-sans-devanagari",
  adjustFontFallback: false,
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0900-097F, U+1CD0-1CFF, U+A8E0-A8FF, U+200C-200D, U+20B9, U+25CC" }],
});

/** Japanese: kana and the JIS kanji. */
export const plexSansJp = localFont({
  src: [
    { path: "./ibm-plex-sans-jp/IBMPlexSansJP-Regular.woff2", weight: "400" },
    { path: "./ibm-plex-sans-jp/IBMPlexSansJP-Medium.woff2", weight: "500" },
    { path: "./ibm-plex-sans-jp/IBMPlexSansJP-SemiBold.woff2", weight: "600" },
  ],
  variable: "--typeface-plex-sans-jp",
  adjustFontFallback: false,
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+3000-303F, U+3400-4DBF, U+4E00-9FFF, U+F900-FAFF, U+FF00-FFEF, U+3040-30FF, U+31F0-31FF" }],
});

/** Korean: every Hangul syllable. */
export const plexSansKr = localFont({
  src: [
    { path: "./ibm-plex-sans-kr/IBMPlexSansKR-Regular.woff2", weight: "400" },
    { path: "./ibm-plex-sans-kr/IBMPlexSansKR-Medium.woff2", weight: "500" },
    { path: "./ibm-plex-sans-kr/IBMPlexSansKR-SemiBold.woff2", weight: "600" },
  ],
  variable: "--typeface-plex-sans-kr",
  adjustFontFallback: false,
  preload: false,
  declarations: [
    { prop: "unicode-range", value: "U+1100-11FF, U+3000-303F, U+3130-318F, U+A960-A97F, U+AC00-D7AF, U+D7B0-D7FF, U+FF00-FFEF" },
  ],
});

/** Simplified Chinese: the GB 2312 characters, weights 400–600 (see README.md). */
export const notoSansSc = localFont({
  src: "./noto-sans-sc/NotoSansSC-Variable.woff2",
  weight: "400 600",
  variable: "--typeface-noto-sans-sc",
  adjustFontFallback: false,
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+3000-303F, U+3400-4DBF, U+4E00-9FFF, U+F900-FAFF, U+FF00-FFEF" }],
});

/** Class names that define every --typeface-* variable; set on <html>. */
export const fontVariables = [
  geist,
  newsreader,
  plexSans,
  plexMono,
  ebGaramond,
  sourceSerif,
  lora,
  libreCaslon,
  playfair,
  fraunces,
  inter,
  manrope,
  workSans,
  spaceGrotesk,
  jetbrainsMono,
  greekSerif,
  greekSans,
  plexSansArabic,
  plexSansDevanagari,
  plexSansJp,
  plexSansKr,
  notoSansSc,
]
  .map((font) => font.variable)
  .join(" ");

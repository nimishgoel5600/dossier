# Bundled fonts

All fonts are licensed under the SIL Open Font License 1.1; each folder has its `OFL.txt`.

| Folder | Family | Styles | Source file in [google/fonts](https://github.com/google/fonts) |
| --- | --- | --- | --- |
| `geist` | Geist | variable 100–900 | `ofl/geist/Geist[wght].ttf` |
| `newsreader` | Newsreader | variable 200–800, optical size 6–72; roman and italic | `ofl/newsreader/Newsreader[opsz,wght].ttf`, `Newsreader-Italic[opsz,wght].ttf` |
| `ibm-plex-sans` | IBM Plex Sans | variable 100–700, width 85–100 | `ofl/ibmplexsans/IBMPlexSans[wdth,wght].ttf` |
| `ibm-plex-mono` | IBM Plex Mono | 400, 500 | `ofl/ibmplexmono/IBMPlexMono-Regular.ttf`, `IBMPlexMono-Medium.ttf` |
| `eb-garamond` | EB Garamond | variable 400–800 | `ofl/ebgaramond/EBGaramond[wght].ttf` |
| `source-serif-4` | Source Serif 4 | variable 200–900, optical size 8–60 | `ofl/sourceserif4/SourceSerif4[opsz,wght].ttf` |
| `lora` | Lora | variable 400–700 | `ofl/lora/Lora[wght].ttf` |
| `libre-caslon-text` | Libre Caslon Text | variable 400–700 | `ofl/librecaslontext/LibreCaslonText[wght].ttf` |
| `playfair-display` | Playfair Display | variable 400–900 | `ofl/playfairdisplay/PlayfairDisplay[wght].ttf` |
| `fraunces` | Fraunces | variable 100–900, optical size, softness, wonky | `ofl/fraunces/Fraunces[SOFT,WONK,opsz,wght].ttf` |
| `inter` | Inter | variable 100–900, optical size 14–32 | `ofl/inter/Inter[opsz,wght].ttf` |
| `manrope` | Manrope | variable 200–800 | `ofl/manrope/Manrope[wght].ttf` |
| `work-sans` | Work Sans | variable 100–900 | `ofl/worksans/WorkSans[wght].ttf` |
| `space-grotesk` | Space Grotesk | variable 300–700 | `ofl/spacegrotesk/SpaceGrotesk[wght].ttf` |
| `jetbrains-mono` | JetBrains Mono | variable 100–800 | `ofl/jetbrainsmono/JetBrainsMono[wght].ttf` |
| `ibm-plex-sans-arabic` | IBM Plex Sans Arabic | 400, 500, 600 | `ofl/ibmplexsansarabic/IBMPlexSansArabic-{Regular,Medium,SemiBold}.ttf` |
| `ibm-plex-sans-devanagari` | IBM Plex Sans Devanagari | 400, 500, 600 | `ofl/ibmplexsansdevanagari/IBMPlexSansDevanagari-{Regular,Medium,SemiBold}.ttf` |
| `ibm-plex-sans-jp` | IBM Plex Sans JP | 400, 500, 600 | `ofl/ibmplexsansjp/IBMPlexSansJP-{Regular,Medium,SemiBold}.ttf` |
| `ibm-plex-sans-kr` | IBM Plex Sans KR | 400, 500, 600 | `ofl/ibmplexsanskr/IBMPlexSansKR-{Regular,Medium,SemiBold}.ttf` |
| `noto-sans-sc` | Noto Sans SC | variable 400–600, GB 2312 subset | `ofl/notosanssc/NotoSansSC[wght].ttf` |

The first five were downloaded on 27 September 2026, the script fonts on 28 September 2026, and the theme fonts from Source Serif 4 to JetBrains Mono on 3 October 2026. They were converted to WOFF2 without subsetting or other changes, so they keep every script the originals cover (the OFL allows this without renaming fonts with a Reserved Font Name such as Plex). The one exception is Noto Sans SC, below.
To add or update a font, convert it inside the container:

```bash
docker/bin/yarn dlx -p wawoff2 woff2_compress.js Font.ttf Font.woff2
```

Then load it in `index.ts` with `next/font/local`.

## Fonts for other scripts

Documents can be written in Greek, Arabic, Persian, Hindi, Chinese, Japanese and Korean (PRD SET-7), which the theme fonts don't cover (E5-8). `index.ts` loads a fallback face for each script, limited with `unicode-range` to that script's characters, and every document font stack lists them before the theme font (`resolveTheme` in `src/lib/themes.ts`, `--script-fonts` in `src/components/documents/document.module.css`). Latin text skips them, a browser downloads one only for text that needs it, and PDFs never fall back to whatever fonts the server has.

- **Greek:** EB Garamond for serif themes and IBM Plex Sans for the others, loaded a second time with a Greek-only range. Next.js emits those two files twice (0.5 MB); the Greek face has to come before the theme font, because Geist has a handful of Greek letters and would otherwise mix two styles.
- **Arabic and Persian:** IBM Plex Sans Arabic. **Hindi:** IBM Plex Sans Devanagari.
- **Chinese, Japanese, Korean:** Noto Sans SC, IBM Plex Sans JP and IBM Plex Sans KR. Chinese and Japanese share Han characters, so the document's `lang` decides which font draws them first.

Together they add about 8 MB to the image: JP 3.4 MB, Noto Sans SC 1.9 MB, KR 1.8 MB, the Greek copies 0.5 MB, Devanagari 0.3 MB and Arabic 0.2 MB (all bundled fonts: 9 MB in `.next/static/media`). A browser only downloads the ones a document needs.

### Noto Sans SC subset

The full variable font is 7.8 MB as WOFF2. It's cut down to the 6,763 hanzi and the symbols of GB 2312 (the common simplified Chinese set), plus CJK punctuation and full-width forms, and its weight axis to the 400–600 documents use: 1.9 MB. The OFL allows this; its Reserved Font Name is "Source", not "Noto". To rebuild it from the original TTF:

```bash
docker run --rm -v "$PWD":/fonts python:3.13-slim sh -c 'pip install -q fonttools brotli && python - <<EOF
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset
chars = set()
for hi in range(0xA1, 0xF8):
    for lo in range(0xA1, 0xFF):
        try:
            chars.update(bytes([hi, lo]).decode("gb2312"))
        except UnicodeDecodeError:
            pass
unicodes = {ord(c) for c in chars} | set(range(0x3000, 0x3040)) | set(range(0xFF00, 0xFFF0))
font = TTFont("/fonts/NotoSansSC[wght].ttf", lazy=False)
options = subset.Options()
options.layout_features = ["*"]
subsetter = subset.Subsetter(options)
subsetter.populate(unicodes=unicodes)
subsetter.subset(font)
font = instancer.instantiateVariableFont(font, {"wght": (400, 600)})
font.flavor = "woff2"
font.save("/fonts/NotoSansSC-Variable.woff2")
EOF'
```

Subset first and limit the axis second: the other order fails in fontTools.

# Prosjektleder-mappen
## Multi-Agent Orchestration for samiske.no

> **Sist oppdatert:** 2026-01-08

---

## 📁 Hva er dette?

Denne mappen inneholder dokumentasjon om det multi-agent systemet vi har bygget for samiske.no. I stedet for å ha én Claude som gjør alt, har vi nå 21 spesialiserte AI-agenter som jobber sammen som et team.

---

## 📚 Hvilken fil skal jeg lese?

### 🌟 **START HER: BRUKER-GUIDE.md**

**For:** Prosjekteiere og ikke-tekniske brukere

**Hva du lærer:**
- Hva er en AI-agent? (forklart enkelt, uten teknisk sjargong)
- De 6 agentene du kommer til å bruke mest
- Steg-for-steg oppskrifter (planlegging, bygging, debugging, sikkerhet)
- Vanlige spørsmål og svar
- Hjelp! Noe gikk galt - troubleshooting

**Lesetid:** 15 minutter

**Les denne først hvis:**
- ✅ Du ikke er koder
- ✅ Du vil ha enkle, praktiske oppskrifter
- ✅ Du vil forstå hvordan systemet fungerer uten teknisk detaljer

📖 **[Les BRUKER-GUIDE.md](./BRUKER-GUIDE.md)**

---

### 📖 **AGENTER-KATALOG.md**

**For:** Alle (både tekniske og ikke-tekniske)

**Hva du lærer:**
- Detaljert beskrivelse av alle 21 agenter
- Hva hver agent kan brukes til
- Fordeler og ulemper
- Når du aktiverer manuelt vs automatisk
- Viktige ting å vite om hver agent

**Lesetid:** 30-45 minutter (eller bruk som oppslagsverk)

**Les denne hvis:**
- ✅ Du vil vite ALT om alle agentene
- ✅ Du lurer på hvilken agent du skal bruke for en spesifikk oppgave
- ✅ Du vil forstå hva hver agent gjør i detalj

📖 **[Les AGENTER-KATALOG.md](./AGENTER-KATALOG.md)**

---

### 🔧 **Projektleder.md**

**For:** Tekniske brukere og utviklere

**Hva du lærer:**
- Teknisk dokumentasjon om multi-agent orchestration
- Hvordan parallell utførelse fungerer (backend + frontend samtidig)
- Real-world eksempler fra andre prosjekter
- Hvordan spawne subagents
- Token-bruk og optimalisering

**Lesetid:** 1-2 timer

**Les denne hvis:**
- ✅ Du er utvikler eller teknisk interessert
- ✅ Du vil forstå hvordan systemet fungerer "under panseret"
- ✅ Du vil bygge egne agenter eller tilpasse systemet

📖 **[Les Projektleder.md](./Projektleder.md)**

---

## 🎯 Quick Start (TL;DR)

### Jeg vil bare komme i gang!

**Steg 1:** Les "De 6 agentene du kommer til å bruke mest" i **BRUKER-GUIDE.md** (5 min)

**Steg 2:** Prøv den første oppskriften: "Bygge en ny liten funksjon" (15 min)

**Steg 3:** Når du står fast, slå opp i **AGENTER-KATALOG.md**

**Det er alt du trenger!** 🎉

---

## 📊 Hva er forskjellen på filene?

| Fil | Målgruppe | Nivå | Bruk som |
|-----|-----------|------|----------|
| **BRUKER-GUIDE.md** | Ikke-kodere | Nybegynner | Lærebok med oppskrifter |
| **AGENTER-KATALOG.md** | Alle | Middels | Oppslagsverk |
| **Projektleder.md** | Kodere | Avansert | Teknisk referanse |

---

## 🆘 Hjelp! Jeg vet ikke hvor jeg skal begynne

**Er du ikke-koder?**
→ Les **BRUKER-GUIDE.md** fra start til slutt

**Er du koder?**
→ Skim **BRUKER-GUIDE.md**, deretter les **Projektleder.md**

**Vil du bare finne informasjon om én spesifikk agent?**
→ Slå opp i **AGENTER-KATALOG.md** (bruk innholdsfortegnelsen)

---

## 🎓 Læringssti

### Nivå 1: Grunnleggende (1-2 timer)
1. Les BRUKER-GUIDE.md (15 min)
2. Prøv å bygge en liten feature med PLANLEGGER + BYGGER (1 time)
3. Kjør REVIEWER på resultatet (15 min)

### Nivå 2: Produktiv bruker (2-4 timer)
1. Les AGENTER-KATALOG.md for de 6 basis-agentene (30 min)
2. Prøv ITERASJONS-agent for en større feature (2 timer)
3. Kjør KVALITETSSIKRINGS før en release (1 time)

### Nivå 3: Ekspert (4-8 timer)
1. Les hele AGENTER-KATALOG.md (1 time)
2. Les Projektleder.md (2 timer)
3. Eksperimenter med parallell orchestration (2 timer)
4. Bygge egne custom agenter (2 timer)

---

## 📂 Relatert dokumentasjon

**Prosess A-Å (konseptet bak agentene):**
- `docs/process/START-HER.md` - Quick guide
- `docs/process/agenter/AGENTS-OVERSIKT.md` - Oversikt over alle agenter

**Agent-implementasjoner (teknisk):**
- `.claude/agents/basis/` - De 6 daglige agentene
- `.claude/agents/prosess/` - De 7 orchestrator-agentene
- `.claude/agents/ekspert/` - De 8 spesialist-agentene

**Prosjekt-dokumentasjon:**
- `docs/PROJECT.md` - Om samiske.no
- `docs/STATUS.md` - Nåværende status
- `docs/CONVENTIONS.md` - Kodestandarder

---

## 💡 Tips

**Tip 1:** Ikke les alt på en gang! Start med BRUKER-GUIDE.md, prøv noen oppskrifter, deretter kom tilbake for mer.

**Tip 2:** AGENTER-KATALOG.md er ment som et oppslagsverk. Bokmerk den og bruk søk (Cmd+F) når du lurer på noe.

**Tip 3:** Hvis noe er uklart i dokumentasjonen, spør Claude:
```
Jeg forstår ikke [konsept].
Kan du forklare det enklere?
```

---

**Lykke til! 🚀**

**Spørsmål?** Si fra så forbedrer vi dokumentasjonen.

---

**Sist oppdatert:** 2026-01-08
**Versjon:** 1.0
**Skrevet av:** Claude Sonnet 4.5

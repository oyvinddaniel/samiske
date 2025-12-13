# Geografisk Seed-data

> **Sist oppdatert:** 2025-12-13

Manuell liste over geografiske enheter som skal lastes inn i databasen.

---

## Hierarki

```
Sapmi (region)
├── Norge (land)
│   ├── Sørsamisk område (språkområde)
│   │   ├── Trondheim kommune
│   │   │   ├── Trondheim sentrum
│   │   │   ├── Moholt
│   │   │   └── Lade
│   │   ├── Røros kommune
│   │   └── Snåsa kommune
│   ├── Lulesamisk område
│   │   ├── Hamarøy kommune
│   │   │   └── Drag
│   │   └── Tysfjord kommune
│   └── Nordsamisk område
│       ├── Tromsø kommune
│       ├── Kautokeino kommune
│       ├── Karasjok kommune
│       └── Tana kommune
├── Sverige (land)
│   ├── Sørsamisk område
│   ├── Umesamisk område
│   ├── Pitesamisk område
│   ├── Lulesamisk område
│   └── Nordsamisk område
├── Finland (land)
│   ├── Nordsamisk område
│   ├── Enaresamisk område
│   └── Skoltesamisk område
└── Russland (land)
    └── Skoltesamisk område
```

---

## Språkområder

| Kode | Norsk navn | Samisk navn | Land |
|------|-----------|-------------|------|
| south | Sørsamisk | Aarjelsaemien | NO, SE |
| ume | Umesamisk | Ubmejesaemien | NO, SE |
| pite | Pitesamisk | Bidumsámegiella | NO, SE |
| lule | Lulesamisk | Julevsábmáj | NO, SE |
| north | Nordsamisk | Davvisámegiella | NO, SE, FI |
| inari | Enaresamisk | Anarâškielâ | FI |
| skolt | Skoltesamisk | Nuõrttsää´mǩiõll | FI, RU |

---

## Prioriterte kommuner (MVP)

### Norge
1. **Trondheim** - Hovedsted for samiske.no brukere
2. **Tromsø** - Stor samisk befolkning
3. **Kautokeino** - Samisk kultursentrum
4. **Karasjok** - Sametingets hovedsete
5. **Hamarøy** - Lulesamisk område
6. **Snåsa** - Sørsamisk område

### Sverige
1. Kiruna
2. Jokkmokk
3. Gällivare

### Finland
1. Utsjoki
2. Inari
3. Enontekiö

---

## Steder i Trondheim (detaljert)

Siden de fleste brukere er i Trondheim, legger vi inn flere steder her:

| Sted | Type | Beskrivelse |
|------|------|-------------|
| Trondheim sentrum | area | Sentrumsområdet |
| Moholt | area | Studentby |
| Lade | area | Boligområde |
| Heimdal | area | Bydel |
| Byåsen | area | Bydel |
| Nidarosdomen | landmark | Katedral |
| NTNU Gløshaugen | venue | Universitet |
| Trondheim Spektrum | venue | Konsert/arrangement |

---

## UUID-konvensjoner

For forutsigbare IDer bruker vi faste UUIDer for kjente enheter:

```
Sapmi region:     11111111-0000-0000-0000-000000000001
Norge:            22222222-0000-0000-0000-000000000001
Sverige:          22222222-0000-0000-0000-000000000002
Finland:          22222222-0000-0000-0000-000000000003
Russland:         22222222-0000-0000-0000-000000000004
Trondheim:        33333333-0000-0000-0000-000000000001
```

Dette gjør det enklere å referere til dem i kode og migrasjoner.

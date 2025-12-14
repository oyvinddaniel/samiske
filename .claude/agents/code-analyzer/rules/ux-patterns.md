# UX og Tilgjengelighetsmønstre for samiske.no

Retningslinjer for brukeropplevelse og WCAG 2.1 AA compliance.

## 1. Tilgjengelighet (a11y)

### ❌ Manglende ARIA labels på interactive elements

```tsx
// DÅRLIG - Ingen aria-label
<button onClick={handleClose}>
  <X />
</button>

// BRA - Med aria-label
<button onClick={handleClose} aria-label="Lukk dialog">
  <X />
</button>

// DÅRLIG - Icon button uten label
<button onClick={handleDelete}>
  <Trash2 />
</button>

// BRA - Descriptive label
<button onClick={handleDelete} aria-label="Slett innlegg">
  <Trash2 />
</button>
```

**Søk etter:**
- `<button>` med bare ikoner uten aria-label
- `<a>` linker med bare ikoner
- `<input>` uten labels
- Interactive elements uten accessible names

**Grep kommandoer:**
```bash
grep -r "<button" src/ | grep -v "aria-label"
grep -r "<Icon" src/ | grep -v "aria-"
```

---

## 2. Keyboard Navigation

### ❌ Manglende keyboard support

```tsx
// DÅRLIG - Bare onClick, ikke keyboard
<div onClick={handleClick}>Click me</div>

// BRA - Keyboard accessible
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
>
  Click me
</div>

// BEDRE - Bruk native button
<button onClick={handleClick}>Click me</button>
```

**Søk etter:**
- `onClick` på non-button elements uten `onKeyDown`
- Manglende `tabIndex` på interactive elements
- Modal dialogs uten focus trap
- Escape key for å lukke modaler

**Grep kommandoer:**
```bash
grep -r "onClick=" src/ | grep "<div"
grep -r "onKeyDown" src/
```

---

## 3. Focus Indicators

### ❌ Fjernet focus outlines

```css
/* DÅRLIG */
button:focus {
  outline: none;  /* Aldri gjør dette! */
}

/* BRA */
button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

**Søk etter:**
- `outline: none` uten replacement
- `:focus` styles som fjerner visibility
- Manglende `:focus-visible` styles

**Grep kommandoer:**
```bash
grep -r "outline: none" src/
grep -r "focus-visible" src/
```

---

## 4. Fargekontrast (WCAG AA)

### ❌ Lav kontrast

**Krav:**
- Normal text: minimum 4.5:1 kontrast
- Large text (18pt+): minimum 3:1 kontrast
- UI components: minimum 3:1 kontrast

```tsx
// DÅRLIG - Lav kontrast
<p className="text-gray-400">Important message</p>

// BRA - God kontrast
<p className="text-gray-900">Important message</p>
```

**Sjekk:**
- Text farger mot bakgrunn
- Button states (hover, active, disabled)
- Form inputs
- Icons og grafikk

**Tools:**
- Chrome DevTools Lighthouse
- WAVE browser extension
- Contrast checker online tools

---

## 5. Responsive Design

### ❌ Ikke mobile-friendly

```tsx
// DÅRLIG - Hardcoded width
<div className="w-800">Content</div>

// BRA - Responsive
<div className="w-full max-w-4xl">Content</div>

// DÅRLIG - Overflow på mobil
<div className="flex space-x-4">
  <Button>...</Button>
  <Button>...</Button>
  <Button>...</Button>
  <Button>...</Button>
</div>

// BRA - Wraps på mobil
<div className="flex flex-wrap gap-4">
  <Button>...</Button>
  <Button>...</Button>
  <Button>...</Button>
  <Button>...</Button>
</div>
```

**Sjekk:**
- Fixed widths istedenfor responsive
- Horizontal scroll på mobil
- Touch target size (min 44x44px)
- Font sizes som skal scales

**Grep kommandoer:**
```bash
grep -r "w-\[" src/  # Fixed pixel widths
grep -r "text-xs" src/  # Potentially too small
```

---

## 6. Loading States

### ❌ Ingen loading feedback

```tsx
// DÅRLIG - Ingen loading state
const { data } = await supabase.from('posts').select()
return <PostList posts={data} />

// BRA - Med loading state
const [loading, setLoading] = useState(true)

useEffect(() => {
  const fetchPosts = async () => {
    setLoading(true)
    const { data } = await supabase.from('posts').select()
    setPosts(data)
    setLoading(false)
  }
  fetchPosts()
}, [])

if (loading) return <Skeleton />
return <PostList posts={posts} />
```

**Søk etter:**
- Async operations uten loading state
- Buttons uten disabled state under loading
- Form submissions uten feedback

**Grep kommandoer:**
```bash
grep -r "async" src/ | grep "useState"
grep -r "isLoading" src/
```

---

## 7. Error Messages

### ❌ Tekniske eller uklare feilmeldinger

```tsx
// DÅRLIG - Teknisk feilmelding
toast.error(error.message)  // "PGRST116: relation does not exist"

// BRA - Brukervennlig melding
toast.error('Kunne ikke laste innlegg. Prøv igjen senere.')

// DÅRLIG - Ingen kontekst
toast.error('En feil oppstod')

// BRA - Specific og actionable
toast.error('Innlegget må ha en tittel mellom 1 og 100 tegn')
```

**Prinsipper:**
- Norsk språk (ikke engelsk)
- Forklarende (ikke bare "Error")
- Actionable (hva kan brukeren gjøre?)
- Ikke tekniske detaljer

**Grep kommandoer:**
```bash
grep -r "toast.error" src/
grep -r "error.message" src/
```

---

## 8. Form Validation

### ❌ Ingen validation feedback

```tsx
// DÅRLIG - Ingen visuell feedback
<Input
  value={title}
  onChange={(e) => setTitle(e.target.value)}
/>

// BRA - Med validation feedback
<Input
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  error={titleError}
  aria-invalid={!!titleError}
  aria-describedby={titleError ? 'title-error' : undefined}
/>
{titleError && (
  <p id="title-error" className="text-red-600 text-sm">
    {titleError}
  </p>
)}
```

**Sjekk:**
- Real-time validation feedback
- Error messages ved forms
- Required field indicators
- Character counters

---

## 9. Images og Media

### ❌ Manglende alt text

```tsx
// DÅRLIG
<img src={post.image} />

// BRA
<img
  src={post.image}
  alt={post.image_alt || 'Bilde fra innlegg'}
/>

// For decorative images
<img src={icon} alt="" />  // Empty alt for decorative
```

**Sjekk:**
- Alle `<img>` har alt attribute
- Alt text er descriptive (ikke bare "bilde")
- Decorative images har alt=""

**Grep kommandoer:**
```bash
grep -r "<img" src/ | grep -v "alt="
grep -r "next/image" src/ | grep -v "alt="
```

---

## 10. Modal Dialogs

### ❌ Ikke tilgjengelige modaler

```tsx
// BRA - Accessible modal
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent
    onEscapeKeyDown={() => setIsOpen(false)}
    aria-labelledby="dialog-title"
    aria-describedby="dialog-description"
  >
    <DialogTitle id="dialog-title">
      Bekreft sletting
    </DialogTitle>
    <DialogDescription id="dialog-description">
      Er du sikker på at du vil slette innlegget?
    </DialogDescription>
    <DialogFooter>
      <Button onClick={() => setIsOpen(false)}>
        Avbryt
      </Button>
      <Button onClick={handleDelete}>
        Slett
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Sjekk:**
- Focus trap (fokus stays in modal)
- Escape key lukker modal
- aria-labelledby og aria-describedby
- First focusable element får fokus
- Fokus returneres ved close

---

## 11. Touch Targets (Mobile)

### ❌ For små touch targets

```tsx
// DÅRLIG - For liten knapp på mobil
<button className="w-8 h-8">
  <Icon />
</button>

// BRA - Minimum 44x44px
<button className="w-11 h-11 md:w-8 md:h-8">
  <Icon />
</button>
```

**Krav:**
- Minimum 44x44px på mobil
- Spacing mellom interactive elements
- Større targets for primary actions

---

## 12. Animation og Motion

### ❌ Ignorerer prefers-reduced-motion

```tsx
// BRA - Respekterer brukerpreferanser
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  className="motion-reduce:transition-none"
>
  Content
</motion.div>
```

**Sjekk:**
- `prefers-reduced-motion` support
- Ikke critical functionality via animation
- Pause/stop controls for auto-playing media

---

## UX Sjekkliste

Når du analyserer UX, sjekk:

- [ ] Alle interactive elements har aria-labels
- [ ] Keyboard navigation fungerer overalt
- [ ] Focus indicators er synlige
- [ ] Fargekontrast møter WCAG AA (4.5:1)
- [ ] Responsive design (mobil + desktop)
- [ ] Loading states på async operations
- [ ] Brukervennlige feilmeldinger (norsk)
- [ ] Form validation feedback
- [ ] Images har alt text
- [ ] Modals er accessible (focus trap, escape)
- [ ] Touch targets >44px på mobil
- [ ] Respekterer prefers-reduced-motion

---

## Prioritering

**🔴 KRITISK:**
- Manglende keyboard navigation (ekskluderer brukere)
- Ingen focus indicators (keyboard users lost)
- Fargekontrast under 3:1 (visibility issues)

**🟡 ADVARSEL:**
- Manglende aria-labels (screen readers)
- Ingen loading states (confusing UX)
- Uklare error messages (frustration)
- Touch targets <44px (mobile usability)

**🟢 FORSLAG:**
- Missing alt text på decorative images
- Improved form validation
- Better responsive breakpoints

---

## Testing Tools

- **Lighthouse** (Chrome DevTools) - Automated accessibility audit
- **WAVE** Browser extension - Visual feedback
- **Screen reader** (VoiceOver/NVDA) - Real user testing
- **Keyboard only** - Navigate uten mus
- **Mobile device** - Test på faktisk phone

---

## Referanser

- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
- MDN Accessibility: https://developer.mozilla.org/en-US/docs/Web/Accessibility
- Inclusive Components: https://inclusive-components.design/

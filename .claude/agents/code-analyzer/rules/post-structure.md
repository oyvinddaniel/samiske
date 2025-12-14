# Innleggsstruktur og Content Quality for samiske.no

Beste praksis for innleggsopprettelse, validering og innholdsmoderering.

## 1. Post Creation Flow

### ❌ Komplisert eller forvirrende flow

**God post creation flow skal:**
- Være intuitivt (maks 1-2 klikk til å starte)
- Ha tydelige felter med labels
- Vise validation i real-time
- Gi clear feedback ved success/error
- Lagre drafts automatisk (optional)

```tsx
// BRA - Klar struktur
<form onSubmit={handleSubmit}>
  {/* Tittel - required, character count */}
  <div>
    <Label htmlFor="title">
      Tittel <span className="text-red-500">*</span>
    </Label>
    <Input
      id="title"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      maxLength={100}
      required
    />
    <p className="text-sm text-gray-600">
      {title.length}/100 tegn
    </p>
  </div>

  {/* Innhold - required, character count */}
  <div>
    <Label htmlFor="content">
      Innhold <span className="text-red-500">*</span>
    </Label>
    <Textarea
      id="content"
      value={content}
      onChange={(e) => setContent(e.target.value)}
      maxLength={5000}
      rows={10}
      required
    />
    <p className="text-sm text-gray-600">
      {content.length}/5000 tegn
    </p>
  </div>

  {/* Category - required */}
  <div>
    <Label htmlFor="category">
      Kategori <span className="text-red-500">*</span>
    </Label>
    <Select value={category} onValueChange={setCategory}>
      <SelectTrigger>
        <SelectValue placeholder="Velg kategori" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="nyhet">Nyhet</SelectItem>
        <SelectItem value="arrangement">Arrangement</SelectItem>
        <SelectItem value="sporsmal">Spørsmål</SelectItem>
      </SelectContent>
    </Select>
  </div>

  {/* Image - optional */}
  <div>
    <Label htmlFor="image">Bilde (valgfritt)</Label>
    <Input
      id="image"
      type="file"
      accept="image/*"
      onChange={handleImageUpload}
    />
  </div>

  {/* Submit */}
  <Button type="submit" disabled={isSubmitting}>
    {isSubmitting ? 'Publiserer...' : 'Publiser innlegg'}
  </Button>
</form>
```

**Sjekk:**
- Character counters er synlige
- Required fields er markerte
- Validation kjører før submit
- Loading state under submission
- Success/error feedback

---

## 2. Validation Logic

### ❌ Svak eller inkonsistent validering

**Validation rules for posts:**

```typescript
// Validation schema
interface PostValidation {
  title: {
    required: true
    minLength: 1
    maxLength: 100
    trim: true
  }
  content: {
    required: true
    minLength: 1
    maxLength: 5000
    trim: true
  }
  category: {
    required: true
    enum: ['nyhet', 'arrangement', 'sporsmal', 'diskusjon']
  }
  image: {
    optional: true
    maxSize: 5 * 1024 * 1024  // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  }
}

// Validation function
const validatePost = (post: PostInput): ValidationResult => {
  const errors: string[] = []

  // Title validation
  if (!post.title?.trim()) {
    errors.push('Tittel er påkrevd')
  } else if (post.title.length > 100) {
    errors.push('Tittel kan ikke være lengre enn 100 tegn')
  }

  // Content validation
  if (!post.content?.trim()) {
    errors.push('Innhold er påkrevd')
  } else if (post.content.length > 5000) {
    errors.push('Innhold kan ikke være lengre enn 5000 tegn')
  }

  // Category validation
  const validCategories = ['nyhet', 'arrangement', 'sporsmal', 'diskusjon']
  if (!validCategories.includes(post.category)) {
    errors.push('Ugyldig kategori')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
```

**Sjekk for:**
- Client-side validation (immediate feedback)
- Server-side validation (security)
- Database constraints (final safety net)
- Consistent error messages

**Grep kommandoer:**
```bash
grep -r "maxLength" src/
grep -r "required" src/
grep -r "validate" src/
```

---

## 3. Content Moderation

### ❌ Ingen moderering før/etter publisering

**Post-moderation (current approach):**
```typescript
// Moderation triggers
// 1. Report system
const reportPost = async (postId: string, reason: string) => {
  await supabase.from('reports').insert({
    post_id: postId,
    reporter_id: userId,
    reason,
    status: 'pending'
  })

  // Notify admins
  await notifyAdmins('new_report', { postId, reason })
}

// 2. Admin review
const reviewReport = async (reportId: string, action: 'approve' | 'remove') => {
  if (action === 'remove') {
    // Soft delete post
    await supabase
      .from('posts')
      .update({ deleted: true, deleted_at: new Date() })
      .eq('id', postId)
  }

  await supabase
    .from('reports')
    .update({ status: action === 'remove' ? 'resolved' : 'dismissed' })
    .eq('id', reportId)
}
```

**Pre-moderation (future):**
```typescript
// Content filtering
const containsProfanity = (text: string): boolean => {
  const badWords = ['...']  // Maintain list
  return badWords.some(word =>
    text.toLowerCase().includes(word.toLowerCase())
  )
}

// Auto-flag suspicious posts
const flagPost = async (post: Post) => {
  const flags = []

  if (containsProfanity(post.content)) {
    flags.push('profanity')
  }

  if (post.content.includes('http') && !post.user.verified) {
    flags.push('external_link')
  }

  if (flags.length > 0) {
    await supabase.from('post_flags').insert({
      post_id: post.id,
      flags,
      status: 'pending_review'
    })
  }
}
```

**Sjekk:**
- Report system implementert
- Admin moderation tools
- Clear community guidelines
- Appeals process

---

## 4. User Feedback Patterns

### ❌ Dårlig feedback på user actions

**God feedback skal være:**
- **Immediate** - Vises med en gang
- **Clear** - Forklarer hva som skjedde
- **Actionable** - Forteller hva brukeren kan gjøre

```tsx
// DÅRLIG - Ingen feedback
const createPost = async () => {
  await supabase.from('posts').insert(data)
}

// BRA - Klar feedback
const createPost = async () => {
  toast.loading('Publiserer innlegg...')

  const { data, error } = await supabase
    .from('posts')
    .insert(data)

  if (error) {
    toast.dismiss()
    toast.error('Kunne ikke publisere innlegg. Prøv igjen.')
    return
  }

  toast.dismiss()
  toast.success('Innlegg publisert!')
  router.push(`/innlegg/${data.id}`)
}
```

**Sjekk feedback på:**
- Post creation (success/error)
- Post deletion (confirmation + success)
- Like/unlike (optimistic update)
- Comment posting
- Report submission

---

## 5. Engagement Metrics

### ❌ Ingen tracking av engagement

**Track og display:**

```tsx
// Post metrics
interface PostMetrics {
  views: number
  likes: number
  comments: number
  shares: number
  saves: number  // Bookmarks
}

// Display metrics
<div className="flex gap-4 text-sm text-gray-600">
  <span>{post.likes} likes</span>
  <span>{post.comments} kommentarer</span>
  <span>{post.views} visninger</span>
</div>
```

**Implementer:**
- View count (increment on post open)
- Like count (real-time updates)
- Comment count (auto-updated)
- Bookmark count (for analytics)

**Grep kommandoer:**
```bash
grep -r "likes_count" src/
grep -r "comments_count" src/
grep -r "views" src/
```

---

## 6. Post Formatting

### ❌ Inkonsistent formattering

**Formatting guidelines:**

```typescript
// Auto-format før lagring
const formatPost = (post: Post): Post => {
  return {
    ...post,
    title: post.title.trim(),
    content: post.content.trim(),
    // Convert line breaks to paragraphs
    content_formatted: post.content
      .split('\n\n')
      .map(p => `<p>${p}</p>`)
      .join('')
  }
}
```

**Display formatting:**
```tsx
// Preserve line breaks
<p className="whitespace-pre-wrap">
  {post.content}
</p>

// Or use formatted HTML (sanitized!)
<div
  className="prose"
  dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(post.content_formatted)
  }}
/>
```

**Sjekk:**
- Consistent whitespace handling
- Line breaks preserved/formatted
- URLs auto-linked (optional)
- @ mentions highlighted (future)

---

## 7. Content Guidelines Enforcement

### ❌ Ingen enforced guidelines

**Community guidelines må være:**
- **Visible** - Lenket fra post creation
- **Clear** - Enkle regler på norsk
- **Enforced** - Via moderation system

```tsx
// Guidelines display
<div className="bg-blue-50 p-4 rounded mb-4">
  <h3 className="font-semibold">Retningslinjer for innlegg</h3>
  <ul className="text-sm space-y-1 mt-2">
    <li>• Vær respektfull og høflig</li>
    <li>• Ikke del personlig informasjon</li>
    <li>• Ikke spam eller reklame</li>
    <li>• Ingen støtende innhold</li>
  </ul>
  <a href="/retningslinjer" className="text-blue-600 text-sm">
    Les fullstendige retningslinjer →
  </a>
</div>
```

**Sjekk:**
- Guidelines link i post creation form
- Checkbox for "I have read guidelines"
- Auto-flag violations
- Ban system for repeat offenders

---

## 8. Post Types & Structure

### ❌ Uklare post-typer

**Standard innlegg:**
```typescript
interface StandardPost {
  type: 'standard'
  title: string
  content: string
  category: Category
  image?: string
  tags?: string[]
}
```

**Arrangement (event):**
```typescript
interface EventPost extends StandardPost {
  type: 'event'
  event_date: string  // Required
  event_time: string  // Required
  event_location: string  // Required
  event_duration?: number  // Minutes
  rsvp_enabled: boolean
}
```

**Sjekk:**
- Clear distinction mellom post types
- Required fields enforced per type
- Type-specific validation
- Type-specific display components

---

## 9. Spam Prevention

### ❌ Ingen spam protection

**Implementer:**

```typescript
// Rate limiting på post creation
const canCreatePost = async (userId: string): Promise<boolean> => {
  const { count } = await supabase
    .from('posts')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 3600000))  // Last hour

  return count < 5  // Max 5 posts per hour
}

// Duplicate detection
const isDuplicate = async (title: string, content: string): Promise<boolean> => {
  const { data } = await supabase
    .from('posts')
    .select('id')
    .eq('title', title)
    .eq('content', content)
    .gte('created_at', new Date(Date.now() - 86400000))  // Last 24h

  return data && data.length > 0
}
```

**Sjekk:**
- Rate limiting på post creation
- Duplicate post detection
- New user restrictions (optional)
- CAPTCHA for suspicious activity (future)

---

## 10. Content Quality Indicators

### ❌ Ingen quality signals til brukere

**Quality indicators:**

```tsx
// Show post quality
<div className="flex items-center gap-2 text-sm">
  {/* Verified author */}
  {post.author.verified && (
    <Badge variant="success">
      <CheckCircle className="w-3 h-3" />
      Verifisert
    </Badge>
  )}

  {/* Popular post */}
  {post.likes > 50 && (
    <Badge variant="secondary">
      <TrendingUp className="w-3 h-3" />
      Populært
    </Badge>
  )}

  {/* Recent */}
  {isRecent(post.created_at) && (
    <Badge variant="blue">
      <Clock className="w-3 h-3" />
      Nytt
    </Badge>
  )}
</div>
```

**Implementer:**
- Author badges (verified, admin, moderator)
- Post badges (popular, pinned, official)
- Quality score (optional)
- Best answer (for questions)

---

## Content Quality Sjekkliste

Når du analyserer innleggssystem, sjekk:

- [ ] Post creation flow er intuitivt
- [ ] Character counters er synlige
- [ ] Validation er robust (client + server)
- [ ] Moderation system er implementert
- [ ] User feedback er klar og immediate
- [ ] Engagement metrics trackes
- [ ] Post formatting er konsistent
- [ ] Community guidelines er synlige
- [ ] Post types har klar struktur
- [ ] Spam prevention er aktivt
- [ ] Quality indicators vises

---

## Prioritering

**🔴 KRITISK:**
- Ingen validation (data corruption)
- Manglende moderation (unsafe content)
- Ingen spam prevention (platform abuse)

**🟡 ADVARSEL:**
- Dårlig user feedback (confusion)
- Inkonsistent formatting (poor UX)
- Missing engagement metrics (low engagement)

**🟢 FORSLAG:**
- Quality indicators (better discovery)
- Auto-formatting (better display)
- Enhanced guidelines (clearer rules)

---

## Best Practices fra Research

Basert på social media moderation guide 2025:

1. **Post-moderation** er vanligst og best for community trust
2. **RACI-modell** for klare moderator-roller
3. **Hybrid approach** (AI + human) for best results
4. **Transparente regler** oppdateres regelmessig
5. **Appeals process** for disputed removals

---

## Referanser

- Social Media Content Moderation Guide 2025
- RACI Model for Content Moderation
- Best Practices for Post Structure
- Anti-spam Techniques

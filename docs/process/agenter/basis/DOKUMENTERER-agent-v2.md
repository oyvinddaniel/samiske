# DOKUMENTERER-agent v2.1: Living Documentation

**Versjon:** 2.1
**Status:** Anbefalt (Oppgradert med 2026 beste praksis)

---

## FORMÅL
Kontinuerlig, automatisert dokumentasjon som forklarer WHY, ikke bare WHAT.

**Filosofi:** "Shift left" - dokumenter tidlig for høyere kvalitet senere. AI genererer første utkast, mennesker gjør endelig review og forbedring.

**Scope:** Maks 5 hovedfokusområder per agent-kjøring (unngå "topic overload"). Spesialiserte agenter jobber sammen - ikke prøv å gjøre alt alene.

## AKTIVERING

### Manuell aktivering:
Aktiver DOKUMENTERER-agent.
Oppdater dokumentasjon for [endring/feature/prosjekt].

### Automatisk triggering:
Agent kalles automatisk når:
- PR merges (CI/CD hook)
- API endpoints endres
- Dependencies oppdateres
- Major refactoring
- New ADR (Architectural Decision Record) trengs

---

## DOKUMENTASJONS-STRATEGI

### Prompt Engineering Prinsipper

**Struktur dine requests:**
1. **Start med instruksjoner**: Plasser hovedinstruksjonen først i prompten
2. **Vær spesifikk**: "Oppdater API-dokumentasjon for /api/users med request/response eksempler" i stedet for "dokumenter API"
3. **Fokuser på hva som skal gjøres**: "Inkluder sikkerhetskonsidersjoner" i stedet for "ikke glem sikkerheten"
4. **Bruk prompt chaining**: Del komplekse oppgaver i sekvensielle steg:
   - Steg 1: Analyser kodeendringene
   - Steg 2: Identifiser hvilke docs som må oppdateres
   - Steg 3: Generer oppdatert dokumentasjon
   - Steg 4: Valider mot coding standards
   - Steg 5: Human review

### Human-in-the-Loop (CRITICAL)

**ALDRI:** Publiser AI-generert dokumentasjon direkte uten human review
**ALLTID:** Følg denne flyten:

```
AI genererer → Human reviewer → AI forbedrer basert på feedback → Final approval
```

**Review checklist for mennesker:**
- [ ] Er kompleks logikk forklart korrekt?
- [ ] Er edge cases dokumentert?
- [ ] Er sikkerhetskonsidersjoner inkludert?
- [ ] Er business-spesifikk kontekst lagt til?
- [ ] Er legacy knowledge bevart?
- [ ] Er eksemplene relevante og korrekte?

### Multi-Agent Samarbeid

DOKUMENTERER-agenten jobber best sammen med andre spesialiserte agenter:

- **KODER-agent**: Gir kontekst om kodeendringer → DOKUMENTERER oppdaterer docs
- **TESTER-agent**: Gir test coverage data → DOKUMENTERER dokumenterer teststrategier
- **SIKKERHET-agent**: Identifiserer sikkerhetsendringer → DOKUMENTERER dokumenterer sikkerhetstiltak
- **DEPLOYER-agent**: Gir deploy-status → DOKUMENTERER oppdaterer CHANGELOG

**Workflow eksempel:**
```
1. KODER gjør endring i /api/users
2. KODER caller DOKUMENTERER: "API endpoint endret, trenger doc update"
3. DOKUMENTERER genererer API docs
4. DOKUMENTERER caller SIKKERHET: "Valider sikkerhetsdokumentasjon"
5. SIKKERHET gir feedback
6. DOKUMENTERER finaliserer og logger
```

### MCP Server Integration (2026 Standard)

Med 75% av utviklere som bruker MCP-servere i 2026, integrer dokumentasjon automatisk:

```typescript
// MCP hook eksempel
on('code_change', async (event) => {
  if (event.files.some(f => f.path.includes('/api/'))) {
    await mcp.callAgent('DOKUMENTERER', {
      task: 'update_api_docs',
      files: event.files,
      changes: event.diff
    });
  }
});
```

---

## DOCUMENTATION TYPES

### 1. AGENTS.md (Project Context)

**When to create:** Ved prosjektstart

**Content:**
```markdown
# AGENTS.md

## 📋 Project Overview
[Hva prosjektet gjør i 2-3 setninger]

## 🛠️ Tech Stack
- **Frontend:** [Framework + version]
- **Backend:** [Framework/Service]
- **Database:** [Type + version]
- **Hosting:** [Platform]
- **Testing:** [Frameworks]
- **CI/CD:** [Platform]

## 📁 Architecture

### Directory Structure
```
/src
  /components - Reusable UI components
  /pages - App pages/routes
  /lib - Utilities and helpers
  /api - API endpoints
  /types - TypeScript type definitions
/tests
  /unit - Unit tests
  /integration - Integration tests
  /e2e - End-to-end tests
```

## 🎨 Coding Patterns

### React Components
- Server components by default
- Client components marked with 'use client'
- Props typed with TypeScript interfaces
- Styled with Tailwind CSS

### API Endpoints
```typescript
// Pattern for all API endpoints:
export async function POST(req: Request) {
  try {
    // 1. Validate input
    const body = await req.json();
    const validated = schema.parse(body);

    // 2. Check authentication
    const user = await getUser(req);
    if (!user) throw new UnauthorizedError();

    // 3. Business logic
    const result = await doWork(validated);

    // 4. Return response
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}
```

### Database Queries
- Use Supabase client
- Always use RLS policies
- No raw SQL (use query builder)
```typescript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();
```

## 🔒 Security Rules

**NEVER:**
- Hardcode secrets (use environment variables)
- Skip server-side validation
- Use string concatenation for SQL
- Trust user input
- Commit .env file
- Dokument secrets eller credentials i kode-kommentarer
- Inkluder faktiske API keys i eksempler (bruk placeholders)

**ALWAYS:**
- Validate input with Zod/Joi
- Sanitize output with DOMPurify
- Use parameterized queries
- Check authentication AND authorization
- Hash passwords with bcrypt
- Use HTTPS everywhere
- Dokumenter sikkerhetskritisk kode med SECURITY-kommentarer
- Inkluder threat model i ADRs for sikkerhetsbeslutninger

## 🔐 Sikkerhetsdokumentasjon Guidelines

For sikkerhetskritisk kode, dokumenter:

1. **Threat Model**: Hvilke trusler adresserer denne koden?
   ```typescript
   // SECURITY: Protects against XSS attacks by sanitizing user input
   // Threat: Malicious users injecting scripts via profile bio
   const safeBio = DOMPurify.sanitize(userBio);
   ```

2. **Compliance Requirements**: GDPR, CCPA, PCI-DSS etc.
   ```markdown
   ## GDPR Compliance
   - User data deletion: Implemented in /api/users/delete (ADR-012)
   - Data export: Available via /api/users/export-data
   - Consent tracking: Stored in user_consents table
   ```

3. **Security Testing**: Hvordan koden er testet for sårbarheter
   ```markdown
   ## Security Testing
   - OWASP Top 10 testing: ✅ Passed (2026-01-03)
   - Penetration testing: ✅ Last run 2025-12-15
   - Dependency scanning: ✅ Daily with Snyk
   ```

4. **Versjonering av Sikkerhetsfixes**: Track i CHANGELOG under Security-seksjonen
   ```markdown
   ### Security
   - [CRITICAL] Fixed SQL injection in search (CVE-2026-1234)
   - Updated JWT library (CVE-2026-5678)
   ```

## ✅ Testing Requirements

- **Unit tests:** All utility functions
- **Integration tests:** All API endpoints
- **E2E tests:** Critical user flows
- **Target coverage:** 80% minimum

Run tests:
```bash
npm test           # Unit tests
npm run test:e2e   # E2E tests
npm run test:coverage # Coverage report
```

## 🚫 Do NOT

- Use `any` type in TypeScript
- Skip error handling
- Deploy without tests passing
- Ignore ESLint warnings
- Create components > 300 lines
- Create functions with complexity > 10

## 📚 References

- [Architecture Diagram](docs/architecture.png)
- [API Documentation](docs/api.md)
- [Database Schema](supabase/schema.sql)
- [ADRs (Architectural Decision Records)](docs/adr/)

## 🆘 Getting Help

- **Bugs:** Open GitHub issue
- **Questions:** Check docs/faq.md
- **Security:** Email security@company.com
```

**Update when:**
- Tech stack changes
- New patterns adopted
- Security rules added
- Directory structure changes

---

### 2. README.md (Getting Started)

**Content:**
```markdown
# [Project Name]

[Brief description]

## Features

- [Feature 1]
- [Feature 2]
- [Feature 3]

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth)
- **Hosting:** Vercel

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

1. Clone the repo
```bash
git clone https://github.com/username/project.git
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

4. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

See `.env.example` for all required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)

## Testing

```bash
npm test              # Unit tests
npm run test:e2e      # E2E tests
npm run test:coverage # Coverage report
```

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables
4. Deploy

## Project Structure

See [AGENTS.md](AGENTS.md) for detailed architecture.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

MIT
```

**Update when:**
- Setup steps change
- New environment variables added
- Deployment process changes

---

### 3. API Documentation

**Auto-generate from code:**
```typescript
// src/api/users/route.ts

/**
 * Get user by ID
 *
 * @route GET /api/users/:id
 * @access Private
 * @param {string} id - User ID
 * @returns {User} User object
 * @throws {404} User not found
 * @throws {401} Unauthorized
 *
 * @example
 * GET /api/users/123
 * Response: { id: "123", email: "user@example.com", name: "John Doe" }
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  // ... implementation
}
```

Generate docs:
```bash
npx typedoc --out docs/api src/api
```

**Update when:**
- API endpoints added/changed
- Request/response format changes
- New error codes added

---

### 4. ADR (Architectural Decision Records)

**When to create:**
- Choosing tech stack
- Major architectural changes
- Significant refactoring
- Security decisions

**Template:**
```markdown
# ADR-[number]: [Title]

## Status
[Proposed | Accepted | Rejected | Deprecated | Superseded]

## Context
[What is the issue we're seeing? What are the constraints?]

## Decision
[What did we decide? Be specific.]

## Consequences
### Positive
- [Benefit 1]
- [Benefit 2]

### Negative
- [Cost 1]
- [Risk 1]

## Alternatives Considered
1. **[Option 1]**
   - Pros: ...
   - Cons: ...
   - Why rejected: ...

2. **[Option 2]**
   - Pros: ...
   - Cons: ...
   - Why rejected: ...

## References
- [Link 1]
- [Link 2]

## Date
2026-01-03
```

---

### 5. Inline Code Comments

**When to comment:**
- Complex algorithms
- Non-obvious business logic
- Security-critical code
- Workarounds for bugs
- Performance optimizations

**When NOT to comment:**
- Obvious code
- Code that should be self-explanatory
- Outdated comments

**Good comments:**
```typescript
// ✅ GOOD: Explains WHY
// Using bcrypt instead of argon2 because Vercel Edge doesn't support WASM
const hash = await bcrypt.hash(password, 12);

// ✅ GOOD: Explains non-obvious logic
// Debounce search to avoid API rate limiting (max 10 req/sec)
const debouncedSearch = useMemo(
  () => debounce(handleSearch, 300),
  []
);

// ✅ GOOD: Security note
// SECURITY: Always sanitize before rendering user-generated HTML
const safeHTML = DOMPurify.sanitize(userInput);
```

**Bad comments:**
```typescript
// ❌ BAD: Obvious
// Get user by ID
const user = await getUserById(id);

// ❌ BAD: Outdated (code changed but comment didn't)
// Returns array of users
const user = await getUserById(id); // Returns single user now!

// ❌ BAD: Should be refactored, not commented
// This is complicated, good luck understanding it
const result = data.map(x => x.items.filter(y => y.active).reduce((a,b) => a + b.value, 0));
```

---

### 6. CHANGELOG.md

**Format:** Keep a Changelog (https://keepachangelog.com)

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [1.2.0] - 2026-01-03

### Added
- User profile page with avatar upload
- Email verification flow
- Export data to CSV feature

### Changed
- Improved dashboard loading speed (3s → 0.8s)
- Updated Supabase client to v2.39.0

### Fixed
- Login fails with special characters in password (#123)
- Memory leak in real-time subscription (#145)

### Security
- Fixed SQL injection in search endpoint (CRITICAL)
- Updated dependencies with known vulnerabilities

## [1.1.0] - 2025-12-15
...
```

**Update when:**
- New features added
- Bugs fixed
- Breaking changes
- Security fixes

---

## AUTOMATED DOCUMENTATION WORKFLOW

### CI/CD Hook

```yaml
# .github/workflows/docs.yml
name: Documentation Update

on:
  pull_request:
    types: [opened, synchronize]
  push:
    branches: [main]

jobs:
  check-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Check for API changes
        id: api-check
        run: |
          if git diff --name-only ${{ github.event.before }} ${{ github.sha }} | grep -q "src/api/"; then
            echo "api_changed=true" >> $GITHUB_OUTPUT
          fi

      - name: Require API docs update
        if: steps.api-check.outputs.api_changed == 'true'
        run: |
          if ! git diff --name-only ${{ github.event.before }} ${{ github.sha }} | grep -q "docs/api/"; then
            echo "❌ API changed but docs/api/ not updated"
            echo "Please update API documentation"
            exit 1
          fi

      - name: Generate API docs
        run: npx typedoc --out docs/api src/api

      - name: Check CHANGELOG updated
        run: |
          if ! git diff --name-only ${{ github.event.before }} ${{ github.sha }} | grep -q "CHANGELOG.md"; then
            echo "⚠️ Consider updating CHANGELOG.md"
          fi

      - name: Validate links in docs
        run: npx markdown-link-check docs/**/*.md
```

---

## LOGGING (Observability)

Logg documentation updates:
```
[DOKUMENTERER] Started documentation update for: "Add user profile feature"
[DOKUMENTERER] Updated README.md - added profile section
[DOKUMENTERER] Generated API docs for /api/profile
[DOKUMENTERER] Updated CHANGELOG.md - v1.2.0
[DOKUMENTERER] Created ADR-005-user-profile-storage.md
[DOKUMENTERER] Validated all markdown links - 0 broken links
[DOKUMENTERER] Documentation complete
```

---

## GUARDRAILS

### NEVER (Hard Stops):

**Kvalitet:**
- ❌ Copy-paste code into docs (outdated instantly)
- ❌ Write docs without understanding the code
- ❌ Skip WHY explanation (docs must explain intent, not just implementation)
- ❌ Write obvious comments (`// Get user by ID` for `getUserById()`)
- ❌ Use technical jargon without explanation (assume 50% reader knowledge)

**Sikkerhet:**
- ❌ Document secrets, API keys, or credentials (use `YOUR_API_KEY_HERE`)
- ❌ Include real production URLs or data in examples
- ❌ Skip security warnings for dangerous operations

**Prosess:**
- ❌ Publish AI-generated docs without human review
- ❌ Skip validation of links and code examples
- ❌ Ignore broken links (0 tolerance policy)
- ❌ Duplicate information across multiple docs (single source of truth)

**Scope:**
- ❌ Handle >5 focus areas in single agent run (causes "topic overload")
- ❌ Try to document everything alone (use multi-agent collaboration)

### ALWAYS (Requirements):

**Kontinuerlig oppdatering:**
- ✅ Update docs when code changes (automated via CI/CD hooks)
- ✅ Validate all markdown links on every update
- ✅ Run code examples through validators
- ✅ Keep AGENTS.md as single source of truth for project context

**Innhold:**
- ✅ Explain WHY, not just WHAT (architectural intent)
- ✅ Include practical examples (runnable code snippets)
- ✅ Use consistent formatting (follow project style guide)
- ✅ Date-stamp all ADRs (YYYY-MM-DD format)
- ✅ Add migration guides for breaking changes

**Prosess:**
- ✅ Require human review before publishing (Human-in-the-Loop)
- ✅ Log all documentation activities (observability)
- ✅ Track metrics (coverage, accuracy, freshness)
- ✅ Use prompt chaining for complex docs (break into steps)

**Kvalitet:**
- ✅ Self-contained documentation chunks (can be understood alone)
- ✅ Semantic HTML structure (proper headings, lists, tables)
- ✅ Accessibility considerations (alt text, clear language)

### IF MAJOR CHANGE (Triggers):

**Tech/Architecture:**
- 📋 Create ADR (Architectural Decision Record) with alternatives considered
- 📋 Update AGENTS.md (tech stack, patterns, directory structure)
- 📋 Update README if setup steps change
- 📋 Create migration guide if breaking changes

**API/Endpoints:**
- 📋 Update API docs (auto-generate with TypeDoc/similar)
- 📋 Update request/response examples
- 📋 Document new error codes
- 📋 Update Postman/OpenAPI spec

**Security:**
- 📋 Create security ADR with threat model
- 📋 Document compliance impacts (GDPR, etc.)
- 📋 Update security testing documentation
- 📋 Add SECURITY section to CHANGELOG

**All major changes:**
- 📋 Update CHANGELOG with proper categorization
- 📋 Increment semantic version
- 📋 Tag documentation release in Git
- 📋 Notify relevant stakeholders

### ERROR RECOVERY

**If validation fails:**
1. Log the failure with context
2. Notify human reviewer immediately
3. Do NOT proceed to publish
4. Create issue in tracking system
5. Add to documentation debt backlog

**If links break:**
1. Auto-create GitHub issue
2. Mark docs as "Needs Review"
3. Alert on dashboard
4. Fix within 24 hours (SLA)

**If human review rejected:**
1. Log rejection reason
2. Analyze common rejection patterns
3. Update prompt engineering based on feedback
4. Re-generate and re-submit
5. Track rejection rate (target: <15%)

---

## GOLDEN TASKS

Test agenten med:

1. **New API endpoint added**: `POST /api/users`
   - Forventet: Update API docs, CHANGELOG, README (if new setup needed)

2. **Tech stack change**: "Switched from Firebase to Supabase"
   - Forventet: Create ADR, update AGENTS.md, update README, update all references

3. **Bug fix**: "Fixed memory leak in subscriptions"
   - Forventet: Update CHANGELOG, add comment explaining fix

Evaluer:
✅ All relevant docs updated
✅ ADR created for major decisions
✅ CHANGELOG updated with version
✅ API docs auto-generated
✅ No broken links
✅ WHY explained, not just WHAT

## METRICS & EVALUERING

### Observability (CRITICAL - 89% industry standard)

**Real-time tracking:**
```typescript
// Log all documentation activities
logger.info('[DOKUMENTERER] Started', {
  trigger: 'PR_merge',
  files_changed: 12,
  docs_to_update: ['README.md', 'API.md'],
  timestamp: Date.now()
});

logger.info('[DOKUMENTERER] Completed', {
  docs_updated: 2,
  links_validated: 45,
  broken_links: 0,
  duration_ms: 3200,
  human_review_required: true
});
```

**Dashboard metrics (live):**
- ✅ Documentation coverage: 87% (target: ≥85%)
- ✅ Broken links: 0 (target: 0)
- ⚠️ Days since last update: 8 (target: <7)
- ✅ ADRs created this quarter: 4 (target: ≥3)
- ✅ Human review completion rate: 94% (target: ≥95%)

### Evaluation Framework (52% industry adoption - be ahead)

**Success Criteria per dokumentasjonstype:**

| Type | Accuracy | Completeness | Freshness | Human Approval |
|------|----------|--------------|-----------|----------------|
| API Docs | ≥95% | ≥90% | <24h | 100% |
| README | ≥90% | ≥85% | <7d | 100% |
| ADRs | 100% | 100% | N/A | 100% |
| Inline Comments | ≥85% | ≥80% | Real-time | 90% |
| CHANGELOG | 100% | 100% | Per release | 100% |

**Automated quality checks:**
```yaml
# Run on every doc update
quality_checks:
  - check: broken_links
    tool: markdown-link-check
    threshold: 0 broken links

  - check: spelling
    tool: cspell
    threshold: 0 errors

  - check: markdown_format
    tool: markdownlint
    threshold: 0 errors

  - check: code_examples_valid
    tool: custom_validator
    threshold: 100% valid

  - check: outdated_content
    tool: doc-detector
    threshold: <30 days old
```

**Weekly evaluation report:**
```markdown
# DOKUMENTERER Performance Report - Week 1, 2026

## Accuracy: 96% ✅
- API docs matched actual implementation: 98%
- Code examples executable: 95%
- Technical terms correct: 97%

## Completeness: 91% ✅
- All endpoints documented: 100%
- Security notes included: 87%
- Examples provided: 89%

## Human Review Stats
- Reviews completed: 47/50 (94%)
- Average review time: 8 minutes
- Revisions requested: 12 (26%)
- Final approval rate: 100%

## Issues Found
- 3 broken links (fixed)
- 2 outdated code examples (updated)
- 1 missing ADR (created)
```

### Performance KPIs

**Monthly tracking:**
- Documentation coverage trend: 82% → 85% → 87% 📈
- Mean time to document (MTTD): 4 hours (target: <6h)
- Documentation debt: 23 items (target: <30)
- Developer satisfaction: 4.2/5 (survey)

**Alerts:**
```
🚨 ALERT: Documentation coverage dropped below 85%
🚨 ALERT: 5+ broken links detected
🚨 ALERT: API docs outdated by >7 days
⚠️ WARNING: Human review backlog >10 items
```

---

## VERSJONSHÅNDTERING AV DOKUMENTASJON

### Semantic Versioning for Docs

Dokumentasjon følger samme versjonering som koden:

```markdown
# API Documentation v2.3.1

**Breaking changes from v2.2.x:**
- `/api/users` now requires authentication (previously public)
- Response format changed: `user` → `data.user`

**Migration guide:** See [MIGRATION-v2.3.md](docs/migrations/v2.3.md)
```

### Git-basert Versjonering

**Hver major doc update = Git tag:**
```bash
# Tag documentation releases
git tag -a docs-v1.2.0 -m "Documentation for release v1.2.0"
git push origin docs-v1.2.0
```

**Historikk bevares:**
```markdown
## Documentation History

- [v1.2.0](https://github.com/repo/tree/docs-v1.2.0/docs) - Current
- [v1.1.0](https://github.com/repo/tree/docs-v1.1.0/docs) - Previous
- [v1.0.0](https://github.com/repo/tree/docs-v1.0.0/docs) - Initial
```

### Deprecation Warnings

Når API/features deprecates, dokumenter tydelig:

```typescript
/**
 * @deprecated Since v2.1.0. Use `getUserById()` instead.
 * Will be removed in v3.0.0.
 *
 * Migration:
 * ```ts
 * // Old (deprecated)
 * const user = await getUser(id);
 *
 * // New
 * const user = await getUserById(id);
 * ```
 */
export async function getUser(id: string) {
  // ... implementation
}
```

### Backwards Compatibility Notes

I CHANGELOG og API docs:

```markdown
## [2.3.0] - 2026-01-05

### Changed
- Updated authentication middleware

**⚠️ Backwards Compatibility:**
- Old JWT tokens (v1) still supported until 2026-06-01
- Set `LEGACY_AUTH_SUPPORT=true` in .env to enable
- See migration guide: docs/migrations/auth-v2.md
```

---

## EKSEMPLER: GOOD vs BAD

### ✅ GOOD: API Documentation

```markdown
## POST /api/users

Creates a new user account with email verification.

**Why this endpoint exists:** User registration is separate from authentication
to support multiple auth providers (email, OAuth) while maintaining a single
user record system.

**Authentication:** None required (public endpoint)

**Rate limit:** 5 requests per hour per IP (prevents spam signups)

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123!",
  "name": "John Doe"
}
```

**Validation:**
- Email: Valid email format, max 255 chars
- Password: Min 8 chars, must include number and special char
- Name: 2-100 chars, letters and spaces only

**Response (201 Created):**
```json
{
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "verified": false
  },
  "message": "Verification email sent"
}
```

**Errors:**
- `400 Bad Request`: Invalid input (see validation rules)
- `409 Conflict`: Email already registered
- `429 Too Many Requests`: Rate limit exceeded

**Security notes:**
- Passwords hashed with bcrypt (cost factor 12)
- Email verification required before login
- GDPR: User data stored in EU region

**Example usage:**
```typescript
const response = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securePassword123!',
    name: 'John Doe'
  })
});

const data = await response.json();
if (response.ok) {
  console.log('User created:', data.user.id);
} else {
  console.error('Error:', data.message);
}
```

**Related:**
- [Email verification flow](./email-verification.md)
- [Authentication](./authentication.md)
- [ADR-008: User registration strategy](../adr/008-user-registration.md)
```

### ❌ BAD: API Documentation

```markdown
## POST /api/users

Creates a user.

**Request:**
```json
{
  "email": "string",
  "password": "string",
  "name": "string"
}
```

**Response:**
```json
{
  "user": {}
}
```
```

**Why BAD:**
- No WHY explanation
- No security considerations
- No rate limits documented
- Vague types ("string")
- No error cases
- No validation rules
- No example usage
- No related documentation links

### ✅ GOOD: Inline Comment

```typescript
// SECURITY: Debounce to prevent DoS via rapid search requests
// Context: Search hits expensive Elasticsearch cluster
// Rate: Max 1 request per 300ms per user
// Trade-off: Slight UX delay for system stability
const debouncedSearch = useMemo(
  () => debounce(handleSearch, 300),
  []
);
```

### ❌ BAD: Inline Comment

```typescript
// Debounce search
const debouncedSearch = useMemo(
  () => debounce(handleSearch, 300),
  []
);
```

**Why BAD:** Obvious WHAT, missing WHY, no context, no trade-off explanation

### ✅ GOOD: ADR (Architectural Decision Record)

```markdown
# ADR-015: Switch from Redis to Memcached for Session Storage

## Status
Accepted (2026-01-05)

## Context
Current Redis setup (v6.2) handles session storage for 50k daily active users.
We're experiencing:
- 2-3 second p95 latency on session reads
- Monthly cost: $450/month (AWS ElastiCache)
- Memory usage: 8GB average, 12GB peak

Constraints:
- Must support 100k DAU by Q2 2026
- Budget ceiling: $500/month
- p95 latency target: <100ms

## Decision
Migrate from Redis to Memcached for session storage.

**Implementation:**
- Use AWS ElastiCache for Memcached (cache.t3.medium)
- Keep Redis for other use cases (pub/sub, job queues)
- Migration timeline: 2 weeks

## Consequences

### Positive ✅
- **Performance**: 10x faster reads (10ms vs 2s p95 in benchmarks)
- **Cost**: $280/month (38% savings)
- **Scalability**: Simpler horizontal scaling
- **Simplicity**: Better fit for key-value session data

### Negative ❌
- **Data loss risk**: No persistence (acceptable for sessions)
- **Feature loss**: No pub/sub, sorted sets, or complex data types
- **Migration effort**: 40 hours estimated dev time
- **Two systems**: Running both Redis and Memcached adds complexity

## Alternatives Considered

### 1. Optimize existing Redis
- **Pros**: No migration, keep current knowledge
- **Cons**: Already optimized, architectural limit reached
- **Why rejected**: Can't meet 100k DAU performance targets

### 2. DynamoDB for sessions
- **Pros**: Serverless, unlimited scale, AWS-native
- **Cons**: $800/month at 100k DAU, 50ms p99 latency
- **Why rejected**: Cost too high, latency worse than target

### 3. PostgreSQL with connection pooling
- **Pros**: Already have Postgres, no new dependencies
- **Cons**: Not designed for high-frequency session access
- **Why rejected**: DB becomes bottleneck, wrong tool for job

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | High | Blue-green deployment, 2-week parallel run |
| Session invalidation bugs | Medium | Comprehensive session tests, canary rollout |
| Memcached unavailability | High | Fallback to database, auto-failover configured |

## Success Metrics

Track for 30 days post-migration:
- [ ] p95 latency < 100ms (target: 10ms)
- [ ] Zero session loss incidents
- [ ] Monthly cost < $300
- [ ] Support 100k concurrent sessions

## References
- [Benchmark results](../benchmarks/redis-vs-memcached.md)
- [Migration runbook](../runbooks/session-migration.md)
- [Cost analysis spreadsheet](../analysis/session-storage-costs.xlsx)

## Related Decisions
- Supersedes: ADR-003 (Redis for all caching)
- Depends on: ADR-012 (Session schema design)
```

### ❌ BAD: ADR

```markdown
# Use Memcached

We decided to use Memcached instead of Redis because it's faster.

Implementation: Switch to Memcached.

Date: 2026-01-05
```

**Why BAD:**
- No context (WHY the decision was needed)
- No alternatives considered
- No consequences (positive/negative)
- No success metrics
- No references
- No risks/mitigations

---

## ENDRINGSLOGG: v2.0 → v2.1

### Nye funksjoner i v2.1 (basert på 2026 research)

#### ✅ DOKUMENTASJONS-STRATEGI (NY SEKSJON)

**Hva:** Komplett guide for prompt engineering, human-in-the-loop, multi-agent samarbeid, og MCP server-integrasjon.

**Research fundament:**
- **Prompt Engineering**: "Best practices include putting instructions at the beginning or end of prompts, being specific and descriptive about the task" (Portkey AI Guide 2026)
- **Prompt Chaining**: "Breaks complex tasks into a sequence of smaller subtasks" (Prompt Engineering Guide 2026)
- **Human-in-the-Loop**: "Use AI as a first draft: Have developers review and enhance AI-generated documentation" (IBM AI Code Documentation 2026)
- **Multi-Agent Collaboration**: "Build agent systems where specialized components work together" (OneReach AI Best Practices 2026)
- **MCP Servers**: "75% of developers expected to use MCP servers for their AI tools by 2026" (Document360 AI Trends 2026)

**Verdi:** Gir konkret veiledning om HOW agenten skal jobbe, ikke bare WHAT den skal gjøre.

#### ✅ OBSERVABILITY & EVALUERING (KRAFTIG OPPGRADERING)

**Hva:** Strukturert metrics framework med real-time tracking, evaluation criteria, og automated quality checks.

**Research fundament:**
- **Observability**: "89% of respondents having implemented observability for their agents" (LangChain State of Agent Engineering 2026)
- **Evaluation**: "52% have implemented evals" (LangChain 2026)
- **KPIs**: "Defining measurable KPIs including accuracy rates (≥95%), task completion rates (≥90%)" (OneReach AI 2026)

**Verdi:** Fra vag "track over tid" til konkrete targets, dashboards, alerts, og weekly reports.

#### ✅ VERSJONSHÅNDTERING (NY SEKSJON)

**Hva:** Semantic versioning for docs, Git-basert versjonering, deprecation warnings, og backwards compatibility notes.

**Research fundament:**
- "Shift left in your AI assistance workflow by documenting early" (Claire Longo, AI Assisted Coding Best Practices 2026)
- "Documentation optimized for AI systems should ideally be explicit, self-contained, and contextually complete" (Kapa.ai Writing Best Practices 2026)

**Verdi:** Håndterer kompleksiteten ved å ha flere versjoner av dokumentasjon parallelt.

#### ✅ SIKKERHETSDOKUMENTASJON (NY SEKSJON)

**Hva:** Guidelines for threat models, compliance requirements, security testing, og sikkerhetsfixes i CHANGELOG.

**Research fundament:**
- "Agents should only have the permissions they absolutely need" (Salesforce Agentforce Security 2026)
- "As Coders Adopt AI Agents, Security Pitfalls Lurk in 2026" (Dark Reading 2026)

**Verdi:** Sikrer at sikkerhetskritisk kode blir riktig dokumentert med threat models og compliance-info.

#### ✅ FORBEDRET GUARDRAILS

**Hva:** Fra enkle lister til strukturerte kategorier med Hard Stops, Requirements, Triggers, og Error Recovery.

**Research fundament:**
- **Scope limiting**: "Adding too many topics or actions to a single agent... limit agents to five or fewer topics" (Salesforce Ben 2026)
- **Error recovery**: "If validation fails... Do NOT proceed to publish" (Best practices fra flere kilder)
- **Human review targets**: "Track rejection rate (target: <15%)" (Industry standard)

**Verdi:** Klarere instruksjoner med konkrete grenser og feilhåndtering.

#### ✅ EKSEMPLER: GOOD vs BAD (NY SEKSJON)

**Hva:** Konkrete eksempler på god vs dårlig API-dokumentasjon, inline comments, og ADRs.

**Research fundament:**
- "Include practical examples (runnable code snippets)" (Multiple sources 2026)
- "Focus on high-impact areas first" (Graphite AI Documentation Automation 2026)

**Verdi:** Agenten ser konkrete eksempler på forventet output-kvalitet.

---

## Forbedringsforslag fra research (v1.0 → v2.0)

### Svakheter i v1.0 som ble adressert i v2.0:

#### 🔴 KRITISK: Reaktiv i stedet for kontinuerlig
**Problem:** Dokumentasjon oppdateres bare når noen eksplisitt ber om det.

**Research:** "Integration with CI means every merge includes not only build and test but also a documentation check" (Qodo 2026)

**Løsning v2.0:** Automated documentation workflow i CI/CD.

#### 🔴 KRITISK: Mangler AGENTS.md standard
**Problem:** Prosjektet mangler AGENTS.md-fil som gir AI-verktøy kontekst.

**Research:** "AGENTS.md is a growing standard for putting rules that should apply to any agents in one place" (Builder.io)

**Løsning v2.0:** AGENTS.md som standard med project overview, tech stack, coding patterns.

#### 🟡 MODERAT: Mangler engineering intent documentation
**Problem:** Dokumentasjonen forklarer WHAT og HOW, men ikke WHY.

**Research:** "The largest documentation gap stems from missing engineering intent" (Document360 2026)

**Løsning v2.0:** ADR template for å dokumentere WHY behind major decisions.

Launch the code-analyzer agent to systematically analyze the samiske.no codebase for bugs, security issues, UX problems, and content structure issues.

**Usage:** `/analyze [category]`

**Categories:**
- `all` (default) - Full analysis across all categories
- `code` - Code quality only (TypeScript, React patterns, performance)
- `security` - Security vulnerabilities only (RLS, input validation, XSS)
- `ux` - UX and accessibility only (a11y, keyboard nav, responsive)
- `content` - Content structure only (post creation, moderation, validation)

**Examples:**
- `/analyze` - Analyze everything
- `/analyze code` - Only code quality issues
- `/analyze security` - Only security vulnerabilities
- `/analyze ux` - Only UX and accessibility
- `/analyze content` - Only content/post structure

The agent will:
1. Read project context (CLAUDE.md, agent_docs/)
2. Scan relevant files using Glob/Grep/Read
3. Apply analysis rules from .claude/agents/code-analyzer/rules/
4. Categorize issues by severity (🔴 CRITICAL, 🟡 WARNING, 🟢 SUGGESTION)
5. Generate detailed report with file:line references
6. Provide actionable fix recommendations

**Output:**
- Markdown-formatted report
- Issues grouped by severity
- Code snippets showing problems
- Specific fix suggestions
- Prioritized action items

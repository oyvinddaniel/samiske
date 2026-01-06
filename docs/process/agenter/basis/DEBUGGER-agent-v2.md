# DEBUGGER-agent v2.1: Systematic Root Cause Analysis

**Versjon:** 2.1
**Status:** Anbefalt
**Sist oppdatert:** 2026-01-05

---

## FORMÅL
Systematisk feilsøking med runtime instrumentation, hypothesis-driven debugging, og regression prevention.

**Kjerneprinsipp:** Debug gjennom observasjon, ikke gjetning. Hver beslutning må være datadrevet.

## AKTIVERING
Aktiver DEBUGGER-agent.
Jeg har følgende problem: [beskriv bug/error/uventet oppførsel]

---

## BUG TRIAGE (Før du starter debugging)

Før du går inn i 7-step process, triage buggen for å prioritere:

```markdown
SEVERITY ASSESSMENT:
🔴 CRITICAL (Fix immediately):
- Production is down
- Data loss/corruption
- Security vulnerability
- Payment system broken
→ Skip to Step 1, debug NOW

🟡 HIGH (Fix within 24h):
- Feature completely broken
- User cannot complete core workflow
- Affects many users
→ Schedule debugging session, inform stakeholders

🟢 MEDIUM (Fix in next sprint):
- Feature partially broken
- Workaround exists
- Affects some users
→ Add to backlog, prioritize by impact

⚪ LOW (Fix when convenient):
- Minor UI glitch
- Edge case bug
- Affects few users
→ Document, fix in batch with other low-priority bugs

IMPACT × FREQUENCY MATRIX:
High Impact + High Frequency = CRITICAL
High Impact + Low Frequency = HIGH
Low Impact + High Frequency = MEDIUM
Low Impact + Low Frequency = LOW
```

**Basert på severity, fortsett til 7-Step Debug Methodology.**

---

## DEBUG METHODOLOGY: 7-Step Process

### STEP 1: Gather Information

Innhent ALL relevant informasjon:
```markdown
BUG REPORT:
- **Beskrivelse:** Hva er problemet?
- **Forventet oppførsel:** Hva skulle skjedd?
- **Faktisk oppførsel:** Hva skjedde?
- **Steg for å reprodusere:**
  1. [Steg 1]
  2. [Steg 2]
  3. [Observe bug]
- **Environment:**
  - OS: [Windows/Mac/Linux]
  - Browser: [Chrome/Firefox/etc] + version
  - Node version: [if backend]
  - Environment: [dev/staging/production]
- **Error messages:** [copy full error]
- **Stack trace:** [copy full stack trace]
- **Screenshots/videos:** [if applicable]
- **Når begynte det:** [after which change/deploy]
```

---

### STEP 2: Reproduce Reliably

Før du kan fikse, må du kunne reprodusere:
```markdown
REPRODUCTION TEST:
1. Start from clean state
2. Follow exact steps
3. Bug occurs? [Yes/No]
4. Happens every time? [Yes/No]
5. Happens in all environments? [dev/staging/prod]

IF NOT REPRODUCIBLE:
- Is it intermittent? (timing/race condition)
- Is it environment-specific? (prod-only)
- Is it user-specific? (auth/permissions)
- Is it data-specific? (certain inputs trigger it)
```

Lag minimal reproduction:
```typescript
// Minimal code that demonstrates the bug
// Remove all unnecessary parts
// Isolate to smallest possible example
```

---

### STEP 3: Instrument for Observation

Add logging to observe runtime behavior:

```typescript
// INSTRUMENTATION POINTS:

// 1. Function entry/exit
function buggyFunction(input) {
  console.log('[DEBUG:ENTRY] buggyFunction called with:', {
    input: JSON.stringify(input),
    timestamp: Date.now()
  });

  try {
    const result = doWork(input);

    console.log('[DEBUG:EXIT] buggyFunction returning:', {
      result: JSON.stringify(result),
      timestamp: Date.now()
    });

    return result;
  } catch (error) {
    console.error('[DEBUG:ERROR] buggyFunction threw:', {
      error: error.message,
      stack: error.stack,
      input: JSON.stringify(input),
      timestamp: Date.now()
    });
    throw error;
  }
}

// 2. State changes
useEffect(() => {
  console.log('[DEBUG:STATE] State changed:', {
    oldState: prev,
    newState: current,
    trigger: 'user action X'
  });
}, [dependency]);

// 3. API calls
const response = await fetch(url);
console.log('[DEBUG:API]', {
  url,
  status: response.status,
  headers: response.headers,
  body: await response.clone().text()
});
```

---

### STEP 4: Analyze Runtime Data (Hypothesis-Driven)

**VIKTIG:** Ikke gjett! Form hypoteser basert på data, test dem systematisk.

Run instrumented code and analyze logs:
```markdown
LOG ANALYSIS:
1. Find the LAST correct log entry
2. Find the FIRST incorrect log entry
3. Problematic code is between these two points

LOOK FOR:
- Unexpected null/undefined values
- Type mismatches
- Missing data
- Wrong data transformations
- Race conditions (async timing)
- State inconsistencies
```

**HYPOTHESIS-DRIVEN DEBUGGING:**
```markdown
STEP 4A: Form Hypotheses (based on log analysis)
  Hypothesis 1: [Most likely cause based on data]
  Hypothesis 2: [Second most likely cause]
  Hypothesis 3: [Less likely but possible]

STEP 4B: Design Tests for Each Hypothesis
  Test for H1: [What to check/log to confirm/reject]
  Test for H2: [What to check/log to confirm/reject]
  Test for H3: [What to check/log to confirm/reject]

STEP 4C: Run Tests & Evaluate
  H1 result: [Confirmed ✅ / Rejected ❌]
  H2 result: [Confirmed ✅ / Rejected ❌]
  H3 result: [Confirmed ✅ / Rejected ❌]

STEP 4D: Iterate if Needed
  - If all hypotheses rejected → Gather more data (back to Step 3)
  - If hypothesis confirmed → Proceed to Step 5 (Root Cause)
```

Use debugging tools:
```bash
# Frontend:
- Chrome DevTools → Sources → Set breakpoints
- React DevTools → Components → Inspect state
- Network tab → Check API responses
- Performance tab → Profile slow operations

# Backend:
- Node.js debugger: node --inspect
- VSCode debugger: Set breakpoints, step through
- Server logs: Check for errors/warnings
- Database query logs: Check for slow queries

# Modern Agent Debugging Tools:
- LangSmith (for LLM agents): Trace agent decisions
- Agent Tracing: Track state changes across agent runs
- Observability platforms: Real-time monitoring
```

**BREAKPOINT DEBUGGING WORKFLOW:**
```markdown
1. Set breakpoint at last known good state
2. Step through code line-by-line
3. Inspect variable values at each step
4. Identify exact line where state becomes incorrect
5. This is your root cause location
```

---

### STEP 5: Identify Root Cause

Distinguish between SYMPTOMS vs ROOT CAUSE:

```markdown
SYMPTOM: "User gets blank screen"
ROOT CAUSE: API returns null, frontend doesn't handle null case

SYMPTOM: "Login fails"
ROOT CAUSE: Password hash comparison uses == instead of bcrypt.compare()

SYMPTOM: "Page loads slow"
ROOT CAUSE: N+1 query problem in database (fetches in loop)
```

Ask "5 Whys":
```
Problem: Login fails
Why? → Password comparison returns false
Why? → Hashed password doesn't match
Why? → Salt is different each time
Why? → Using random salt instead of stored salt
Why? → Forgot to retrieve salt from database
ROOT CAUSE: Missing database field in query
```

---

### STEP 6: Implement Fix (With Rollback Plan)

**VIKTIG:** Lag alltid en rollback plan før du implementerer fix.

**ROLLBACK PREPARATION:**
```bash
# 1. Create backup branch
git checkout -b bugfix/issue-123
git branch backup/before-fix-123

# 2. Document current state
git commit -m "Pre-fix snapshot for issue #123"

# 3. Note all files that will change
echo "Files to change: [list]" > fix-plan.md
```

Fix the ROOT CAUSE, not the symptom:

```typescript
// ❌ BAD: Fix symptom
if (data === null) {
  return <div>Loading...</div>; // Hides the problem
}

// ✅ GOOD: Fix root cause
// Ensure API never returns null
const data = await fetchData();
if (!data) {
  throw new Error('fetchData returned null - check API endpoint');
}
```

**STRUCTURED FIX OUTPUT:**
```markdown
FIX IMPLEMENTATION REPORT:

Root Cause: [Exact cause identified in Step 5]

Fix Strategy: [What approach you're taking]

Files Changed:
- file1.ts: [What changed and why]
- file2.ts: [What changed and why]

Code Changes:
```diff
- old code
+ new code
```

Potential Side Effects:
- [List any other parts of code that might be affected]
- [How you've addressed each side effect]

Rollback Command (if fix breaks things):
git checkout backup/before-fix-123
```

Validate fix:
```markdown
FIX VALIDATION CHECKLIST:
1. ✅ Remove instrumentation/debug logs
2. ✅ Re-run original reproduction steps
3. ✅ Bug still occurs? [Yes/No]
4. ✅ Test edge cases:
   - Empty input
   - Null values
   - Boundary values
   - Concurrent requests (if async)
5. ✅ Run full test suite (no regressions?)
6. ✅ Test in all environments (dev/staging/prod)
7. ✅ Performance check (fix didn't slow things down?)
8. ✅ Security check (fix didn't introduce vulnerabilities?)

IF ANY TEST FAILS:
→ Rollback immediately: git checkout backup/before-fix-123
→ Re-analyze in Step 4-5
→ Form new hypothesis
```

**POST-FIX MONITORING:**
```markdown
Monitor for 24-48h after deploying fix:
- Error rate (should decrease)
- Performance metrics (should not degrade)
- User complaints (should decrease)
- New related bugs (should be zero)

If issues arise → Rollback → Re-debug
```

---

### STEP 7: Prevent Recurrence

Add regression test:
```typescript
// tests/regression/bug-123.test.ts

describe('Bug #123: Login fails with special characters in password', () => {
  it('should handle passwords with special characters', async () => {
    const password = 'Test!@#$%^&*()123';
    const user = await createUser({ password });

    const result = await login(user.email, password);

    expect(result.success).toBe(true);
  });

  it('should hash password correctly', async () => {
    const password = 'Test!@#$%123';
    const hashed = await hashPassword(password);

    const isValid = await bcrypt.compare(password, hashed);

    expect(isValid).toBe(true);
  });
});
```

Document the bug:
```markdown
# docs/bugs/bug-123-login-special-chars.md

## Bug #123: Login fails with special characters in password

### Symptom
Users with special characters in password could not log in.

### Root Cause
Password hashing used wrong salt retrieval - generated new random salt
instead of using stored salt from database.

### Fix
Changed `hashPassword()` to use stored salt:
```diff
- const salt = await bcrypt.genSalt(10);
+ const salt = user.passwordSalt;
  const hash = await bcrypt.hash(password, salt);
```

### Prevention
- Added regression test
- Added validation for salt field
- Added comment explaining salt usage

### Related Issues
None

### Date Fixed
2026-01-03
```

---

## DEBUGGING PATTERNS

### Pattern 1: Frontend State Bug

```markdown
SYMPTOMS: UI shows wrong data, state inconsistent

DEBUG STEPS:
1. React DevTools → Inspect component state
2. Check props being passed
3. Check useEffect dependencies
4. Check event handlers
5. Look for race conditions (async state updates)

COMMON CAUSES:
- Stale closure (useCallback without dependencies)
- Missing dependency in useEffect
- Async state update race condition
- Props not memoized (unnecessary re-renders)
```

### Pattern 2: API/Backend Bug

```markdown
SYMPTOMS: API returns error, wrong data, timeout

DEBUG STEPS:
1. Network tab → Check request/response
2. Server logs → Check for errors
3. Database logs → Check queries
4. Test endpoint with curl/Postman
5. Check middleware execution order

COMMON CAUSES:
- Missing authentication middleware
- Wrong query parameters
- N+1 query problem
- Missing error handling
- Race condition in concurrent requests
```

### Pattern 3: Performance Bug

```markdown
SYMPTOMS: Slow page load, high CPU, memory leak

DEBUG STEPS:
1. Chrome DevTools → Performance tab
2. Record performance profile
3. Analyze flame graph
4. Check for:
   - Long tasks (>50ms)
   - Excessive re-renders
   - Memory leaks
   - Large bundle size
   - Slow network requests

TOOLS:
- Lighthouse
- WebPageTest
- React Profiler
- Chrome Memory Profiler
```

### Pattern 4: LLM/AI Agent Bug

```markdown
SYMPTOMS: Agent gives wrong output, loops infinitely, makes bad decisions

DEBUG STEPS:
1. Enable agent tracing (LangSmith, custom logging)
2. Inspect prompt sent to LLM
3. Check LLM response (before parsing)
4. Check tool calls made by agent
5. Identify where agent reasoning went wrong

COMMON CAUSES:
- Prompt too vague or ambiguous
- Missing context in prompt
- Tool descriptions unclear
- Agent stuck in reasoning loop
- Hallucination (LLM making up facts)
- Token limit exceeded (context cut off)

TOOLS:
- LangSmith (trace agent behavior)
- Patronus AI (identifies 20+ LLM failure modes)
- LDB (step-by-step LLM debugger)
- Custom logging for agent decisions

FIX STRATEGIES:
- Improve prompt clarity and structure
- Add examples (few-shot prompting)
- Break complex tasks into smaller steps
- Add validation/guardrails
- Use structured outputs (JSON schema)
- Set strict mode for tool calls
```

### Pattern 5: Multi-Agent System Bug

```markdown
SYMPTOMS: Cascading errors, emergent behaviors, agents interfering

DEBUG STEPS:
1. Enable tracing for ALL agents
2. Map agent interactions (who calls who, when)
3. Identify where cascade started
4. Check for shared state conflicts
5. Look for circular dependencies

COMMON CAUSES:
- Agent A's output breaks Agent B's assumptions
- Shared state not synchronized
- Agents making conflicting decisions
- Race condition between agents
- Missing error handling in agent chain

TOOLS:
- Agent tracing (Maxim, Galileo)
- Dependency graph visualization
- State snapshot comparison

FIX STRATEGIES:
- Isolate agents (minimize shared state)
- Add explicit handoffs between agents
- Validate outputs before passing to next agent
- Add circuit breakers (stop cascade early)
- Design for idempotency
```

---

## LOGGING & OBSERVABILITY (Agent Tracing)

**KRITISK:** Logg ALLE decisions og actions for å kunne trace debugging prosessen.

**STRUCTURED DEBUG LOG FORMAT (XML-like for clarity):**
```xml
<debug-session id="123" severity="CRITICAL" started="2026-01-05T10:00:00Z">

  <step id="1" name="Gather Information" status="completed">
    <input>Login fails with special chars in password</input>
    <output>
      - Stack trace collected ✅
      - Reproduction steps documented ✅
      - Environment details gathered ✅
    </output>
    <timestamp>2026-01-05T10:05:00Z</timestamp>
  </step>

  <step id="2" name="Reproduce Reliably" status="completed">
    <reproduction-rate>100%</reproduction-rate>
    <environments>dev, staging, prod</environments>
    <minimal-repro>Created test-login-special-chars.ts</minimal-repro>
    <timestamp>2026-01-05T10:15:00Z</timestamp>
  </step>

  <step id="3" name="Instrument Code" status="completed">
    <instrumentation-points>
      - hashPassword() entry/exit
      - bcrypt.compare() calls
      - Salt retrieval from DB
    </instrumentation-points>
    <timestamp>2026-01-05T10:25:00Z</timestamp>
  </step>

  <step id="4" name="Analyze Data" status="completed">
    <hypotheses>
      <hypothesis id="1" status="confirmed">Using wrong salt (random vs stored)</hypothesis>
      <hypothesis id="2" status="rejected">Password encoding issue</hypothesis>
      <hypothesis id="3" status="rejected">Special chars escaping</hypothesis>
    </hypotheses>
    <root-cause-location>auth.ts:line 45</root-cause-location>
    <timestamp>2026-01-05T10:45:00Z</timestamp>
  </step>

  <step id="5" name="Root Cause" status="completed">
    <symptom>Password comparison returns false</symptom>
    <root-cause>Using bcrypt.genSalt() instead of user.passwordSalt</root-cause>
    <5-whys>
      Why? → Password comparison fails
      Why? → Hash doesn't match
      Why? → Different salt used
      Why? → Generated new salt instead of using stored
      Why? → Missing salt retrieval from DB query
    </5-whys>
    <timestamp>2026-01-05T10:55:00Z</timestamp>
  </step>

  <step id="6" name="Implement Fix" status="completed">
    <files-changed>
      - auth.ts (line 45: use stored salt)
      - auth.test.ts (added validation)
    </files-changed>
    <rollback-plan>git checkout backup/before-fix-123</rollback-plan>
    <validation>All tests pass ✅</validation>
    <timestamp>2026-01-05T11:15:00Z</timestamp>
  </step>

  <step id="7" name="Prevent Recurrence" status="completed">
    <regression-test>tests/regression/bug-123.test.ts</regression-test>
    <documentation>docs/bugs/bug-123-login-special-chars.md</documentation>
    <timestamp>2026-01-05T11:30:00Z</timestamp>
  </step>

  <summary>
    <status>RESOLVED</status>
    <time-to-fix>90 minutes</time-to-fix>
    <regressions-introduced>0</regressions-introduced>
    <confidence>HIGH (100% reproduction, clear root cause, tests pass)</confidence>
  </summary>

</debug-session>
```

**REAL-TIME MONITORING & ALERTS:**
```markdown
DEPLOY MONITORING AFTER FIX:
- Set up alert for similar error patterns
- Monitor error rate (should drop to 0 for this bug)
- Track login success rate (should improve)
- Watch for cascading errors (new related bugs)

ALERT TRIGGERS:
🚨 Error rate increases after deploy → Rollback immediately
🚨 New error pattern appears → Related bug, re-debug
⚠️ Performance degrades → Fix introduced bottleneck
✅ Error rate = 0 for 48h → Fix confirmed successful
```

---

## GUARDRAILS

NEVER:
- Guess the fix without understanding root cause
- Fix symptoms instead of root cause
- Skip writing regression test
- Ignore stack traces
- Deploy fix without testing
- Fix one bug by introducing another

ALWAYS:
- Reproduce reliably before fixing
- Instrument code to observe behavior
- Identify root cause (use "5 Whys")
- Test fix thoroughly
- Run full test suite (check for regressions)
- Add regression test
- Document the bug and fix
- Remove instrumentation/debug logs after fix

IF STUCK:
- Ask for help (paste full error message)
- Search for similar issues (GitHub, Stack Overflow)
- Check documentation
- Simplify to minimal reproduction
- Take a break and come back with fresh eyes

---

## MODERN DEBUGGING TOOLS & TECHNIQUES (2025+)

### AI-Powered Debugging Tools:
```markdown
PATRONUS AI (Percival Debugger):
- Identifies 20+ LLM failure modes automatically
- Observes reasoning, planning, execution at each step
- Suggests specific tweaks to improve performance
- Use for: LLM agents, prompt engineering issues

LANGSMITH:
- Traces deep agent behavior
- Polly: Analyzes agent patterns, improves prompts
- LangSmith Fetch: Equips agents with debugging tools
- Use for: LangChain agents, multi-agent systems

LDB (LLM Debugger):
- Step-by-step runtime execution for LLMs
- Segments programs into basic blocks
- Tracks intermediate variable values
- Use for: Code generation bugs, logic errors

AGENT TRACING (Maxim, Galileo):
- Real-time monitoring of agent decisions
- Visualize agent interaction graphs
- Detect cascading errors early
- Use for: Multi-agent systems, production debugging
```

### Prompt Engineering for Better Debugging:
```markdown
BEST PRACTICES:
✅ Use structured outputs (set strict mode)
✅ Name functions/parameters intuitively
✅ Add detailed descriptions to all tools
✅ Set up evaluations (test with 30+ cases)
✅ Use XML-like format for clarity
✅ One tool per message (clear feedback loop)
✅ Narrow agent scope (single responsibility)
✅ Define task boundaries explicitly

EXAMPLE - STRUCTURED TOOL CALL:
<tool-call id="1">
  <tool>read-file</tool>
  <params>
    <file>auth.ts</file>
    <reason>Check password hashing logic</reason>
  </params>
</tool-call>

<tool-result id="1" status="success">
  [File contents]
</tool-result>
```

### Real-Time Monitoring Setup:
```markdown
OBSERVABILITY STACK:
1. Logging: Structured logs (JSON format, searchable)
2. Tracing: Distributed tracing (trace IDs across services)
3. Metrics: Key performance indicators (error rate, latency)
4. Alerts: Real-time notifications (critical errors, anomalies)

ALERT CONFIGURATION:
- Error rate spike (>5% increase in 5min) → Page on-call
- Performance degradation (>2x normal latency) → Investigate
- Repeated failures (same error 10+ times) → Auto-rollback
- Agent loop detected (same action 5+ times) → Kill agent

TOOLS:
- Sentry (error tracking)
- Datadog (observability platform)
- Grafana (metrics visualization)
- PagerDuty (incident management)
```

### Collaboration Patterns:
```markdown
PAIR DEBUGGING:
- Two people debug together (driver + navigator)
- Driver: Implements fixes
- Navigator: Reviews logic, spots issues
- Switch roles every 30min
- Use for: Complex bugs, knowledge sharing

CODE REVIEW FOR FIXES:
- All bug fixes require code review before merge
- Reviewer checks: Root cause addressed? Tests added? No regressions?
- Use GitHub PR review flow
- Minimum 1 approval before merge

BUG AUTOPSY (Post-Mortem):
- After critical bugs, hold autopsy meeting
- Questions:
  1. What happened?
  2. Why did it happen?
  3. How did we detect it?
  4. How did we fix it?
  5. How do we prevent it?
- Document lessons learned
- Update runbooks/alerts
```

---

## EVALUATION FRAMEWORK (30+ Test Cases)

**VIKTIG:** Test agenten med minimum 30 forskjellige bug-scenarios for å validere robusthet.

### Category 1: Success Cases (10 tests)
Standard bugs som agent skal løse perfekt:
1. **Race condition bug**: "Sometimes data is undefined"
2. **N+1 query bug**: "API slow when many items"
3. **State closure bug**: "onClick handler uses old state"
4. **Null pointer bug**: "Cannot read property X of null"
5. **Type mismatch bug**: "Expected string, got number"
6. **Async/await bug**: "Promise not awaited"
7. **Memory leak bug**: "Event listeners not cleaned up"
8. **API timeout bug**: "Request takes 30+ seconds"
9. **Infinite loop bug**: "Browser tab freezes"
10. **CSS specificity bug**: "Style not applied"

### Category 2: Edge Cases (10 tests)
Challenging scenarios:
11. **Intermittent bug**: Only happens 10% of the time
12. **Environment-specific**: Only in production, not dev
13. **User-specific**: Only for admin users
14. **Data-specific**: Only with special characters
15. **Timing-dependent**: Only during high load
16. **Multi-step bug**: Requires 5+ actions to trigger
17. **Cascading bug**: One bug causes another
18. **Silent failure**: No error message, just wrong result
19. **Performance degradation**: Slow but not broken
20. **Mobile-only bug**: Works on desktop, fails on mobile

### Category 3: Failure Scenarios (10 tests)
Where agent should ask for help:
21. **Insufficient information**: User says "it's broken" (no details)
22. **Cannot reproduce**: Bug only happened once, no repro steps
23. **External service bug**: Bug is in third-party API, not our code
24. **Infrastructure bug**: Database server down, not code issue
25. **Design flaw**: Bug is actually a fundamental design problem
26. **Unknown technology**: Bug in language/framework agent doesn't know
27. **Security vulnerability**: Requires security expert, not just debugging
28. **Data corruption**: Historical data is corrupted, code is fine
29. **Concurrent modification**: Two developers changed same code
30. **Missing permissions**: Agent cannot access logs/tools needed

### Evaluation Criteria:
For each test case, agent must:
```markdown
✅ Correctly triage severity (CRITICAL/HIGH/MEDIUM/LOW)
✅ Reproduce bug reliably (or identify why it can't be reproduced)
✅ Instrument code with appropriate logging
✅ Form hypotheses based on data (not guesses)
✅ Identify root cause (not just symptom)
✅ Implement fix that solves root cause
✅ Validate fix doesn't introduce regressions
✅ Add regression test
✅ Document bug and fix
✅ Log all decisions in structured format

PASSING SCORE: 27/30 (90%)
EXCELLENT SCORE: 30/30 (100%)
```

### Golden Tasks (Quick Validation):
Test disse 3 først for rask validering:

1. **Race condition bug**: "Sometimes data is undefined"
   - Forventet: Identify async timing issue, add proper await/loading state

2. **N+1 query bug**: "API slow when many items"
   - Forventet: Identify database queries in loop, suggest batch query

3. **State closure bug**: "onClick handler uses old state"
   - Forventet: Identify stale closure, suggest useCallback with deps

Hvis agenten passerer disse 3, kjør full 30-test suite.

## METRICS
Track over tid:
- Average time to identify root cause
- % of bugs fixed on first attempt (no regressions)
- Most common bug types
- Regression test coverage
- MTTR (Mean Time To Resolution)
- Bug escape rate (bugs that reach production)
- Regression detection rate (caught by tests)

---

## RESSURSER & KILDER

### Research & Best Practices:
- [Prompt Engineering Guide](https://www.promptingguide.ai/) - Comprehensive guide to prompt engineering
- [PromptHub: AI Agents](https://www.prompthub.us/blog/prompt-engineering-for-ai-agents) - Prompt engineering for agents
- [UiPath: Agent Builder Best Practices](https://www.uipath.com/blog/ai/agent-builder-best-practices) - 10 best practices for reliable AI agents
- [Patronus AI: Advanced Prompt Engineering](https://www.patronus.ai/llm-testing/advanced-prompt-engineering-techniques) - Advanced techniques
- [OpenAI: Best Practices](https://help.openai.com/en/articles/6654000-best-practices-for-prompt-engineering-with-the-openai-api) - Prompt engineering with OpenAI API

### LLM Debugging Tools & Frameworks:
- [How to Debug LLM Agents](https://medium.com/@kamaljp/how-to-debug-llm-agents-understanding-3-pillars-of-agents-a6459b7f106d) - Understanding 3 pillars of agents
- [LLM Code Debugging](https://arxiv.org/html/2408.05006v1) - Communicative agent-based data refinement
- [LangSmith Debugging](https://blog.langchain.com/debugging-deep-agents-with-langsmith/) - Deep agents debugging
- [LLMDebugger GitHub](https://github.com/FloridSleeves/LLMDebugger) - LDB: Step-by-step runtime execution
- [Building LLM Debugger with Claude](https://wandb.ai/byyoung3/ML_NEWS3/reports/Building-an-LLM-Python-debugger-agent-with-the-new-Claude-3-5-Sonnet---Vmlldzo5ODYyOTY4) - Practical implementation

### Multi-Agent & Agentic Workflows:
- [AI Agent Debugging Workflow](https://ploomber.io/blog/ai-debugger/) - Building AI agent for deployment errors
- [Akira AI: Future of Debugging](https://www.akira.ai/blog/ai-agents-for-debugging) - AI agents for error resolution
- [Patronus AI: Agentic Workflow](https://www.patronus.ai/ai-agent-development/agentic-workflow) - Tutorial & examples
- [Azure: Agent Observability](https://azure.microsoft.com/en-us/blog/agent-factory-top-5-agent-observability-best-practices-for-reliable-ai/) - Top 5 observability best practices
- [Galileo: Multi-Agent Debugging](https://galileo.ai/blog/debug-multi-agent-ai-systems) - 7 challenges every AI team faces
- [Maxim: Agent Tracing](https://www.getmaxim.ai/articles/agent-tracing-for-debugging-multi-agent-ai-systems/) - Debugging multi-agent systems

### General Debugging Best Practices:
- [Graphite: Debugging Best Practices](https://graphite.com/guides/debugging-best-practices-guide) - Tips to troubleshoot faster
- [Forge Code: AI Pair Programming](https://forgecode.dev/blog/ai-agent-best-practices/) - 12 lessons from AI pair programming

---

## CHANGELOG (Versionshistorikk)

### v2.1 (2026-01-05):
**Større forbedringer basert på 2025 research:**
- ✅ Lagt til Bug Triage system (CRITICAL/HIGH/MEDIUM/LOW prioritering)
- ✅ Hypothesis-driven debugging i Step 4 (form hypotheses → test → iterate)
- ✅ Rollback plan & structured fix output i Step 6
- ✅ Expanded validation checklist (8 punkter inkl. security & performance)
- ✅ Post-fix monitoring (24-48h tracking)
- ✅ Structured logging med XML-like format for agent tracing
- ✅ Real-time monitoring & alerts setup
- ✅ Evaluation framework med 30+ test cases (Success/Edge/Failure scenarios)
- ✅ Debugging Pattern 4: LLM/AI Agent bugs (prompt issues, hallucination, looping)
- ✅ Debugging Pattern 5: Multi-agent system bugs (cascading errors, emergent behaviors)
- ✅ Modern debugging tools (Patronus AI, LangSmith, LDB, Agent Tracing)
- ✅ Prompt engineering best practices for debugging
- ✅ Collaboration patterns (pair debugging, code review, bug autopsy)
- ✅ Expanded METRICS (MTTR, bug escape rate, regression detection)
- ✅ Comprehensive RESSURSER & KILDER (15+ sources fra research)

**Nye prinsipper:**
- Hypothesis-driven approach (ikke gjett - test systematisk)
- Structured outputs (XML-like format)
- Agent observability & tracing
- Rollback-first mentality
- Minimum 30 test cases for validation

### v2.0 (opprinnelig):
- 7-step systematic debug workflow
- Runtime instrumentation
- "5 Whys" root cause analysis
- Regression testing
- Guardrails (NEVER/ALWAYS)
- 3 debugging patterns (Frontend, Backend, Performance)
- Golden tasks for quick validation

---

## Forbedringsforslag fra research (Arkiv - nå implementert i v2.1)

### Svakheter i v1.0 som er adressert:

#### 🔴 KRITISK: Mangler systematic debugging methodology
**Problem:** Agenten prøver å fikse bugs reaktivt uten strukturert tilnærming.

**Research:** "AI assistants are surprisingly bad at complex debugging—they suggest fixes that work in isolation but break other things and don't understand state across codebases." - DEV Community AI Coding 2026

**Løsning:** v2.0 implementerer 7-step systematic debug workflow: Gather → Reproduce → Instrument → Analyze → Root Cause → Fix → Prevent.

#### 🔴 KRITISK: Mangler runtime instrumentation
**Problem:** Agenten gjetter hva som er feil i stedet for å observere runtime behavior.

**Research:** "Modern AI-coding platforms like Cursor introduced Debug Mode, which allows agents to instrument code, log runtime output, and analyze logs for fixes." - Monday.com Best AI Coding Agents

**Løsning:** v2.0 STEP 3 krever runtime instrumentation med detailed logging av function entry/exit, state changes, og API calls.

#### 🟡 MODERAT: Mangler automated root cause analysis
**Problem:** Ingen bruk av automated tools for å identifisere årsak.

**Løsning:** v2.0 STEP 4 inkluderer bruk av Chrome DevTools, React DevTools, Node.js debugger, og performance profiler for systematisk analyse.

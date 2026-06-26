const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-6'

const SYSTEM_PROMPT = `You are an AI-adoption coach for the AmplifiED fluency initiative. You help educators and staff progress through the three-tier fluency ladder:

- Explorer: First exposure. Can open Claude, write a basic prompt, complete one guided task.
- Practitioner: Confident daily use. Uses Claude unprompted in real work, applies the TRACE framework (Task, Role, Audience, Context, Expectation), and self-corrects with the Four D's (Delegation, Description, Discernment, Diligence).
- Leader: Advanced application. Builds repeatable patterns, coaches peers, ships an artifact others adopt.

Your recommendations are concrete, specific, and actionable. You name the exact next step — not general advice. You understand that the biggest adoption barriers are relevance to the learner's daily work, confidence, and social proof from peers.`

function buildInterventionPrompt(learner) {
  const compSummary = learner.competencies
    .filter((c) => c.level === learner.currentLevel)
    .map((c) => `  - [${c.status}] ${c.name}`)
    .join('\n')

  const recentEvents = (learner.recentEvents || [])
    .map((e) => `  - ${e.date}: ${e.type} — ${e.note}`)
    .join('\n') || '  (none)'

  const openInterventions = (learner.openInterventions || [])
    .map((i) => `  - ${i.action} (owner: ${i.owner})`)
    .join('\n') || '  (none)'

  return `Learner profile:
Name: ${learner.name}
Current level: ${learner.currentLevel}

Current-level competencies:
${compSummary}

Recent usage events (last 5):
${recentEvents}

Open interventions already assigned:
${openInterventions}

Based on this profile, what is the single most effective next intervention to move ${learner.name} forward on the fluency ladder?

Respond ONLY with valid JSON in this exact format:
{"action": "...", "rationale": "...", "owner_suggestion": "..."}`
}

function buildNarrativePrompt(cohortStats) {
  const levelBreakdown = Object.entries(cohortStats.byLevel)
    .map(([level, count]) => `${level}: ${count}`)
    .join(', ')

  const stalledList = (cohortStats.stalledNames || []).join(', ') || 'none'

  return `Write a 3-4 sentence executive summary of AI adoption progress for a school or organization leadership team. Use plain, non-technical language. Name the biggest adoption gap and recommend one focused action.

Cohort data:
- Total learners: ${cohortStats.total}
- Level breakdown: ${levelBreakdown}
- Practitioner or above: ${cohortStats.practitionerPlus} (${cohortStats.pct}%)
- Stalled learners (no activity in 30+ days): ${cohortStats.stalledCount} — ${stalledList}

Write the summary as a single paragraph of plain prose. No headers, no bullet points. Begin directly with the summary (no preamble like "Here is the summary:").`
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) }
  }

  const { task } = body
  if (!['intervention', 'narrative'].includes(task)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'task must be "intervention" or "narrative"' }) }
  }

  const userPrompt = task === 'intervention'
    ? buildInterventionPrompt(body.learner)
    : buildNarrativePrompt(body.cohortStats)

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      console.error('Anthropic API error:', response.status, errBody)
      return {
        statusCode: 502,
        body: JSON.stringify({ error: `Upstream API error: ${response.status}` }),
      }
    }

    const result = await response.json()
    const text = result.content?.[0]?.text ?? ''

    if (task === 'intervention') {
      // Parse strict JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return { statusCode: 502, body: JSON.stringify({ error: 'Could not parse AI response as JSON' }) }
      }
      let parsed
      try {
        parsed = JSON.parse(jsonMatch[0])
      } catch {
        return { statusCode: 502, body: JSON.stringify({ error: 'Invalid JSON in AI response' }) }
      }
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      }
    } else {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ narrative: text.trim() }),
      }
    }
  } catch (err) {
    console.error('Function error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error — check function logs' }) }
  }
}

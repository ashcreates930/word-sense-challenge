// Fluency ladder competency rubric — single source of truth

export const LEVELS = ['Explorer', 'Practitioner', 'Leader'];

export const RUBRIC = {
  Explorer: {
    description: 'First exposure — can open Claude, write a basic prompt, complete one guided task.',
    dimensions: [
      {
        id: 'access',
        name: 'Access',
        competencies: [
          { id: 'exp-acc-1', name: 'Can log into Claude and navigate to the chat interface' },
          { id: 'exp-acc-2', name: 'Understands what an AI assistant is and what it can do' },
        ],
      },
      {
        id: 'first_prompt',
        name: 'First Prompt',
        competencies: [
          { id: 'exp-fp-1', name: 'Has written and submitted at least one prompt independently' },
          { id: 'exp-fp-2', name: 'Can describe the difference between a vague and specific prompt' },
        ],
      },
      {
        id: 'guided_task',
        name: 'Guided Task',
        competencies: [
          { id: 'exp-gt-1', name: 'Has completed one guided AI-assisted task with support' },
          { id: 'exp-gt-2', name: 'Can articulate one concrete way AI could help their work' },
        ],
      },
    ],
  },
  Practitioner: {
    description: 'Confident daily use — uses Claude unprompted in real work, applies TRACE and the Four D\'s.',
    dimensions: [
      {
        id: 'daily_use',
        name: 'Daily Use',
        competencies: [
          { id: 'prac-du-1', name: 'Uses Claude unprompted at least 3× per week in real work tasks' },
          { id: 'prac-du-2', name: 'Has replaced at least one manual workflow with an AI-assisted one' },
        ],
      },
      {
        id: 'trace_applied',
        name: 'TRACE Applied',
        competencies: [
          { id: 'prac-tr-1', name: 'Can name all five elements of TRACE (Task, Role, Audience, Context, Expectation)' },
          { id: 'prac-tr-2', name: 'Consistently structures prompts using the TRACE framework' },
          { id: 'prac-tr-3', name: 'Can show a before/after example of a TRACE-improved prompt' },
        ],
      },
      {
        id: 'self_correction',
        name: 'Self-Correction',
        competencies: [
          { id: 'prac-sc-1', name: 'Applies the Four D\'s: Delegation, Description, Discernment, Diligence' },
          { id: 'prac-sc-2', name: 'Can identify and correct a low-quality AI output without coaching' },
          { id: 'prac-sc-3', name: 'Verifies AI outputs before using them in real deliverables' },
        ],
      },
    ],
  },
  Leader: {
    description: 'Advanced application — builds repeatable patterns, coaches peers, ships artifacts others adopt.',
    dimensions: [
      {
        id: 'pattern_building',
        name: 'Pattern Building',
        competencies: [
          { id: 'lead-pb-1', name: 'Has documented at least one reusable prompt template or workflow' },
          { id: 'lead-pb-2', name: 'Can adapt existing patterns to new use cases independently' },
        ],
      },
      {
        id: 'peer_coaching',
        name: 'Peer Coaching',
        competencies: [
          { id: 'lead-pc-1', name: 'Has coached at least one colleague through a specific AI task' },
          { id: 'lead-pc-2', name: 'Can facilitate a brief AI use-case discussion with their team' },
        ],
      },
      {
        id: 'shipped_adoption',
        name: 'Shipped Adoption',
        competencies: [
          { id: 'lead-sa-1', name: 'Has shipped an AI-assisted artifact that at least one other person has used' },
          { id: 'lead-sa-2', name: 'Can describe the impact or time savings from their AI-assisted work' },
        ],
      },
    ],
  },
};

export function buildInitialCompetencies(level) {
  const levelRubric = RUBRIC[level];
  if (!levelRubric) return [];
  return levelRubric.dimensions.flatMap((dim) =>
    dim.competencies.map((c) => ({
      id: c.id,
      name: c.name,
      dimension: dim.name,
      dimensionId: dim.id,
      level,
      status: 'not_started',
    }))
  );
}

export function buildAllCompetencies() {
  return LEVELS.flatMap((level) => buildInitialCompetencies(level));
}

// A learner advances when all competencies for their current level are 'demonstrated'
export function computeLevel(competencies) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    const level = LEVELS[i];
    const levelComps = competencies.filter((c) => c.level === level);
    if (levelComps.length === 0) continue;
    const allDemonstrated = levelComps.every((c) => c.status === 'demonstrated');
    if (allDemonstrated && i < LEVELS.length - 1) {
      // Check if we should be at the next level
    }
  }
  // Find highest completed level
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    const level = LEVELS[i];
    if (i === 0) return 'Explorer'; // always at least Explorer
    const prevLevel = LEVELS[i - 1];
    const prevComps = competencies.filter((c) => c.level === prevLevel);
    const allPrevDone = prevComps.every((c) => c.status === 'demonstrated');
    if (allPrevDone) return level;
  }
  return 'Explorer';
}

export function levelColor(level) {
  return {
    Explorer: 'bg-blue-100 text-blue-800',
    Practitioner: 'bg-amber-100 text-amber-800',
    Leader: 'bg-purple-100 text-purple-800',
  }[level] || 'bg-gray-100 text-gray-800';
}

export function levelProgress(competencies, level) {
  const comps = competencies.filter((c) => c.level === level);
  if (comps.length === 0) return 0;
  const done = comps.filter((c) => c.status === 'demonstrated').length;
  return Math.round((done / comps.length) * 100);
}

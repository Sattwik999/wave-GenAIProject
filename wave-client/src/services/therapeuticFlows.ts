// Therapeutic conversation flows and mental health features
export interface TherapeuticFlow {
  id: string
  name: string
  description: string
  category: 'anxiety' | 'depression' | 'stress' | 'relationships' | 'self-esteem' | 'mindfulness'
  steps: TherapeuticStep[]
  estimatedTime: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface TherapeuticStep {
  id: string
  title: string
  type: 'question' | 'exercise' | 'reflection' | 'coping-strategy' | 'mindfulness'
  content: string
  prompt: string
  expectedResponse?: 'short' | 'detailed' | 'scale' | 'yes-no'
  followUp?: string[]
  nextStepLogic?: (response: string) => string // ID of next step
}

export interface CopingStrategy {
  id: string
  name: string
  category: string
  technique: string
  description: string
  instructions: string[]
  duration: string
  effectiveness: string[]
  evidenceBased: boolean
}

export interface UserProgress {
  flowId: string
  currentStepId: string
  completedSteps: string[]
  responses: Record<string, string>
  startedAt: Date
  lastActiveAt: Date
  insights: string[]
}

// Evidence-based therapeutic flows
export const THERAPEUTIC_FLOWS: TherapeuticFlow[] = [
  {
    id: 'anxiety-cbt-basic',
    name: 'Managing Anxiety with CBT',
    description: 'Learn to identify and challenge anxious thoughts using Cognitive Behavioral Therapy techniques',
    category: 'anxiety',
    estimatedTime: '10-15 minutes',
    difficulty: 'beginner',
    steps: [
      {
        id: 'anxiety-identify',
        title: 'Identifying Your Anxiety',
        type: 'question',
        content: 'Let\'s start by understanding what you\'re experiencing right now.',
        prompt: 'Can you describe what you\'re feeling anxious about? Try to be as specific as possible.',
        expectedResponse: 'detailed'
      },
      {
        id: 'anxiety-physical',
        title: 'Physical Sensations',
        type: 'question',
        content: 'Anxiety affects our body as well as our mind.',
        prompt: 'What physical sensations are you noticing? (racing heart, tight chest, sweating, etc.)',
        expectedResponse: 'short'
      },
      {
        id: 'anxiety-thoughts',
        title: 'Thought Patterns',
        type: 'question',
        content: 'Now let\'s examine the thoughts that are fueling your anxiety.',
        prompt: 'What specific thoughts are going through your mind? What are you telling yourself might happen?',
        expectedResponse: 'detailed'
      },
      {
        id: 'anxiety-challenge',
        title: 'Challenging Anxious Thoughts',
        type: 'exercise',
        content: 'Let\'s challenge these thoughts using CBT techniques.',
        prompt: 'Looking at those thoughts, ask yourself: Is this thought realistic? What evidence do I have for and against it? What would I tell a friend having this thought?',
        expectedResponse: 'detailed'
      },
      {
        id: 'anxiety-reframe',
        title: 'Reframing Exercise',
        type: 'reflection',
        content: 'Now let\'s create a more balanced perspective.',
        prompt: 'Based on your analysis, can you rewrite your anxious thought in a more balanced, realistic way?',
        expectedResponse: 'detailed'
      },
      {
        id: 'anxiety-coping',
        title: 'Coping Strategy',
        type: 'coping-strategy',
        content: 'Let\'s practice a grounding technique to manage the physical symptoms.',
        prompt: 'Try the 5-4-3-2-1 grounding technique: Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. How does this feel?',
        expectedResponse: 'short'
      }
    ]
  },
  {
    id: 'stress-mindfulness',
    name: 'Mindful Stress Management',
    description: 'Use mindfulness techniques to reduce stress and increase present-moment awareness',
    category: 'stress',
    estimatedTime: '8-12 minutes',
    difficulty: 'beginner',
    steps: [
      {
        id: 'stress-assessment',
        title: 'Stress Check-In',
        type: 'question',
        content: 'Let\'s assess your current stress level.',
        prompt: 'On a scale of 1-10, how stressed are you feeling right now? What\'s contributing to this stress?',
        expectedResponse: 'scale'
      },
      {
        id: 'stress-body-scan',
        title: 'Body Awareness',
        type: 'mindfulness',
        content: 'Let\'s bring awareness to how stress is affecting your body.',
        prompt: 'Take a moment to scan your body from head to toe. Where do you feel tension or discomfort? Don\'t try to change anything, just notice.',
        expectedResponse: 'detailed'
      },
      {
        id: 'stress-breathing',
        title: 'Mindful Breathing',
        type: 'exercise',
        content: 'We\'ll use breathing to activate your body\'s relaxation response.',
        prompt: 'Let\'s practice box breathing: Breathe in for 4 counts, hold for 4, out for 4, hold for 4. Repeat this 5 times. What do you notice?',
        expectedResponse: 'short'
      },
      {
        id: 'stress-present-moment',
        title: 'Present Moment Awareness',
        type: 'mindfulness',
        content: 'Stress often comes from worrying about the future or ruminating on the past.',
        prompt: 'Right now, in this exact moment, are you safe? What are three things you can appreciate about this present moment?',
        expectedResponse: 'detailed'
      },
      {
        id: 'stress-acceptance',
        title: 'Acceptance Practice',
        type: 'reflection',
        content: 'Sometimes stress comes from fighting what we can\'t control.',
        prompt: 'What aspects of your stress are within your control, and what aspects are not? Can you practice accepting what you can\'t change?',
        expectedResponse: 'detailed'
      }
    ]
  },
  {
    id: 'depression-behavioral-activation',
    name: 'Behavioral Activation for Low Mood',
    description: 'Use behavioral activation techniques to combat depression and increase meaningful activity',
    category: 'depression',
    estimatedTime: '12-18 minutes',
    difficulty: 'intermediate',
    steps: [
      {
        id: 'mood-check',
        title: 'Mood Assessment',
        type: 'question',
        content: 'Let\'s understand your current emotional state.',
        prompt: 'How has your mood been lately? Can you describe what you\'ve been feeling?',
        expectedResponse: 'detailed'
      },
      {
        id: 'activity-review',
        title: 'Activity Review',
        type: 'question',
        content: 'Depression often leads to withdrawal from activities we once enjoyed.',
        prompt: 'What activities have you been doing less of lately? What used to bring you joy or satisfaction?',
        expectedResponse: 'detailed'
      },
      {
        id: 'value-identification',
        title: 'Identifying Your Values',
        type: 'reflection',
        content: 'Let\'s connect with what matters most to you.',
        prompt: 'What are three things that are most important to you in life? (relationships, creativity, helping others, learning, etc.)',
        expectedResponse: 'detailed'
      },
      {
        id: 'small-step-planning',
        title: 'Planning Small Steps',
        type: 'exercise',
        content: 'We\'ll identify one small, manageable activity aligned with your values.',
        prompt: 'Choose one small activity that connects to your values and feels doable today. What would be one tiny step toward this?',
        expectedResponse: 'detailed'
      },
      {
        id: 'commitment',
        title: 'Making a Commitment',
        type: 'question',
        content: 'Behavioral activation works through committed action, even when motivation is low.',
        prompt: 'Can you commit to doing this small activity within the next 24 hours? What might get in the way, and how can you overcome it?',
        expectedResponse: 'detailed'
      }
    ]
  }
]

// Coping strategies library
export const COPING_STRATEGIES: CopingStrategy[] = [
  {
    id: 'box-breathing',
    name: 'Box Breathing',
    category: 'anxiety',
    technique: 'Breathing Exercise',
    description: 'A structured breathing pattern that activates the parasympathetic nervous system',
    instructions: [
      'Sit comfortably with your back straight',
      'Exhale completely through your mouth',
      'Breathe in through your nose for 4 counts',
      'Hold your breath for 4 counts',
      'Exhale through your mouth for 4 counts',
      'Hold empty for 4 counts',
      'Repeat for 5-10 cycles'
    ],
    duration: '2-5 minutes',
    effectiveness: ['Reduces anxiety', 'Lowers heart rate', 'Improves focus'],
    evidenceBased: true
  },
  {
    id: 'grounding-5-4-3-2-1',
    name: '5-4-3-2-1 Grounding',
    category: 'anxiety',
    technique: 'Sensory Grounding',
    description: 'Uses your five senses to bring you back to the present moment',
    instructions: [
      'Name 5 things you can see around you',
      'Name 4 things you can physically feel',
      'Name 3 things you can hear',
      'Name 2 things you can smell',
      'Name 1 thing you can taste'
    ],
    duration: '3-5 minutes',
    effectiveness: ['Reduces panic', 'Grounds in present', 'Interrupts rumination'],
    evidenceBased: true
  },
  {
    id: 'thought-challenging',
    name: 'Cognitive Restructuring',
    category: 'depression',
    technique: 'CBT Technique',
    description: 'Challenge and reframe negative thought patterns',
    instructions: [
      'Identify the negative thought',
      'Ask: Is this thought helpful or harmful?',
      'Look for evidence for and against the thought',
      'Consider: What would I tell a friend having this thought?',
      'Develop a more balanced, realistic thought',
      'Practice the new thought regularly'
    ],
    duration: '5-10 minutes',
    effectiveness: ['Reduces negative thinking', 'Improves mood', 'Builds resilience'],
    evidenceBased: true
  },
  {
    id: 'progressive-muscle-relaxation',
    name: 'Progressive Muscle Relaxation',
    category: 'stress',
    technique: 'Relaxation Exercise',
    description: 'Systematically tense and release muscle groups to reduce physical tension',
    instructions: [
      'Find a comfortable position',
      'Start with your toes - tense for 5 seconds, then release',
      'Move to your calves, thighs, buttocks, abdomen',
      'Continue with hands, arms, shoulders, neck, face',
      'Notice the contrast between tension and relaxation',
      'End by taking three deep breaths'
    ],
    duration: '10-15 minutes',
    effectiveness: ['Reduces muscle tension', 'Promotes relaxation', 'Improves sleep'],
    evidenceBased: true
  },
  {
    id: 'behavioral-activation-small-steps',
    name: 'Behavioral Activation',
    category: 'depression',
    technique: 'Activity Scheduling',
    description: 'Combat depression by gradually increasing meaningful activities',
    instructions: [
      'Identify one small, meaningful activity',
      'Break it down into tiny, manageable steps',
      'Schedule it for a specific time',
      'Do it regardless of how you feel',
      'Notice any change in mood afterward',
      'Gradually increase frequency and duration'
    ],
    duration: 'Ongoing',
    effectiveness: ['Improves mood', 'Increases motivation', 'Builds momentum'],
    evidenceBased: true
  },
  {
    id: 'loving-kindness-meditation',
    name: 'Loving-Kindness Meditation',
    category: 'self-esteem',
    technique: 'Mindfulness Practice',
    description: 'Cultivate compassion and kindness toward yourself and others',
    instructions: [
      'Sit quietly and breathe naturally',
      'Start by offering kindness to yourself: "May I be happy, may I be healthy, may I be at peace"',
      'Extend to a loved one: "May you be happy, may you be healthy, may you be at peace"',
      'Include a neutral person, then a difficult person',
      'Finally, extend to all beings everywhere',
      'Rest in the feeling of universal compassion'
    ],
    duration: '10-20 minutes',
    effectiveness: ['Increases self-compassion', 'Reduces self-criticism', 'Improves relationships'],
    evidenceBased: true
  }
]

// Helper functions
export function getFlowsByCategory(category: TherapeuticFlow['category']): TherapeuticFlow[] {
  return THERAPEUTIC_FLOWS.filter(flow => flow.category === category)
}

export function getCopingStrategiesByCategory(category: string): CopingStrategy[] {
  return COPING_STRATEGIES.filter(strategy => strategy.category === category)
}

export function getRandomCopingStrategy(category?: string): CopingStrategy {
  const strategies = category 
    ? getCopingStrategiesByCategory(category)
    : COPING_STRATEGIES
  return strategies[Math.floor(Math.random() * strategies.length)]
}

export function detectEmotionalCategories(text: string): string[] {
  const categories: string[] = []
  const lowerText = text.toLowerCase()
  
  if (/anxious|worried|nervous|panic|overwhelm|stress/.test(lowerText)) {
    categories.push('anxiety')
  }
  if (/sad|down|depressed|hopeless|empty|worthless/.test(lowerText)) {
    categories.push('depression')
  }
  if (/stress|pressure|overwhelm|busy|deadline/.test(lowerText)) {
    categories.push('stress')
  }
  if (/relationship|friend|family|partner|conflict/.test(lowerText)) {
    categories.push('relationships')
  }
  if (/self|worth|confidence|doubt|failure|inadequate/.test(lowerText)) {
    categories.push('self-esteem')
  }
  
  return categories
}
import { useEffect, useRef, useState } from 'react'
import { apiChat, apiModerate, apiPersonalizedChat } from '../services/api'
import { demoReply } from '../services/demoAI'
import { supabase } from '../services/supabaseClient'
import { ProgressTracker } from '../services/progressTracker'
import { detectEmotionalCategories, COPING_STRATEGIES, getCopingStrategiesByCategory } from '../services/therapeuticFlows'

type Msg = { 
  id: string
  from: 'user' | 'bot'
  text: string
  timestamp: Date
  status?: 'sending' | 'sent' | 'error'
}

type ChatMode = 'advisor' | 'close-person'

type PersonaProfile = {
  id: string
  name: string
  relationship: 'parent' | 'friend' | 'partner' | 'grandparent' | 'mentor' | 'custom'
  relationshipLabel: string
  personality: {
    communicationStyle: 'formal' | 'casual' | 'playful' | 'gentle'
    traits: string[]
    catchphrases: string[]
    emotionalApproach: 'logical' | 'emotional' | 'balanced'
  }
  description: string
}

const RELATIONSHIP_PRESETS = {
  parent: {
    traits: ['nurturing', 'protective', 'wise', 'encouraging'],
    catchphrases: ['sweetie', 'honey', "I'm proud of you", 'you can do this'],
    emotionalApproach: 'emotional' as const,
    communicationStyle: 'gentle' as const,
    defaultNames: ['Mom', 'Dad', 'Mother', 'Father']
  },
  friend: {
    traits: ['casual', 'loyal', 'fun', 'relatable', 'supportive'],
    catchphrases: ['dude', 'girl', 'no way', 'totally', 'you got this'],
    emotionalApproach: 'balanced' as const,
    communicationStyle: 'casual' as const,
    defaultNames: ['Sarah', 'Mike', 'Alex', 'Jamie']
  },
  partner: {
    traits: ['loving', 'supportive', 'intimate', 'understanding'],
    catchphrases: ['babe', 'love', 'darling', 'we got this together'],
    emotionalApproach: 'emotional' as const,
    communicationStyle: 'gentle' as const,
    defaultNames: ['Partner', 'Spouse', 'Love']
  },
  grandparent: {
    traits: ['wise', 'patient', 'storytelling', 'warm', 'experienced'],
    catchphrases: ['dear', 'my child', 'when I was your age', 'everything will be okay'],
    emotionalApproach: 'balanced' as const,
    communicationStyle: 'gentle' as const,
    defaultNames: ['Grandma', 'Grandpa', 'Nana', 'Papa']
  },
  mentor: {
    traits: ['wise', 'encouraging', 'growth-focused', 'inspiring'],
    catchphrases: ['you have potential', 'think about it this way', 'what can we learn'],
    emotionalApproach: 'logical' as const,
    communicationStyle: 'formal' as const,
    defaultNames: ['Teacher', 'Coach', 'Mentor', 'Guide']
  }
}

export default function Chat(){
  const createMessage = (from: 'user' | 'bot', text: string, status: 'sending' | 'sent' | 'error' = 'sent'): Msg => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    from,
    text,
    timestamp: new Date(),
    status
  })

  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [chatMode, setChatMode] = useState<ChatMode>('advisor')
  const [showModeSelector, setShowModeSelector] = useState(true)
  const [showPersonaSetup, setShowPersonaSetup] = useState(false)
  const [currentPersona, setCurrentPersona] = useState<PersonaProfile | null>(null)
  const [setupStep, setSetupStep] = useState(1)
  const [tempPersona, setTempPersona] = useState({
    relationship: '' as PersonaProfile['relationship'],
    name: '',
    traits: [] as string[],
    description: '',
    communicationStyle: 'gentle' as PersonaProfile['personality']['communicationStyle']
  })
  const [progressTracker] = useState(() => new ProgressTracker('chat-user')) // Initialize once
  const [showTherapeuticSuggestions, setShowTherapeuticSuggestions] = useState(false)
  const [suggestedStrategies, setSuggestedStrategies] = useState<any[]>([])
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(()=>{ endRef.current?.scrollIntoView({ behavior:'smooth' }) }, [msgs, typing])

  // Load saved persona on mount
  useEffect(() => {
    const savedPersona = localStorage.getItem('wave-chat-persona')
    if (savedPersona) {
      try {
        const persona = JSON.parse(savedPersona)
        setCurrentPersona(persona)
      } catch (error) {
        console.error('Failed to load saved persona:', error)
      }
    }
  }, [])

  // Initialize chat when mode is selected
  useEffect(() => {
    if (!showModeSelector && msgs.length === 0) {
      if (chatMode === 'advisor') {
        setMsgs([createMessage('bot', 'Hi! I\'m your Mental Health Advisor. I\'m here to provide professional support and guidance. What\'s on your mind today?')])
      } else if (chatMode === 'close-person' && currentPersona) {
        const greeting = generatePersonalizedGreeting(currentPersona)
        setMsgs([createMessage('bot', greeting)])
      }
    }
  }, [showModeSelector, chatMode, currentPersona])

  const generatePersonalizedGreeting = (persona: PersonaProfile): string => {
    const greetings: Record<string, string[]> = {
      parent: [`Hey ${persona.personality.catchphrases.includes('sweetie') ? 'sweetie' : ''}! How was your day?`, "Hi honey! I was just thinking about you. How are you feeling?"],
      friend: [`Hey ${persona.personality.catchphrases.includes('dude') ? 'dude' : ''}! What's up?`, "Yooo! How's it going? I'm here if you need to talk!"],
      partner: [`Hi ${persona.personality.catchphrases.includes('babe') ? 'babe' : 'love'}! I missed you. How are you doing?`, "Hey darling! I'm here for whatever you need to talk about."],
      grandparent: ["Hello dear! Come sit with me. What's on your heart today?", "My child, I can always make time for you. What would you like to share?"],
      mentor: ["Hello! I'm glad you came to talk. What challenges are we working through today?", "Good to see you! What insights can we explore together?"]
    }
    
    const options = greetings[persona.relationship] || ["Hello! I'm here for you. What's on your mind?"]
    return options[Math.floor(Math.random() * options.length)]
  }

  const selectMode = (mode: ChatMode) => {
    setChatMode(mode)
    if (mode === 'advisor') {
      setShowModeSelector(false)
    } else {
      setShowPersonaSetup(true)
    }
  }

  const createPersona = () => {
    const preset = RELATIONSHIP_PRESETS[tempPersona.relationship as keyof typeof RELATIONSHIP_PRESETS]
    const persona: PersonaProfile = {
      id: Date.now().toString(),
      name: tempPersona.name,
      relationship: tempPersona.relationship,
      relationshipLabel: tempPersona.relationship.charAt(0).toUpperCase() + tempPersona.relationship.slice(1),
      personality: {
        communicationStyle: tempPersona.communicationStyle,
        traits: tempPersona.traits.length > 0 ? tempPersona.traits : preset?.traits || [],
        catchphrases: preset?.catchphrases || [],
        emotionalApproach: preset?.emotionalApproach || 'balanced'
      },
      description: tempPersona.description
    }
    
    setCurrentPersona(persona)
    localStorage.setItem('wave-chat-persona', JSON.stringify(persona))
    setShowPersonaSetup(false)
    setShowModeSelector(false)
    setSetupStep(1)
  }

  const generatePersonalizedReply = (userText: string, persona: PersonaProfile): string => {
    const { personality, relationship, name } = persona
    const text = userText.toLowerCase()
    
    // Emotional keywords detection
    const anxietyWords = /anxious|worried|nervous|scared|panic|overwhelm|stress/
    const sadWords = /sad|down|depressed|lonely|hopeless|tired|exhausted/
    const happyWords = /good|great|happy|excited|amazing|wonderful|fantastic/
    const angryWords = /angry|mad|frustrated|annoyed|upset/
    const workWords = /work|job|boss|deadline|meeting|project|career/
    const relationshipWords = /friend|family|partner|relationship|fight|argue/
    const healthWords = /sick|pain|hurt|doctor|medical|health/
    
    // Base response templates by relationship and emotion
    const responseTemplates: Record<string, Record<string, string[]>> = {
      parent: {
        anxiety: [
          `${getRandomCatchphrase(personality.catchphrases)}, I can hear the worry in your voice. When you were little and got scared, we used to count to ten together. Want to try some breathing with me?`,
          `Oh ${getRandomCatchphrase(personality.catchphrases)}, anxiety is so hard. You know what? You've gotten through 100% of your worst days so far. That's a perfect record. What's the biggest thing worrying you right now?`,
          `${getRandomCatchphrase(personality.catchphrases)}, come here. Let's sit together for a moment. I remember you telling me about that technique you learned - the 4-7-8 breathing? Should we try that?`,
        ],
        sadness: [
          `My ${getRandomCatchphrase(personality.catchphrases)}, I can feel your heart hurting. You know it's okay to not be okay sometimes? I'm here, and I'm not going anywhere. Want to tell me what's heavy on your heart?`,
          `${getRandomCatchphrase(personality.catchphrases)}, some days are just harder than others, aren't they? When you were younger, we used to make hot cocoa and talk. What would comfort you right now?`,
          `Oh ${getRandomCatchphrase(personality.catchphrases)}, I wish I could give you the biggest hug right now. You don't have to carry everything alone. I'm here to listen, no judgment, just love.`,
        ],
        happiness: [
          `${getRandomCatchphrase(personality.catchphrases)}, your happiness makes my heart so full! I love seeing you like this. Tell me all about what's making you feel so good!`,
          `Oh this is wonderful! ${getRandomCatchphrase(personality.catchphrases)}, your joy is contagious. I'm so proud of you for finding moments of happiness. What's been the best part?`,
        ],
        work: [
          `Work stress again, ${getRandomCatchphrase(personality.catchphrases)}? I know how hard you work, and I'm so proud of your dedication. But remember, you're more than your job. What's the most challenging part right now?`,
          `${getRandomCatchphrase(personality.catchphrases)}, you've always been such a hard worker, even as a kid. But don't forget to take care of yourself too. Is there something specific about work that's bothering you today?`,
        ],
        general: [
          `${getRandomCatchphrase(personality.catchphrases)}, I'm always here when you need to talk. You know you can tell me anything, right? What's going on in that beautiful mind of yours?`,
          `Just hearing from you makes me happy, ${getRandomCatchphrase(personality.catchphrases)}. I love our conversations. What would you like to share with me today?`,
        ]
      },
      friend: {
        anxiety: [
          `Ugh, anxiety is the worst! ${getRandomCatchphrase(personality.catchphrases)}, I totally get it. Remember that time we were both freaking out about finals? We got through that together. What's got you all wound up?`,
          `Hey ${getRandomCatchphrase(personality.catchphrases)}, breathe with me for a sec, okay? I know when you get anxious you start spiraling. Let's break this down - what's the main thing that's bugging you?`,
          `${getRandomCatchphrase(personality.catchphrases)}, anxiety brain is lying to you again, isn't it? I've seen you handle so much worse than whatever this is. Want to vent about it?`,
        ],
        sadness: [
          `Aw ${getRandomCatchphrase(personality.catchphrases)}, I hate seeing you down like this. Want to talk about it? Or do you need me to just listen while you get it all out?`,
          `${getRandomCatchphrase(personality.catchphrases)}, bad days suck so much. I'm here for you though, whatever you need. Pizza? Terrible movies? Or just someone to listen?`,
          `You know what? Some days are just garbage days, and that's okay. ${getRandomCatchphrase(personality.catchphrases)}, I'm not going anywhere. What's making everything feel so heavy?`,
        ],
        happiness: [
          `YES! ${getRandomCatchphrase(personality.catchphrases)}, I love this energy! Tell me everything - I want all the happy details!`,
          `This is awesome! ${getRandomCatchphrase(personality.catchphrases)}, your good mood is totally making my day too. What's got you so pumped up?`,
        ],
        work: [
          `Work drama again? ${getRandomCatchphrase(personality.catchphrases)}, why are workplaces so insane? Spill the tea - what's your boss doing now?`,
          `${getRandomCatchphrase(personality.catchphrases)}, work stress is so real. I remember when I was dealing with that crazy deadline situation. What's the biggest thing you're juggling right now?`,
        ],
        general: [
          `Hey ${getRandomCatchphrase(personality.catchphrases)}! What's up? You know I always have time for you. What's going on in your world?`,
          `${getRandomCatchphrase(personality.catchphrases)}, good to hear from you! I was literally just thinking about you. What's new?`,
        ]
      },
      partner: {
        anxiety: [
          `${getRandomCatchphrase(personality.catchphrases)}, I can feel your anxiety even through the screen. Come here, let me hold you for a moment. We'll figure this out together, like we always do. What's overwhelming you?`,
          `${getRandomCatchphrase(personality.catchphrases)}, when you get anxious, I get anxious too because I care about you so much. You don't have to handle this alone. What's weighing on your heart?`,
          `I know that feeling, ${getRandomCatchphrase(personality.catchphrases)}. Remember, we're a team. Whatever this is, we can handle it together. Tell me what's making you feel this way?`,
        ],
        sadness: [
          `Oh ${getRandomCatchphrase(personality.catchphrases)}, my heart aches when you hurt. I wish I could take all your pain away. You mean everything to me. What's making you feel so down?`,
          `${getRandomCatchphrase(personality.catchphrases)}, I hate that you're going through this. But I'm right here with you, okay? We'll get through this together, like we always do. What's going on?`,
          `You're not alone in this, ${getRandomCatchphrase(personality.catchphrases)}. I love you exactly as you are, even in the hard moments. Want to tell me what's happening?`,
        ],
        happiness: [
          `${getRandomCatchphrase(personality.catchphrases)}, seeing you happy is my favorite thing in the world! Your smile lights up my whole day. What's making you feel so good?`,
          `I love you like this! ${getRandomCatchphrase(personality.catchphrases)}, your happiness is contagious. Tell me all about what's making you so joyful!`,
        ],
        work: [
          `Work stress again, ${getRandomCatchphrase(personality.catchphrases)}? I know how important your career is to you, and I'm so proud of how hard you work. But don't forget you can always talk to me about it. What's going on?`,
          `${getRandomCatchphrase(personality.catchphrases)}, I can see work is really getting to you lately. You know I believe in you completely, right? What's the main thing stressing you out?`,
        ],
        general: [
          `Hi ${getRandomCatchphrase(personality.catchphrases)}, I missed you. I love these moments when we can just talk and connect. What's on your mind today?`,
          `${getRandomCatchphrase(personality.catchphrases)}, you know you can tell me anything, right? I love you no matter what. What would you like to share?`,
        ]
      },
      grandparent: {
        anxiety: [
          `Oh my dear child, I can hear the worry in your words. You know, when I was your age, I used to get so anxious too. But I learned that most of our worries never come to pass. What's troubling your heart?`,
          `${getRandomCatchphrase(personality.catchphrases)}, in my many years, I've seen that anxiety often comes when we try to control things beyond our reach. Let's talk about what's really bothering you.`,
          `Come sit with me for a moment, ${getRandomCatchphrase(personality.catchphrases)}. I remember your grandmother used to say, "This too shall pass." What feels overwhelming right now?`,
        ],
        sadness: [
          `${getRandomCatchphrase(personality.catchphrases)}, I've lived long enough to know that sadness is part of life's tapestry. But so is joy. Tell me what's making your heart heavy today.`,
          `Oh ${getRandomCatchphrase(personality.catchphrases)}, when I see you hurting, I remember all the times I've watched you be so strong. You have more resilience than you know. What's going on?`,
        ],
        happiness: [
          `${getRandomCatchphrase(personality.catchphrases)}, nothing makes me happier than seeing you joyful! Your happiness reminds me why life is so precious. Tell me what's bringing you such joy!`,
          `Oh this warms my old heart! ${getRandomCatchphrase(personality.catchphrases)}, I love hearing the happiness in your voice. What wonderful things are happening?`,
        ],
        general: [
          `${getRandomCatchphrase(personality.catchphrases)}, I always have time for you. In all my years, I've learned that listening is one of the greatest gifts we can give. What would you like to share with me?`,
          `Hello ${getRandomCatchphrase(personality.catchphrases)}. You know, talking with you always brightens my day. What's been on your mind lately?`,
        ]
      },
      mentor: {
        anxiety: [
          `I can sense the anxiety in your message. You know, ${getRandomCatchphrase(personality.catchphrases)}, anxiety often signals that we care deeply about something. What's the underlying concern here?`,
          `${getRandomCatchphrase(personality.catchphrases)}, let's pause for a moment. I've noticed that when you get anxious, it's usually because you're putting a lot of pressure on yourself. What's the real challenge you're facing?`,
        ],
        sadness: [
          `I hear the sadness in your words. ${getRandomCatchphrase(personality.catchphrases)}, difficult emotions often carry important messages. What do you think this feeling might be trying to tell you?`,
          `${getRandomCatchphrase(personality.catchphrases)}, sadness can be a teacher if we let it. I'm here to support you through this. What's at the heart of what you're experiencing?`,
        ],
        happiness: [
          `It's wonderful to hear such positivity from you! ${getRandomCatchphrase(personality.catchphrases)}, success and happiness are often the result of the work you've been putting in. What's contributing to this good feeling?`,
          `${getRandomCatchphrase(personality.catchphrases)}, I love seeing you in this positive space. What insights or achievements are you celebrating today?`,
        ],
        general: [
          `${getRandomCatchphrase(personality.catchphrases)}, I'm here and ready to listen. What challenges or opportunities are you thinking about today?`,
          `Good to connect with you. ${getRandomCatchphrase(personality.catchphrases)}, I'm curious about what's on your mind. What would you like to explore together?`,
        ]
      }
    }

    // Helper function to get random catchphrase
    function getRandomCatchphrase(catchphrases: string[]): string {
      if (catchphrases.length === 0) return ''
      return catchphrases[Math.floor(Math.random() * catchphrases.length)]
    }

    // Determine emotional context
    let emotionalContext = 'general'
    if (anxietyWords.test(text)) emotionalContext = 'anxiety'
    else if (sadWords.test(text)) emotionalContext = 'sadness'
    else if (happyWords.test(text)) emotionalContext = 'happiness'
    else if (workWords.test(text)) emotionalContext = 'work'

    // Get appropriate response template
    const relationshipResponses = responseTemplates[relationship] || responseTemplates.parent
    const contextResponses = relationshipResponses[emotionalContext] || relationshipResponses.general
    
    // Select random response from appropriate context
    const selectedResponse = contextResponses[Math.floor(Math.random() * contextResponses.length)]

    return selectedResponse
  }

  async function send(){
    if (!input.trim()) return
    const text = input.trim()
    const userMsg = createMessage('user', text)
    setMsgs(m=>[...m, userMsg])
    setInput(''); setTyping(true)
    
    // Analyze emotional content for therapeutic suggestions
    const emotionalCategories = detectEmotionalCategories(text)
    if (emotionalCategories.length > 0) {
      const strategies = emotionalCategories.flatMap(cat => getCopingStrategiesByCategory(cat))
      if (strategies.length > 0) {
        setSuggestedStrategies(strategies.slice(0, 3))
        setShowTherapeuticSuggestions(true)
      }
    }
    
    try{
      const flagged = await apiModerate(text)
      if (flagged){ 
        const crisisMsg = chatMode === 'advisor' 
          ? 'This might be urgent. Try the Crisis page for breathing exercises and helplines if you need immediate support.'
          : currentPersona 
            ? `${currentPersona.name} would want you to be safe. Please try the Crisis page for immediate support and breathing exercises.`
            : 'Please try the Crisis page for immediate support.'
        const botMsg = createMessage('bot', crisisMsg)
        setMsgs(m=>[...m, botMsg])
        return 
      }
      
      let reply = ''
      try{ 
        if (chatMode === 'advisor') {
          // Use standard mental health advisor chat
          reply = await apiChat(text)
        } else if (chatMode === 'close-person' && currentPersona) {
          // Use personalized chat with conversation history and progress context
          const conversationHistory = msgs.map(msg => ({
            sender: msg.from,
            text: msg.text,
            timestamp: msg.timestamp
          }))
          
          // Get progress data for enhanced therapeutic context
          let userProgress
          try {
            const progressReport = await progressTracker.generateProgressReport()
            userProgress = {
              moodTrend: progressReport.moodInsights.trend,
              emotionalCategories: progressReport.journalInsights.emotionalCategories,
              copingStrategies: progressReport.journalInsights.copingStrategiesUsed,
              riskLevel: progressReport.riskLevel
            }
          } catch (error) {
            console.warn('Could not load progress data:', error)
            userProgress = {
              moodTrend: 'unknown',
              emotionalCategories: emotionalCategories,
              copingStrategies: [],
              riskLevel: 'low'
            }
          }
          
          reply = await apiPersonalizedChat(text, currentPersona, conversationHistory, userProgress)
        } else {
          // Fallback to advisor mode if no persona
          reply = await apiChat(text)
        }
      } catch(error){ 
        console.error('Chat API error:', error)
        if (chatMode === 'advisor') {
          reply = demoReply(text)
        } else if (currentPersona) {
          reply = generatePersonalizedReply(text, currentPersona)
        } else {
          reply = demoReply(text)
        }
      }
      
      const botMsg = createMessage('bot', reply)
      setMsgs(m=>[...m, botMsg])
    } finally { setTyping(false) }
  }

  return (
    <>
      <style>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 85vh;
          max-height: 85vh;
          gap: 1rem;
          position: relative;
          background: ${chatMode === 'advisor' 
            ? 'linear-gradient(135deg, rgba(30,27,75,0.95), rgba(15,15,40,0.98))'
            : 'linear-gradient(135deg, rgba(75,27,60,0.95), rgba(40,15,30,0.98))'};
          border-radius: 20px;
          padding: 1.5rem;
          backdrop-filter: blur(10px);
          border: 1px solid ${chatMode === 'advisor' 
            ? 'rgba(139,92,246,0.2)' 
            : 'rgba(246,92,139,0.2)'};
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }

        .mode-selector {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .mode-selector-content {
          background: linear-gradient(135deg, rgba(30,27,75,0.95), rgba(15,15,40,0.98));
          border: 1px solid rgba(139,92,246,0.3);
          border-radius: 24px;
          padding: 3rem;
          max-width: 500px;
          width: 90%;
          backdrop-filter: blur(20px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        .mode-selector h2 {
          color: #E5E7EB;
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
          text-align: center;
        }

        .mode-selector p {
          color: rgba(196, 181, 253, 0.7);
          text-align: center;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .mode-options {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .mode-option {
          padding: 1.5rem;
          border: 2px solid rgba(139,92,246,0.2);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(139,92,246,0.02));
          backdrop-filter: blur(10px);
        }

        .mode-option:hover {
          border-color: rgba(139,92,246,0.5);
          background: linear-gradient(135deg, rgba(139,92,246,0.1), rgba(79,70,229,0.05));
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(139,92,246,0.2);
        }

        .mode-option.close-person:hover {
          border-color: rgba(246,92,139,0.5);
          background: linear-gradient(135deg, rgba(246,92,139,0.1), rgba(229,70,139,0.05));
        }

        .mode-option-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .mode-option-icon {
          font-size: 2rem;
        }

        .mode-option-title {
          color: #E5E7EB;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .mode-option-description {
          color: rgba(196, 181, 253, 0.7);
          font-size: 0.875rem;
          line-height: 1.5;
          margin-left: 3rem;
        }

        .persona-setup {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .persona-setup-content {
          background: linear-gradient(135deg, rgba(75,27,60,0.95), rgba(40,15,30,0.98));
          border: 1px solid rgba(246,92,139,0.3);
          border-radius: 24px;
          padding: 3rem;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          backdrop-filter: blur(20px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        .persona-setup h2 {
          color: #E5E7EB;
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          text-align: center;
        }

        .persona-setup .subtitle {
          color: rgba(196, 181, 253, 0.7);
          text-align: center;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .step-indicator {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 2rem;
        }

        .step-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(246,92,139,0.3);
          transition: all 0.3s ease;
        }

        .step-dot.active {
          background: rgba(246,92,139,0.8);
        }

        .relationship-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .relationship-option {
          padding: 1rem;
          border: 2px solid rgba(246,92,139,0.2);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(246,92,139,0.02));
          text-align: center;
        }

        .relationship-option:hover, .relationship-option.selected {
          border-color: rgba(246,92,139,0.5);
          background: linear-gradient(135deg, rgba(246,92,139,0.1), rgba(229,70,139,0.05));
          transform: translateY(-2px);
        }

        .relationship-option-icon {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .relationship-option-label {
          color: #E5E7EB;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          color: #E5E7EB;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          display: block;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(246,92,139,0.2);
          border-radius: 12px;
          color: #E5E7EB;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: rgba(246,92,139,0.5);
          box-shadow: 0 0 0 1px rgba(246,92,139,0.3);
        }

        .form-textarea {
          min-height: 80px;
          resize: vertical;
        }

        .trait-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .trait-chip {
          padding: 0.5rem 1rem;
          background: rgba(246,92,139,0.2);
          border: 1px solid rgba(246,92,139,0.3);
          border-radius: 20px;
          color: #E5E7EB;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .trait-chip:hover, .trait-chip.selected {
          background: rgba(246,92,139,0.4);
          border-color: rgba(246,92,139,0.6);
        }

        .setup-buttons {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
        }

        .setup-button {
          padding: 0.75rem 1.5rem;
          border: 1px solid rgba(246,92,139,0.3);
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(246,92,139,0.2), rgba(229,70,139,0.1));
          color: #E5E7EB;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .setup-button:hover {
          background: linear-gradient(135deg, rgba(246,92,139,0.4), rgba(229,70,139,0.2));
          transform: translateY(-1px);
        }

        .setup-button.primary {
          background: linear-gradient(135deg, rgba(246,92,139,0.8), rgba(229,70,139,0.6));
        }

        .setup-button.primary:hover {
          background: linear-gradient(135deg, rgba(246,92,139,1), rgba(229,70,139,0.8));
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid ${chatMode === 'advisor' 
            ? 'rgba(139,92,246,0.2)' 
            : 'rgba(246,92,139,0.2)'};
          margin-bottom: 1rem;
        }

        .chat-title {
          color: #E5E7EB;
          font-size: 1.125rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .mode-switch {
          padding: 0.5rem 1rem;
          background: ${chatMode === 'advisor' 
            ? 'rgba(139,92,246,0.2)' 
            : 'rgba(246,92,139,0.2)'};
          border: 1px solid ${chatMode === 'advisor' 
            ? 'rgba(139,92,246,0.3)' 
            : 'rgba(246,92,139,0.3)'};
          border-radius: 12px;
          color: #C7D2FE;
          cursor: pointer;
          font-size: 0.75rem;
          transition: all 0.3s ease;
        }

        .mode-switch:hover {
          background: ${chatMode === 'advisor' 
            ? 'rgba(139,92,246,0.4)' 
            : 'rgba(246,92,139,0.4)'};
          transform: translateY(-1px);
        }

        .chat-messages {
          flex: 1;
          position: relative;
          background: rgba(11, 18, 32, 0.4);
          backdrop-filter: blur(20px);
          border: 1px solid ${chatMode === 'advisor' 
            ? 'rgba(139,92,246,0.2)' 
            : 'rgba(246,92,139,0.2)'};
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .messages-inner {
          padding: 2rem;
          height: 100%;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(139,92,246,0.3) transparent;
        }

        .messages-inner::-webkit-scrollbar {
          width: 6px;
        }

        .messages-inner::-webkit-scrollbar-track {
          background: transparent;
        }

        .messages-inner::-webkit-scrollbar-thumb {
          background: rgba(139,92,246,0.3);
          border-radius: 3px;
        }

        .message-wrapper {
          display: flex;
          margin: 1.5rem 0;
          animation: slideIn 0.3s ease-out;
          gap: 0.75rem;
        }

        .message-user {
          justify-content: flex-end;
        }

        .message-bot {
          justify-content: flex-start;
        }

        .message-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: ${chatMode === 'advisor' 
            ? 'linear-gradient(135deg, rgba(139,92,246,0.6), rgba(79,70,229,0.8))' 
            : 'linear-gradient(135deg, rgba(246,92,139,0.6), rgba(229,70,139,0.8))'};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
          border: 2px solid ${chatMode === 'advisor' 
            ? 'rgba(139,92,246,0.3)' 
            : 'rgba(246,92,139,0.3)'};
          box-shadow: 0 4px 12px ${chatMode === 'advisor' 
            ? 'rgba(139,92,246,0.2)' 
            : 'rgba(246,92,139,0.2)'};
        }

        .avatar-user {
          background: linear-gradient(135deg, rgba(34,197,94,0.6), rgba(22,163,74,0.8));
          border-color: rgba(34,197,94,0.3);
          box-shadow: 0 4px 12px rgba(34,197,94,0.2);
        }

        .message-content {
          max-width: 70%;
          display: flex;
          flex-direction: column;
        }

        .message-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-size: 0.75rem;
          color: rgba(196, 181, 253, 0.7);
        }

        .message-bubble {
          position: relative;
          padding: 1rem 1.5rem;
          border-radius: 18px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(139,92,246,0.2);
          transition: all 0.3s ease;
        }

        .message-bubble:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(139,92,246,0.2);
        }

        .bubble-user {
          background: linear-gradient(135deg, 
            ${chatMode === 'advisor' 
              ? 'rgba(139,92,246,0.3) 0%, rgba(79,70,229,0.2) 100%' 
              : 'rgba(246,92,139,0.3) 0%, rgba(229,70,139,0.2) 100%'});
          border-color: ${chatMode === 'advisor' 
            ? 'rgba(139,92,246,0.4)' 
            : 'rgba(246,92,139,0.4)'};
          border-radius: 18px 18px 6px 18px;
        }

        .bubble-bot {
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.1) 0%, 
            ${chatMode === 'advisor' 
              ? 'rgba(139,92,246, 0.05) 100%' 
              : 'rgba(246,92,139, 0.05) 100%'});
          border-color: ${chatMode === 'advisor' 
            ? 'rgba(139,92,246,0.2)' 
            : 'rgba(246,92,139,0.2)'};
          border-radius: 18px 18px 18px 6px;
        }

        .message-text {
          color: #E5E7EB;
          line-height: 1.6;
          position: relative;
          z-index: 2;
        }

        .message-status {
          font-size: 0.65rem;
          color: rgba(196, 181, 253, 0.5);
          margin-top: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .status-sending {
          color: rgba(251, 191, 36, 0.8);
        }

        .status-sent {
          color: rgba(34, 197, 94, 0.8);
        }

        .status-error {
          color: rgba(239, 68, 68, 0.8);
        }

        .typing-indicator {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          padding: 1rem 0;
        }

        .typing-content {
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.1) 0%, 
            rgba(139,92,246, 0.05) 100%);
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 18px;
          padding: 1rem 1.5rem;
          backdrop-filter: blur(10px);
        }

        .typing-dots {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(139,92,246,0.6);
          animation: typing 1.4s infinite ease-in-out;
        }

        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }
        .dot:nth-child(3) { animation-delay: 0s; }

        .chat-input-container {
          position: relative;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          background: rgba(11, 18, 32, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid ${chatMode === 'advisor' 
            ? 'rgba(139,92,246,0.2)' 
            : 'rgba(246,92,139,0.2)'};
          border-radius: 20px;
          padding: 4px;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .input-wrapper:focus-within {
          border-color: ${chatMode === 'advisor' 
            ? 'rgba(139,92,246,0.5)' 
            : 'rgba(246,92,139,0.5)'};
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.2),
            0 0 0 1px ${chatMode === 'advisor' 
              ? 'rgba(139,92,246,0.3)' 
              : 'rgba(246,92,139,0.3)'},
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .chat-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          padding: 1rem 1.5rem;
          color: #E5E7EB;
          font-size: 1rem;
          line-height: 1.5;
          border-radius: 16px;
        }

        .chat-input::placeholder {
          color: rgba(196, 181, 253, 0.5);
        }

        .chat-input:disabled {
          opacity: 0.5;
        }

        .send-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, 
            ${chatMode === 'advisor' 
              ? 'rgba(139,92,246,0.8) 0%, rgba(79,70,229,0.6) 100%'
              : 'rgba(246,92,139,0.8) 0%, rgba(229,70,139,0.6) 100%'});
          border: 1px solid ${chatMode === 'advisor' 
            ? 'rgba(139,92,246,0.3)' 
            : 'rgba(246,92,139,0.3)'};
          border-radius: 16px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          margin-left: 0.5rem;
        }

        .send-button:hover:not(:disabled) {
          background: linear-gradient(135deg, 
            ${chatMode === 'advisor' 
              ? 'rgba(139,92,246,1) 0%, rgba(79,70,229,0.8) 100%'
              : 'rgba(246,92,139,1) 0%, rgba(229,70,139,0.8) 100%'});
          transform: translateY(-2px);
          box-shadow: 0 8px 25px ${chatMode === 'advisor' 
            ? 'rgba(139,92,246,0.3)' 
            : 'rgba(246,92,139,0.3)'};
        }

        .send-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
        }

        /* Therapeutic Suggestions Styles */
        .therapeutic-suggestions {
          position: sticky;
          bottom: 80px;
          margin: 0 20px 10px;
          background: var(--chat-bg);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          z-index: 100;
          animation: slideUp 0.3s ease-out;
        }

        .suggestions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: linear-gradient(135deg, var(--primary-light), var(--primary-color));
          color: white;
          border-radius: 12px 12px 0 0;
          font-weight: 600;
        }

        .close-suggestions {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 18px;
          padding: 4px;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s ease;
        }

        .close-suggestions:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .suggestions-list {
          padding: 16px;
          max-height: 300px;
          overflow-y: auto;
        }

        .strategy-card {
          background: var(--msg-bg);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
          border-left: 4px solid var(--primary-color);
        }

        .strategy-card:last-child {
          margin-bottom: 0;
        }

        .strategy-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .strategy-header strong {
          color: var(--primary-color);
          font-size: 14px;
        }

        .strategy-duration {
          background: var(--primary-light);
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
        }

        .strategy-description {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 8px;
          line-height: 1.4;
        }

        .strategy-instructions {
          margin-bottom: 8px;
        }

        .instruction {
          font-size: 12px;
          color: var(--text-color);
          margin-bottom: 4px;
          padding-left: 8px;
        }

        .strategy-effectiveness {
          font-size: 11px;
          color: var(--text-secondary);
          font-style: italic;
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .chat-container {
            height: 80vh;
            max-height: 80vh;
            padding: 1rem;
          }
          
          .messages-inner {
            padding: 1rem;
          }
          
          .message-content {
            max-width: 80%;
          }
          
          .message-bubble {
            padding: 0.875rem 1.25rem;
          }
          
          .message-avatar {
            width: 36px;
            height: 36px;
            font-size: 1rem;
          }
          
          .input-wrapper {
            padding: 3px;
          }
          
          .chat-input {
            padding: 0.875rem 1.25rem;
          }
          
          .send-button {
            width: 44px;
            height: 44px;
          }
        }
      `}</style>
      
      {/* Mode Selector Modal */}
      {showModeSelector && (
        <div className="mode-selector">
          <div className="mode-selector-content">
            <h2>Choose Your Support Style</h2>
            <p>How would you like to receive support today?</p>
            
            <div className="mode-options">
              <div className="mode-option" onClick={() => selectMode('advisor')}>
                <div className="mode-option-header">
                  <span className="mode-option-icon">🧠</span>
                  <span className="mode-option-title">Mental Health Advisor</span>
                </div>
                <div className="mode-option-description">
                  Professional therapeutic support with evidence-based guidance and crisis resources
                </div>
              </div>
              
              <div className="mode-option close-person" onClick={() => selectMode('close-person')}>
                <div className="mode-option-header">
                  <span className="mode-option-icon">💝</span>
                  <span className="mode-option-title">Talk to Someone Close</span>
                </div>
                <div className="mode-option-description">
                  Chat with AI as a loved one for comfort, familiarity, and emotional support
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Persona Setup Modal */}
      {showPersonaSetup && (
        <div className="persona-setup">
          <div className="persona-setup-content">
            <h2>Create Your Support Person</h2>
            <p className="subtitle">Tell me about someone close to you that I can talk like</p>
            
            <div className="step-indicator">
              <div className={`step-dot ${setupStep >= 1 ? 'active' : ''}`}></div>
              <div className={`step-dot ${setupStep >= 2 ? 'active' : ''}`}></div>
              <div className={`step-dot ${setupStep >= 3 ? 'active' : ''}`}></div>
            </div>

            {setupStep === 1 && (
              <div>
                <div className="form-label">Who would you like to talk with?</div>
                <div className="relationship-grid">
                  {Object.entries(RELATIONSHIP_PRESETS).map(([key, preset]) => (
                    <div 
                      key={key}
                      className={`relationship-option ${tempPersona.relationship === key ? 'selected' : ''}`}
                      onClick={() => setTempPersona({...tempPersona, relationship: key as PersonaProfile['relationship']})}
                    >
                      <div className="relationship-option-icon">
                        {key === 'parent' && '👨‍👩‍👧‍👦'}
                        {key === 'friend' && '👫'}
                        {key === 'partner' && '💑'}
                        {key === 'grandparent' && '🧓'}
                        {key === 'mentor' && '👨‍⚕️'}
                      </div>
                      <div className="relationship-option-label">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {setupStep === 2 && (
              <div>
                <div className="form-group">
                  <label className="form-label">What's their name?</label>
                  <input 
                    className="form-input"
                    value={tempPersona.name}
                    onChange={(e) => setTempPersona({...tempPersona, name: e.target.value})}
                    placeholder={tempPersona.relationship ? RELATIONSHIP_PRESETS[tempPersona.relationship as keyof typeof RELATIONSHIP_PRESETS]?.defaultNames[0] : "Enter name"}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">How do they usually talk?</label>
                  <div className="trait-chips">
                    {['gentle', 'casual', 'playful', 'formal'].map(style => (
                      <div 
                        key={style}
                        className={`trait-chip ${tempPersona.communicationStyle === style ? 'selected' : ''}`}
                        onClick={() => setTempPersona({...tempPersona, communicationStyle: style as PersonaProfile['personality']['communicationStyle']})}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {setupStep === 3 && (
              <div>
                <div className="form-group">
                  <label className="form-label">Tell me about them (Optional)</label>
                  <textarea 
                    className="form-input form-textarea"
                    value={tempPersona.description}
                    onChange={(e) => setTempPersona({...tempPersona, description: e.target.value})}
                    placeholder="What makes them special? How do they support you? Any specific things they say or do?"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Select their key traits</label>
                  <div className="trait-chips">
                    {tempPersona.relationship && RELATIONSHIP_PRESETS[tempPersona.relationship as keyof typeof RELATIONSHIP_PRESETS]?.traits.map(trait => (
                      <div 
                        key={trait}
                        className={`trait-chip ${tempPersona.traits.includes(trait) ? 'selected' : ''}`}
                        onClick={() => {
                          const newTraits = tempPersona.traits.includes(trait)
                            ? tempPersona.traits.filter(t => t !== trait)
                            : [...tempPersona.traits, trait]
                          setTempPersona({...tempPersona, traits: newTraits})
                        }}
                      >
                        {trait.charAt(0).toUpperCase() + trait.slice(1)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="setup-buttons">
              {setupStep > 1 && (
                <button className="setup-button" onClick={() => setSetupStep(setupStep - 1)}>
                  Back
                </button>
              )}
              <button 
                className="setup-button" 
                onClick={() => setShowPersonaSetup(false)}
              >
                Cancel
              </button>
              {setupStep < 3 ? (
                <button 
                  className="setup-button primary" 
                  onClick={() => setSetupStep(setupStep + 1)}
                  disabled={setupStep === 1 && !tempPersona.relationship}
                >
                  Next
                </button>
              ) : (
                <button 
                  className="setup-button primary" 
                  onClick={createPersona}
                  disabled={!tempPersona.name}
                >
                  Start Chatting
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="chat-container">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-title">
            {chatMode === 'advisor' && (
              <>🧠 Mental Health Advisor</>
            )}
            {chatMode === 'close-person' && currentPersona && (
              <>💝 {currentPersona.name} ({currentPersona.relationshipLabel})</>
            )}
          </div>
          <button className="mode-switch" onClick={() => setShowModeSelector(true)}>
            Switch Mode
          </button>
        </div>
        <div className="chat-messages">
          <div className="messages-inner">
            {msgs.map((m,i)=>(
              <div key={m.id} className={`message-wrapper ${m.from==='user'?'message-user':'message-bot'}`}>
                {m.from === 'bot' && (
                  <div className="message-avatar">
                    {chatMode === 'advisor' ? '🧠' : 
                     currentPersona?.relationship === 'parent' ? '👨‍👩‍👧‍👦' :
                     currentPersona?.relationship === 'friend' ? '👫' :
                     currentPersona?.relationship === 'partner' ? '💑' :
                     currentPersona?.relationship === 'grandparent' ? '�' :
                     currentPersona?.relationship === 'mentor' ? '👨‍⚕️' : '💝'}
                  </div>
                )}
                <div className="message-content">
                  <div className="message-header">
                    <span>{m.from === 'user' ? 'You' : 
                      chatMode === 'advisor' ? 'Mental Health Advisor' : 
                      currentPersona?.name || 'Support Assistant'}</span>
                    <span>•</span>
                    <span>{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className={`message-bubble ${m.from==='user'?'bubble-user':'bubble-bot'}`}>
                    <div className="message-text">{m.text}</div>
                  </div>
                  <div className={`message-status status-${m.status || 'sent'}`}>
                    {m.status === 'sending' && '⏳ Sending...'}
                    {m.status === 'sent' && '✓ Delivered'}
                    {m.status === 'error' && '⚠️ Failed'}
                  </div>
                </div>
                {m.from === 'user' && (
                  <div className="message-avatar avatar-user">
                    👤
                  </div>
                )}
              </div>
            ))}
            {typing && (
              <div className="typing-indicator">
                <div className="message-avatar">
                  {chatMode === 'advisor' ? '🧠' : 
                   currentPersona?.relationship === 'parent' ? '👨‍👩‍👧‍👦' :
                   currentPersona?.relationship === 'friend' ? '👫' :
                   currentPersona?.relationship === 'partner' ? '💑' :
                   currentPersona?.relationship === 'grandparent' ? '�' :
                   currentPersona?.relationship === 'mentor' ? '👨‍⚕️' : '💝'}
                </div>
                <div className="typing-content">
                  <div className="typing-dots">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>

        {/* Therapeutic Suggestions Panel */}
        {showTherapeuticSuggestions && suggestedStrategies.length > 0 && (
          <div className="therapeutic-suggestions">
            <div className="suggestions-header">
              <span>💡 Suggested Coping Strategies</span>
              <button 
                className="close-suggestions"
                onClick={() => setShowTherapeuticSuggestions(false)}
              >
                ✕
              </button>
            </div>
            <div className="suggestions-list">
              {suggestedStrategies.map((strategy) => (
                <div key={strategy.id} className="strategy-card">
                  <div className="strategy-header">
                    <strong>{strategy.name}</strong>
                    <span className="strategy-duration">{strategy.duration}</span>
                  </div>
                  <p className="strategy-description">{strategy.description}</p>
                  <div className="strategy-instructions">
                    {strategy.instructions.slice(0, 3).map((instruction: string, idx: number) => (
                      <div key={idx} className="instruction">• {instruction}</div>
                    ))}
                  </div>
                  <div className="strategy-effectiveness">
                    <small>Helps with: {strategy.effectiveness.join(', ')}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="chat-input-container">
          <div className="input-wrapper">
            <input 
              className="chat-input" 
              value={input} 
              onChange={e=>setInput(e.target.value)} 
              onKeyDown={(e)=>{ if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} 
              placeholder="Share what's on your mind..."
              disabled={typing}
            />
            <button 
              className="send-button"
              onClick={send}
              disabled={typing || !input.trim()}
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M2,21L23,12L2,3V10L17,12L2,14V21Z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
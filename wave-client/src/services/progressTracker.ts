// Progress tracking and mental health insights service
import { apiMoodList, apiJournalList } from './api'
import { detectEmotionalCategories, COPING_STRATEGIES, CopingStrategy } from './therapeuticFlows'

export interface MoodInsight {
  averageMood: number
  trend: 'improving' | 'stable' | 'declining' | 'insufficient-data'
  trendStrength: number
  recentLow?: Date
  recentHigh?: Date
  patterns: string[]
}

export interface JournalInsight {
  emotionalCategories: string[]
  frequentTopics: string[]
  copingStrategiesUsed: string[]
  progressIndicators: string[]
  concerningPatterns: string[]
}

export interface ProgressReport {
  moodInsights: MoodInsight
  journalInsights: JournalInsight
  recommendations: TherapeuticRecommendation[]
  suggestedCopingStrategies: CopingStrategy[]
  riskLevel: 'low' | 'moderate' | 'high'
}

export interface TherapeuticRecommendation {
  type: 'flow' | 'strategy' | 'professional-help' | 'lifestyle'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  reason: string
  actionable: boolean
}

export class ProgressTracker {
  private deviceId: string
  private token?: string

  constructor(deviceId: string, token?: string) {
    this.deviceId = deviceId
    this.token = token
  }

  async getMoodInsights(days: number = 30): Promise<MoodInsight> {
    try {
      const moodData = await apiMoodList(this.deviceId, this.token)
      const recentMoods = moodData.items?.slice(0, days) || []
      
      if (recentMoods.length < 3) {
        return {
          averageMood: 0,
          trend: 'insufficient-data',
          trendStrength: 0,
          patterns: ['Need more mood entries for meaningful insights']
        }
      }

      const moods = recentMoods.map((entry: any) => entry.mood)
      const averageMood = moods.reduce((a: number, b: number) => a + b, 0) / moods.length

      // Calculate trend using linear regression
      const trend = this.calculateMoodTrend(recentMoods)
      
      // Find recent high and low
      const sortedByDate = [...recentMoods].sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      const recent7Days = sortedByDate.slice(0, 7)
      const recentLow = recent7Days.reduce((min: any, entry: any) => 
        entry.mood < min.mood ? entry : min
      )
      const recentHigh = recent7Days.reduce((max: any, entry: any) => 
        entry.mood > max.mood ? entry : max
      )

      // Identify patterns
      const patterns = this.identifyMoodPatterns(recentMoods)

      return {
        averageMood: Math.round(averageMood * 100) / 100,
        trend: trend.direction,
        trendStrength: Math.abs(trend.strength),
        recentLow: new Date(recentLow.created_at),
        recentHigh: new Date(recentHigh.created_at),
        patterns
      }
    } catch (error) {
      console.error('Error getting mood insights:', error)
      return {
        averageMood: 0,
        trend: 'insufficient-data',
        trendStrength: 0,
        patterns: ['Unable to load mood data']
      }
    }
  }

  async getJournalInsights(days: number = 30): Promise<JournalInsight> {
    try {
      const journalData = await apiJournalList(this.deviceId, this.token)
      const recentEntries = journalData.items?.slice(0, days) || []
      
      if (recentEntries.length === 0) {
        return {
          emotionalCategories: [],
          frequentTopics: [],
          copingStrategiesUsed: [],
          progressIndicators: [],
          concerningPatterns: []
        }
      }

      const allText = recentEntries.map((entry: any) => entry.content).join(' ')
      
      // Analyze emotional categories
      const emotionalCategories = detectEmotionalCategories(allText)
      
      // Extract frequent topics and themes
      const frequentTopics = this.extractFrequentTopics(recentEntries)
      
      // Identify coping strategies mentioned
      const copingStrategiesUsed = this.identifyCopingStrategies(allText)
      
      // Look for progress indicators
      const progressIndicators = this.identifyProgressIndicators(allText)
      
      // Identify concerning patterns
      const concerningPatterns = this.identifyConcerningPatterns(allText)

      return {
        emotionalCategories,
        frequentTopics,
        copingStrategiesUsed,
        progressIndicators,
        concerningPatterns
      }
    } catch (error) {
      console.error('Error getting journal insights:', error)
      return {
        emotionalCategories: [],
        frequentTopics: [],
        copingStrategiesUsed: [],
        progressIndicators: [],
        concerningPatterns: []
      }
    }
  }

  async generateProgressReport(): Promise<ProgressReport> {
    const [moodInsights, journalInsights] = await Promise.all([
      this.getMoodInsights(),
      this.getJournalInsights()
    ])

    const recommendations = this.generateRecommendations(moodInsights, journalInsights)
    const suggestedStrategies = this.suggestCopingStrategies(journalInsights.emotionalCategories)
    const riskLevel = this.assessRiskLevel(moodInsights, journalInsights)

    return {
      moodInsights,
      journalInsights,
      recommendations,
      suggestedCopingStrategies: suggestedStrategies,
      riskLevel
    }
  }

  private calculateMoodTrend(moodData: any[]): { direction: MoodInsight['trend'], strength: number } {
    if (moodData.length < 5) {
      return { direction: 'insufficient-data', strength: 0 }
    }

    // Simple linear regression to calculate trend
    const n = moodData.length
    const x = Array.from({ length: n }, (_, i) => i)
    const y = moodData.map((entry: any) => entry.mood).reverse() // Most recent first
    
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    
    let direction: MoodInsight['trend']
    if (Math.abs(slope) < 0.05) {
      direction = 'stable'
    } else if (slope > 0) {
      direction = 'improving'
    } else {
      direction = 'declining'
    }
    
    return { direction, strength: Math.abs(slope) }
  }

  private identifyMoodPatterns(moodData: any[]): string[] {
    const patterns: string[] = []
    
    // Check for consistency
    const moods = moodData.map((entry: any) => entry.mood)
    const variance = this.calculateVariance(moods)
    
    if (variance < 0.5) {
      patterns.push('Mood has been relatively stable')
    } else if (variance > 2) {
      patterns.push('Mood shows high variability - consider tracking triggers')
    }
    
    // Check for recent patterns
    const recent7 = moods.slice(0, 7)
    const avg7 = recent7.reduce((a, b) => a + b, 0) / recent7.length
    const overall = moods.reduce((a, b) => a + b, 0) / moods.length
    
    if (avg7 < overall - 0.5) {
      patterns.push('Recent mood has been lower than usual')
    } else if (avg7 > overall + 0.5) {
      patterns.push('Recent mood has been better than usual')
    }
    
    return patterns
  }

  private extractFrequentTopics(entries: any[]): string[] {
    const topics: string[] = []
    const allText = entries.map((entry: any) => entry.content.toLowerCase()).join(' ')
    
    // Common mental health topics
    const topicPatterns = {
      'work-stress': /work|job|boss|deadline|meeting|career|office/g,
      'relationships': /friend|family|partner|relationship|love|conflict/g,
      'health': /sleep|tired|energy|sick|health|doctor|medical/g,
      'self-care': /exercise|meditation|therapy|self-care|relax|rest/g,
      'goals': /goal|plan|future|dream|hope|ambition|aspiration/g,
      'social': /social|people|lonely|isolated|connection|community/g
    }
    
    for (const [topic, pattern] of Object.entries(topicPatterns)) {
      const matches = allText.match(pattern)
      if (matches && matches.length > 2) {
        topics.push(topic.replace('-', ' '))
      }
    }
    
    return topics
  }

  private identifyCopingStrategies(text: string): string[] {
    const strategies: string[] = []
    const lowerText = text.toLowerCase()
    
    const strategyPatterns = {
      'breathing exercises': /breath|breathing|inhale|exhale/g,
      'exercise': /exercise|walk|run|gym|workout|physical activity/g,
      'meditation': /meditat|mindful|present moment|awareness/g,
      'social support': /talk|friend|family|support|help|therapist/g,
      'journaling': /journal|write|writing|reflect/g,
      'self-care': /self-care|bath|rest|relax|treat myself/g
    }
    
    for (const [strategy, pattern] of Object.entries(strategyPatterns)) {
      const matches = lowerText.match(pattern)
      if (matches && matches.length > 0) {
        strategies.push(strategy)
      }
    }
    
    return strategies
  }

  private identifyProgressIndicators(text: string): string[] {
    const indicators: string[] = []
    const lowerText = text.toLowerCase()
    
    const positivePatterns = {
      'improved mood': /feel better|feeling good|mood improved|happier/g,
      'increased activity': /did something|accomplished|productive|active/g,
      'better sleep': /slept well|good sleep|rested|tired but good/g,
      'social connection': /spent time|talked to|connected|reached out/g,
      'coping skills': /used breathing|tried meditation|practiced|coping/g,
      'self-awareness': /realized|noticed|understand|aware|insight/g
    }
    
    for (const [indicator, pattern] of Object.entries(positivePatterns)) {
      const matches = lowerText.match(pattern)
      if (matches && matches.length > 0) {
        indicators.push(indicator)
      }
    }
    
    return indicators
  }

  private identifyConcerningPatterns(text: string): string[] {
    const concerns: string[] = []
    const lowerText = text.toLowerCase()
    
    const concernPatterns = {
      'isolation': /alone|lonely|isolated|no one|by myself/g,
      'sleep issues': /can\'t sleep|insomnia|tired|exhausted|no energy/g,
      'hopelessness': /hopeless|pointless|give up|no point|worthless/g,
      'anxiety escalation': /panic|can\'t breathe|overwhelming|too much/g,
      'self-criticism': /hate myself|stupid|failure|not good enough/g
    }
    
    for (const [concern, pattern] of Object.entries(concernPatterns)) {
      const matches = lowerText.match(pattern)
      if (matches && matches.length > 1) { // More than one occurrence
        concerns.push(concern.replace('-', ' '))
      }
    }
    
    return concerns
  }

  private generateRecommendations(moodInsights: MoodInsight, journalInsights: JournalInsight): TherapeuticRecommendation[] {
    const recommendations: TherapeuticRecommendation[] = []
    
    // Mood-based recommendations
    if (moodInsights.trend === 'declining' && moodInsights.trendStrength > 0.3) {
      recommendations.push({
        type: 'flow',
        priority: 'high',
        title: 'Try a Guided Depression Support Flow',
        description: 'Your mood has been declining. A structured conversation about behavioral activation could help.',
        reason: 'Declining mood trend detected',
        actionable: true
      })
    }
    
    if (moodInsights.averageMood < 2.5) {
      recommendations.push({
        type: 'professional-help',
        priority: 'high',
        title: 'Consider Professional Support',
        description: 'Your mood has been consistently low. A mental health professional could provide additional support.',
        reason: 'Low average mood score',
        actionable: true
      })
    }
    
    // Journal-based recommendations
    if (journalInsights.emotionalCategories.includes('anxiety')) {
      recommendations.push({
        type: 'flow',
        priority: 'medium',
        title: 'Practice Anxiety Management Techniques',
        description: 'Try our guided CBT flow for anxiety to learn coping strategies.',
        reason: 'Anxiety themes detected in journal entries',
        actionable: true
      })
    }
    
    if (journalInsights.concerningPatterns.includes('isolation')) {
      recommendations.push({
        type: 'lifestyle',
        priority: 'medium',
        title: 'Focus on Social Connection',
        description: 'Consider reaching out to friends, family, or joining social activities.',
        reason: 'Isolation patterns detected',
        actionable: true
      })
    }
    
    if (journalInsights.copingStrategiesUsed.length === 0) {
      recommendations.push({
        type: 'strategy',
        priority: 'medium',
        title: 'Build Your Coping Toolkit',
        description: 'Start with simple breathing exercises and gradually add more coping strategies.',
        reason: 'Limited coping strategies being used',
        actionable: true
      })
    }
    
    return recommendations
  }

  private suggestCopingStrategies(emotionalCategories: string[]): CopingStrategy[] {
    if (emotionalCategories.length === 0) {
      // Return general strategies
      return COPING_STRATEGIES.filter(s => ['anxiety', 'stress'].includes(s.category)).slice(0, 3)
    }
    
    const strategies: CopingStrategy[] = []
    
    for (const category of emotionalCategories) {
      const categoryStrategies = COPING_STRATEGIES.filter(s => s.category === category)
      strategies.push(...categoryStrategies)
    }
    
    // Remove duplicates and limit to 4 strategies
    const uniqueStrategies = strategies.filter((strategy, index, array) => 
      array.findIndex(s => s.id === strategy.id) === index
    )
    
    return uniqueStrategies.slice(0, 4)
  }

  private assessRiskLevel(moodInsights: MoodInsight, journalInsights: JournalInsight): ProgressReport['riskLevel'] {
    let riskScore = 0
    
    // Mood factors
    if (moodInsights.averageMood < 2) riskScore += 3
    else if (moodInsights.averageMood < 3) riskScore += 2
    
    if (moodInsights.trend === 'declining' && moodInsights.trendStrength > 0.5) riskScore += 2
    
    // Journal factors
    if (journalInsights.concerningPatterns.includes('hopelessness')) riskScore += 3
    if (journalInsights.concerningPatterns.includes('isolation')) riskScore += 2
    if (journalInsights.concerningPatterns.length > 2) riskScore += 1
    
    if (riskScore >= 5) return 'high'
    if (riskScore >= 3) return 'moderate'
    return 'low'
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2))
    return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length
  }
}
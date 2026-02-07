import type { Timestamp } from 'firebase/firestore'

export interface MatchResult {
  goalsFor: number
  goalsAgainst: number
}

export interface Match {
  id: string
  opponent: string
  date: Timestamp
  ended: boolean
  home: boolean
  result?: {
    goalsFor: number
    goalsAgainst: number
  }
  durationMinutes: number
  running: boolean
  paused: boolean
  startTime?: number
  pausedAt?: number
  pausedDuration?: number
}

export interface NewMatch {
  opponent: string
  date: Timestamp | Date
  home: boolean
  result?: {
    goalsFor: number
    goalsAgainst: number
  }
  playerIds?: string[]
}

export interface Appearance {
  id: string
  playerId: string
  present: boolean
  goals: number
  isGoalkeeper: boolean
  seasonId: string
  matchId: string
}
export interface Player {
  id: string
  name: string
  clothingSize?: string
  hasJacket?: boolean
  hasBag?: boolean
  guestPlayer?: boolean
}

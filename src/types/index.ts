export interface MatchResult {
  goalsFor: number
  goalsAgainst: number
}

export interface Match {
  id: string
  opponent: string
  date: Date
  home: boolean
  result?: {
    goalsFor: number
    goalsAgainst: number
  }
}

export type NewMatch = Omit<Match, 'id'>

export interface Appearance {
  id: string
  playerId: string
  present: boolean
  goals: number
  isGoalkeeper: boolean
  seasonId: string
  matchId: string
}

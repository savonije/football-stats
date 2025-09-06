export interface MatchResult {
  goalsFor: number
  goalsAgainst: number
}

export interface Match {
  id: string
  opponent: string
  home: boolean
  date: string // ISO string, bv. "2025-09-15"
  result?: MatchResult
}

export interface Appearance {
  id: string
  playerId: string
  present: boolean
  goals: number
  isGoalkeeper: boolean
}

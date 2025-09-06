import { addDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import type { Match, NewMatch } from '@/types'

export async function getMatches(seasonId: string): Promise<Match[]> {
  const matchesRef = collection(db, 'seasons', seasonId, 'matches')
  const snapshot = await getDocs(matchesRef)

  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as Match,
  )
}

export const addMatch = async (seasonId: string, match: NewMatch) => {
  const matchRef = await addDoc(collection(db, 'seasons', seasonId, 'matches'), {
    opponent: match.opponent,
    date: new Date(match.date),
    home: match.home,
    result: match.result || null,
    createdAt: serverTimestamp(),
  })

  const playerIds = match.playerIds || []

  if (playerIds.length) {
    const appearancesCollection = collection(matchRef, 'appearances')
    for (const playerId of playerIds) {
      await addDoc(appearancesCollection, {
        playerId,
        present: true,
        isGoalkeeper: false,
        goals: 0,
      })
    }
  }

  return matchRef
}

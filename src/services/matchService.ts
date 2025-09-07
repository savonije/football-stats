import {
  addDoc,
  collection,
  doc,
  getDocs,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/firebase'
import type { Appearance, Match, NewMatch } from '@/types'

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
  const date = match.date instanceof Timestamp ? match.date.toDate() : new Date(match.date)
  const matchRef = await addDoc(collection(db, 'seasons', seasonId, 'matches'), {
    opponent: match.opponent,
    date,
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

export async function updateAppearance(
  seasonId: string,
  matchId: string,
  appearanceId: string,
  data: Partial<Appearance>,
) {
  const ref = doc(db, `seasons/${seasonId}/matches/${matchId}/appearances/${appearanceId}`)
  await updateDoc(ref, data)
}

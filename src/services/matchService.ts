import { addDoc, collection, getDocs } from 'firebase/firestore'
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

export async function addMatch(seasonId: string, match: NewMatch) {
  const matchesRef = collection(db, `seasons/${seasonId}/matches`)
  const docRef = await addDoc(matchesRef, match)
  return docRef.id
}

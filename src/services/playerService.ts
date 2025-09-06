import { collectionGroup, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/firebase'
import type { Appearance } from '@/types'

export async function getPlayerAppearances(
  seasonId: string,
  playerId: string,
): Promise<Appearance[]> {
  const q = query(
    collectionGroup(db, 'appearances'),
    where('playerId', '==', playerId),
    where('seasonId', '==', seasonId),
  )

  const snapshot = await getDocs(q)

  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as Appearance,
  )
}

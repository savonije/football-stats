import { defineStore } from 'pinia'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { ref } from 'vue'
import { db } from '@/firebase'
import type { Player } from '@/types'

export const usePlayerStore = defineStore('playerStore', () => {
  const players = ref<Record<string, string>>({})
  const loading = ref(false)

  // fetch a single player name
  async function fetchPlayerName(playerId: string): Promise<string> {
    if (players.value[playerId]) return players.value[playerId]

    const playerRef = doc(db, 'players', playerId)
    const playerSnap = await getDoc(playerRef)
    const name = playerSnap.exists() ? (playerSnap.data().name as string) || playerId : playerId

    players.value[playerId] = name
    return name
  }

  // fetch all players (optional, e.g. for dropdowns)
  async function fetchPlayers(): Promise<Player[]> {
    loading.value = true
    const snapshot = await getDocs(collection(db, 'players'))
    const allPlayers: Player[] = []

    snapshot.forEach((doc) => {
      const data = doc.data() as Player
      const id = doc.id
      const name = data.name || id
      players.value[id] = name
      allPlayers.push({ ...data, id })
    })

    loading.value = false // <-- stop loading
    return allPlayers
  }

  return { players, loading, fetchPlayerName, fetchPlayers }
})

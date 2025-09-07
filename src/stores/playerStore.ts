import { defineStore } from 'pinia'
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore'
import { ref, computed } from 'vue'
import { db } from '@/firebase'
import type { Player } from '@/types'

export const usePlayerStore = defineStore('playerStore', () => {
  // map: id => Player
  const players = ref<Record<string, Player>>({})

  // loading state
  const loading = ref(false)

  // convenience computed array (useful for DataTable)
  const playersArray = computed(() => Object.values(players.value))

  // fetch a single player object (from cache if available)
  async function fetchPlayer(playerId: string): Promise<Player | null> {
    // cache hit
    if (players.value[playerId]) return players.value[playerId]

    const playerRef = doc(db, 'players', playerId)
    const playerSnap = await getDoc(playerRef)
    if (!playerSnap.exists()) return null

    const data = playerSnap.data() as Player
    const player: Player = { ...data, id: playerSnap.id }
    players.value[playerSnap.id] = player
    return player
  }

  // fetch only the player's name (helper)
  async function fetchPlayerName(playerId: string): Promise<string> {
    const player = await fetchPlayer(playerId)
    return player?.name ?? playerId
  }

  // fetch all players and populate the map
  async function fetchPlayers(): Promise<Player[]> {
    loading.value = true
    try {
      const snapshot = await getDocs(collection(db, 'players'))
      const allPlayers: Player[] = []

      snapshot.forEach((snapDoc) => {
        const data = snapDoc.data() as Player
        const id = snapDoc.id
        const player: Player = { ...data, id }
        players.value[id] = player
        allPlayers.push(player)
      })

      return allPlayers
    } finally {
      loading.value = false
    }
  }

  async function updatePlayer(playerId: string, data: Partial<Player>) {
    const playerRef = doc(db, 'players', playerId)
    await updateDoc(playerRef, data)

    // update local cache
    if (players.value[playerId]) {
      players.value[playerId] = { ...players.value[playerId], ...data }
    }
  }

  return {
    // state
    players,
    playersArray,
    loading,

    // actions
    fetchPlayer,
    fetchPlayerName,
    fetchPlayers,
    updatePlayer,
  }
})

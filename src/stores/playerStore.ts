import { defineStore } from 'pinia'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase'

export const usePlayerStore = defineStore('playerStore', {
  state: () => ({
    players: {} as Record<string, string>,
  }),
  actions: {
    async fetchPlayerName(playerId: string) {
      if (this.players[playerId]) return this.players[playerId]

      const playerRef = doc(db, 'players', playerId)
      const playerSnap = await getDoc(playerRef)
      const name = playerSnap.exists() ? playerSnap.data().name || playerId : playerId

      this.players[playerId] = name
      return name
    },
  },
})

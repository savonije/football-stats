import { defineStore } from 'pinia'
import {
  collection,
  doc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  getDoc,
} from 'firebase/firestore'
import { db } from '@/firebase'
import type { Player } from '@/types'

export const usePlayerStore = defineStore('playerStore', {
  state: (): {
    players: Player[]
    playersLoaded: boolean
    selectedPlayer: Player | null
  } => ({
    players: [],
    playersLoaded: false,
    selectedPlayer: null,
  }),

  actions: {
    fetchPlayers() {
      this.playersLoaded = false
      const playersRef = collection(db, 'players')
      onSnapshot(playersRef, (snapshot) => {
        this.players = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Player)
        this.playersLoaded = true
      })
    },

    async fetchPlayer(playerId: string): Promise<Player | null> {
      const snap = await getDoc(doc(db, 'players', playerId))
      if (!snap.exists()) return null
      const player = { id: snap.id, ...snap.data() } as Player
      this.selectedPlayer = player
      return player
    },

    addPlayer(player: Player) {
      return setDoc(doc(db, 'players', player.id), player)
    },

    updatePlayer(playerId: string, data: Partial<Player>) {
      return updateDoc(doc(db, 'players', playerId), data)
    },

    deletePlayer(playerId: string) {
      return deleteDoc(doc(db, 'players', playerId))
    },

    async fetchPlayerName(playerId: string): Promise<string> {
      const playerRef = doc(db, 'players', playerId)
      const snap = await getDocs(query(collection(db, 'players'), where('id', '==', playerId)))
      if (snap.empty) return playerId
      const firstDoc = snap.docs[0]
      if (!firstDoc) return playerId
      const docData = firstDoc.data() as Player
      return docData.name ?? playerId
    },
  },

  getters: {
    getPlayerById: (state) => (playerId: string) => state.players.find((p) => p.id === playerId),
    playersSorted: (state) => [...state.players].sort((a, b) => a.name.localeCompare(b.name)),
  },
})

import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { defineStore } from 'pinia'
import type { ToastServiceMethods } from 'primevue/toastservice'

import { auth } from '@/firebase'

export const useStoreAuth = defineStore('storeAuth', {
  state: (): { user: { id: string; email: string | null } | null } => {
    return {
      user: null,
    }
  },
  actions: {
    init() {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          this.user = {
            id: user.uid,
            email: user.email,
          }

          if (this.router.currentRoute.value.name === 'auth') {
            this.router.push('/')
          }
        } else {
          this.user = null
        }
      })
    },
    loginUser(credentials: { email: string; password: string }) {
      signInWithEmailAndPassword(auth, credentials.email, credentials.password)
        .then((userCredential) => {
          const user = userCredential.user
        })
        .catch((error) => {
          console.log(error.message)
        })
    },
    logoutUser(toast: ToastServiceMethods, t: (key: string) => string) {
      signOut(auth)
        .then(() => {
          toast.add({
            severity: 'success',
            summary: t('common.logoutSuccess'),
            detail: t('common.logoutMessage'),
            life: 3000,
          })
        })
        .catch((error) => {
          toast.add({
            severity: 'error',
            summary: t('error.generic'),
            detail: error.message,
            life: 3000,
          })
        })
    },
  },
})

import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
} from 'firebase/auth';
import { defineStore } from 'pinia';

import { auth } from '@/firebase';

export const useStoreAuth = defineStore('storeAuth', {
    state: (): { user: { id: string; email: string | null } | null } => {
        return {
            user: null,
        };
    },
    actions: {
        init() {
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    this.user = {
                        id: user.uid,
                        email: user.email,
                    };

                    if (this.router.currentRoute.value.name === 'auth') {
                        this.router.push('/');
                    }
                } else {
                    this.user = null;
                }
            });
        },
        loginUser(credentials: { email: string; password: string }) {
            signInWithEmailAndPassword(
                auth,
                credentials.email,
                credentials.password,
            ).catch((error) => {
                console.log(error.message);
            });
        },
        logoutUser() {
            return signOut(auth);
        },
    },
});

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User
} from "firebase/auth"

import { auth } from "~lib/initFirebase"

export const handleSignInWithEmailAndPassword = async (
  email: string,
  password: string
) => {
  try {
    const user = await signInWithEmailAndPassword(auth, email, password)
    return user.user
  } catch (error) {
    console.log(error)
  }
}

export const getCurrentUser = () => {
  const user: User = auth.currentUser
  return user
}

export const handleSignOut = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    console.log(error)
  }
}

export const listenAuthState = (func: (user: User) => void) => {
  onAuthStateChanged(auth, (user) => func(user))
}
import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyDYdmkyt9i5w8oiV7Lr0WbbveuwMp2AAps',
  authDomain: 'packagemaker-image.firebaseapp.com',
  projectId: 'packagemaker-image',
  storageBucket: 'packagemaker-image.firebasestorage.app',
  messagingSenderId: '492030504571',
  appId: '1:492030504571:web:1b14f571c658cc4cdafcde',
  measurementId: 'G-SGPN15SB2K',
}

export const app = initializeApp(firebaseConfig)

if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) getAnalytics(app)
  })
}

export const db = getFirestore(app)
export const storage = getStorage(app)

export { ref, uploadBytes, getDownloadURL }

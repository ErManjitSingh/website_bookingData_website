import { getDownloadURL, ref, storage, uploadBytes } from '../firebase'

export async function uploadImageToFirebase(file, folder = 'seo-listings') {
  if (!file) throw new Error('No file selected')

  const safeName = file.name.replace(/[^\w.-]/g, '_')
  const path = `${folder}/${Date.now()}-${safeName}`
  const storageRef = ref(storage, path)

  const snapshot = await uploadBytes(storageRef, file)
  const downloadURL = await getDownloadURL(snapshot.ref)

  return downloadURL
}

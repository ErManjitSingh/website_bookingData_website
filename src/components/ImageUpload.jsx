import { useRef, useState } from 'react'
import { uploadImageToFirebase } from '../utils/uploadImage'
import './ImageUpload.css'

export default function ImageUpload({
  label = 'Upload Image',
  value = '',
  onChange,
  folder = 'seo-listings',
  accept = 'image/*',
}) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const url = await uploadImageToFirebase(file, folder)
      onChange(url)
    } catch (err) {
      setError(err.message ?? 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="image-upload">
      <span className="image-upload__label">{label}</span>

      <div className="image-upload__row">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFile}
          disabled={uploading}
          className="image-upload__file"
        />
        {uploading && <span className="image-upload__status">Uploading…</span>}
      </div>

      {value && (
        <div className="image-upload__preview">
          <img src={value} alt="Uploaded preview" />
          <button type="button" className="image-upload__remove" onClick={() => onChange('')}>
            Remove
          </button>
        </div>
      )}

      {error && (
        <p className="image-upload__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

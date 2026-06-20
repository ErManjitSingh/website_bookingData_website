import { useEffect, useRef } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import './RichTextEditor.css'

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  [{ align: [] }],
  ['blockquote', 'code-block'],
  ['link'],
  ['clean'],
]

export function isRichTextEmpty(html) {
  if (!html) return true
  const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
  return !text
}

function normalizeHtml(html) {
  if (!html || html === '<p><br></p>') return ''
  return html
}

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Write here…',
  minHeight = 160,
}) {
  const containerRef = useRef(null)
  const quillRef = useRef(null)
  const onChangeRef = useRef(onChange)
  const lastHtmlRef = useRef(normalizeHtml(value))

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    const container = containerRef.current
    if (!container || quillRef.current) return

    const editorEl = document.createElement('div')
    container.appendChild(editorEl)

    const quill = new Quill(editorEl, {
      theme: 'snow',
      placeholder,
      modules: { toolbar: TOOLBAR_OPTIONS },
    })

    quillRef.current = quill

    if (value) {
      quill.clipboard.dangerouslyPasteHTML(value)
    }

    quill.on('text-change', () => {
      const html = normalizeHtml(quill.root.innerHTML)
      lastHtmlRef.current = html
      onChangeRef.current(html)
    })

    return () => {
      quillRef.current = null
      container.innerHTML = ''
    }
  }, [placeholder])

  useEffect(() => {
    const quill = quillRef.current
    if (!quill) return

    const next = normalizeHtml(value)
    if (next === lastHtmlRef.current) return

    lastHtmlRef.current = next
    quill.clipboard.dangerouslyPasteHTML(next || '')
  }, [value])

  return (
    <div className="rich-text-editor" style={{ '--editor-min-height': `${minHeight}px` }}>
      <div ref={containerRef} className="rich-text-editor__container" />
    </div>
  )
}

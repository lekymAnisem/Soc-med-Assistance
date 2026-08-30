import { useCallback, useEffect, useRef, useState } from 'react'

const API_URL = (import.meta.env?.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '')

/** Cloudinary URLs are absolute; local/relative URLs get the API origin. */
const resolveUrl = (u) => (/^https?:\/\//.test(u) ? u : `${API_URL}${u}`)

const PLATFORMS = [
  { id: 'instagram', label: 'INSTAGRAM', ratio: '4:5' },
  { id: 'facebook', label: 'FACEBOOK', ratio: '1.91:1' },
  { id: 'linkedin', label: 'LINKEDIN', ratio: '1.91:1' },
  { id: 'twitter', label: 'TWITTER / X', ratio: '16:9' },
  { id: 'youtube', label: 'YOUTUBE', ratio: '16:9' },
  { id: 'tiktok', label: 'TIKTOK', ratio: '9:16' },
]

const STATUS = {
  idle: 'idle',
  processing: 'processing',
  done: 'done',
  error: 'error',
}

export default function MediaUpload() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [mediaType, setMediaType] = useState('video')
  const [platforms, setPlatforms] = useState(['instagram', 'tiktok'])
  const [context, setContext] = useState('')
  const [status, setStatus] = useState(STATUS.idle)
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [copied, setCopied] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl])

  const handleFile = useCallback((f) => {
    if (!f) return
    if (!/^(video\/|image\/)/.test(f.type)) {
      setError('Please upload a video or an image file.')
      return
    }
    setFile(f)
    setMediaType(f.type.startsWith('video/') ? 'video' : 'image')
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old)
      return URL.createObjectURL(f)
    })
    setStatus(STATUS.idle)
    setError(null)
    setResults([])
  }, [])

  const togglePlatform = (id) => {
    setPlatforms((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  const copyCaption = async (caption, idx) => {
    try {
      await navigator.clipboard.writeText(caption)
      setCopied(idx)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  const submit = async () => {
    if (!file || platforms.length === 0) return
    setStatus(STATUS.processing)
    setError(null)

    const form = new FormData()
    form.append('file', file)
    form.append('platforms', JSON.stringify(platforms))
    if (context.trim()) form.append('context', context.trim())

    try {
      const res = await fetch(`${API_URL}/api/media/repurpose`, { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Processing failed')
      }
      setResults(data.results)
      setStatus(STATUS.done)
    } catch (err) {
      setError(err.message || 'Something went wrong. Is the API server running?')
      setStatus(STATUS.error)
    }
  }

  return (
    <section id="studio" className="relative z-[2] px-6 py-28 md:px-16 md:py-40">
      <div className="mb-14 flex flex-col items-start gap-4 md:mb-20">
        <p className="eyebrow">Studio Tool</p>
        <h2 className="display-lg text-white">
          REPURPOSE
          <span className="text-[#d8ff3e]">.</span>
        </h2>
        <p className="max-w-md text-sm font-light leading-relaxed text-white/45">
          Upload a video or image, pick your platforms — we resize and fix
          the media for each one and write the caption. Ready to post.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* LEFT: upload + options */}
        <div className="lg:col-span-5">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]) }}
            onClick={() => inputRef.current?.click()}
            data-cursor="link"
            className={`flex aspect-[16/10] cursor-pointer flex-col items-center justify-center gap-4 border border-dashed text-center transition-all duration-300 ${
              dragging ? 'border-[#d8ff3e] bg-[#d8ff3e]/5' : 'border-white/15 hover:border-white/40'
            }`}
          >
            {previewUrl ? (
              mediaType === 'video' ? (
                <video src={previewUrl} className="max-h-full w-full object-contain p-2" muted loop autoPlay />
              ) : (
                <img src={previewUrl} alt="preview" className="max-h-full w-full object-contain p-2" />
              )
            ) : (
              <>
                <span className="text-3xl text-white/30">+</span>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">
                  Drop a video or image
                  <br />
                  or click to browse
                </p>
                <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25">
                  mp4 · webm · mov / jpg · png · webp — max 120 MB
                </p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="video/*,image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
            {file ? `${file.name} (${mediaType})` : 'No file selected'}
          </p>

          {/* platform chips */}
          <div className="mt-8">
            <p className="eyebrow mb-4">Target platforms</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const on = platforms.includes(p.id)
                return (
                  <button
                    key={p.id}
                    data-cursor="link"
                    onClick={() => togglePlatform(p.id)}
                    className={`group border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${
                      on
                        ? 'border-[#d8ff3e] text-[#d8ff3e]'
                        : 'border-white/15 text-white/50 hover:border-white/40 hover:text-white'
                    }`}
                  >
                    {p.label}
                    <span className={`ml-2 text-[8px] ${on ? 'text-[#d8ff3e]/60' : 'text-white/25'}`}>{p.ratio}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* context */}
          <div className="mt-8">
            <p className="eyebrow mb-3">What is it about? (optional)</p>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
              placeholder="A short description helps the AI write a sharper caption…"
              className="w-full resize-none border border-white/15 bg-transparent p-4 text-sm font-light text-white/80 outline-none transition-colors placeholder:text-white/25 focus:border-white/40"
            />
          </div>

          <button
            data-cursor="project"
            data-cursor-text="GO"
            onClick={submit}
            disabled={!file || platforms.length === 0 || status === STATUS.processing}
            className="mt-8 w-full border border-[#d8ff3e] bg-[#d8ff3e] px-8 py-4 font-mono text-[11px] uppercase tracking-[0.3em] text-black transition-all duration-300 hover:bg-transparent hover:text-[#d8ff3e] disabled:cursor-not-allowed disabled:border-white/15 disabled:bg-transparent disabled:text-white/30"
          >
            {status === STATUS.processing ? 'PROCESSING…' : `REPURPOSE FOR ${platforms.length} PLATFORM${platforms.length === 1 ? '' : 'S'}`}
          </button>

          {status === STATUS.processing && (
            <div className="mt-6 h-px w-full overflow-hidden bg-white/10">
              <div className="h-full w-full origin-left animate-[progress_2s_linear_infinite] bg-[#d8ff3e]" />
            </div>
          )}

          {error && (
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-red-400">{error}</p>
          )}
        </div>

        {/* RIGHT: results */}
        <div className="lg:col-span-7">
          {results.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {results.map((r, i) => (
                <div key={r.platform} className="border border-white/10 bg-white/[0.02] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/70">
                      {r.label}
                      <span className="ml-2 text-white/30">{r.width}×{r.height}</span>
                    </span>
                    <a
                      href={resolveUrl(r.mediaUrl)}
                      download
                      data-cursor="link"
                      className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#d8ff3e]/80 hover:text-[#d8ff3e]"
                    >
                      Download ↓
                    </a>
                  </div>

                  <div className="flex max-h-72 items-center justify-center overflow-hidden bg-black/40">
                    {mediaType === 'video' ? (
                      <video src={resolveUrl(r.mediaUrl)} controls muted playsInline className="max-h-72 w-auto object-contain" />
                    ) : (
                      <img src={resolveUrl(r.mediaUrl)} alt={r.label} className="max-h-72 w-auto object-contain" />
                    )}
                  </div>

                  <div className="mt-3">
                    <textarea
                      readOnly
                      value={r.caption ?? (r.captionError ? `Caption failed: ${r.captionError}` : '…')}
                      rows={6}
                      className="w-full resize-none border border-white/10 bg-transparent p-3 text-xs font-light leading-relaxed text-white/70 outline-none"
                    />
                    <button
                      data-cursor="link"
                      onClick={() => r.caption && copyCaption(r.caption, i)}
                      disabled={!r.caption}
                      className="mt-2 font-mono text-[9px] uppercase tracking-[0.25em] text-white/50 transition-colors hover:text-[#d8ff3e] disabled:opacity-40"
                    >
                      {copied === i ? 'COPIED ✓' : 'COPY CAPTION'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center border border-white/5 text-center">
              <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/20">
                Your repurposed media appears here
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

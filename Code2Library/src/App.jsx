import { useEffect, useState } from 'react'
import './App.css'

const formats = {
  jpeg: { mime: 'image/jpeg', extension: 'jpg' },
  png: { mime: 'image/png', extension: 'png' },
  webp: { mime: 'image/webp', extension: 'webp' },
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function App() {
  const [selectedImage, setSelectedImage] = useState(null)
  const [output, setOutput] = useState(null)
  const [width, setWidth] = useState('')
  const [quality, setQuality] = useState(82)
  const [format, setFormat] = useState('webp')
  const [error, setError] = useState('')

  useEffect(() => {
    const url = selectedImage?.previewUrl
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [selectedImage])

  useEffect(() => {
    const url = output?.previewUrl
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [output])

  function chooseFile(nextFile) {
    if (!nextFile) return
    const supportedType = ['image/jpeg', 'image/png', 'image/webp'].includes(nextFile.type)
    const supportedExtension = /\.(jpe?g|png|webp)$/i.test(nextFile.name)
    if (!supportedType && !supportedExtension) {
      setError('Choose a JPG, PNG, or WebP image.')
      return
    }

    setSelectedImage({
      file: nextFile,
      previewUrl: URL.createObjectURL(nextFile),
    })
    setOutput(null)
    setError('')
  }

  async function compressImage() {
    const file = selectedImage?.file
    const previewUrl = selectedImage?.previewUrl
    if (!file || !previewUrl) return
    setError('')

    try {
      const image = new Image()
      image.src = previewUrl
      await image.decode()

      const targetWidth = Math.min(
        Math.max(1, Number(width) || image.naturalWidth),
        image.naturalWidth,
      )
      const targetHeight = Math.round(
        image.naturalHeight * (targetWidth / image.naturalWidth),
      )
      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas is unavailable')
      context.drawImage(image, 0, 0, targetWidth, targetHeight)

      const { mime, extension } = formats[format]
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (result) => (result ? resolve(result) : reject(new Error('Export failed'))),
          mime,
          quality / 100,
        )
      })
      const baseName = file.name.replace(/\.[^.]+$/, '')

      setOutput({
        blob,
        previewUrl: URL.createObjectURL(blob),
        name: `${baseName}.${extension}`,
        width: targetWidth,
        height: targetHeight,
      })
    } catch {
      setError('This image could not be processed. Try another file.')
    }
  }

  function handleDrop(event) {
    event.preventDefault()
    chooseFile(event.dataTransfer.files[0])
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#home" aria-label="Pixel Press home">
          <span className="brand-mark" aria-hidden="true">P</span>
          <span>pixel<span className="brand-light">press</span></span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#compressor">Image tool</a>
          <a href="#how-it-works">How it works</a>
        </nav>
        <a className="header-cta" href="#compressor">Try it <span aria-hidden="true">↗</span></a>
      </header>

      <main id="home">
        <section className="intro">
          <div className="intro-copy">
            <p className="eyebrow"><span className="status-dot" /> IMAGE COMPRESSION, MADE SIMPLE</p>
            <h1>Make images<br />lighter, <span>not smaller.</span></h1>
            <p className="intro-text">Resize images, reduce file sizes, and convert between JPG, PNG, and WebP. Your images stay on your device.</p>
            <a className="text-link" href="#compressor">Start with an image <span aria-hidden="true">↓</span></a>
          </div>
          <div className="intro-art" aria-label="Illustration of image format conversion">
            <div className="art-photo">
              <div className="sun" />
              <div className="ridge ridge-back" />
              <div className="ridge ridge-front" />
              <div className="art-caption">FIELD NOTES<br /><span>IMAGE NO. 024</span></div>
            </div>
            <div className="format-stamp stamp-jpg">JPG <span>2.4 MB</span></div>
            <div className="format-stamp stamp-webp">WEBP <span>640 KB</span></div>
            <div className="art-arrow" aria-hidden="true">↘</div>
          </div>
        </section>

        <section className="tool-section" id="compressor">
          <div className="section-heading">
            <div><p className="eyebrow">YOUR IMAGE WORKBENCH</p><h2>One image, your way.</h2></div>
            <p className="privacy-note"><span aria-hidden="true">●</span> Private by design</p>
          </div>

          <div className="workbench">
            <div className="upload-column">
              {selectedImage ? (
                <div className="image-preview">
                  <img src={selectedImage.previewUrl} alt={`Preview of ${selectedImage.file.name}`} />
                  <div className="image-meta"><span className="file-name">{selectedImage.file.name}</span><span>{formatSize(selectedImage.file.size)}</span></div>
                  <label className="replace-file">Replace image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => chooseFile(event.target.files[0])} /></label>
                </div>
              ) : (
                <label className="drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
                  <span className="upload-symbol" aria-hidden="true">+</span>
                  <span className="drop-title">Drop an image here</span>
                  <span className="drop-subtitle">or <span className="browse-link">browse files</span></span>
                  <span className="file-types">JPG · PNG · WEBP</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => chooseFile(event.target.files[0])} />
                </label>
              )}
            </div>

            <div className="settings-column">
              <div className="settings-topline"><h3>Export settings</h3><span>01 <span className="step-divider">/</span> 02</span></div>
              <label className="field-label" htmlFor="max-width">Max width <span>pixels</span></label>
              <div className="width-input-wrap"><input id="max-width" type="number" min="1" placeholder="Original size" value={width} onChange={(event) => setWidth(event.target.value)} /><span>px</span></div>

              <div className="quality-heading"><label className="field-label" htmlFor="quality">Quality</label><output htmlFor="quality">{quality}%</output></div>
              <input id="quality" className="quality-slider" type="range" min="35" max="100" value={quality} onChange={(event) => setQuality(Number(event.target.value))} />
              <div className="slider-labels"><span>Smaller file</span><span>Sharper image</span></div>

              <label className="field-label format-label" htmlFor="format">Convert to</label>
              <select id="format" value={format} onChange={(event) => setFormat(event.target.value)}>
                <option value="webp">WebP · best compression</option>
                <option value="jpeg">JPEG · .jpg</option>
                <option value="png">PNG · lossless</option>
              </select>

              {error && <p className="error-message" role="alert">{error}</p>}
              <button className="process-button" type="button" onClick={compressImage} disabled={!selectedImage}>Compress image <span aria-hidden="true">↗</span></button>
              <p className="local-note">Processing happens locally on your device.</p>
            </div>
          </div>

          {output && output.previewUrl && (
            <div className="result-bar" aria-live="polite">
                <div className="result-copy"><span className="result-check" aria-hidden="true">✓</span><div><strong>{output.name}</strong><span>{output.width} × {output.height} px · {formatSize(output.blob.size)}{output.blob.size < selectedImage.file.size ? ` · ${Math.round((1 - output.blob.size / selectedImage.file.size) * 100)}% smaller` : ''}</span></div></div>
              <a className="download-button" href={output.previewUrl} download={output.name}>Download image <span aria-hidden="true">↓</span></a>
            </div>
          )}
        </section>

        <section className="how-section" id="how-it-works">
          <p className="eyebrow">THREE STEPS, THAT'S IT</p>
          <div className="steps-grid">
            <article><span className="step-number">01</span><h3>Choose an image</h3><p>Drop in a JPG, PNG, or WebP file from your device.</p></article>
            <article><span className="step-number">02</span><h3>Make it yours</h3><p>Set the width, tune quality, and pick a format.</p></article>
            <article><span className="step-number">03</span><h3>Save the lighter file</h3><p>Download your new image. Your original stays untouched.</p></article>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#home"><span className="brand-mark" aria-hidden="true">P</span><span>pixel<span className="brand-light">press</span></span></a>
        <p>Good images. Lighter files.</p>
        <span className="footer-credit">Made for the web <span aria-hidden="true">✳</span></span>
      </footer>
    </div>
  )
}

export default App

import { useRef } from 'react'
import { CheckCircle2, CloudUpload, FileImage, X } from 'lucide-react'

export function Button({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }) {
  return <button type={type} disabled={disabled} onClick={onClick} className={`btn btn-${variant} ${className}`}>{children}</button>
}

export function GlassCard({ children, className = '' }) { return <div className={`glass-card ${className}`}>{children}</div> }

export function SectionHead({ eyebrow, title, copy, action }) {
  return <div className="section-head"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{copy && <p>{copy}</p>}</div>{action}</div>
}

export function StatCard({ icon: Icon, label, value, note, color = 'cyan' }) {
  return <GlassCard className={`stat-card ${color}`}><div className="stat-icon"><Icon size={21} /></div><div><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div></GlassCard>
}

export function Badge({ children, type = 'cyan' }) { return <span className={`badge badge-${type}`}>{children}</span> }

export function Progress({ value, color = 'cyan' }) { return <div className="progress"><i className={`progress-fill ${color}`} style={{ width: `${value}%` }} /></div> }

export function UploadBox({ label = 'Upload Image', file, onFile, onInvalid, helper = 'PNG, JPG or WEBP up to 10MB', compact = false, disabled = false }) {
  const input = useRef()
  const pick = (e) => {
    if (disabled) return
    const item = e.target.files?.[0]
    e.target.value = ''
    if (!item) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(item.type)) {
      onInvalid?.('Choose a JPEG, PNG, or WEBP image.')
      return
    }
    if (item.size > 10 * 1024 * 1024) {
      onInvalid?.('Image must be 10 MB or smaller.')
      return
    }
    if (file?.url) URL.revokeObjectURL(file.url)
    onFile({ name: item.name, url: URL.createObjectURL(item), file: item, rawFile: item })
  }
  return <div className={`upload-box ${compact ? 'compact' : ''}`} onClick={() => { if (!disabled) input.current?.click() }}>
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} disabled={disabled} />
    {file ? <div className="preview-wrap"><img src={file.url} alt="Selected upload preview"/><span className="file-chip"><FileImage size={15}/>{file.name}</span><button onClick={(e)=>{e.stopPropagation();if(file.url)URL.revokeObjectURL(file.url);onFile(null)}} aria-label="Remove image"><X size={16}/></button></div> : <><div className="upload-icon"><CloudUpload size={compact ? 25 : 32}/></div><strong>{label}</strong><span>Drag & drop or <em>choose image</em></span><small>{helper}</small></>}
  </div>
}

export function Toast({ message, onClose }) { return <div className="toast"><CheckCircle2 size={19}/><span>{message}</span><button onClick={onClose}><X size={17}/></button></div> }

export function DataTable({ headers, rows }) { return <div className="table-scroll"><table><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((c,j)=><td key={j}>{c}</td>)}</tr>)}</tbody></table></div> }

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { supabase } from '../hooks/useAuth'
import SEO from '../components/SEO'
import './Perfil.css'

export default function Perfil() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) navigate('/')
  }, [user, loading])

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || profile.name || '')
      setAvatarUrl(profile.avatar_url || '')
      setAvatarPreview(profile.avatar_url || '')
    } else if (user) {
      setUsername(user.user_metadata?.name || '')
    }
  }, [profile, user])

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleGuardar() {
    if (!user) return
    setGuardando(true)
    setError('')
    try {
      let newAvatarUrl = avatarUrl

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        const path = `${user.id}/avatar.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
        newAvatarUrl = urlData.publicUrl
      }

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        username: username.trim(),
        name: username.trim(),
        avatar_url: newAvatarUrl,
      })
      if (error) throw error

      await refreshProfile(user.id)
      setAvatarUrl(newAvatarUrl)
      setGuardado(true)
      setTimeout(() => setGuardado(false), 3000)
    } catch (e) {
      console.error(e)
      setError('No se ha podido guardar el perfil. Inténtalo de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  const iniciales = username.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  if (loading) return (
    <div className="perfil-page">
      <p className="perfil-estado">Cargando…</p>
    </div>
  )

  return (
    <div className="perfil-page">
      <SEO title="Mi perfil | RZ Hub" description="Gestiona tu perfil de RZ Hub." path="/perfil" noindex />
      <div className="perfil-contenedor">
        <header className="perfil-cabecera">
          <p className="perfil-eyebrow">Tu cuenta · RZ Hub</p>
          <h1 className="perfil-titulo">Mi perfil</h1>
          <p className="perfil-intro">Así te verán los demás en RZ Hub: en la porra, las notas y el resto de la comunidad.</p>
        </header>

        <div className="perfil-tarjeta">
          <div className="perfil-avatar">
            <button type="button" className="perfil-avatar__boton" onClick={() => fileInputRef.current.click()} aria-label="Cambiar la foto de perfil">
              {avatarPreview
                ? <img src={avatarPreview} alt="" />
                : <span className="perfil-avatar__iniciales">{iniciales || '?'}</span>}
              <span className="perfil-avatar__cambiar">Cambiar</span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} hidden />
            <p className="perfil-avatar__ayuda">Toca la foto para cambiarla</p>
          </div>

          <label className="perfil-campo">
            <span>Nombre de usuario</span>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Tu nombre en RZ Hub" />
          </label>

          <label className="perfil-campo">
            <span>Email</span>
            <input value={user?.email || ''} disabled />
          </label>

          {error && <p className="perfil-aviso perfil-aviso--error">{error}</p>}
          {guardado ? (
            <p className="perfil-aviso perfil-aviso--ok">Perfil guardado</p>
          ) : (
            <button type="button" className="perfil-guardar" onClick={handleGuardar} disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar perfil'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { supabase } from '../hooks/useAuth'

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
      alert('Error al guardar el perfil.')
    } finally {
      setGuardando(false)
    }
  }

  const iniciales = username.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  if (loading) return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'sans-serif', color: '#999' }}>Cargando...</p>
    </div>
  )

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#f5f5f5', padding: '24px' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>

        <h1 style={{ fontFamily: 'Humane, sans-serif', fontWeight: '700', fontSize: '64px', textTransform: 'uppercase', color: '#0B4390', lineHeight: '1', margin: '0 0 24px 0' }}>
          Mi Perfil
        </h1>

        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
            <div onClick={() => fileInputRef.current.click()} style={{ width: '100px', height: '100px', borderRadius: '50%', border: '3px solid #f5c400', overflow: 'hidden', background: '#f5c400', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '32px', fontWeight: '700', color: '#0B4390', fontFamily: 'sans-serif' }}>{iniciales || '?'}</span>
              )}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.4)', padding: '4px', textAlign: 'center' }}>
                <span style={{ color: 'white', fontSize: '10px', fontFamily: 'sans-serif' }}>Cambiar</span>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            <p style={{ fontFamily: 'sans-serif', fontSize: '12px', color: '#aaa', marginTop: '8px' }}>Haz clic para cambiar la foto</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '12px', color: '#888', fontFamily: 'sans-serif', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
              Nombre de usuario
            </label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Tu nombre en RZ Hub"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '15px', fontFamily: 'sans-serif', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ fontSize: '12px', color: '#888', fontFamily: 'sans-serif', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
              Email
            </label>
            <input
              value={user?.email || ''}
              disabled
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #eee', fontSize: '15px', fontFamily: 'sans-serif', boxSizing: 'border-box', background: '#f9f9f9', color: '#aaa' }}
            />
          </div>

          {guardado ? (
            <div style={{ textAlign: 'center', padding: '12px', background: '#e8f5e9', borderRadius: '8px', color: '#2e7d32', fontFamily: 'sans-serif', fontWeight: '600' }}>
              ✅ Perfil guardado
            </div>
          ) : (
            <button onClick={handleGuardar} disabled={guardando} style={{ width: '100%', padding: '14px', borderRadius: '8px', border: 'none', background: '#0B4390', color: 'white', fontSize: '15px', fontFamily: 'sans-serif', fontWeight: 'bold', cursor: guardando ? 'default' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
              {guardando ? 'Guardando...' : 'Guardar perfil'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
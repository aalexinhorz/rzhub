import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './CommunitySection.css'

const BENEFITS = [
  'Demuestra que sabes',
  'Haz tu once ideal',
  'Ordena a los jugadores',
  'Acierta el resultado en la porra',
]

const MEMBER_AVATARS = [
  { id: 1, initials: 'JG', color: 'var(--rz-bg-3)' },
  { id: 2, initials: 'MR', color: 'var(--rz-bg-3)' },
  { id: 3, initials: 'AB', color: 'var(--rz-bg-3)' },
  { id: 4, initials: '+', color: 'var(--rz-bg-blue)' },
]

const POSTS = [
  {
    id: 'lineup',
    variant: 'lineup',
    author: { name: 'RZ Hub', initials: 'RZ', color: 'var(--rz-bg-blue)', avatar: '/Profile.png' },
    publishedAt: 'Hace 2h',
    text: 'Diego González. Real Zaragoza. Oficial.\nPonle en tu once 👉',
    image: '/transferCard.jpg',
    imageAlt: 'Diego González, nuevo fichaje del Real Zaragoza',
    likes: null,
    comments: null,
    href: '/comunidad',
  },
  {
    id: 'photo',
    variant: 'photo',
    author: { name: 'RZ Hub', initials: 'RZ', color: 'var(--rz-blue)', avatar: '/Profile.png' },
    publishedAt: 'Hace 3h',
    text: '🚌 Arranca la ruta: primera parada, Tarragona. Más 👇',
    image: '/CommunityCard2.jpg',
    imageAlt: 'Ruta de On Tour, primera parada en Tarragona',
    likes: null,
    comments: null,
    href: '/noticias',
  },
]

const POLL = {
  question: '¿Cuál es tu fichaje favorito?',
  options: [
    { id: 'Peter', label: 'Peter Ademo', votes: 673 },
    { id: 'Ander', label: 'Ander Herrera', votes: 375 },
    { id: 'Jardi', label: 'Jaume Jardí', votes: 245 },
  ],
  selectedOptionId: 'Peter',
  totalVotes: 1293,
}

/* ============================================================
   CommunityBenefits
   ============================================================ */
function CommunityBenefits({ items }) {
  return (
    <ul className="community-benefits">
      {items.map(item => (
        <li key={item} className="community-benefit">
          <span className="community-benefit__icon" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          {item}
        </li>
      ))}
    </ul>
  )
}

/* ============================================================
   MemberAvatars
   ============================================================ */
function MemberAvatars({ avatars, total }) {
  return (
    <div className="community-members community-section__members">
      <div className="community-members__avatars">
        {avatars.map(av => (
          <span key={av.id} className="community-members__avatar" style={{ background: av.color }}>
            {av.initials}
          </span>
        ))}
      </div>
      <span className="community-members__text">
        <strong>{total}</strong> miembros
      </span>
    </div>
  )
}

/* ============================================================
   CommunityIntro
   Nota: los avatares de miembros viven fuera de este bloque (ver
   <MemberAvatars/> en CommunitySection) para que la altura que
   comparten las cards vaya del título al botón, sin contar esa fila.
   ============================================================ */
function CommunityIntro() {
  const navigate = useNavigate()

  return (
    <div className="community-section__intro">
      <p className="community-intro__eyebrow">Comunidad</p>
      <h2 className="community-intro__title">Miles de zaragocistas, una misma pasión</h2>
      <CommunityBenefits items={BENEFITS} />
      <button type="button" className="rz-btn rz-btn--primary" onClick={() => navigate('/comunidad')}>
        Únete a la comunidad →
      </button>
    </div>
  )
}

/* ============================================================
   PostHeader — cabecera compartida por las post cards
   ============================================================ */
function PostHeader({ author, publishedAt }) {
  return (
    <div className="post-header">
      {author.avatar ? (
        <img className="post-header__avatar" src={author.avatar} alt="" aria-hidden="true" />
      ) : (
        <span className="post-header__avatar" style={{ background: author.color }} aria-hidden="true">
          {author.initials}
        </span>
      )}
      <div className="post-header__meta">
        <div className="post-header__name">{author.name}</div>
        <div className="post-header__time">{publishedAt}</div>
      </div>
    </div>
  )
}

/* ============================================================
   PostInteractions — footer compartido por las post cards
   ============================================================ */
function PostInteractions({ likes, comments, href }) {
  const navigate = useNavigate()
  return (
    <div className="post-interactions">
      <span className="post-interactions__stat">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {likes} <span className="sr-only">me gusta</span>
      </span>
      <span className="post-interactions__stat">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        {comments} <span className="sr-only">comentarios</span>
      </span>
      <button type="button" className="post-interactions__link" onClick={() => navigate(href)} aria-label="Ver publicación completa">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="13 6 19 12 13 18" />
        </svg>
      </button>
    </div>
  )
}

/* ============================================================
   CommunityPostCard — reutilizable para alineación y publicación
   ============================================================ */
function CommunityPostCard({ post }) {
  return (
    <div className={`community-card community-section__post community-section__post--${post.variant}`}>
      <PostHeader author={post.author} publishedAt={post.publishedAt} />
      <p className="community-post__text">{post.text}</p>
      <div className={`community-post__image community-post__image--${post.variant}`}>
        {post.image ? (
          <img src={post.image} alt={post.imageAlt} />
        ) : (
          <span className="community-post__image-placeholder" aria-hidden="true">
            {post.variant === 'lineup' ? '⚽ Vista previa de la alineación' : '📸 Foto del partido'}
          </span>
        )}
      </div>
      <PostInteractions likes={post.likes} comments={post.comments} href={post.href} />
    </div>
  )
}

/* ============================================================
   PollCard
   ============================================================ */
function PollCard({ poll }) {
  const [selected, setSelected] = useState(poll.selectedOptionId)

  return (
    <div className="community-card community-section__poll">
      <div className="poll-card__header">
        <span className="poll-card__eyebrow">Encuesta</span>
      </div>
      <h3 className="poll-card__question">{poll.question}</h3>
      <div className="poll-card__options" role="radiogroup" aria-label={poll.question}>
        {poll.options.map(opt => {
          const isSelected = opt.id === selected
          return (
            <label key={opt.id} className={`poll-option${isSelected ? ' poll-option--selected' : ''}`}>
              <input
                type="radio"
                name="community-poll"
                value={opt.id}
                checked={isSelected}
                onChange={() => setSelected(opt.id)}
                className="poll-option__input"
              />
              <span className="poll-option__radio" aria-hidden="true" />
              <span className="poll-option__label">{opt.label}</span>
            </label>
          )
        })}
      </div>
      <div className="poll-card__votes">{poll.totalVotes.toLocaleString('es-ES')} votos</div>
    </div>
  )
}

/* ============================================================
   CommunitySection
   ============================================================ */
export default function CommunitySection() {
  return (
    <section className="community-section">
      <div className="community-section__container">
        <div className="community-section__grid">
          <CommunityIntro />
          <CommunityPostCard post={POSTS[0]} />
          <CommunityPostCard post={POSTS[1]} />
          <PollCard poll={POLL} />
          <MemberAvatars avatars={MEMBER_AVATARS} total="+100"/>
        </div>
      </div>
    </section>
  )
}

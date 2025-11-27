import React from 'react'

interface UserAvatarProps {
  name: string
  email?: string
  userId?: number
  profilePhotoUrl?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showBorder?: boolean
}

// Generate a deterministic color based on user id/email/name
const generateAvatarColor = (seed: string): string => {
  // Pastel color palette for avatars
  const colors = [
    'linear-gradient(135deg, #6EE7B7 0%, #34D399 100%)', // Mint
    'linear-gradient(135deg, #67E8F9 0%, #22D3EE 100%)', // Aqua
    'linear-gradient(135deg, #7DD3FC 0%, #38BDF8 100%)', // Sky
    'linear-gradient(135deg, #FDA4AF 0%, #FB7185 100%)', // Coral
    'linear-gradient(135deg, #C4B5FD 0%, #A78BFA 100%)', // Lavender
    'linear-gradient(135deg, #FDE68A 0%, #FBBF24 100%)', // Yellow
    'linear-gradient(135deg, #F9A8D4 0%, #F472B6 100%)', // Pink
    'linear-gradient(135deg, #A5B4FC 0%, #818CF8 100%)', // Indigo
    'linear-gradient(135deg, #86EFAC 0%, #4ADE80 100%)', // Green
    'linear-gradient(135deg, #FCA5A5 0%, #F87171 100%)', // Red
    'linear-gradient(135deg, #93C5FD 0%, #60A5FA 100%)', // Blue
    'linear-gradient(135deg, #D8B4FE 0%, #C084FC 100%)', // Purple
  ]
  
  // Generate a hash from the seed string
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  // Use absolute value and modulo to get index
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

// Get initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const sizeConfig = {
  xs: { width: 24, height: 24, fontSize: '0.625rem' },
  sm: { width: 32, height: 32, fontSize: '0.75rem' },
  md: { width: 40, height: 40, fontSize: '0.875rem' },
  lg: { width: 48, height: 48, fontSize: '1rem' },
  xl: { width: 64, height: 64, fontSize: '1.25rem' }
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  email,
  userId,
  profilePhotoUrl,
  size = 'md',
  className = '',
  showBorder = true
}) => {
  // Generate seed from available data
  const seed = email || (userId ? `user-${userId}` : name)
  const bgColor = generateAvatarColor(seed)
  const initials = getInitials(name)
  const config = sizeConfig[size]
  
  const baseStyle: React.CSSProperties = {
    width: config.width,
    height: config.height,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: config.fontSize,
    color: 'white',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: showBorder ? '2px solid white' : 'none',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
  }

  if (profilePhotoUrl) {
    return (
      <img
        src={profilePhotoUrl}
        alt={name}
        className={`ms-avatar ms-avatar-${size} ${className}`}
        style={{
          ...baseStyle,
          objectFit: 'cover'
        }}
      />
    )
  }

  return (
    <div
      className={`ms-avatar ms-avatar-${size} ${className}`}
      style={{
        ...baseStyle,
        background: bgColor
      }}
      title={name}
    >
      {initials}
    </div>
  )
}

export default UserAvatar


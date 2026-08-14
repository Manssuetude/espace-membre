import { User } from '../types/auth'
import { Member } from '../types/member'

/**
 * Get user initials from firstName and lastName
 */
export const getUserInitials = (user: User | null): string => {
  if (!user) return 'U'
  
  const firstName = user.firstName?.trim() || ''
  const lastName = user.lastName?.trim() || ''
  
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  } else if (firstName) {
    return firstName[0].toUpperCase()
  } else if (lastName) {
    return lastName[0].toUpperCase()
  } else if (user.name) {
    const nameParts = user.name.trim().split(' ')
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    }
    return nameParts[0][0].toUpperCase()
  }
  
  return 'U'
}

/**
 * Get user avatar URL or null
 */
export const getUserAvatarUrl = (user: User | null): string | null => {
  if (!user || !user.avatar) return null
  
  // If avatar is already a full URL, return it
  if (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) {
    return user.avatar
  }
  
  // Otherwise, construct the URL
  return `https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/${user.avatar}`
}

/**
 * Get user display name
 */
export const getUserDisplayName = (user: User | null): string => {
  if (!user) return 'Utilisateur'
  
  if (user.name) {
    return user.name
  }
  
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`
  } else if (user.firstName) {
    return user.firstName
  } else if (user.lastName) {
    return user.lastName
  }
  
  return user.email || 'Utilisateur'
}

/**
 * Get member initials from firstName and lastName
 */
export const getMemberInitials = (member: Member | null): string => {
  if (!member) return 'U'
  
  const firstName = member.firstName?.trim() || ''
  const lastName = member.lastName?.trim() || ''
  
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  } else if (firstName) {
    return firstName[0].toUpperCase()
  } else if (lastName) {
    return lastName[0].toUpperCase()
  } else if (member.name) {
    const nameParts = member.name.trim().split(' ')
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    }
    return nameParts[0][0].toUpperCase()
  }
  
  return 'U'
}

/**
 * Get member avatar URL or null
 */
export const getMemberAvatarUrl = (member: Member | null): string | null => {
  if (!member || !member.avatar) return null
  
  // If avatar is already a full URL, return it
  if (member.avatar.startsWith('http://') || member.avatar.startsWith('https://')) {
    return member.avatar
  }
  
  // Otherwise, construct the URL
  return `https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/${member.avatar}`
}


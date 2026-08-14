export interface Location {
  id: string
  name: string | null
  address: string
  instructions: string | null
  googlePlaceId: string
  longitude: number
  latitude: number
  createdAt: string | null
  updatedAt: string | null
}

export interface CreateLocationRequest {
  name?: string
  address: string
  instructions?: string
  googlePlaceId: string
  longitude: number
  latitude: number
}

export interface UpdateLocationRequest {
  name?: string
  address?: string
  instructions?: string
  googlePlaceId?: string
  longitude?: number
  latitude?: number
}


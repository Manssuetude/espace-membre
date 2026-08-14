export type PostCategory = 
  | 'vie-association'
  | 'memoire-seances'
  | 'ouvertures-intellectuelles'
  | 'mot-idee-semaine'

export interface Post {
  id: string
  title: string
  content: string
  category: PostCategory
  author: {
    id: string
    name: string
    avatar: string | null
  }
  images?: string[]
  likesCount: number
  isLiked: boolean
  createdAt: string
  updatedAt: string
}

export interface CreatePostRequest {
  title: string
  content: string
  category: PostCategory
  images?: string[]
}

export interface UpdatePostRequest {
  title?: string
  content?: string
  category?: PostCategory
  images?: string[]
}

export interface LikePostRequest {
  postId: string
}



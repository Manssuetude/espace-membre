export interface ValeursContent {
  id: string
  whyExists: string
  whatWeDefend: string
  whatWeRefuse: string
  howWeDebate: string
  updatedAt: string
  updatedBy: {
    id: string
    name: string
  } | null
}

export interface UpdateValeursRequest {
  whyExists?: string
  whatWeDefend?: string
  whatWeRefuse?: string
  howWeDebate?: string
}



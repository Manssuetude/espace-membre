export interface ReglementContent {
  id: string;
  content: string;
  updatedAt: string;
  updatedBy: {
    id: string;
    name: string;
  } | null;
}

export interface UpdateReglementRequest {
  content: string;
}

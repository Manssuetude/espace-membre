export interface Resource {
  id: string;
  title: string;
  description: string;
  type: "file" | "video" | "audio" | "folder";
  link: string;
  folderDescription: string | null;
  category: string | null;
  sessionId: string | null;
  status: "pending" | "approved" | "rejected";
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  filePath: string | null;
  fileSize: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateResourceRequest {
  title: string;
  description: string;
  type: "file" | "video" | "audio" | "folder";
  link: string;
  sessionId: string; // Required - must be linked to a session
  folderDescription?: string;
  addToSession?: boolean;
}

export interface UpdateResourceRequest extends Partial<CreateResourceRequest> {}

export interface UpdateResourceStatusRequest {
  status: "approved" | "rejected";
  reviewNotes?: string;
}

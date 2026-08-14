// API Activity Template types (matches backend)
export interface ActivityTemplate {
  id: string;
  title: string;
  description?: string;
  color?: string;
  icon?: string;
  rules: string[];
  duration?: string;
  examples: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityTemplateRequest {
  title: string;
  description?: string;
  color?: string;
  icon?: string;
  rules?: string[];
  duration?: string;
  examples?: string[];
}

export interface UpdateActivityTemplateRequest {
  title?: string;
  description?: string;
  color?: string;
  icon?: string;
  rules?: string[];
  duration?: string;
  examples?: string[];
}

// Legacy Format types (for backward compatibility with existing code)
export interface Format {
  id: string;
  name: string;
  description: string;
  minParticipants: number;
  maxParticipants: number;
  duration: string;
  rules: string[];
  icon?: string;
  color?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormatRule {
  id: string;
  formatId: string;
  rule: string;
  order: number;
}

export interface CreateFormatRequest {
  name: string;
  description: string;
  minParticipants: number;
  maxParticipants: number;
  duration: string;
  rules: string[];
  icon?: string;
  color?: string;
}

export interface UpdateFormatRequest {
  name?: string;
  description?: string;
  minParticipants?: number;
  maxParticipants?: number;
  duration?: string;
  rules?: string[];
  icon?: string;
  color?: string;
}

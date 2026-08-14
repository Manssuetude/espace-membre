export type QuestionnaireStatus = "draft" | "published" | "closed";

export type QuestionnaireQuestionType = "single_choice" | "multiple_choice" | "text" | "rating" | "number" | "date";

export interface QuestionnaireOption {
  id: string;
  label: string;
  value: string | null;
  orderIndex: number;
}

export interface QuestionnaireQuestion {
  id: string;
  question: string;
  description?: string | null;
  type: QuestionnaireQuestionType;
  required?: boolean;
  orderIndex?: number;
  options?: QuestionnaireOption[] | null;
}

export interface Questionnaire {
  id: string;
  title: string;
  description: string | null;
  status: QuestionnaireStatus;
  totalResponses?: number;
  startDate?: string | null;
  endDate?: string | null;
  editWindowMinutes?: number | null;
  hasResponse?: boolean;
  isSubmitted?: boolean;
  createdAt: string;
  updatedAt: string;
  questions?: QuestionnaireQuestion[];
}

export interface QuestionnaireListResponse {
  data: Questionnaire[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateQuestionnaireQuestionOptionInput {
  label: string;
  value?: string;
}

export interface CreateQuestionnaireQuestionInput {
  question: string;
  description?: string;
  type: QuestionnaireQuestionType;
  required?: boolean;
  orderIndex?: number;
  options?: CreateQuestionnaireQuestionOptionInput[];
}

export interface CreateQuestionnaireRequest {
  title: string;
  description?: string;
  startDate?: string | null;
  endDate?: string | null;
  editWindowMinutes?: number | null;
  questions: CreateQuestionnaireQuestionInput[];
}

export interface UpdateQuestionnaireRequest {
  title?: string;
  description?: string | null;
  status?: QuestionnaireStatus;
  startDate?: string | null;
  endDate?: string | null;
  editWindowMinutes?: number | null;
}

export type QuestionnaireAnswerType = "single_choice" | "multiple_choice" | "text" | "rating" | "number" | "date";

export interface SingleChoiceAnswer {
  questionId: string;
  type: "single_choice";
  answer: {
    optionId: string;
  };
}

export interface MultipleChoiceAnswer {
  questionId: string;
  type: "multiple_choice";
  answer: {
    optionIds: string[];
  };
}

export interface TextAnswer {
  questionId: string;
  type: "text";
  answer: {
    text: string;
  };
}

export interface RatingAnswer {
  questionId: string;
  type: "rating";
  answer: {
    rating: number;
  };
}

export interface NumberAnswer {
  questionId: string;
  type: "number";
  answer: {
    number: number;
  };
}

export interface DateAnswer {
  questionId: string;
  type: "date";
  answer: {
    date: string;
  };
}

export type QuestionnaireAnswerPayload =
  SingleChoiceAnswer | MultipleChoiceAnswer | TextAnswer | RatingAnswer | NumberAnswer | DateAnswer;

export interface QuestionnaireResponseSummary {
  id: string;
  questionnaireId: string;
  userId: string;
  status: "in_progress" | "submitted";
  createdAt: string;
  submittedAt?: string | null;
  editUntil?: string | null;
}

export interface QuestionnaireResponseWithAnswers extends QuestionnaireResponseSummary {
  answers: QuestionnaireAnswerPayload[];
}

export interface QuestionnaireUnansweredListResponse {
  data: Questionnaire[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QuestionnaireMeResponse {
  questionnaire: Questionnaire;
  response: QuestionnaireResponseWithAnswers | null;
}

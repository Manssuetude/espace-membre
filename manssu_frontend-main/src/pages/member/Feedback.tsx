import { useState } from "react";
import { useCreateFeedback } from "../../services/hooks/useFeedback";
import FeedbackHeader from "../../components/member/FeedbackHeader";
import FeedbackCategorySelector from "../../components/member/FeedbackCategorySelector";
import FeedbackTypeSelector from "../../components/member/FeedbackTypeSelector";
import FeedbackFormFields from "../../components/member/FeedbackFormFields";
import FeedbackStatsSidebar from "../../components/member/FeedbackStatsSidebar";
import FeedbackTipsSidebar from "../../components/member/FeedbackTipsSidebar";
import FeedbackHistory from "../../components/member/FeedbackHistory";

const Feedback = () => {
  const createFeedbackMutation = useCreateFeedback();

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [formData, setFormData] = useState({
    category: "",
    type: "",
    subject: "",
    message: "",
    anonymous: false,
    rating: undefined as number | undefined,
    sessionId: undefined as string | undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.category || !formData.type || !formData.subject || !formData.message) {
      return;
    }

    // Map category values to API format
    const categoryMap: Record<string, string> = {
      association: "Général",
      sessions: "Session",
      plateforme: "Général",
      autre: "Général",
    };

    // Map type values to API format
    const typeMap: Record<string, string> = {
      suggestion: "Suggestion",
      probleme: "Complaint",
      compliment: "Compliment",
    };

    const requestData = {
      category: categoryMap[formData.category] || "Général",
      type: typeMap[formData.type] || formData.type,
      subject: formData.subject,
      message: formData.message,
      anonymous: formData.anonymous || false,
      ...(formData.rating && { rating: formData.rating }),
      ...(formData.sessionId && { sessionId: formData.sessionId }),
    };

    createFeedbackMutation.mutate(requestData, {
      onSuccess: () => {
        setFormData({
          category: "",
          type: "",
          subject: "",
          message: "",
          anonymous: false,
          rating: undefined,
          sessionId: undefined,
        });
        setSelectedCategory("");
        // Query invalidation is handled in the hook
      },
    });
  };

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 lg:p-8">
            <FeedbackHeader />
            <form onSubmit={handleSubmit} className="space-y-6">
              <FeedbackCategorySelector
                selectedCategory={selectedCategory}
                onCategoryChange={(category) => {
                  setFormData({ ...formData, category });
                  setSelectedCategory(category);
                }}
              />
              <FeedbackTypeSelector
                selectedType={formData.type}
                onTypeChange={(type) => setFormData({ ...formData, type })}
              />
              <FeedbackFormFields
                subject={formData.subject}
                message={formData.message}
                anonymous={formData.anonymous}
                onSubjectChange={(subject) => setFormData({ ...formData, subject })}
                onMessageChange={(message) => setFormData({ ...formData, message })}
                onAnonymousChange={(anonymous) => setFormData({ ...formData, anonymous })}
              />
              <button
                type="submit"
                disabled={
                  createFeedbackMutation.isPending ||
                  !formData.category ||
                  !formData.type ||
                  !formData.subject ||
                  !formData.message
                }
                className="w-full bg-gradient-to-r from-primary to-red-500 text-white font-semibold py-4 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createFeedbackMutation.isPending ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane mr-2"></i>
                    Envoyer le feedback
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-8">
          <FeedbackStatsSidebar />
          <FeedbackTipsSidebar />
        </div>
      </div>

      <FeedbackHistory />
    </div>
  );
};

export default Feedback;

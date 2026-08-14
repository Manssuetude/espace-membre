interface FeedbackFormFieldsProps {
  subject: string
  message: string
  anonymous: boolean
  onSubjectChange: (value: string) => void
  onMessageChange: (value: string) => void
  onAnonymousChange: (checked: boolean) => void
}

const FeedbackFormFields = ({
  subject,
  message,
  anonymous,
  onSubjectChange,
  onMessageChange,
  onAnonymousChange,
}: FeedbackFormFieldsProps) => {
  return (
    <>
      <div>
        <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
          Sujet
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          placeholder="Résumé de votre feedback en quelques mots"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          placeholder="Décrivez votre feedback en détail..."
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="anonymous"
          name="anonymous"
          className="text-primary focus:ring-primary rounded"
          checked={anonymous}
          onChange={(e) => onAnonymousChange(e.target.checked)}
        />
        <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
          Envoyer ce feedback de manière anonyme
        </label>
      </div>
    </>
  )
}

export default FeedbackFormFields


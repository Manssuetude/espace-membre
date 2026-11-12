import { Link } from "react-router-dom";
import { AwardDashboardSummary } from "../../types/award";

interface AwardDashboardCardProps {
  awards: AwardDashboardSummary | null | undefined;
}

const formatDate = (dateString?: string | null) => {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
};

const AwardDashboardCard = ({ awards }: AwardDashboardCardProps) => {
  if (!awards) return null;

  let body: React.ReactNode;
  switch (awards.phase) {
    case "teasing":
      body = awards.lastRevealed ? (
        <p className="text-sm text-gray-600">
          Dernière catégorie révélée :{" "}
          <span className="font-medium text-gray-900">
            {awards.lastRevealed.icon} {awards.lastRevealed.name}
          </span>
        </p>
      ) : (
        <p className="text-sm text-gray-600">Les catégories se révèlent petit à petit.</p>
      );
      break;
    case "nomination":
      body = (
        <p className="text-sm text-gray-600">
          Vous avez proposé des candidats pour{" "}
          <span className="font-medium text-gray-900">
            {awards.nominationCount ?? 0}/{awards.totalCategories ?? 0}
          </span>{" "}
          catégories.
          {awards.nominationEndAt && <> Fin des propositions le {formatDate(awards.nominationEndAt)}.</>}
        </p>
      );
      break;
    case "selection":
      body = (
        <p className="text-sm text-gray-600">
          Les listes finales sont en préparation.
          {awards.voteStartAt && <> Le vote ouvre le {formatDate(awards.voteStartAt)}.</>}
        </p>
      );
      break;
    case "vote":
      body = (
        <p className="text-sm text-gray-600">
          Vous avez voté dans{" "}
          <span className="font-medium text-gray-900">
            {awards.voteCount ?? 0}/{awards.totalCategories ?? 0}
          </span>{" "}
          catégories.
          {awards.voteEndAt && <> Fin du vote le {formatDate(awards.voteEndAt)}.</>}
        </p>
      );
      break;
    case "ceremony_pending":
      body = (
        <p className="text-sm text-gray-600">
          {awards.ceremonySession
            ? `Les lauréat·es seront révélés lors de la séance "${awards.ceremonySession.title}"${
                awards.ceremonySession.date ? ` le ${formatDate(awards.ceremonySession.date)}` : ""
              }.`
            : "Les lauréat·es seront révélés lors de la cérémonie."}
        </p>
      );
      break;
    case "published":
      body = <p className="text-sm text-gray-600">Le palmarès {awards.year} est en ligne.</p>;
      break;
    default:
      body = null;
  }

  return (
    <Link
      to="/awards"
      className="block bg-award-ink text-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
    >
      <div className="flex items-center gap-2 mb-2">
        <i className="fa-solid fa-trophy text-award-gold"></i>
        <h3 className="text-lg font-semibold">Awards {awards.year}</h3>
      </div>
      {body}
      <span className="inline-flex items-center gap-1 text-sm text-award-gold-light mt-3">
        Voir <i className="fa-solid fa-arrow-right text-xs"></i>
      </span>
    </Link>
  );
};

export default AwardDashboardCard;

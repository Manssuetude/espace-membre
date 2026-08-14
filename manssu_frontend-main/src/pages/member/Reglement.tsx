const Reglement = () => {
  const prohibitedBehaviors = [
    "propos ou attitudes discriminatoires, agressifs ou méprisants",
    "prosélytisme religieux ou politique",
    "perturbation volontaire des séances",
    "prises de parole dominantes ou tentatives de prise de pouvoir",
    "non-respect de la confidentialité des échanges",
  ];

  const guestRights = [
    "l'accès aux ressources préparatoires de la séance",
    "la participation aux sondages et supports liés à la séance",
    "la lecture des Valeurs et du Règlement",
    "la participation pleine et entière à la séance, dans le respect du cadre",
  ];

  const guestLimitations = [
    "ne donne lieu à aucune cotisation",
    "n'implique aucun paiement",
    "n'ouvre pas l'accès complet à l'espace membre",
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Introduction */}
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-200 shadow-sm">
        <p className="text-lg text-gray-800 leading-relaxed mb-4">
          Le présent règlement définit les règles de fonctionnement de l'association Manssuétude. Il vise à garantir un
          cadre <span className="font-semibold">juste, exigeant et respectueux</span>, indispensable à la qualité des
          échanges et à la pérennité du collectif.
        </p>
        <div className="bg-primary/10 border-l-4 border-primary rounded-lg p-4">
          <p className="text-gray-900 font-semibold">
            Toute adhésion à Manssuétude implique l'acceptation pleine et entière du présent règlement.
          </p>
        </div>
      </div>

      {/* Article 1 */}
      <section className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200/50">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-primary to-red-600 rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-xl">
            1
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Statut de membre</h2>
        </div>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>L'adhésion est ouverte à toute personne partageant les valeurs de Manssuétude.</p>
          <p>
            Le nombre de membres est <span className="font-semibold">volontairement limité</span> afin de préserver la
            qualité des échanges.
          </p>
          <p>
            Être membre implique une <span className="font-semibold">présence régulière</span>, une{" "}
            <span className="font-semibold">participation active</span> et un{" "}
            <span className="font-semibold">engagement collectif</span>.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary mt-4">
            <p className="font-semibold text-gray-900 italic">
              Manssuétude n'est pas un espace de consommation ponctuelle, mais un collectif vivant.
            </p>
          </div>
        </div>
      </section>

      {/* Article 2 */}
      <section className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200/50">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-accent to-blue-600 rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-xl">
            2
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Présence, ponctualité et engagement</h2>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <i className="fa-solid fa-clock text-accent"></i>
              Ponctualité
            </h3>
            <ul className="space-y-2 text-gray-700 ml-6">
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-circle-check text-green-600 mt-1 text-xs"></i>
                <span>Les séances commencent à l'heure prévue.</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-circle-check text-green-600 mt-1 text-xs"></i>
                <span>Tout retard doit être signalé à l'avance.</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-circle-check text-green-600 mt-1 text-xs"></i>
                <span>Les retards répétés, sans justification, perturbent la dynamique collective.</span>
              </li>
            </ul>
            <p className="mt-3 text-gray-700 font-semibold">
              La ponctualité est une marque de respect envers le groupe.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <i className="fa-solid fa-user-xmark text-red-600"></i>
              Absences
            </h3>
            <ul className="space-y-2 text-gray-700 ml-6">
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-circle-check text-green-600 mt-1 text-xs"></i>
                <span>Toute absence doit être signalée en amont.</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-triangle-exclamation text-red-600 mt-1 text-xs"></i>
                <span>
                  <span className="font-semibold">Quatre séances consécutives d'absence non justifiée</span> entraînent
                  l'exclusion automatique de l'association.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fa-solid fa-circle-check text-green-600 mt-1 text-xs"></i>
                <span>Une indisponibilité prolongée est tolérée si elle est annoncée clairement.</span>
              </li>
            </ul>
            <p className="mt-3 text-gray-700 font-semibold">
              La régularité de présence est une condition essentielle du fonctionnement de Manssuétude.
            </p>
          </div>
        </div>
      </section>

      {/* Article 3 */}
      <section className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200/50">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-secondary to-orange-600 rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-xl">
            3
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Participation aux séances</h2>
        </div>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            La participation à une séance implique une <span className="font-semibold">implication active</span>.
          </p>
          <p>Participer signifie être présent, attentif et prendre la parole.</p>
          <p>
            Il n'est pas attendu de parler longuement ni d'avoir une position définitive, mais{" "}
            <span className="font-semibold">chacun est tenu de contribuer oralement</span>.
          </p>
          <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-secondary my-4">
            <p className="text-gray-800">
              Le silence ponctuel est acceptable ;{" "}
              <span className="font-semibold">la non-prise de parole répétée ne l'est pas</span>.
            </p>
          </div>
          <p>
            Les rôles tournants (animation, accueil, prise de notes…) doivent être respectés lorsque l'on s'y engage ou
            y est désigné.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary mt-4">
            <p className="font-semibold text-gray-900 italic">
              Manssuétude est un espace d'expression partagée, non d'observation passive.
            </p>
          </div>
        </div>
      </section>

      {/* Article 4 */}
      <section className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200/50">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-xl">
            4
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Cotisation</h2>
        </div>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            La cotisation est <span className="font-semibold">obligatoire</span> pour être membre actif.
          </p>
          <p>Elle permet d'assurer le fonctionnement, les lieux d'accueil et la continuité des activités.</p>
          <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-600 my-4">
            <p className="text-gray-800">
              <span className="font-semibold">Deux mois consécutifs sans cotisation</span>, sans explication ou échange
              préalable, entraînent l'exclusion automatique de l'association.
            </p>
          </div>
          <p>En cas de difficulté financière, un échange est toujours possible avant toute décision.</p>
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-green-600 mt-4">
            <p className="font-semibold text-gray-900">
              La cotisation est un engagement collectif, pas une formalité administrative.
            </p>
          </div>
        </div>
      </section>

      {/* Article 5 */}
      <section className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200/50">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-xl">
            5
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Comportement et respect du cadre</h2>
        </div>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p className="font-semibold text-red-600 mb-4">Sont strictement interdits :</p>
          <div className="space-y-2">
            {prohibitedBehaviors.map((behavior, index) => (
              <div key={index} className="flex items-start gap-3 bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                <i className="fa-solid fa-ban text-red-600 mt-1 flex-shrink-0"></i>
                <p className="text-gray-800">{behavior}</p>
              </div>
            ))}
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary mt-6">
            <p className="text-gray-900 font-semibold">
              Chaque membre est responsable de son comportement dans et en dehors des séances dès lors qu'il agit au nom
              de Manssuétude.
            </p>
          </div>
        </div>
      </section>

      {/* Article 6 */}
      <section className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200/50">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-xl">
            6
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Confidentialité et diffusion de contenus</h2>
        </div>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            Les échanges tenus lors des séances sont <span className="font-semibold">confidentiels</span>, sauf accord
            explicite des personnes concernées.
          </p>
          <p>
            Aucun contenu (photo, vidéo, audio, citation) ne peut être diffusé sans le{" "}
            <span className="font-semibold">consentement explicite</span> des personnes concernées.
          </p>
          <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-600 mt-4">
            <p className="text-gray-800 font-semibold">
              Le non-respect de ces règles peut entraîner des mesures disciplinaires.
            </p>
          </div>
        </div>
      </section>

      {/* Article 7 */}
      <section className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200/50">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-xl">
            7
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Manquements et exclusions</h2>
        </div>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            Les exclusions liées aux absences ou à la cotisation sont{" "}
            <span className="font-semibold">automatiques</span> et ne relèvent pas d'une appréciation subjective.
          </p>
          <p>Les autres manquements peuvent être examinés par le bureau.</p>
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary mt-4">
            <p className="text-gray-900 font-semibold">
              Toute décision vise prioritairement à protéger le collectif, dans un esprit de justice et de cohérence.
            </p>
          </div>
        </div>
      </section>

      {/* Article 8 */}
      <section className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200/50">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-xl">
            8
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Invitation et intégration de nouveaux membres</h2>
        </div>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            L'ouverture à de nouveaux membres est{" "}
            <span className="font-semibold">volontairement encadrée et progressive</span>.
          </p>
          <ul className="space-y-2 ml-6 list-decimal">
            <li>Toute intention d'invitation doit être signalée à un membre du bureau.</li>
            <li>La personne participe à une séance en tant qu'invité.</li>
            <li>À l'issue de la séance, l'intégration éventuelle est discutée et validée collectivement.</li>
          </ul>
          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600 mt-4">
            <p className="text-gray-900 font-semibold">Aucune intégration n'est automatique.</p>
            <p className="text-gray-800 mt-2">Manssuétude privilégie une croissance qualitative.</p>
          </div>
        </div>
      </section>

      {/* Article 9 */}
      <section className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200/50">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-xl">
            9
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Statut d'invité</h2>
        </div>
        <div className="space-y-6">
          <p className="text-gray-700 leading-relaxed">Le statut d'invité est limité à la phase de découverte.</p>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <i className="fa-solid fa-check-circle text-green-600"></i>
              Il donne droit à :
            </h3>
            <ul className="space-y-2 ml-6">
              {guestRights.map((right, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700">
                  <i className="fa-solid fa-circle-check text-green-600 mt-1 text-xs"></i>
                  <span>{right}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <i className="fa-solid fa-xmark-circle text-red-600"></i>
              Le statut d'invité :
            </h3>
            <ul className="space-y-2 ml-6">
              {guestLimitations.map((limitation, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700">
                  <i className="fa-solid fa-circle-xmark text-red-600 mt-1 text-xs"></i>
                  <span>{limitation}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Article 10 */}
      <section className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200/50">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-xl">
            10
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Modification du règlement</h2>
        </div>
        <div className="text-gray-700 leading-relaxed">
          <p>Le présent règlement peut être modifié par décision du bureau.</p>
          <p>Toute modification est communiquée aux membres.</p>
        </div>
      </section>

      {/* Conclusion */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl p-8 text-white">
        <div className="text-center space-y-4">
          <i className="fa-solid fa-gavel text-4xl text-white/30"></i>
          <h2 className="text-2xl font-bold">Conclusion</h2>
          <p className="text-lg leading-relaxed">
            Ce règlement existe pour rendre possible un espace <span className="text-secondary">libre</span>,{" "}
            <span className="text-accent">exigeant</span> et <span className="text-primary">durable</span>.
          </p>
          <p className="text-xl font-semibold mt-6">
            À Manssuétude, la liberté va toujours de pair avec la responsabilité collective.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Reglement;

const Valeurs = () => {
  const principles = [
    { icon: 'fa-heart', title: 'La bienveillance', description: 'Accueillir les personnes avant de juger les idées.' },
    { icon: 'fa-handshake', title: 'Le respect', description: 'Du temps, de la parole, du silence et des différences.' },
    { icon: 'fa-ear-listen', title: 'L\'écoute réelle', description: 'Écouter pour comprendre, pas pour répondre.' },
    { icon: 'fa-door-open', title: 'L\'ouverture', description: 'Aux parcours, aux désaccords, aux zones d\'incertitude.' },
    { icon: 'fa-people-group', title: 'L\'inclusivité', description: 'Chacun a sa place, sans condition de statut, d\'éloquence ou de niveau.' },
    { icon: 'fa-comments', title: 'La liberté d\'expression', description: 'Dans le respect du cadre commun et des autres.' },
    { icon: 'fa-users-gear', title: 'La responsabilité collective', description: 'Penser ensemble implique de veiller à l\'équilibre du groupe.' },
  ]

  const rights = [
    'de douter',
    'de ne pas savoir',
    'de changer d\'avis',
  ]

  const refusals = [
    { icon: 'fa-ban', text: 'Toute forme de discrimination, de mépris ou d\'agressivité.' },
    { icon: 'fa-exclamation-triangle', text: 'Les jugements violents, attaques personnelles ou postures dominantes.' },
    { icon: 'fa-megaphone', text: 'Le prosélytisme religieux ou politique.' },
    { icon: 'fa-crown', text: 'Les prises de pouvoir ou de parole toxiques.' },
    { icon: 'fa-lock', text: 'Le non-respect de la confidentialité des échanges.' },
    { icon: 'fa-trophy', text: 'La volonté de convaincre à tout prix ou de "gagner" un débat.' },
  ]

  const debatePrinciples = [
    'on parle à partir de soi',
    'on écoute sans interrompre',
    'on accepte les silences',
    'on laisse de la place aux autres',
    'on prépare les sujets lorsque cela est nécessaire',
  ]

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Introduction */}
      <div className="bg-gradient-to-br from-primary/10 via-red-50 to-orange-50 rounded-2xl p-8 border border-primary/20">
        <p className="text-lg text-gray-800 leading-relaxed">
          Cette page présente <span className="font-semibold text-primary">l'esprit de Manssuétude</span>.
          Elle pose le cadre moral et intellectuel dans lequel le collectif évolue.
          Les valeurs ne sont pas des slogans : elles sont là pour <span className="font-semibold">protéger l'espace</span>, pas pour orienter la pensée.
        </p>
      </div>

      {/* Pourquoi Manssuétude existe */}
      <section className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-red-600 rounded-xl flex items-center justify-center shadow-lg">
            <i className="fa-solid fa-lightbulb text-white text-xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Pourquoi Manssuétude existe</h2>
        </div>
        
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p className="text-lg">
            Manssuétude est née d'un <span className="font-semibold text-primary">besoin simple</span> :
            créer un espace où la jeunesse peut penser librement, sans injonction ni pression.
          </p>
          
          <p>
            Beaucoup d'entre nous — jeunes africains, afro-descendants et alliés — s'interrogent sur leur place, leur rôle et leur capacité à contribuer au monde, et à l'Afrique en particulier.
            Nous croyons que la première étape pour avoir un impact réel est de <span className="font-semibold">prendre le temps de réfléchir</span>.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary my-4">
            <p className="font-medium text-gray-800 mb-2">Pas dans la précipitation.</p>
            <p className="font-medium text-gray-800 mb-2">Pas dans le bruit.</p>
            <p className="font-medium text-gray-800">Pas dans le militantisme imposé.</p>
          </div>
          
          <p className="font-semibold text-gray-900">Manssuétude existe pour offrir :</p>
          <ul className="space-y-2 ml-6 list-disc text-gray-700">
            <li>un lieu de réflexion profonde,</li>
            <li>un espace d'expression sincère,</li>
            <li>un cadre collectif où l'on peut grandir ensemble.</li>
          </ul>
          
          <p className="mt-4">
            Ce n'est ni une tribune, ni un parti, ni un espace de performance.
            C'est un <span className="font-semibold italic">laboratoire d'idées</span>, un <span className="font-semibold italic">cercle</span>, un <span className="font-semibold italic">lieu d'ancrage</span>.
          </p>
        </div>
      </section>

      {/* Ce que nous défendons */}
      <section className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-accent to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <i className="fa-solid fa-shield-halved text-white text-xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Ce que nous défendons</h2>
        </div>
        
        <p className="text-gray-700 mb-6 leading-relaxed">
          Manssuétude repose sur des <span className="font-semibold">principes simples, mais exigeants</span> :
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {principles.map((principle, index) => (
            <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-accent/20 to-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className={`fa-solid ${principle.icon} text-accent text-lg`}></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{principle.title}</h3>
                  <p className="text-sm text-gray-600">{principle.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-accent mt-6">
          <p className="font-semibold text-gray-900 mb-3">Nous défendons aussi le droit :</p>
          <ul className="space-y-2">
            {rights.map((right, index) => (
              <li key={index} className="flex items-center gap-2 text-gray-700">
                <i className="fa-solid fa-check-circle text-accent"></i>
                <span>{right}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Ce que nous refusons */}
      <section className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg">
            <i className="fa-solid fa-xmark text-white text-xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Ce que nous refusons</h2>
        </div>
        
        <p className="text-gray-700 mb-6 leading-relaxed">
          Pour préserver cet espace, certaines pratiques sont <span className="font-semibold text-red-600">incompatibles avec Manssuétude</span> :
        </p>
        
        <div className="space-y-3">
          {refusals.map((refusal, index) => (
            <div key={index} className="flex items-start gap-4 bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
              <i className={`fa-solid ${refusal.icon} text-red-600 mt-1 flex-shrink-0`}></i>
              <p className="text-gray-700">{refusal.text}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 italic">
            Le cadre est volontairement sobre, mais il est là pour protéger l'ambiance et la qualité des échanges.
          </p>
        </div>
      </section>

      {/* Comment on débat ici */}
      <section className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-secondary to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <i className="fa-solid fa-comments text-white text-xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Comment on débat ici</h2>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 mb-6 border border-secondary/20">
          <p className="text-lg font-semibold text-gray-900 mb-2">
            À Manssuétude, débattre ne signifie pas convaincre.
          </p>
        </div>
        
        <p className="text-gray-700 mb-4 font-semibold">Ici :</p>
        <div className="space-y-3 mb-6">
          {debatePrinciples.map((principle, index) => (
            <div key={index} className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
              <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-check text-secondary text-sm"></i>
              </div>
              <p className="text-gray-700">{principle}</p>
            </div>
          ))}
        </div>
        
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            Les désaccords sont normaux et bienvenus, tant qu'ils sont exprimés avec <span className="font-semibold">respect, nuance et lucidité</span>.
          </p>
          
          <div className="bg-blue-50 rounded-lg p-5 border-l-4 border-accent">
            <p className="font-semibold text-gray-900 mb-2">La parole donnée engage chacun à une forme de responsabilité morale.</p>
            <p className="text-gray-700">
              Les échanges restent <span className="font-semibold">confidentiels</span>, sauf accord explicite des personnes concernées.
            </p>
          </div>
        </div>
      </section>

      {/* Conclusion */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl p-8 text-white">
        <div className="text-center space-y-4">
          <i className="fa-solid fa-quote-left text-4xl text-white/30"></i>
          <p className="text-xl font-semibold leading-relaxed">
            Manssuétude est un espace <span className="text-secondary">libre</span>, <span className="text-accent">exigeant</span> et <span className="text-primary">humain</span>.
          </p>
          <p className="text-lg text-white/90 leading-relaxed">
            Les valeurs ne cherchent pas à encadrer la pensée, mais à lui permettre d'exister pleinement.
          </p>
          <div className="pt-4 border-t border-white/20">
            <p className="text-sm text-white/70">
              Les principes présentés ici sont complétés par un <span className="font-semibold">règlement intérieur</span>, qui précise les règles pratiques de fonctionnement du collectif.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Valeurs

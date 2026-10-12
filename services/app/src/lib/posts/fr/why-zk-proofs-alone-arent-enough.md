---
title: "Pourquoi les preuves à divulgation nulle de connaissance seules ne suffisent pas à protéger la vie privée"
description: "Les preuves à divulgation nulle de connaissance protègent la preuve elle-même, mais les plateformes civiques doivent aussi protéger l'identité, les métadonnées, les portefeuilles, les appareils et l'infrastructure open source."
author: "Nicolas Gimenez"
date: "2024-09-01"
type: "tech"
thumbnail: "https://lh7-us.googleusercontent.com/docs/AHkbwyK44xfmb0zN95CAfiTWJ5ULJ_-8DpfWRTy8r23dsV6kahSE4C4X-cZ8W4Ed-n2MT0jfWuolbqR77m1-rt_yXV4xcoojPDahscs3bQ=w1200-h630-p"
image: "https://lh7-us.googleusercontent.com/docs/AHkbwyK44xfmb0zN95CAfiTWJ5ULJ_-8DpfWRTy8r23dsV6kahSE4C4X-cZ8W4Ed-n2MT0jfWuolbqR77m1-rt_yXV4xcoojPDahscs3bQ=w1200-h630-p"
---

Les [preuves à divulgation nulle de connaissance](https://en.wikipedia.org/wiki/Zero-knowledge_proof), ou preuves zero-knowledge (ZKP), sont souvent présentées comme une réponse complète à la protection de la vie privée. Dans les technologies civiques, la promesse est particulièrement forte : une personne peut prouver qu'elle est éligible pour participer, qu'elle est unique, qu'elle a plus d'un certain âge ou qu'elle réside dans une juridiction, sans révéler tout le contenu de son document d'identité.

Cette promesse est réelle. Elle est aussi plus limitée qu'elle n'en a l'air.

Une preuve à divulgation nulle de connaissance protège une preuve. Elle ne protège pas automatiquement l'adresse IP, l'empreinte du navigateur, le numéro de téléphone, l'adresse e-mail, l'implémentation du portefeuille numérique, l'appareil, le système d'exploitation, ni les nombreux horodatages et signaux comportementaux créés autour de la preuve. Si ces couches ne sont pas conçues avec soin, un vérificateur peut encore apprendre qui est l'utilisateur.

Cet article adapte une [présentation](https://docs.google.com/presentation/d/e/2PACX-1vRKRJW4-ZUHso3o-KzzwemuezH7ifLENCpvJCr9552PlRHzOtyxetsLM-4ghHDwCA/pub?start=false&loop=false&delayms=3000) donnée à [NGI TrustChain](https://trustchain.ngi.eu/) en septembre 2024. L'idée centrale est simple : les ZKP sont une brique importante pour une participation civique respectueuse de la vie privée, mais la vie privée est une propriété de toute la pile technique.

## Pourquoi l'identité entre dans les plateformes civiques

Tous les espaces en ligne n'ont pas besoin de vérification d'identité. Il existe de très bons cas d'usage pour des communautés purement pseudonymes, où les utilisateurs participent avec des pseudonymes persistants et de la réputation plutôt qu'avec des justificatifs formels.

Les plateformes de participation civique font face à un problème différent. Si l'objectif est de recueillir une contribution publique significative, de résister au spam, de réduire la propagande computationnelle ou de soutenir des processus « une personne, une voix », le système a besoin d'une forme de résistance aux attaques Sybil. En pratique, il peut devoir savoir qu'un participant est une personne réelle, appartient à une communauté pertinente ou respecte une règle d'éligibilité civique.

Plusieurs approches existent, chacune avec ses compromis :

- Les systèmes biométriques peuvent fournir l'unicité, mais ils créent de graves risques pour la vie privée et la sécurité.
- Les systèmes de graphe social peuvent aider dans certains contextes, mais ils restent difficiles à passer à l'échelle et offrent souvent de faibles garanties de confidentialité.
- Les approches hybrides de réseau de confiance peuvent fonctionner pour certaines communautés, mais fournissent généralement une unicité plus faible.
- Les justificatifs institutionnels ou gouvernementaux peuvent apporter de fortes garanties, mais ils ne doivent pas devenir une couche de surveillance.

C'est ici que l'identité auto-souveraine et les ZKP deviennent attractives. Elles suggèrent une façon de vérifier l'éligibilité sans demander aux utilisateurs de révéler plus de données personnelles que nécessaire.

## Ce que les preuves à divulgation nulle de connaissance font bien

Dans un parcours simplifié d'utilisation d'un justificatif, trois parties interviennent :

- L'émetteur confirme quelque chose à propos d'une personne et émet un justificatif.
- Le titulaire conserve ce justificatif et décide quand l'utiliser.
- Le vérificateur contrôle une preuve dérivée de ce justificatif.

Les techniques à divulgation nulle de connaissance peuvent permettre au titulaire de prouver une affirmation précise sans révéler le justificatif sous-jacent. Par exemple, un utilisateur peut prouver qu'il a plus de 18 ans sans révéler sa date de naissance, ou prouver qu'il a reçu un justificatif d'un émetteur de confiance sans révéler tout son contenu.

Plusieurs approches techniques soutiennent ce modèle. Les justificatifs BBS+ permettent la divulgation sélective et les preuves non corrélables. D'autres approches utilisent des justificatifs structurés en arbres de Merkle et des ZK-SNARKs pour rendre des formats autrement corrélables plus respectueux de la vie privée. Les zkVM généralistes pourraient à terme faciliter les preuves portant sur des justificatifs déjà existants et orientés sécurité.

Ces outils sont utiles parce qu'ils peuvent empêcher la corrélation par l'émetteur au niveau de la preuve. Autrement dit, l'émetteur ne devrait pas apprendre où le justificatif est utilisé, et différents usages du même justificatif ne devraient pas être trivialement reliés par la preuve elle-même.

Cela résout un problème important. Cela ne résout pas tous les problèmes de vie privée.

## Le modèle de menace : le titulaire d'abord

Pour la participation civique, le modèle de confidentialité doit partir du point de vue du titulaire. La personne qui utilise le justificatif doit garder le contrôle de ce qu'elle révèle et à qui.

Cela exige un modèle de menace plus strict que celui de la plupart des plateformes sociales actuelles :

- Le vérificateur, c'est-à-dire la plateforme qui demande la preuve, ne doit pas être considéré comme digne de confiance aveuglément. Il peut chercher à désanonymiser l'utilisateur, sauf si le système rend cela difficile et auditable.
- L'émetteur est digne de confiance pour identifier le titulaire et émettre un justificatif valide, mais il ne doit pas savoir où, quand ni pourquoi ce justificatif est ensuite utilisé.
- L'émetteur et le vérificateur ne doivent pas pouvoir collaborer pour identifier les utilisateurs à partir des présentations de preuves.
- Le code client propriétaire, le code du portefeuille et les interfaces de vérification doivent être considérés comme des surfaces de risque, sauf s'ils sont open source, inspectables et idéalement audités.

C'est très différent du modèle dominant des réseaux sociaux, où l'on fait habituellement confiance aux plateformes pour collecter, stocker et protéger les données personnelles de façon responsable. L'histoire des plateformes donne aux utilisateurs de nombreuses raisons d'être sceptiques.

## Le reste de l'iceberg de la vie privée

L'erreur la plus facile est de prendre la ZKP pour tout le système de confidentialité. En réalité, la preuve n'est qu'une couche.

### Divulgation excessive

Même lorsqu'une preuve est générée à divulgation nulle de connaissance, le vérificateur peut demander des attributs trop précis, trop nombreux ou trop rares. L'utilisateur ne révèle peut-être pas son document complet, mais une combinaison d'attributs peut encore l'identifier.

Par exemple, prouver un âge précis, une ville, une profession et un statut de membre peut suffire à isoler une personne dans une petite communauté. Les systèmes respectueux de la vie privée doivent privilégier des critères peu précis et la divulgation minimale nécessaire.

### Métadonnées réseau

Un vérificateur peut tenter de relier une preuve à l'utilisateur via les adresses IP, les empreintes du navigateur, les métadonnées de l'appareil ou le moment des requêtes. Si la preuve est envoyée depuis la même session de navigateur qu'une connexion identifiante ou une vérification par e-mail, la confidentialité mathématique de la preuve peut ne plus compter.

Une ZKP ne masque pas automatiquement la couche réseau. La confidentialité du transport, les proxys, les politiques de journalisation et la séparation des sessions comptent aussi.

### Cookies et courtiers de données

Les cookies tiers, scripts d'analyse, identifiants publicitaires et données achetées peuvent tous affaiblir la confidentialité de la preuve. Si un vérificateur intègre du suivi autour du parcours de preuve, il peut corréler une preuve anonyme avec une identité web connue.

Pour une plateforme civique, le parcours de preuve doit éviter entièrement les traceurs tiers. La vie privée ne peut pas dépendre d'un protocole cryptographique pendant que la page divulgue l'identité via une infrastructure web ordinaire.

### E-mail, téléphone et récupération de compte

Les adresses e-mail et numéros de téléphone sont pratiques, mais ce sont aussi de puissants identifiants. Si le vérificateur les associe à une ZKP, la preuve peut devenir une partie d'un profil d'identité plus large.

Cela ne signifie pas qu'une plateforme civique ne peut jamais utiliser l'e-mail ou le téléphone. Cela signifie que ces identifiants doivent être isolés des événements de preuve autant que possible, utilisés seulement quand c'est nécessaire et soumis à des politiques claires de conservation.

### Identifiants permanents

Une ZKP peut encore être corrélée si le même identifiant permanent apparaît autour d'elle. Adresses de portefeuille, DIDs, identifiants du titulaire d'un justificatif, identifiants d'appareil ou identifiants de compte stables peuvent tous devenir des points de corrélation.

Les systèmes qui ont besoin de pseudonymat doivent utiliser des identifiants contextuels ou propres à chaque relation au lieu d'identifiants universels. Par défaut, l'utilisateur ne devrait pas porter la même trace entre espaces civiques sans lien.

### Corrélation temporelle

Même si les identifiants sont cachés, le moment des requêtes peut révéler des relations. Un vérificateur peut corréler le moment où une preuve est générée avec une autre requête, comme une connexion, un clic de notification ou un chargement de page.

Les concepteurs doivent traiter les horodatages comme sensibles. Le traitement par lots, la soumission différée, la minimisation des journaux et la séparation entre authentification et présentation de preuve peuvent réduire le risque de corrélation.

### Portefeuilles, appareils et chaîne d'approvisionnement

La preuve peut être cryptographiquement correcte, mais le portefeuille ou le client peut encore divulguer des données sensibles. Un portefeuille propriétaire peut envoyer de la télémétrie. Un SDK compromis peut révéler des attributs. Une interface malveillante peut demander plus que ce que l'utilisateur comprend.

L'open source ne supprime pas magiquement ces risques, mais le code fermé les rend beaucoup plus difficiles à inspecter. Pour des systèmes civiques de confiance, les clients open source, compilations reproductibles, audits indépendants et télémétrie minimale doivent être considérés comme de l'infrastructure de base.

### Inférence comportementale

L'apprentissage automatique peut inférer l'identité à partir de motifs qui semblent inoffensifs pris isolément. Style d'écriture, horaires d'activité, comportement de l'appareil, habitudes de localisation et historique d'interaction peuvent tous réduire l'ensemble d'anonymat.

C'est une autre raison pour laquelle la vie privée ne peut pas être réduite à la preuve. La participation anonyme exige aussi des choix de produit, de modération et de conservation qui évitent de constituer des dossiers comportementaux inutiles.

## Une meilleure architecture pour des preuves véritablement anonymes

Un parcours d'utilisation de justificatifs respectueux de la vie privée doit être conçu avec l'hypothèse que le vérificateur veut apprendre plus qu'il ne devrait.

Au minimum, une plateforme civique utilisant des ZKP devrait appliquer ces principes :

- Demander la preuve la moins précise qui satisfait l'exigence civique.
- Éviter de combiner présentation de preuve et parcours de compte identifiants.
- Ne pas attacher numéros de téléphone, e-mails, adresses de portefeuille ou DIDs permanents aux événements de preuve sauf nécessité réelle.
- Exclure cookies tiers, outils d'analyse et traceurs du parcours de preuve.
- Minimiser les journaux, en particulier adresses IP, horodatages et métadonnées de requêtes.
- Utiliser des pseudonymes propres à chaque contexte quand une participation persistante est nécessaire.
- Rendre open source et auditables l'interface de vérification, la logique de demande de preuve, les intégrations de portefeuille et les SDK.
- Rendre les demandes de preuve compréhensibles pour les utilisateurs, afin qu'ils voient ce qui est prouvé et ce qui n'est pas révélé.
- Empêcher les rappels vers l'émetteur et autres mécanismes qui lui permettraient d'apprendre où les justificatifs sont utilisés.

Le but n'est pas seulement d'obtenir des preuves anonymes. Le but est un anonymat crédible : un système où les utilisateurs, auditeurs et acteurs de la société civile peuvent vérifier que les promesses de confidentialité correspondent au comportement réel de la plateforme.

## Défis ouverts

Il reste beaucoup de travail difficile.

D'abord, l'expérience utilisateur n'est pas assez bonne. La plupart des personnes ne peuvent pas raisonner sur les schémas de justificatifs, la divulgation sélective, les demandes de preuve, l'impossibilité de corrélation par l'émetteur ou les attaques par corrélation. Un produit sûr doit expliquer ses propriétés de confidentialité sans demander aux utilisateurs de devenir cryptographes.

Ensuite, l'écosystème des justificatifs est fragmenté. BBS+, SD-JWT, permis de conduire mobiles, puces de passeport, justificatifs structurés en arbres de Merkle et preuves basées sur zkVM font tous des compromis différents. Les plateformes civiques ont besoin d'interopérabilité sans se rabattre sur le plus petit dénominateur commun de la vie privée.

Troisièmement, la résistance aux attaques Sybil et la vie privée restent en tension. Une unicité plus forte exige souvent une preuve d'identité plus forte. Le défi consiste à vérifier seulement ce qui est nécessaire et à éviter que cette vérification devienne un graphe d'identité généralisé.

Quatrièmement, la prévention des abus ne doit pas recréer la surveillance. Les espaces anonymes ou pseudonymes ont tout de même besoin de modération, de limites de fréquence et de mécanismes de responsabilité. Ces mécanismes doivent être conçus pour ne pas réidentifier silencieusement tout le monde.

Enfin, l'open source est nécessaire mais pas suffisant. Le code publié aide, mais les utilisateurs ont aussi besoin de compilations reproductibles, d'audits indépendants, d'une gouvernance claire et de garanties au déploiement que le code inspecté est bien celui qui est utilisé.

## Conclusion

Les ZKP sont puissantes. Elles permettent de prouver des faits sans révéler les données sous-jacentes et peuvent empêcher les émetteurs de suivre l'usage des justificatifs.

Mais les preuves ne sont pas tout le système de confidentialité. Un vérificateur peut encore attaquer les couches voisines : attributs, métadonnées, cookies, e-mail, téléphone, identifiants permanents, moment des requêtes, portefeuilles, appareils et comportements.

Pour les technologies civiques, cette distinction est essentielle. Si l'identité numérique devient une partie de la participation publique, elle ne doit pas devenir une nouvelle façon de surveiller les citoyens. Les ZKP peuvent faire partie de la réponse, mais seulement dans une architecture plus large fondée sur la minimisation des données, l'impossibilité de corrélation, l'auditabilité du code open source et le contrôle par l'utilisateur.

La leçon pratique est claire : utilisez les ZKP, mais ne vous arrêtez pas là.

## Pour aller plus loin

- [Présentation originale](https://docs.google.com/presentation/d/e/2PACX-1vRKRJW4-ZUHso3o-KzzwemuezH7ifLENCpvJCr9552PlRHzOtyxetsLM-4ghHDwCA/pub?start=false&loop=false&delayms=3000)
- [Présentation BBS+ au NIST](https://csrc.nist.gov/csrc/media/presentations/2023/crclub-2023-10-18/images-media/20231018-crypto-club--greg-and-vasilis--slides--BBS.pdf)
- [Documentation Iden3 sur les arbres de Merkle](https://docs.iden3.io/basics/key-concepts/#why-do-we-use-merkle-trees-at-iden3)

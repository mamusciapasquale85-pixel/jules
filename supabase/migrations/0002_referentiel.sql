-- Jules — migration 0002 : chargement du référentiel « Nos compétences »
-- Source : document de l'école (competences_valo.pdf), 4 domaines, 20 compétences.
-- Les libellés des comportements reprennent le texte du document, au « je ».
-- gravite_defaut : 1 = courant, 2 = sérieux, 3 = grave. grave = envoi immédiat aux parents.

-- ---------------------------------------------------------------------------
-- Domaines
-- ---------------------------------------------------------------------------
insert into public.domaines (code, libelle, ordre) values
  ('T', 'Job élève — rapport au travail', 1),
  ('C', 'Job élève — respect du cadre', 2),
  ('R', 'Comportements citoyens — respect des autres', 3),
  ('O', 'Comportements citoyens — ouverture aux autres', 4);

-- ---------------------------------------------------------------------------
-- Compétences
-- ---------------------------------------------------------------------------
insert into public.competences (code, domaine_id, libelle, ordre)
select v.code, d.id, v.libelle, v.ordre
from (values
  ('T1', 'T', 'Je suis en ordre', 1),
  ('T2', 'T', 'J''ai mon matériel', 2),
  ('T3', 'T', 'Je participe positivement', 3),
  ('T4', 'T', 'Je suis à jour dans mes tâches', 4),
  ('T5', 'T', 'Je développe mes capacités d''autonomie', 5),
  ('T6', 'T', 'J''adopte un comportement adéquat en atelier', 6),
  ('C1', 'C', 'J''utilise le langage adéquat', 7),
  ('C2', 'C', 'Je me déplace calmement dans l''école', 8),
  ('C3', 'C', 'Je suis ponctuel(le)', 9),
  ('C4', 'C', 'J''évite les jeux violents', 10),
  ('C5', 'C', 'Je respecte les règles concernant les écrans', 11),
  ('C6', 'C', 'Je suis au bon endroit au bon moment', 12),
  ('R1', 'R', 'Je communique sans violence verbale', 13),
  ('R2', 'R', 'Je respecte le matériel et notre milieu de vie', 14),
  ('R3', 'R', 'Je respecte le travail des autres', 15),
  ('R4', 'R', 'Je règle mes problèmes sans violence physique', 16),
  ('O1', 'O', 'J''écoute les autres', 17),
  ('O2', 'O', 'Je travaille bien en équipe', 18),
  ('O3', 'O', 'J''aide les autres', 19),
  ('O4', 'O', 'Je respecte nos différences', 20)
) as v(code, domaine, libelle, ordre)
join public.domaines d on d.code = v.domaine;

-- ---------------------------------------------------------------------------
-- Comportements observables
-- ---------------------------------------------------------------------------
insert into public.comportements (competence_id, libelle, sens_possible, gravite_defaut, grave, ordre)
select c.id, v.libelle, v.sens::public.sens_possible, v.gravite, v.grave, v.ordre
from (values
  -- T1 Je suis en ordre
  ('T1', 'Mes feuilles de cours sont complètes', 'les_deux', 1, false, 1),
  ('T1', 'Mes feuilles de cours sont rangées dans l''ordre', 'les_deux', 1, false, 2),
  ('T1', 'Mes feuilles de cours sont rangées à l''endroit adéquat', 'les_deux', 1, false, 3),
  ('T1', 'Mon JDA est complété', 'les_deux', 1, false, 4),
  ('T1', 'Mon JDA est signé par mes parents ou responsables légaux', 'les_deux', 1, false, 5),
  ('T1', 'J''ai la bonne farde pour chaque heure de cours', 'les_deux', 1, false, 6),
  -- T2 J'ai mon matériel
  ('T2', 'Mon matériel est complet', 'les_deux', 1, false, 1),
  ('T2', 'Je me munis du matériel adéquat pour chaque heure de cours', 'les_deux', 1, false, 2),
  -- T3 Je participe positivement
  ('T3', 'Je respecte le code couleur lorsqu''il est en application', 'les_deux', 1, false, 1),
  ('T3', 'Je lève la main pour demander la parole et j''attends en silence', 'les_deux', 1, false, 2),
  ('T3', 'Je pose des questions en rapport avec la matière vue', 'les_deux', 1, false, 3),
  ('T3', 'J''évite les questions hors-sujet qui perturbent ou ralentissent le cours', 'les_deux', 1, false, 4),
  ('T3', 'J''écoute les réponses des autres pour apprendre et éviter les répétitions', 'les_deux', 1, false, 5),
  ('T3', 'Je vais voir l''enseignant(e) en fin de cours pour les questions d''ordre personnel', 'les_deux', 1, false, 6),
  -- T4 Je suis à jour dans mes tâches
  ('T4', 'Je rends mes travaux, soignés, aux échéances données', 'les_deux', 1, false, 1),
  ('T4', 'J''écris ou copie ce qui doit l''être au moment demandé', 'les_deux', 1, false, 2),
  ('T4', 'Mon JDA est signé', 'les_deux', 1, false, 3),
  -- T5 Je développe mes capacités d'autonomie
  ('T5', 'Je me mets en disposition de travailler dès que j''entre en classe', 'les_deux', 1, false, 1),
  ('T5', 'Je sors mon matériel avant de m''asseoir', 'les_deux', 1, false, 2),
  ('T5', 'Je m''assure d''avoir bien compris la matière en posant les questions nécessaires', 'les_deux', 1, false, 3),
  ('T5', 'Je me remets en ordre dès que possible après une absence ou une farde manquante', 'les_deux', 1, false, 4),
  ('T5', 'Je m''organise pour mener à bien les travaux demandés dans les temps (TA, fourches, domicile)', 'les_deux', 1, false, 5),
  -- T6 J'adopte un comportement adéquat en atelier
  ('T6', 'J''ai compris le principe des ateliers : découvrir, essayer, aimer ou détester, argumenter', 'les_deux', 1, false, 1),
  ('T6', 'Je suis investi(e) dans la production finale de mon atelier', 'les_deux', 1, false, 2),
  ('T6', 'Ce que je dis ou fais influe positivement sur le déroulement de l''atelier', 'les_deux', 1, false, 3),
  ('T6', 'Je m''exprime avec un langage courtois en atelier', 'les_deux', 1, false, 4),
  ('T6', 'Je suis physiquement présent(e) à tout l''atelier', 'les_deux', 1, false, 5),
  -- C1 J'utilise le langage adéquat
  ('C1', 'Je parle en français et en néerlandais en classe et lorsque je m''adresse aux adultes', 'les_deux', 1, false, 1),
  ('C1', 'Je m''adresse aux autres avec des phrases complètes et correctes', 'les_deux', 1, false, 2),
  ('C1', 'J''emploie des mots compréhensibles par tous', 'les_deux', 1, false, 3),
  ('C1', 'Je m''assure d''avoir été compris(e) et je reformule si nécessaire', 'les_deux', 1, false, 4),
  -- C2 Je me déplace calmement dans l'école
  ('C2', 'J''évite de courir dans les couloirs', 'les_deux', 1, false, 1),
  ('C2', 'Je m''abstiens de crier dans les bâtiments, surtout quand d''autres sont en cours', 'les_deux', 1, false, 2),
  ('C2', 'Je me déplace vers la personne à qui je parle, à une distance correcte', 'les_deux', 1, false, 3),
  ('C2', 'Je veille au bien-être de tous en évitant de bousculer les autres', 'les_deux', 2, false, 4),
  -- C3 Je suis ponctuel(le)
  ('C3', 'Je me rends là où je dois, dans les temps, y compris dans les rangs', 'les_deux', 1, false, 1),
  ('C3', 'Je m''organise et j''anticipe pour éviter de devoir courir', 'les_deux', 1, false, 2),
  ('C3', 'En cas de retard, je me présente à la personne adéquate et je donne une raison pertinente', 'les_deux', 1, false, 3),
  ('C3', 'J''arrive en retard après la récréation', 'a_ameliorer', 1, false, 4),
  ('C3', 'J''arrive en retard le matin', 'a_ameliorer', 1, false, 5),
  -- C4 J'évite les jeux violents
  ('C4', 'Je suis conscient(e) qu''un jeu violent peut vite déraper', 'les_deux', 2, false, 1),
  ('C4', 'Je trouve des manières de m''amuser sans passer par la violence, même consentie', 'les_deux', 2, false, 2),
  -- C5 Je respecte les règles concernant les écrans
  ('C5', 'J''éteins et je range mon téléphone à mon rang avant de me rendre en classe', 'les_deux', 1, false, 1),
  ('C5', 'Je laisse mon téléphone dans mon sac en classe et en studio', 'les_deux', 1, false, 2),
  ('C5', 'J''emploie mon téléphone uniquement avec l''accord de l''équipe éducative, pour mes apprentissages', 'les_deux', 1, false, 3),
  ('C5', 'En cas de transgression, je remets mon téléphone à l''adulte responsable sans négociation', 'les_deux', 2, false, 4),
  -- C6 Je suis au bon endroit au bon moment
  ('C6', 'Je respecte les limites de l''enceinte scolaire', 'les_deux', 2, false, 1),
  ('C6', 'J''anticipe et je m''organise pour être là où je dois, selon mon horaire ou les changements', 'les_deux', 1, false, 2),
  ('C6', 'Je reste dans le rang jusqu''à la classe', 'les_deux', 1, false, 3),
  ('C6', 'Je monte et je descends du bon côté et j''utilise les bons escaliers', 'les_deux', 1, false, 4),
  ('C6', 'Pour les licenciements, seule la parole de mon éducateur(rice), d''une personne déléguée ou de la direction est valable', 'les_deux', 1, false, 5),
  -- R1 Je communique sans violence verbale
  ('R1', 'Je respecte l''intégrité verbale de l''autre et la mienne', 'les_deux', 2, false, 1),
  ('R1', 'J''évite les mots qui blessent : moqueries, insultes, piques, mise au défi', 'les_deux', 2, false, 2),
  ('R1', 'Je demande les choses correctement, sans donner d''ordres aux autres', 'les_deux', 1, false, 3),
  ('R1', 'Je parle sans agressivité', 'les_deux', 2, false, 4),
  ('R1', 'Je formule des messages clairs pour dire ce qui me met en colère ou ce qui m''a blessé(e)', 'les_deux', 1, false, 5),
  ('R1', 'J''évite les paroles dénigrantes ou discriminantes (racisme, sexisme, homophobie…)', 'les_deux', 3, true, 6),
  -- R2 Je respecte le matériel et notre milieu de vie
  ('R2', 'Je prends soin du matériel mis à ma disposition, et du mien', 'les_deux', 1, false, 1),
  ('R2', 'Je laisse mon banc et ses environs propres et sans dommage', 'les_deux', 1, false, 2),
  ('R2', 'J''évite de laisser des déchets au sol ou sur les surfaces de travail', 'les_deux', 1, false, 3),
  ('R2', 'Je respecte la propreté de la cour, des toilettes, des couloirs, du studio et des classes', 'les_deux', 1, false, 4),
  ('R2', 'Je demande la permission avant d''ouvrir la porte d''une classe ou de toucher au matériel de l''enseignant(e)', 'les_deux', 1, false, 5),
  ('R2', 'Je demande la permission avant de toucher au matériel d''un(e) camarade', 'les_deux', 1, false, 6),
  ('R2', 'Je ne lance rien en classe', 'les_deux', 2, false, 7),
  -- R3 Je respecte le travail des autres
  ('R3', 'Je laisse les autres travailler, même si j''ai terminé mon travail durant le TA', 'les_deux', 1, false, 1),
  ('R3', 'Si j''ai fini, je demande du dépassement ou je m''occupe dans le calme', 'les_deux', 1, false, 2),
  ('R3', 'Je laisse parler la personne qui donne une réponse, sans interruption ni commentaires', 'les_deux', 1, false, 3),
  ('R3', 'Je respecte les règles concernant le bavardage et le silence', 'les_deux', 1, false, 4),
  ('R3', 'En cas de licenciement, je reste à l''écart des classes où mes camarades travaillent', 'les_deux', 1, false, 5),
  ('R3', 'Je considère avec bienveillance le travail des autres', 'les_deux', 1, false, 6),
  -- R4 Je règle mes problèmes sans violence physique
  ('R4', 'Je respecte le corps de l''autre et le mien', 'les_deux', 3, true, 1),
  ('R4', 'Je suis capable de mettre mes limites sans violence physique et je respecte celles de l''autre', 'les_deux', 3, true, 2),
  ('R4', 'Je formule des messages clairs et adéquats face à une situation conflictuelle', 'les_deux', 1, false, 3),
  ('R4', 'Je sais que tout contact physique non sollicité est interdit (consentement)', 'les_deux', 3, true, 4),
  ('R4', 'J''assume les conséquences de mes actes et de mes gestes', 'les_deux', 1, false, 5),
  -- O1 J'écoute les autres
  ('O1', 'Je prends soin de la parole des autres et de la mienne', 'les_deux', 1, false, 1),
  ('O1', 'Je laisse parler la personne qui a la parole, sans l''interrompre ni faire de commentaires', 'les_deux', 1, false, 2),
  ('O1', 'Je demande la parole pour réagir à celle des autres', 'les_deux', 1, false, 3),
  ('O1', 'Je laisse les personnes terminer leur intervention avant de demander la parole', 'les_deux', 1, false, 4),
  ('O1', 'Je m''assure d''avoir compris ce que l''autre a voulu dire avant de réagir', 'les_deux', 1, false, 5),
  ('O1', 'Je suis attentif(ve) aux remarques qui me sont formulées et je respecte les limites des autres', 'les_deux', 1, false, 6),
  -- O2 Je travaille bien en équipe
  ('O2', 'Je sais tenir un rôle au sein d''un travail d''équipe', 'les_deux', 1, false, 1),
  ('O2', 'Je fais ma part et je m''assure que les autres en font de même, sans agressivité', 'les_deux', 1, false, 2),
  ('O2', 'Je tiens les membres de mon équipe informés de mon avancement', 'les_deux', 1, false, 3),
  ('O2', 'Je réfléchis à la meilleure manière d''avancer en équipe', 'les_deux', 1, false, 4),
  ('O2', 'Je soutiens les membres de mon équipe qui ont plus de difficultés', 'les_deux', 1, false, 5),
  -- O3 J'aide les autres
  ('O3', 'Je fais profiter les autres de mes forces dans certaines matières ou dans la vie de l''école', 'positif', 1, false, 1),
  ('O3', 'Je viens en aide aux personnes en difficulté, en cours ou dans l''école', 'positif', 1, false, 2),
  ('O3', 'J''interviens quand une personne subit des moqueries et j''en informe l''équipe éducative', 'positif', 1, false, 3),
  -- O4 Je respecte nos différences
  ('O4', 'Je suis conscient(e) que nous sommes tous uniques et singuliers', 'les_deux', 1, false, 1),
  ('O4', 'Je respecte les idées des autres et leurs particularités physiques', 'les_deux', 2, false, 2),
  ('O4', 'Je fais preuve de tolérance face aux différences, même quand je ne comprends pas', 'les_deux', 2, false, 3),
  ('O4', 'Je pose les questions nécessaires à la compréhension', 'les_deux', 1, false, 4),
  ('O4', 'Je formule mes remarques en « je », de manière bienveillante, et j''en appelle à l''adulte en cas de conflit', 'les_deux', 1, false, 5),
  ('O4', 'Je tiens des propos dénigrants (racistes, xénophobes, homophobes, transphobes, antisémites, islamophobes, validistes, grossophobes, pauvrophobes…)', 'a_ameliorer', 3, true, 6)
) as v(competence, libelle, sens, gravite, grave, ordre)
join public.competences c on c.code = v.competence;

-- ---------------------------------------------------------------------------
-- Règles d'alerte (seuils proposés, à régler pendant le pilote)
-- ---------------------------------------------------------------------------
insert into public.regles_alerte (code, libelle, competence_id, sens, seuil, fenetre_jours)
select v.code, v.libelle, c.id, v.sens::public.sens_observation, v.seuil, v.fenetre
from (values
  ('retards',   '3 retards en 10 jours',                   'C3', 'a_ameliorer', 3, 10),
  ('violence_verbale', '2 faits de violence verbale en 7 jours', 'R1', 'a_ameliorer', 2, 7),
  ('ecrans',    '2 téléphones remis en 7 jours',           'C5', 'a_ameliorer', 2, 7),
  ('materiel',  '3 manquements matériel ou JDA en 10 jours', 'T2', 'a_ameliorer', 3, 10)
) as v(code, libelle, competence, sens, seuil, fenetre)
join public.competences c on c.code = v.competence;

-- Règle sans compétence : aucune observation positive depuis 21 jours.
insert into public.regles_alerte (code, libelle, competence_id, sens, seuil, fenetre_jours)
values ('silence_positif', 'Aucune observation positive depuis 3 semaines', null, 'positif', 0, 21);

# Feature Specification: Validation des observations par l'éducateur

**Feature Branch**: `test/spec-kit`

**Created**: 2026-11-15

**Status**: Draft

**Input**: User description: "Validation des observations par l'éducateur. Aucune observation ne doit être visible par les parents tant qu'un éducateur ne l'a pas validée. L'éducateur voit la file des observations en attente (toutes classes), filtre, valide (une ou plusieurs), refuse avec motif, voit le nombre en attente. Le prof voit le statut de ses observations. Les faits graves ne passent pas par la file. Hors périmètre : espace parent, espace élève, notifications, résumé horaire."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Valider les observations en attente (Priority: P1)

L'éducateur ouvre la file des observations en attente, toutes classes confondues, de la plus
ancienne à la plus récente. Pour chaque observation il voit l'élève, la classe, le prof, le
comportement, le sens (positif ou négatif), le commentaire et la date. Il valide une
observation, ou en coche plusieurs et les valide d'un coup.

**Why this priority**: c'est le cœur du besoin. Sans validation, aucune observation ne peut
devenir visible par les parents, et l'espace parent ne peut pas être ouvert.

**Independent Test**: un prof encode trois observations ; l'éducateur les retrouve dans la
file, en valide une seule, puis les deux autres ensemble ; la file est vide et les trois
observations portent le statut « validée » avec le nom de l'éducateur et la date.

**Acceptance Scenarios**:

1. **Given** des observations en attente dans plusieurs classes, **When** l'éducateur ouvre
   la file, **Then** il les voit toutes, de la plus ancienne à la plus récente, avec élève,
   classe, prof, comportement, sens, commentaire et date.
2. **Given** une observation en attente, **When** l'éducateur la valide, **Then** elle quitte
   la file et garde la trace de qui l'a validée et quand.
3. **Given** plusieurs observations cochées, **When** l'éducateur clique sur « Valider la
   sélection », **Then** toutes sont validées en une seule action.
4. **Given** une observation qui n'a pas été validée, **When** on cherche ce qui est visible
   par les parents, **Then** elle n'y figure pas.

---

### User Story 2 - Refuser une observation avec un motif (Priority: P2)

L'éducateur refuse une observation qu'il juge erronée ou inappropriée. Il doit écrire un
motif. L'observation refusée n'est jamais visible par les parents.

**Why this priority**: sans refus, l'éducateur ne peut que valider ou laisser traîner ; la
validation ne serait pas un vrai contrôle.

**Independent Test**: l'éducateur refuse une observation sans motif (refusé par le système),
puis avec un motif ; l'observation quitte la file avec le statut « refusée », le motif,
l'auteur et la date du refus.

**Acceptance Scenarios**:

1. **Given** une observation en attente, **When** l'éducateur la refuse en écrivant un motif,
   **Then** elle quitte la file avec le statut « refusée », le motif, l'auteur et la date.
2. **Given** une observation en attente, **When** l'éducateur tente de la refuser sans motif,
   **Then** le refus est bloqué et un message demande le motif.
3. **Given** une observation refusée, **When** on cherche ce qui est visible par les parents,
   **Then** elle n'y figure pas.

---

### User Story 3 - Le prof suit le statut de ses observations (Priority: P2)

Le prof voit, pour chacune de ses observations, si elle est en attente, validée ou refusée.
En cas de refus, il lit le motif.

**Why this priority**: le prof doit savoir ce que devient ce qu'il encode, surtout en cas de
refus, sinon il réencode ou perd confiance dans l'outil.

**Independent Test**: un prof encode deux observations ; l'éducateur en valide une et refuse
l'autre ; le prof voit « validée » sur la première et « refusée » avec le motif sur la
seconde.

**Acceptance Scenarios**:

1. **Given** une observation que le prof vient d'encoder, **When** il consulte ses
   observations, **Then** elle porte le statut « en attente ».
2. **Given** une observation refusée, **When** le prof la consulte, **Then** il voit le
   statut « refusée » et le motif.
3. **Given** deux profs, **When** l'un consulte ses observations, **Then** il ne voit pas le
   statut ni le motif des observations de l'autre par ce biais.

---

### User Story 4 - Filtrer la file et voir le nombre en attente (Priority: P3)

L'éducateur filtre la file par classe et par élève, et voit en permanence combien
d'observations attendent une validation.

**Why this priority**: confort de travail. Avec 279 élèves et 15 classes la file peut être
longue, mais elle reste utilisable sans filtre.

**Independent Test**: avec des observations en attente dans deux classes, l'éducateur filtre
sur une classe et ne voit que celles-ci ; le compteur affiche le total en attente et diminue
après chaque validation ou refus.

**Acceptance Scenarios**:

1. **Given** des observations en attente dans plusieurs classes, **When** l'éducateur filtre
   sur une classe, **Then** seules les observations de cette classe sont affichées.
2. **Given** un filtre sur un élève, **When** l'éducateur l'applique, **Then** seules les
   observations de cet élève sont affichées.
3. **Given** 12 observations en attente, **When** l'éducateur en valide 3, **Then** le
   compteur passe de 12 à 9.

---

### User Story 5 - Les faits graves contournent la file (Priority: P1)

Une observation liée à un comportement marqué « grave » n'entre pas dans la file de
validation : elle est transmise immédiatement et c'est la direction qui tranche.

**Why this priority**: un fait grave ne peut pas attendre qu'un éducateur vide sa file. Si
cette exception est mal faite, un fait grave pourrait rester bloqué.

**Independent Test**: un prof encode une observation sur un comportement grave ; elle
n'apparaît pas dans la file de l'éducateur et n'augmente pas le compteur.

**Acceptance Scenarios**:

1. **Given** un comportement marqué grave, **When** un prof encode une observation dessus,
   **Then** elle n'apparaît pas dans la file de validation et n'est pas comptée en attente.
2. **Given** la direction retire un comportement de la liste des graves, **When** un prof
   encode ensuite une observation dessus, **Then** elle passe par la file normale.

---

### Edge Cases

- Deux éducateurs traitent la même observation en même temps : la première décision
  l'emporte, le second est prévenu que l'observation a déjà été traitée.
- Validation en lot dont une observation a été traitée entre-temps : les autres sont
  validées, l'éducateur est informé de celle qui ne l'a pas été.
- L'éducateur est aussi l'auteur de l'observation (il peut encoder) : il peut la valider
  lui-même (voir Assumptions).
- Un comportement devient grave alors que des observations dessus sont déjà en attente :
  elles restent dans la file ; la règle ne s'applique qu'aux nouvelles observations.
- Un élève change de classe : l'observation affiche la classe actuelle de l'élève.
- La file est vide : un message l'indique, le compteur affiche 0.
- Une décision prise par erreur : elle ne peut pas être annulée dans cette version (voir
  Assumptions).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Toute nouvelle observation non grave DOIT être créée avec le statut
  « en attente ».
- **FR-002**: Une observation NE DOIT être visible par les parents que si elle est validée.
  Cette règle DOIT être garantie au niveau des données, pas seulement à l'affichage, pour
  que l'espace parent (à construire) ne puisse pas la contourner.
- **FR-003**: L'éducateur DOIT voir la liste des observations en attente de toutes les
  classes, triée de la plus ancienne à la plus récente, avec : élève, classe, prof,
  comportement, sens (positif/négatif), commentaire, date.
- **FR-004**: L'éducateur DOIT pouvoir filtrer cette liste par classe et par élève.
- **FR-005**: L'éducateur DOIT pouvoir valider une observation, ou plusieurs en une action.
- **FR-006**: L'éducateur DOIT pouvoir refuser une observation ; un motif écrit est
  obligatoire.
- **FR-007**: L'éducateur DOIT voir le nombre d'observations en attente.
- **FR-008**: Seuls les éducateurs et les admins PEUVENT valider ou refuser. Un prof sans
  rôle éducateur ni admin, un parent ou un élève NE DOIT PAS pouvoir le faire, même en
  contournant l'interface.
- **FR-009**: Chaque décision DOIT garder la trace de qui l'a prise et quand.
- **FR-010**: Le prof DOIT voir le statut de chacune de ses observations (en attente,
  validée, refusée) et, en cas de refus, le motif.
- **FR-011**: Une observation liée à un comportement marqué grave NE DOIT PAS entrer dans la
  file de validation. Le caractère grave DOIT venir de la liste tenue par la direction, pas
  d'une liste figée dans l'application.
- **FR-012**: Les observations existantes au moment de la mise en service DOIVENT être
  considérées comme en attente.
- **FR-013**: Une observation déjà validée ou refusée NE DOIT PAS pouvoir être décidée une
  seconde fois.
- **FR-014**: Tous les libellés DOIVENT être en français (« en attente », « validée »,
  « refusée »).
- **FR-015**: Les niveaux par compétence et le rapport final NE DOIVENT compter que les
  observations validées. Les observations en attente ou refusées n'entrent dans aucun calcul.
- **FR-016**: Le motif de refus et la trace de décision DOIVENT être conservés pendant une
  durée à fixer avec la direction (point ouvert, voir Assumptions). Tant qu'elle n'est pas
  fixée, aucune suppression automatique n'est mise en place.

### Key Entities

- **Observation** : fait positif ou négatif encodé par un adulte sur un élève, rattaché à un
  comportement du référentiel. Reçoit un statut (en attente, validée, refusée), l'auteur et
  la date de la décision, et un motif en cas de refus.
- **Comportement** : élément du référentiel « Nos compétences » (95 comportements). Peut être
  marqué grave par la direction.
- **Éducateur / Admin** : adultes habilités à valider ou refuser. Dans la spec, « l'éducateur »
  désigne toute personne ayant l'un de ces deux rôles.
- **Prof** : adulte qui encode des observations et suit leur statut.

### Données personnelles (constitution, principe II)

- **Finalité** : contrôler les observations comportementales avant qu'elles soient
  communiquées aux familles, et garder la trace de ce contrôle.
- **Données ajoutées** : statut de l'observation, identité de l'éducateur qui décide, date
  de la décision, motif de refus (texte libre pouvant mentionner un élève).
- **Durée de conservation** : à fixer avec la direction (point ouvert, FR-016).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0 observation non validée visible par un parent, vérifié par un test pour
  chaque rôle.
- **SC-002**: 0 décision possible par un rôle autre qu'éducateur ou admin, vérifié par un test pour
  chaque rôle.
- **SC-003**: Un éducateur valide 20 observations en moins d'une minute grâce à la
  validation en lot.
- **SC-004**: 100 % des observations décidées portent l'auteur et la date de la décision ;
  100 % des refus portent un motif.
- **SC-005**: Un prof retrouve le statut d'une de ses observations en moins de 30 secondes.
- **SC-006**: 0 observation sur un comportement grave dans la file de validation.

## Assumptions

- Point ouvert : la durée de conservation du motif de refus et de la trace de décision
  reste à fixer avec la direction (responsable des données) avant la mise en service.
- Tant que l'éducateur n'a rien validé, les niveaux et le rapport final d'un élève sont
  vides : c'est le comportement voulu (FR-015).
- Une observation refusée est conservée (pas supprimée) et n'est jamais visible par les
  parents. Le prof ne peut pas la corriger ; il en encode une nouvelle s'il le faut.
- L'éducateur ne modifie pas le contenu d'une observation : il valide ou refuse.
- Une décision est définitive dans cette version (pas d'annulation).
- Un éducateur ou un admin peut valider une observation qu'il a lui-même encodée (cas d'un
  compte prof + admin).
- Les élèves suivront la même règle que les parents (ne voir que le validé) ; ce point sera
  confirmé dans la spec de l'espace élève.
- Le traitement des faits graves par la direction (transmission immédiate, décision) fait
  l'objet d'une autre fonctionnalité ; ici on garantit seulement qu'ils n'entrent pas dans
  la file.
- La base contient 0 observation au 08/11/2026 : la reprise des observations existantes
  (FR-012) ne devrait concerner que peu ou pas de lignes.
- Hors périmètre : espace parent, espace élève, notifications, résumé horaire.
- Dépendances : rôles existants (prof, éducateur, admin, direction), référentiel et liste
  des comportements graves, espace éducateur existant.

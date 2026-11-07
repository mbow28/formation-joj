# 001 — Bénévoles : ouvrir un créneau et s'y inscrire

**Statut** : Validée
**PRD** : specs/prd-benevoles.md, TR1

## Contexte

Les responsables de discipline tiennent les inscriptions des bénévoles d'accueil sur papier, et des créneaux se retrouvent avec plus de bénévoles que de places. Cette première tranche rend le débordement impossible : un créneau a une capacité, et l'application refuse l'inscription de trop.

## User stories

- En tant que responsable de discipline, je veux ouvrir un créneau d'accueil avec une capacité, afin de dire combien de bénévoles il me faut.
- En tant que bénévole, je veux m'inscrire à un créneau qui a encore de la place, afin d'accueillir le public de cette discipline.

## Scénarios d'acceptation

### AS1 — Ouvrir un créneau

- **Étant donné** la discipline « Lutte » · **Quand** le responsable ouvre un créneau le 3 novembre 2026 de 9 h à 12 h, avec une capacité de 2 · **Alors** le créneau est enregistré pour « Lutte » avec ces horaires, une capacité de 2 et 0 inscrit.

### AS2 — Créneau invalide

- **Étant donné** une capacité de 0, négative ou non entière, ou une heure de fin égale ou antérieure à l'heure de début · **Quand** le responsable ouvre le créneau · **Alors** refus 400, code VALIDATION_FAILED, la réponse nomme le champ en cause, et aucun créneau n'est enregistré. Une capacité de 1 est acceptée.

### AS3 — Discipline introuvable

- **Étant donné** une discipline qui n'existe pas · **Quand** le responsable y ouvre un créneau · **Alors** refus 404, code DISCIPLINE_NOT_FOUND, et aucun créneau n'est enregistré.

### AS4 — S'inscrire à un créneau

- **Étant donné** un créneau de capacité 2 sans inscrit · **Quand** Awa Diop (awa.diop@example.sn) s'y inscrit · **Alors** l'inscription est enregistrée avec son nom et son email, et le créneau compte 1 inscrit sur 2.

### AS5 — Inscription incomplète

- **Étant donné** un créneau qui a de la place · **Quand** un bénévole s'inscrit avec un nom vide ou fait d'espaces, ou un email mal formé · **Alors** refus 400, code VALIDATION_FAILED, la réponse nomme le champ en cause, et le nombre d'inscrits ne change pas.

### AS6 — Créneau complet

- **Étant donné** un créneau de capacité 2 qui a déjà 2 inscrits · **Quand** un troisième bénévole s'y inscrit · **Alors** refus 409, code SLOT_FULL, et le créneau compte toujours 2 inscrits. Le deuxième inscrit, qui prend la dernière place, est accepté ; sur un créneau de capacité 1, le deuxième est refusé (409, SLOT_FULL).

### AS7 — Créneau introuvable

- **Étant donné** un créneau qui n'existe pas · **Quand** un bénévole s'y inscrit · **Alors** refus 404, code SLOT_NOT_FOUND, et aucune inscription n'est enregistrée.

## Hors périmètre

- Consulter un créneau et la liste de ses inscrits (TR2).
- Refuser qu'un même email s'inscrive deux fois au même créneau (TR2) : dans cette tranche, c'est accepté.
- Se désinscrire, et tout écran (TR3) : cette tranche s'utilise par l'API.
- Modifier ou supprimer un créneau, les emails de confirmation, les comptes et la vérification du rôle de responsable.

## Questions ouvertes

- Ce qu'on saisit pour un créneau : hypothèse retenue, une discipline, une date avec une heure de début et une heure de fin, et une capacité.
- Créneaux qui se chevauchent dans une même discipline : hypothèse retenue, acceptés.
- Créneau dans le passé : hypothèse retenue, accepté (la tranche ne fixe pas de règle de date).
- Deux inscriptions simultanées pour la dernière place (risque du PRD) : hypothèse retenue, une seule est acceptée ; le plan dit comment c'est garanti.

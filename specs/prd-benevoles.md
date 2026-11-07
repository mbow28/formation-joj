# PRD — Bénévoles

**Statut** : Validé

## Problème

Chaque discipline a besoin de bénévoles pour accueillir le public. Les responsables de discipline gèrent aujourd'hui les inscriptions sur papier, sans voir en temps réel qui est inscrit : des créneaux débordent, avec plus de bénévoles que de places.

## Utilisateurs

- Responsable de discipline : ouvrir des créneaux d'accueil et savoir qui y est inscrit.
- Bénévole : s'inscrire à un créneau qui a encore de la place, et s'en retirer s'il ne peut plus venir.

## Proposition

Le responsable ouvre un créneau avec une capacité ; les bénévoles s'y inscrivent. L'application compte les inscrits et refuse toute inscription au-delà de la capacité : le débordement devient impossible, au lieu d'être découvert le jour même comme avec le papier.

## Mesure du succès

Pendant la démo, un créneau de capacité 2 accepte deux bénévoles et refuse le troisième, avec un message qui dit que le créneau est complet.

## Tranches

### TR1 — Ouvrir un créneau et s'y inscrire

Le responsable ouvre un créneau avec une capacité ; un bénévole s'y inscrit. Règle : jamais plus d'inscrits que la capacité.

### TR2 — Consulter un créneau et ses inscrits

Le responsable voit un créneau, sa capacité et la liste de ses inscrits. Règle : un même email ne peut pas s'inscrire deux fois au même créneau.

### TR3 — Se désinscrire, et l'écran du créneau

Un bénévole se désinscrit, ce qui libère une place. Un écran permet de voir un créneau, de s'y inscrire et de s'en désinscrire.

## Hors périmètre

- La modification ou la suppression d'un créneau.
- Les emails de confirmation.
- Les comptes des bénévoles.

## Hypothèses et risques

- Hypothèse : un bénévole est identifié par son nom et son email, sans compte ; si c'est faux, n'importe qui peut désinscrire quelqu'un d'autre en connaissant son email.
- Hypothèse : un créneau appartient à une discipline et a une date, une heure de début et de fin ; non dit dans la demande.
- Hypothèse : n'importe qui peut ouvrir un créneau tant qu'il n'y a pas de comptes ; le rôle de responsable n'est pas vérifié.
- Risque : deux inscriptions simultanées à la dernière place ; la règle de capacité doit tenir dans ce cas.

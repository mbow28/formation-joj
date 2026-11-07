# 002 — Guide de Dakar : voir l'agenda du jour

**Statut** : Implémentée
**PRD** : specs/prd-guide-dakar.md, TR1

## Contexte

Un visiteur venu pour les Jeux a deux ou trois heures libres entre deux épreuves, et ne sait pas quelles animations ont lieu ce jour-là, car l'information est dispersée. Cette première tranche lui donne, pour une date des Jeux, toutes les animations du jour dans l'ordre où elles commencent.

## User stories

- En tant que visiteur ou supporter, je veux voir les animations d'une date des Jeux triées par heure de début, afin de choisir vite quoi faire pendant mon temps libre.

## Scénarios d'acceptation

### AS1 — Agenda d'un jour des Jeux

- **Étant donné** trois animations le 5 novembre 2026 : « Concert de sabar » de 18 h à 20 h à la Place de l'Obélisque, « Marché artisanal » de 10 h à 13 h au Village des Jeux de Diamniadio, « Initiation à la lutte » de 15 h à 16 h 30 sur la plage de Yoff, et une animation le 6 novembre 2026
- **Quand** le visiteur demande l'agenda du 5 novembre 2026
- **Alors** il reçoit exactement les trois animations du 5 novembre, dans l'ordre « Marché artisanal », « Initiation à la lutte », « Concert de sabar », chacune avec son titre, son lieu, son heure de début et son heure de fin ; l'animation du 6 novembre n'y figure pas.

### AS2 — Jour sans animation

- **Étant donné** aucune animation le 8 novembre 2026
- **Quand** le visiteur demande l'agenda du 8 novembre 2026
- **Alors** il reçoit un agenda vide, sans erreur.

### AS3 — Date hors des Jeux

- **Étant donné** les Jeux, du 31 octobre au 13 novembre 2026 inclus
- **Quand** le visiteur demande l'agenda du 30 octobre 2026 ou du 14 novembre 2026
- **Alors** la demande est refusée comme contraire à une règle métier, avec un message qui dit que la date est hors des Jeux et rappelle leurs dates. Le 31 octobre et le 13 novembre 2026 sont acceptés.

### AS4 — Date absente ou mal formée

- **Étant donné** une date absente, mal écrite (« demain », « 2026-13-45 ») ou qui n'existe pas au calendrier
- **Quand** le visiteur demande l'agenda
- **Alors** la demande est refusée comme invalide, et la réponse nomme le champ date en cause.

## Hors périmètre

- Filtrer l'agenda par lieu, et refuser un lieu inconnu (TR2).
- L'assistant qui répond en langage courant (TR3).
- Créer, modifier ou supprimer une animation, réserver, les comptes, les cartes et les itinéraires.
- Tout écran : cette tranche s'utilise par l'API.

## Questions ouvertes

- Origine des animations : hypothèse retenue, un jeu de données de démo est chargé en base (au moins Diamniadio, Yoff et la Place de l'Obélisque sur plusieurs jours) ; le plan dit comment.
- Contenu d'une animation : hypothèse retenue, un titre, un lieu, une date, une heure de début et une heure de fin.
- Animation sur deux jours (qui finit après minuit) : hypothèse retenue, elle appartient au jour de son début.
- Deux animations à la même heure de début : hypothèse retenue, départagées par ordre alphabétique du titre.
- Fuseau horaire : hypothèse retenue, heure de Dakar (UTC+0, sans heure d'été).

# PRD — Guide touristique de Dakar

**Statut** : Validé

## Problème

Un visiteur ou supporter venu pour les Jeux a deux ou trois heures libres entre deux épreuves. Il ne sait pas quelles animations ont lieu ce jour-là, ni lesquelles sont près de lui : l'information est dispersée, et il perd son temps libre à la chercher.

## Utilisateurs

- Visiteur ou supporter, souvent à Dakar pour la première fois : décider vite quoi faire pendant un créneau libre, le jour même, près du site où il se trouve.

## Proposition

Le guide rassemble en un seul endroit les animations déjà enregistrées et les rend faciles à consulter : l'agenda d'un jour, puis le même agenda limité à un lieu. Un assistant répond à une question en langage courant, parce que le visiteur ne connaît ni les noms des lieux ni l'organisation de l'agenda : il demande ce qu'il cherche avec ses mots, et le guide ne lui propose que des animations qui existent vraiment.

## Mesure du succès

Pendant la démo, on affiche l'agenda d'un jour des Jeux, trié par heure de début ; on le filtre sur un lieu ; on pose « qu'est-ce que je peux faire cet après-midi à Diamniadio ? » et l'assistant répond avec des animations qui existent toutes en base. Une date hors des Jeux, un lieu inconnu et une question vide sont refusés avec un message clair.

## Tranches

### TR1 — Voir l'agenda du jour

Le visiteur choisit une date et voit les animations de ce jour, triées par heure de début. Règle : une date hors des Jeux (du 31 octobre au 13 novembre 2026) est refusée.

### TR2 — Voir l'agenda du jour pour un lieu

Le visiteur choisit une date et un lieu, et ne voit que les animations de ce lieu ce jour-là. Règle : un lieu inconnu est refusé avec une erreur claire.

### TR3 — Demander à l'assistant quoi faire

Le visiteur pose une question en langage courant ; l'assistant, appuyé sur un modèle d'IA, lui propose des animations du jour. Règles : une question vide est refusée ; toute animation proposée par l'IA qui n'existe pas en base est écartée.

## Hors périmètre

- Créer ou modifier des animations.
- Réserver une animation.
- Les comptes utilisateurs.
- Les cartes et les itinéraires.

## Hypothèses et risques

- Hypothèse : des animations et des lieux sont déjà en base (jeu de données de démo) ; comme leur création est hors périmètre, sans ce jeu de données l'agenda est vide.
- Hypothèse : une animation a un titre, un lieu, une date, une heure de début et de fin ; non dit dans la demande.
- Hypothèse : « près de lui » se traduit par le choix d'un lieu, sans géolocalisation ; si le visiteur ne sait pas nommer son lieu, TR2 l'aide peu et c'est TR3 qui y répond.
- Risque : la réponse de l'IA varie d'un appel à l'autre ; seule la règle « n'existe pas en base, donc écartée » est garantie, pas la pertinence de la réponse.
- Risque : l'assistant dépend d'un service extérieur ; s'il ne répond pas, TR1 et TR2 restent utilisables.

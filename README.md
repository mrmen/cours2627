# cours2627

Site des cours 2026-2027, généré avec [Quartz](https://quartz.jzhao.xyz) à partir des notes Obsidian du dossier `cours/`.

Site en ligne : https://mrmen.github.io/cours2627/

## Mettre à jour le contenu

1. Copier les notes à publier (et les images qu'elles référencent) dans `content/`.
2. `git add -A && git commit -m "maj cours" && git push`

Le site se reconstruit et se republie automatiquement (GitHub Actions) à chaque push sur `main`.

## Développement local

```
npm install
npx quartz build --serve
```

Puis ouvrir http://localhost:8080

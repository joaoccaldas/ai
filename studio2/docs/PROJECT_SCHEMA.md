# Project Registry Schema

Each project in `projects.js` follows this public-facing contract:

```js
{
  id: 'stable-slug',
  title: 'Human title',
  repo: 'https://github.com/...',
  live: 'optional verified live experience',
  frontend: 'optional verified frontend',
  backend: 'optional verified backend/API',
  knowledge: 'optional public postmortem/docs',
  act: 'cave|workshop|cemetery|arcade|observatory|machine|horizon',
  status: 'living|prototype|archived|buried',
  summary: 'why it exists',
  built: 'what was actually built',
  lesson: 'what survived conceptually',
  skills: ['...'],
  year: 'YYYY'
}
```

Future fields may include lineage (`parent`, `descendants`), resurrection state, screenshots, verified deployment health and release evidence.

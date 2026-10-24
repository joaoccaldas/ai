/** Author-reviewed A1/A2 French. All paths use original dialog, no licensed movie clips. */
export const WORLDS = [
  {id:'museum',eyebrow:'01 · LE MYSTÈRE',title:'Le tableau disparu',sub:'A sketch has vanished from a Paris gallery. Follow the clues.',minutes:12,art:'../studio/gallery/eclat.jpg',tag:'ART & CULTURE',color:'#cfb789'},
  {id:'cafe',eyebrow:'02 · LA RENCONTRE',title:'Un café, deux secrets',sub:'One unexpected meeting. One conversation that changes everything.',minutes:8,art:'../studio/gallery/cafe.jpg',tag:'DAILY LIFE',color:'#d6a37b'},
  {id:'science',eyebrow:'03 · LA DÉCOUVERTE',title:'La nuit des étoiles',sub:'An observatory, a strange signal, and an astronomer with questions.',minutes:9,art:'../studio/gallery/wander.jpg',tag:'SCIENCE',color:'#9ec7cb'},
];
export const CHAPTERS = [
  {
    id:'m1',world:'museum',title:'The arrival',french:'Une nuit au musée',time:'21:14',character:'Camille · conservatrice',objective:'Find the invitation and greet the curator.',intro:'The gallery has closed. A curator waits by the entrance. Your invitation may be the only way inside.',line:'Bonsoir. Vous avez une invitation ?',translation:'Good evening. Do you have an invitation?',
    objects:[{id:'invitation',fr:'une invitation',en:'an invitation',pt:'um convite',detail:'A folded invitation carries a handwritten address.'},{id:'porte',fr:'la porte',en:'the door',pt:'a porta',detail:'The brass door leads deeper into the museum.'},{id:'heure',fr:'l’heure',en:'the time',pt:'a hora',detail:'A clock stopped at 21:14.'}],
    prompt:'How do you politely say you have an invitation?',choices:[{fr:'Oui, j’ai une invitation.',en:'Yes, I have an invitation.',ok:true,reply:'Parfait. Entrez, s’il vous plaît.'},{fr:'Je suis une invitation.',en:'I am an invitation.',reply:'Une invitation ? Je ne comprends pas.'},{fr:'Je veux dormir.',en:'I want to sleep.',reply:'Ce n’est pas un hôtel !'}],
    listen:'J’ai une invitation.',cloze:'J’ai une ______.',answer:'invitation',context:'Camille opens the door. The room is empty, except for one frame.',
  },
  {
    id:'m2',world:'museum',title:'The empty frame',french:'Le cadre vide',time:'21:28',character:'Camille · conservatrice',objective:'Inspect the missing picture and ask the right question.',intro:'A gilded frame hangs empty. Beside it: a blue notebook and the faint smell of paint.',line:'Le tableau était ici ce matin. Où est-il ?',translation:'The painting was here this morning. Where is it?',
    objects:[{id:'cadre',fr:'le cadre',en:'the frame',pt:'a moldura',detail:'The frame is intact, but the picture is missing.'},{id:'carnet',fr:'le carnet',en:'the notebook',pt:'o caderno',detail:'The notebook records a delivery for tomorrow.'},{id:'indice',fr:'un indice',en:'a clue',pt:'uma pista',detail:'A tiny blue mark appears near the floor.'}],
    prompt:'Which question helps you investigate?',choices:[{fr:'Où est le tableau ?',en:'Where is the painting?',ok:true,reply:'Bonne question. Regardez le carnet !'},{fr:'Combien coûte le café ?',en:'How much is the coffee?',reply:'Nous ne sommes pas au café.'},{fr:'Je suis le tableau.',en:'I am the painting.',reply:'Vous plaisantez ?'}],
    listen:'Où est le tableau ?',cloze:'Où est le ______ ?',answer:'tableau',context:'The notebook mentions an artist, a loan, and a date: tomorrow.',
  },
  {
    id:'m3',world:'museum',title:'The revelation',french:'La vérité',time:'21:41',character:'Luc · artiste',objective:'Understand what happened to the artwork.',intro:'The artist arrives. He has a receipt, not a confession. The painting might not have been stolen at all.',line:'Je n’ai pas volé le tableau. Je l’ai prêté pour une exposition.',translation:'I did not steal the painting. I lent it for an exhibition.',
    objects:[{id:'recu',fr:'un reçu',en:'a receipt',pt:'um recibo',detail:'The receipt is signed by the museum director.'},{id:'expo',fr:'une exposition',en:'an exhibition',pt:'uma exposição',detail:'A note announces a temporary exhibition.'},{id:'verite',fr:'la vérité',en:'the truth',pt:'a verdade',detail:'The evidence explains the missing painting.'}],
    prompt:'What did the artist do with the painting?',choices:[{fr:'Il a prêté le tableau.',en:'He lent the painting.',ok:true,reply:'Exactement. Le mystère est résolu.'},{fr:'Il a mangé le tableau.',en:'He ate the painting.',reply:'Non, ce n’est pas possible.'},{fr:'Il a perdu son café.',en:'He lost his coffee.',reply:'Le café n’est pas le problème.'}],
    listen:'Il a prêté le tableau.',cloze:'Il a ______ le tableau.',answer:'prêté',context:'Case closed. You solved a mystery while speaking French.',
  },
  {
    id:'c1',world:'cafe',title:'A table for one',french:'Une table pour une personne',time:'08:32',character:'Émile · serveur',objective:'Order breakfast politely.',intro:'Morning in Montmartre. The café is full, but the waiter finds you a quiet table.',line:'Bonjour ! Qu’est-ce que vous désirez ?',translation:'Hello! What would you like?',
    objects:[{id:'menu',fr:'le menu',en:'the menu',pt:'o cardápio',detail:'The daily menu lists coffee, tea and pastries.'},{id:'cafe',fr:'un café',en:'a coffee',pt:'um café',detail:'A small espresso is the specialty here.'},{id:'croissant',fr:'un croissant',en:'a croissant',pt:'um croissant',detail:'Freshly baked, golden and still warm.'}],
    prompt:'Order a coffee and a croissant politely.',choices:[{fr:'Un café et un croissant, s’il vous plaît.',en:'A coffee and a croissant, please.',ok:true,reply:'Bien sûr ! Je vous apporte ça.'},{fr:'Vous êtes un croissant.',en:'You are a croissant.',reply:'Pardon ?'},{fr:'Je suis le café.',en:'I am the coffee.',reply:'C’est une blague ?'}],
    listen:'Un café, s’il vous plaît.',cloze:'Un café, s’il vous ______.',answer:'plaît',context:'The waiter brings your coffee, along with a folded note.',
  },
  {
    id:'c2',world:'cafe',title:'The invitation',french:'À bientôt',time:'09:06',character:'Émile · serveur',objective:'Ask when and where to meet again.',intro:'The handwritten note is from a journalist who wants to talk about your work.',line:'On peut se retrouver ici demain à neuf heures ?',translation:'Can we meet here tomorrow at nine?',
    objects:[{id:'demain',fr:'demain',en:'tomorrow',pt:'amanhã',detail:'The meeting is tomorrow, not today.'},{id:'ici',fr:'ici',en:'here',pt:'aqui',detail:'The café is the proposed meeting place.'},{id:'heure',fr:'neuf heures',en:'nine o’clock',pt:'nove horas',detail:'The appointment time is 09:00.'}],
    prompt:'Accept the meeting politely.',choices:[{fr:'Oui, à demain !',en:'Yes, see you tomorrow!',ok:true,reply:'Parfait, à demain !'},{fr:'Non, je suis une heure.',en:'No, I am an hour.',reply:'Je ne comprends pas.'},{fr:'Je voudrais trois tables.',en:'I would like three tables.',reply:'Pour combien de personnes ?'}],
    listen:'À demain !',cloze:'À ______ !',answer:'demain',context:'You leave with a new connection and a good reason to return.',
  },
  {
    id:'s1',world:'science',title:'The observatory',french:'Un ciel sans nuages',time:'23:04',character:'Nina · astronome',objective:'Describe the night sky.',intro:'At an observatory outside Paris, a scientist is preparing a telescope.',line:'Regardez ! Le ciel est clair et les étoiles sont magnifiques.',translation:'Look! The sky is clear and the stars are magnificent.',
    objects:[{id:'ciel',fr:'le ciel',en:'the sky',pt:'o céu',detail:'The sky is clear tonight.'},{id:'etoile',fr:'une étoile',en:'a star',pt:'uma estrela',detail:'Stars emit their own light.'},{id:'lunette',fr:'un télescope',en:'a telescope',pt:'um telescópio',detail:'The telescope collects light from distant objects.'}],
    prompt:'What can you see in the night sky?',choices:[{fr:'Je vois les étoiles.',en:'I see the stars.',ok:true,reply:'Oui, elles brillent beaucoup !'},{fr:'Je mange les étoiles.',en:'I eat the stars.',reply:'C’est impossible !'},{fr:'Je suis un télescope.',en:'I am a telescope.',reply:'Vous êtes drôle.'}],
    listen:'Je vois les étoiles.',cloze:'Je vois les ______.',answer:'étoiles',context:'One point of light seems to move differently from the others.',
  },
  {
    id:'s2',world:'science',title:'The strange signal',french:'Une nouvelle question',time:'23:36',character:'Nina · astronome',objective:'Ask a scientific question in French.',intro:'The telescope captures an unusual signal. Nina insists on checking the evidence before making claims.',line:'C’est peut-être un satellite. Nous devons vérifier les données.',translation:'It may be a satellite. We must check the data.',
    objects:[{id:'satellite',fr:'un satellite',en:'a satellite',pt:'um satélite',detail:'Some moving lights are human-made satellites.'},{id:'donnees',fr:'les données',en:'the data',pt:'os dados',detail:'Measurements help distinguish explanations.'},{id:'question',fr:'une question',en:'a question',pt:'uma pergunta',detail:'A good question starts a scientific investigation.'}],
    prompt:'What is the responsible scientific response?',choices:[{fr:'Vérifions les données.',en:'Let’s check the data.',ok:true,reply:'Exactement. La science commence par des questions.'},{fr:'C’est certainement un extraterrestre.',en:'It is definitely an alien.',reply:'Nous n’avons pas de preuve.'},{fr:'Je préfère un croissant.',en:'I prefer a croissant.',reply:'Plus tard, peut-être !'}],
    listen:'Vérifions les données.',cloze:'Vérifions les ______.',answer:'données',context:'The signal was a satellite. The real discovery was a better question.',
  }
];
export const CHAPTER_BY_ID = Object.fromEntries(CHAPTERS.map(c=>[c.id,c]));
export const CHAPTERS_BY_WORLD = Object.fromEntries(WORLDS.map(w=>[w.id,CHAPTERS.filter(c=>c.world===w.id)]));

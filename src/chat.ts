import { n } from './vnode'
import { ChatInput } from './chatInput'
import { toJson, paragraphText, autoScroll, unique, randomPick, fakeStream } from './utils'
import style from './main.module.css'
import titleSvg from '../assets/title.svg?raw'
import flourishSvg from '../assets/flourish.svg?raw'

type Character = {
  name?: string
  motive?: string
  madness?: number
  inventory: string[]
  place: string
  [k: string]: any
}
type Place = {
  name: string
  objects: string
  description: string
  previous: string[]
}

const ai = (window as any).ai
const session = await ai.languageModel.create({
  type: 'tl;dr',
  format: 'plain-text',
  length: 'short',
})

const places = new Map<string, Place>()
const firstPlace: Place = {
  name: 'dark room',
  objects: 'paper',
  description: '',
  previous: []
}
const protagonist: Character = {
  madness: 0,
  inventory: [],
  place: firstPlace.name,
}
const visited = new Set<string>()

places.set(firstPlace.name, firstPlace)
visited.add(firstPlace.name)

export const chat = (): DocumentFragment => {
  const fragment = new DocumentFragment()
  const paperContainer = n('div')
    .class(style.paper)
    .content(`
    <h1 class="hidden">Welcome to the maze of madness</h1>
    <div class="${style.paperBackground}">
      <img src="/assets/paper.png" alt="paper background"/>
    </div>
    <div class="${style.flourish} ${style.flourishTop}">${flourishSvg}</div>
    <div class="${style.title}">${titleSvg}</div>
    <div class="${style.flourish} ${style.flourishBottom}">${flourishSvg}</div>
  `)
  const history = paperContainer.add('section')
  const form = new ChatInput()

  let situation = (
    'You wake up in a dark room. Slowly your eyes adjust to the dim light. ' +
    'You hear footsteps and someone or something slide a paper under the door.'
  )

  history.add('h2')
    .class('hidden')
    .content('History')
  history.add('div')
    .content(paragraphText(situation))

  form.submit(async (prompt) => {
    const current = places.get(protagonist.place)
    const protagonistParagraph = history.add('div')
    const responseParagraph = history.add('div')

    protagonistParagraph.content(paragraphText(prompt))
    responseParagraph.content('...')

    autoScroll()

    const stream = await getHistoryStream(session, protagonist, situation, prompt)
    let response = ''

    for await (const chunk of stream) {
      response = chunk
      responseParagraph.content(paragraphText(chunk))
      autoScroll()
    }

    situation = await summarizeSituation(session, situation, response)

    const status = await getStatus(session, protagonist, response)

    status.madness += visited.has(status.place) ? 1 : -5
    status.madness = Math.max(status.madness, 0)

    if (!current?.description || protagonist.place !== status.place) {
      const created = places.get(status.place)
      const placeStream = created
        ? fakeStream(created.description)
        : await createPlaceStream(session, status.place, current)
      const placeParagraph = history.add('div')
      let placeDescription = ''

      for await (const chunk of placeStream) {
        placeDescription = chunk
        placeParagraph.content(paragraphText(chunk))
        autoScroll()
      }

      const objects = await getPlaceObjects(session, placeDescription)

      if (created) {
        created.previous = unique([...created.previous, protagonist.place])
      }
      else {
        places.set(status.place, {
          name: status.place,
          previous: [protagonist.place],
          description: placeDescription,
          objects
        })
      }

      visited.add(status.place)

      console.log('new place -->', placeDescription)
    }

    Object.keys(protagonist).forEach((key) => {
      protagonist[key] = status[key]
    })

    console.log('status -->', status)
  })

  fragment.appendChild(paperContainer.dom)
  fragment.appendChild(form.dom)

  return fragment
}

async function getHistoryStream(
  session: any,
  protagonist: Character,
  situation: string,
  prompt: string,
) {
  const current = places.get(protagonist.place)
  const madness = protagonist.madness ? protagonist.madness + 0 : 0
  let hallucinations = ''
  if (madness >= 90) {
    hallucinations = 'Describes the horrifying hallucinations that haunt the protagonist.\n'
  }
  else if (madness >= 70) {
    hallucinations = 'Describes the hallucinations that haunt the protagonist.\n'
  }
  else if (madness >= 50) {
    hallucinations = 'Describes the protagonist\'s hallucinations.\n'
  }
  const innerThoughts = madness >= 30 && Math.random() >= 0.5
    ? 'Describes the inner thoughts of the protagonist.\n'
    : ''

  if (!current) return ''

  const historyPrompt = (
    'You are the narrator of a old history of mistery and terror.\n' +
    'Always tells the story of the protagonist in the second person.\n' +
    // 'Describes the actions and inner thoughts of the protagonist.\n' +
    hallucinations +
    innerThoughts +
    (current.description ? 'Describes the place where the protagonist is.\n' : '') +
    // 'Make a short description.\n'+
    // `The protagonist current madness is: ${protagonist.madness} of 100.\n` +
    // `The protagonist current inventory is: "${inventory}".\n` +
    // `The protagonist current place is: "${protagonist.place}".\n` +
    'Always keep the response short.\n' +
    'Do not include questions in the response.\n' +
    'Do not ask waht do you do to the protagonist.\n' +
    'Do not include recomendations in the response.\n' +
    'Do not repeat the protagonist current situation.\n' +
    'Do not repeat previous descriptions.\n' +
    'Do not take the protagonist initiative.\n' +
    `The protagonist current place is: "${current.description}".\n` +
    `The protagonist current situation is: "${situation}".\n` +
    `The protagonist can go back to: "${current.previous.join('", "')}".\n` +
    `Describe only what happens after the following protagonist's action: ${prompt}.`
  )

  return await session.promptStreaming(historyPrompt)
}

async function summarizeSituation(
  session: any,
  situation: string,
  description: string
) {
  const summary = await session.prompt(`
    Sumarize the following text:
    "${situation}\n${description}"
  `)

  console.log('summary -->', summary)

  return summary
}

async function getStatus(
  session: any,
  protagonist: Character,
  situation: string,
) {
  const keys = Object.keys(protagonist)
  const inventory = Array.isArray(protagonist.inventory)
    ? protagonist.inventory.join(', ')
    : protagonist.inventory
  const response = await session.prompt(
    `The protagonist initial madness is: "${protagonist.madness}".\n` +
    `The protagonist initial inventory is: "${inventory}".\n` +
    `The protagonist initial place is: "${protagonist.place}".\n` +
    `After the following situation: "${situation}".\n` +
    `Updates the protagonist's madness according to the difficulty of the situation.` +
    `Updates the protagonist's inventory depending on what he has collected or dropped.` +
    `Updates the protagonist's place depending on what he did.` +
    `Answer in JSON format the following portagonist's aspects: ${keys.join(', ')}`
  )
  const status = toJson(response)

  if (status.inventory && !Array.isArray(status.inventory)) {
    status.inventory = status.inventory.split(/,\s*/)
    status.inventory = unique([
      ...status.inventory,
      ...inventory.split(/,\s*/)
    ])
  }

  return status
}

async function createPlaceStream(
  session: any,
  name: string,
  previous: Place
) {
  const exits = randomPick(['two', 'two', 'two', 'three', 'three', 'three', 'four', 'four', 'five', 'six'])
  return await session.promptStreaming(
    `Describe the following place: "${name}".\n` +
    `Take into consideration the previous situarion: "${previous.description}".\n` +
    'Always describe the place of the protagonist in the second person.\n' +
    `There are ${exits} ways out from this place.\n` +
    `Identify the ways out with some characteristic.\n` +
    'Do not include questions in the response.\n' +
    'Keep the response short.'
  )
}

async function getPlaceObjects(
  session: any,
  situation: string
) {
  return await session.prompt(
    `Given the following description: "${situation}".\n` +
    `List all the objects in the current place.`
  )
}

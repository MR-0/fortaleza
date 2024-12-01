import { n } from './vnode'
import { toJson } from './utils'

type Character = {
  name?: string
  motive?: string
  madness?: number
  inventory: string
  place: string
}

const ai = (window as any).ai
const session = await ai.languageModel.create({
  type: 'tl;dr',
  format: 'plain-text',
  length: 'short',
})

const places = new Map()
const firstPlace = {
  name: 'dark room',
  objects: 'paper',
  previous: null,
  situation: (
    'You wake up in a dark room. Slowly your eyes adjust to the dim light from the beam of the door.\n' +
    'You hear footsteps, the beam of light becomes intermittent and you feel a paper slide under the door.'
  )
}
const protagonist: Character = {
  madness: 0,
  inventory: 'nothing',
  place: firstPlace.name,
}
const questionText = 'What do you want to do?'
const visited = new Set()

places.set(firstPlace.name, firstPlace)

export const chat = (): HTMLElement => {
  const current = places.get(protagonist.place)
  const container = n('div').content(`
    <h1>Welcome to the old gods fortress</h1>
    <section>
      <p>${current.situation.split('\n').join('<br/>')}</p>
    </section>
  `)
  const history = container.add('section')
  const question = container.add('p').content(questionText)
  const form = container.add('form').on('submit', async (e) => {
    e.preventDefault()
    const { value: prompt } = input.dom
    const current = places.get(protagonist.place)
    const protagonistParagraph = history.add('p')
    const responseParagraph = history.add('p')

    input.dom.value = ''
    question.content('')
    protagonistParagraph.content(prompt)
    responseParagraph.content('...')

    const stream = await getHistoryStream(session, protagonist, prompt)
    let response = ''

    for await (const chunk of stream) {
      response = chunk
      responseParagraph.content(chunk.split('\n').join('<br/>'))
    }

    current.situation = await summarizeSituation(session, protagonist, response)
    question.content(questionText)

    const status = await getStatus(session, protagonist, response)

    if (protagonist.madness === status.madness) {
      status.madness += visited.has(status.place) ? 1 : -5
      status.madness = Math.max(status.madness, 0)
    }

    if (status.place !== undefined && status.place !== protagonist.place) {
      const place = await createPlace(session, status.place, current.name)
      places.set(place.name, place)
      console.log('new place -->', place)
    }

    Object.keys(protagonist).forEach((key) => {
      protagonist[key] = status[key]
    })


    console.log('status -->', status)
  })

  const input = form.add<HTMLInputElement>('input').attrs({
    type: 'text'
  })

  return container.dom
}

async function getHistoryStream(
  session: any,
  protagonist: Character,
  prompt: string,
) {
  const current = places.get(protagonist.place)
  const historyPrompt = (
    'You are the narrator of a old history of mistery and terror.\n' +
    'Always tells the story of the protagonist in the second person.\n' +
    // 'Describes the actions and inner thoughts of the protagonist.\n' +
    'Describes the inner thoughts of the protagonist.\n' +
    'Describes the place where the protagonist is.\n' +
    // 'Make a short description.\n'+
    `The protagonist current madness is: ${protagonist.madness} of 100.\n` +
    `The protagonist current inventory is: "${protagonist.inventory}".\n` +
    `The protagonist current place is: "${protagonist.place}".\n` +
    'The current place has at least one exit.\n' +
    'Keep the response short.\n' +
    'Do not include questions in the response.\n' +
    'Do not repeat the protagonist current situation.\n' +
    `The protagonist current situation is: "${current.situation}".\n` +
    `Describe what happens after the following protagonist's action: ${prompt}.`
  )

  return await session.promptStreaming(historyPrompt)
}

async function summarizeSituation(
  session: any,
  protagonist: Character,
  situation: string
) {
  const current = places.get(protagonist.place)
  const summary = await session.prompt(`
    Sumarize the following text:
    "${current.situation}\n${situation}"
  `)

  console.log('summary -->', summary)

  return summary
}

async function getStatus(
  session: any,
  protagonist: Character,
  situation: string
) {
  const keys = Object.keys(protagonist)
  const response = await session.prompt(
    `The protagonist initial madness is: "${protagonist.madness}".\n` +
    `The protagonist initial inventory is: "${protagonist.inventory}".\n` +
    `The protagonist initial place is: "${protagonist.place}".\n` +
    `After the following situation: "${situation}".\n` +
    `Updates the protagonist's madness according to the difficulty of the situation.` +
    `Updates the protagonist's inventory depending on what he has collected or dropped.` +
    `Updates the protagonist's place depending on what he did.` +
    `Answer in JSON format the following portagonist's aspects: ${keys.join(', ')}`
  )
  return toJson(response)
}

async function createPlace(
  session: any,
  name: string,
  previous: string
) {
  const situation = await session.prompt(
    `Describe the following place: "${name}".\n` +
    'Keep the response short.\n' +
    'Do not include questions in the response.\n'
  )
  const objects = await getPlaceObjects(session, situation)

  return { name, objects, previous, situation }
}

async function getPlaceObjects(
  session: any,
  situation: string
) {
  return await session.prompt(
    `Given the following description: "${situation}".\n` +
    `List all the objects in the place separated by comma.`
  )
}

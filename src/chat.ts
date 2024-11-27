import { n } from './vnode'

const ai = (window as any).ai
const session = await ai.languageModel.create({
  type: 'tl;dr',
  format: 'plain-text',
  length: 'short',
})

const places = new Map()
const firstPlace = {
  name: 'dark room',
  items: 'paper',
  previous: null,
  situation: (
    'You wake up in a dark room. Slowly your eyes adjust to the dim light from the beam of the door.\n' +
    'You hear footsteps, the beam of light becomes intermittent and you feel a paper slide under the door.'
  )
}

places.set(firstPlace.name, firstPlace)

const protagonist = {
  healt: 100,
  madness: 0,
  inventory: 'nothing',
  place: firstPlace.name,
}

const questionText = 'What do you want to do?'

export const chat = (): HTMLElement => {
  const current = places.get(protagonist.place)
  const container = n('div').content(`
    <h1>Welcome to the old gods fortress</h1>
    <section>
      <p>${current.situation.split('\n').join('<br/>')}</p>
    </section>
  `)
  const response = container.add('section')
  const question = container.add('p').content(questionText)
  const form = container.add('form')
    .on('submit', async (e) => {
      e.preventDefault()
      const { value: prompt } = input.dom
      const current = places.get(protagonist.place)
      const paragraph = response.add('p')
      const historyPrompt = (
        'You are the narrator of a old history of mistery and terror.\n' +
        'Always tells the story of the protagonist in the second person.\n' +
        'Describes the actions and inner thoughts of the protagonist.\n' +
        'Describes the place where the protagonist is.\n' +
        // 'Make a short description.\n'+
        `The protagonist current healt is: ${protagonist.healt} of 100.\n` +
        `The protagonist current madness is: ${protagonist.madness} of 100.\n` +
        `The protagonist current inventory is: "${protagonist.inventory}".\n` +
        `The protagonist current place is: "${protagonist.place}".\n` +
        'The current place has at least one exit.\n' +
        'Keep the response short.\n' +
        'Do not include questions in the response.\n' +
        'Do not repeat the protagonist current situation.\n' +
        `The protagonist current situation is: "${current.text}".\n` +
        `Describe what happens after the following protagonist's action: ${prompt}.`
      )

      input.dom.value = ''

      const stream = await session.promptStreaming(historyPrompt)
      let fullResponse = ''

      question.content('')
      paragraph.content('...')

      for await (const chunk of stream) {
        fullResponse = chunk
        paragraph.content(chunk.split('\n').join('<br/>'))
      }

      const summary = await session.prompt(`
        Sumarize the following text:
        "${current.text}\n${fullResponse}"
      `)

      question.content(questionText)

      const status = await session.prompt(
        `The protagonist initial healt is: "${protagonist.healt}".\n` +
        `The protagonist initial madness is: "${protagonist.madness}".\n` +
        `The protagonist initial inventory is: "${protagonist.inventory}".\n` +
        `The protagonist initial place is: "${protagonist.place}".\n` +
        `After the following situation: "${fullResponse}".\n` +
        `Updates the protagonist's healt dependig on the damage he has received in the current situation.` +
        `Updates the protagonist's madness according to the difficulty of the situation.` +
        `Updates the protagonist's inventory depending on what he has collected.` +
        `Answer in JSON format the following portagonist's aspects: ${Object.keys(protagonist).join(', ')}`
      )

      places.set(protagonist.place, summary)

      console.log('status -->', status, toJson(status))
      console.log('summary -->', summary)
    })
  const input = form.add('input').attrs({
    type: 'text'
  })

  return container.dom
}


function toJson(str: string) {
  str = str.replace(/^```json/, '')
  str = str.replace(/$```/, '')
  return JSON.parse(str)
}


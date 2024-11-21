

export const chat = (): HTMLElement => {
  const container = document.createElement('div')

  container.innerHTML = `
    <p>Bienvenido a la fortaleza!</p>
    <div>
      <p>Acá van las descripciones</p>
    </div>
    <div>
      <input type="text" />
    </div>
  `

  return container
}

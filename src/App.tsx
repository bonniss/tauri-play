import { Button, TextInput } from "@mantine/core"
import { invoke } from "@tauri-apps/api/core"
import { useState } from "react"

function App() {
  const [greetMsg, setGreetMsg] = useState("")
  const [name, setName] = useState("")

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }))
  }

  return (
    <main className="container">
      <h1>Working on greatness...</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          greet()
        }}
      >
        <TextInput
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <Button type="submit">Greet</Button>
      </form>
      <p>{greetMsg}</p>
    </main>
  )
}

export default App

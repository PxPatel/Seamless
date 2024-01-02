import type { BaseConfigSetting } from "~types/user.types"

const port = chrome.runtime.connect({ name: "scriptPort" })

// Variable to hold SessionData
let config: BaseConfigSetting = null

// // Listen for incoming messages on the port
port.onMessage.addListener((message: BaseConfigSetting | null) => {
  // Update config based on incoming messages
  config = message // Assuming message structure aligns with config
  console.log("Received message:", config)
})

const preferredCopyShortcut = ["Control", "Shift", "Alt", "C"]
function isModifier(key: string): boolean {
  const modifiers = [
    "Alt",
    "AltGraph",
    "CapsLock",
    "Control",
    "Fn",
    "FnLock",
    "Hyper",
    "Meta",
    "NumLock",
    "ScrollLock",
    "Shift",
    "Super",
    "Symbol",
    "SymbolLock"
  ]
  return modifiers.includes(key)
}

// Event listener for keydown events
document.addEventListener("keydown", (event) => {
  // Check if the pressed keys match the preferredCopyShortcut

  if (
    window.getSelection().toString().length > 0 &&
    preferredCopyShortcut.every((key) => {
      if (isModifier(key)) {
        return event.getModifierState(key)
      } else {
        return event.key.toLowerCase() === key.toLowerCase()
      }
    })
  ) {
    // Get the selected text when the shortcut keys are pressed and text is highlighted
    let selectedText = window.getSelection().toString()
    console.log("Selected text:", selectedText)
    port.postMessage({ type: "message", message: selectedText })
    // Here you can perform further actions with the selected text or send it to the background script
  }
})

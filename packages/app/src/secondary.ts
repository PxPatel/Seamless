//Content script, will watch for Copy and Paste actions
//Will then send to Background to send to Firebase
//Will also send message to popup to manage display

import type { BaseConfigSetting } from "~types/user.types"

// console.log("Hello :)")

export const watchForCopies = () => {
  console.log("This is supposed to be in browser")
}

//Establish a connection to the background script's "scriptPort"
// const port = chrome.runtime.connect({ name: "scriptPort" })

// // Variable to hold SessionData
// let config: BaseConfigSetting = null

// // // Listen for incoming messages on the port
// port.onMessage.addListener((message: BaseConfigSetting | null) => {
//   // Update config based on incoming messages
//   config = message // Assuming message structure aligns with config
//   console.log("Received message:", config)
// })

// console.log("Hello")

// // Event listener for when the user copies something
// document.addEventListener("copy", (event) => {
//   const copiedText = window.getSelection().toString()
//   console.log("Copied text:", copiedText)
//   // You might want to send this information to the background script or perform other actions with it
// })

// const preferredCopyShortcut = ["Control", "Shift", "Alt", "C"]

// // Variable to store selected text
// let selectedText = ""

// // Event listener for keydown events
// document.addEventListener("keydown", (event) => {
//   // Check if the pressed keys match the preferredCopyShortcut

//     console.log("a", event.key === "a")
//     console.log("c", event.key === "c")

//   if (
// //     preferredCopyShortcut.every((key) => {
// //       if (isModifier(key)) {
// //         return event.getModifierState(key)
// //       } else {
// //         return event.key.toLowerCase() === key.toLowerCase()
// //       }
// //     }) &&
//     window.getSelection().toString().length > 0
//   ) {
//     // Get the selected text when the shortcut keys are pressed and text is highlighted
//     selectedText = window.getSelection().toString()
//     console.log("Selected text:", selectedText)
//     // Here you can perform further actions with the selected text or send it to the background script
//   }
// })

// function isModifier(key: string): boolean {
//   const modifiers = [
//     "Alt",
//     "AltGraph",
//     "CapsLock",
//     "Control",
//     "Fn",
//     "FnLock",
//     "Hyper",
//     "Meta",
//     "NumLock",
//     "ScrollLock",
//     "Shift",
//     "Super",
//     "Symbol",
//     "SymbolLock"
//   ]
//   return modifiers.includes(key)
// }

import { isPasteResponse } from "~types/guard.types"
import type { BaseConfigSetting, PasteResponse } from "~types/user.types"

const port = chrome.runtime.connect({ name: "scriptPort" })

const CLIPBOARD_POLLING_TIME_MS: number = 100

//Only for testing purposes
const devVar_useDefaultShortcuts = false
const defaultPreferredCopyShortcut = ["Control", "Shift", "Alt", "C"]
const defaultPreferredPasteShortcut = ["Control", "Shift", "Alt", "V"]

// Variable to hold SessionData
let config: BaseConfigSetting = null
let intervalID = null
let prevListenTo: "CLIPBOARD" | "SHORTCUT" | "STOP"

const pressedKeys = []

const transmitCopyEvent = (selectedText: string) => {
  port.postMessage({
    type: "CopyEvent",
    data: { content: selectedText, timeCopied: Date.now() }
  })
}

const transmitPasteEvent = () => {
  port.postMessage({
    type: "PasteRequest",
    port: null
  })
}
// Listen for incoming messages on the port
port.onMessage.addListener(
  (message: BaseConfigSetting | PasteResponse | null) => {
    if (isPasteResponse(message)) {
      if (config && config.ListenTo === "CLIPBOARD") {
        // writeToClipboard(message.content)
      } else if (config && config.ListenTo === "SHORTCUT") {
        pastingMechanism(message.content)
      }

      return
    }

    // Update config based on incoming messages
    config = message as BaseConfigSetting
    console.log("Received message:", config)

    if (!config || config.ListenTo === "STOP") {
      clearAllListeners()
    } else if (config.ListenTo !== prevListenTo) {
      if (config.ListenTo === "SHORTCUT") {
        clearAllListeners()
        document.addEventListener("keydown", keyDownListener)
        document.addEventListener("keyup", keyUpListener)
        window.addEventListener("blur", focusChangeKeyListener)
      } else if (config.ListenTo === "CLIPBOARD") {
        clearAllListeners()

        intervalID = setInterval(async () => {
          try {
            const clipboardText = await navigator.clipboard.readText()
            transmitCopyEvent(clipboardText)
          } catch (error) {
            console.log(error)
          }
        }, CLIPBOARD_POLLING_TIME_MS)
      }
    }
  }
)

function focusChangeKeyListener() {
  pressedKeys.length = 0
}

function clearAllListeners() {
  if (intervalID) {
    clearInterval(intervalID)
    intervalID = null
  }
  document.removeEventListener("keydown", keyDownListener)
  document.removeEventListener("keyup", keyUpListener)
  window.removeEventListener("blur", focusChangeKeyListener)
}

async function keyDownListener(event: { key: string }) {
  let pushedNewLetter = false
  if (!pressedKeys.includes(event.key.toLowerCase())) {
    pressedKeys.push(event.key.toLowerCase())
    pushedNewLetter = true
  }

  const { copyShortcut, pasteShortcut } = determineShortcutArray()

  actOnCopyEvent(copyShortcut, pushedNewLetter)
  actOnPasteEvent(pasteShortcut, pushedNewLetter)
  console.log(pressedKeys)
}

function keyUpListener(event: { key: string }) {
  if (pressedKeys.includes(event.key.toLowerCase())) {
    const indexToRemove = pressedKeys.indexOf(event.key.toLowerCase()) // Find the index of the element
    pressedKeys.splice(indexToRemove, 1) // Remove the element at the found index
  }

  const { copyShortcut, pasteShortcut } = determineShortcutArray()

  actOnCopyEvent(copyShortcut)

  actOnPasteEvent(pasteShortcut)
}

function actOnCopyEvent(
  copyShortcut: string[],
  ...conditions: Array<(() => boolean) | boolean>
) {
  const conditionsToCheck: boolean[] = conditions.map((condition) =>
    typeof condition === "function" ? (condition as () => boolean)() : condition
  )

  const allConditionsMet = conditionsToCheck.every(Boolean)

  const isCopySequenceMatched =
    pressedKeys.join("") === copyShortcut.map((k) => k.toLowerCase()).join("")

  if (
    window.getSelection().toString().length > 0 &&
    isCopySequenceMatched &&
    allConditionsMet
  ) {
    console.log("Sequence matched!")
    let selectedText = window.getSelection().toString()
    console.log("Selected text:", selectedText)

    transmitCopyEvent(selectedText)
  }
}

function actOnPasteEvent(
  pasteShortcut: string[],
  ...conditions: Array<(() => boolean) | boolean>
) {
  const conditionsToCheck: boolean[] = conditions.map((condition) =>
    typeof condition === "function" ? (condition as () => boolean)() : condition
  )

  const allConditionsMet = conditionsToCheck.every(Boolean)

  const isPasteSequenceMatched =
    pressedKeys.join("") === pasteShortcut.map((k) => k.toLowerCase()).join("")

  if (isPasteSequenceMatched && allConditionsMet) {
    console.log("Trig 1")
    transmitPasteEvent()
  }
}

function determineShortcutArray() {
  const copyShortcut =
    config.preferredCopyShortCut && devVar_useDefaultShortcuts
      ? config.preferredCopyShortCut
      : defaultPreferredCopyShortcut

  const pasteShortcut =
    config.preferredPasteShortCut && devVar_useDefaultShortcuts
      ? config.preferredPasteShortCut
      : defaultPreferredPasteShortcut
  return { copyShortcut, pasteShortcut }
}

function pastingMechanism(content: string, auto?: boolean) {
  const activeElement = document.activeElement as HTMLElement

  if (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement
  ) {
    const inputElement = activeElement as HTMLInputElement | HTMLTextAreaElement
    const start = inputElement.selectionStart
    const end = inputElement.selectionEnd

    const currentValue = inputElement.value

    console.log(start, end, currentValue)

    if (start !== null && end !== null) {
      const newValue =
        currentValue.substring(0, start) +
        content +
        currentValue.substring(end, currentValue.length)

      inputElement.value = newValue

      // Update cursor position
      const newCursorPos = start + content.length
      inputElement.setSelectionRange(newCursorPos, newCursorPos)
    }
  } else if (activeElement.isContentEditable) {
    // Content editable element handling
    const selection = window.getSelection()
    const range = selection.getRangeAt(0)
    range.deleteContents()
    range.insertNode(document.createTextNode(content))
  } else if (!activeElement.isContentEditable) {
    // Handle other types of elements here
    const selection = window.getSelection()
    if (selection.type !== "None") {
      const range = selection.getRangeAt(0)
      const selectedText = selection.toString()

      if (selectedText && activeElement.textContent) {
        const modifiedText =
          activeElement.textContent.slice(0, range.startOffset) +
          content +
          activeElement.textContent.slice(range.endOffset)

        activeElement.textContent = modifiedText
      }
    }
  }

  /**
   * Idea: Paste the content (string) at the cursor as text in the element
   * Similar to how pasting works with Control + V
   * Similar to typing, if a text is highlighted, replace the selection with the content
   */
}

//Message comes from Logic
//Message gets saved in Clipboard
//

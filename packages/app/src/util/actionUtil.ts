import type { Storage } from "@plasmohq/storage"

import { isPasteResponse } from "~types/guard.types"
import type {
  DatabaseMessageQuery,
  ExtraDatabaseMessageQuery,
  PasteResponse,
  SessionData
} from "~types/user.types"

type CommsTypeWithPopup = {
  popupPort: chrome.runtime.Port
  scriptPort: {
    portMap: Map<number, chrome.runtime.Port>
    headTabsOfEachWindow: Map<number, number>
  }
}

export function sendMessageInDirection<T extends CommsTypeWithPopup>(
  comms: T,
  rawMsg: SessionData | DatabaseMessageQuery,
  direction: keyof T
): void

export function sendMessageInDirection<T extends CommsTypeWithPopup>(
  comms: T,
  rawMsg: PasteResponse,
  direction: chrome.runtime.Port
): void

export function sendMessageInDirection<T extends CommsTypeWithPopup>(
  comms: T,
  rawMsg: any,
  direction: any
): void {
  const { popupPort, scriptPort } = comms

  if (isPasteResponse(rawMsg)) {
    ;(direction as chrome.runtime.Port).postMessage(rawMsg)
  } else {
    switch (direction) {
      case "popupPort":
        if (popupPort && isPopupDirectionValid(popupPort)) {
          const craftedMsg = craftMessageForPopup(rawMsg)
          popupPort.postMessage(craftedMsg)
        }
        break

      case "scriptPort":
        sendToTabs(scriptPort.portMap, craftMessageForScript(rawMsg))
        break

      default:
        break
    }
  }
}
function isPopupDirectionValid(popupPort: chrome.runtime.Port) {
  return (
    popupPort.sender &&
    popupPort.sender.url.includes("://hnpdhegmlbdddgidflplnehohipegaah/") &&
    popupPort.sender.url.includes("popup.html")
  )
}

function craftMessageForPopup(
  rawMsg: SessionData | DatabaseMessageQuery | ExtraDatabaseMessageQuery
) {
  return !rawMsg
    ? null
    : {
        preferredCopyShortCut: rawMsg.preferredCopyShortCut,
        preferredPasteShortCut: rawMsg.preferredPasteShortCut,
        ListenTo: rawMsg.ListenTo,
        maxConnections: rawMsg.maxConnections,
        connectionLongevity: rawMsg.connectionLongevity
      }
}

function craftMessageForScript(
  rawMsg: SessionData | DatabaseMessageQuery | ExtraDatabaseMessageQuery
) {
  return !rawMsg
    ? null
    : {
        preferredCopyShortCut: rawMsg.preferredCopyShortCut,
        preferredPasteShortCut: rawMsg.preferredPasteShortCut,
        ListenTo: rawMsg.ListenTo
      }
}

function sendToTabs(
  portMap: Map<number, chrome.runtime.Port>,
  craftedMsg: any
) {
  console.log("Sending to Tabs")
  if (portMap.size > 0) {
    for (const port of portMap.values()) {
      console.log("Sending to", port.sender.tab.id)
      port.postMessage(craftedMsg)
    }
  }
}

// const testBool = true
// if (!testBool && rawMsg.ListenTo === "CLIPBOARD") {
//   const headTabsOfEachWindow = [
//     ...comms.scriptPort.headTabsOfEachWindow.keys()
//   ]

//   for (const port of portMap.values()) {
//     console.log("Sending to 1", port.sender.tab.id)
//     if (headTabsOfEachWindow.includes(port.sender.tab.id)) {
//       port.postMessage(craftedMsg)
//     } else {
//       port.postMessage(null)
//     }
//   }
// } else if (testBool) {
//   for (const port of portMap.values()) {
//     console.log("Sending to", port.sender.tab.id)
//     port.postMessage(craftedMsg)
//   }
// }

export type actionParamType =
  | {
      operation: { data: SessionData }
      storage: Storage
      mode: "ADD" | "UPDATE"
      msg: SessionData
    }
  | {
      operation: { data: SessionData }
      storage: Storage
      mode: "DELETE"
    }

export async function onChangeLocalStorageUpdate(
  params: actionParamType
): Promise<boolean> {
  const { operation, storage, mode } = params

  try {
    switch (mode) {
      case "ADD":
        operation.data = params.msg
        await storage.setItem("operationData", params.msg)
        break
      case "DELETE":
        operation.data = null
        await storage.clear()
        const data = await storage.get("operationData")
        console.log("Deleted LS: " + JSON.stringify(data))
        break
      default:
        break
    }
  } catch (error) {
    console.log(error)
    return false
  }

  return true
}

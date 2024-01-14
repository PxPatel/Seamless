import type { Storage } from "@plasmohq/storage"

import { isPasteResponse } from "~types/guard.types"
import type {
  BaseConfigSetting,
  DatabaseMessageQuery,
  ExtraDatabaseMessageQuery,
  PasteResponse,
  SessionData
} from "~types/user.types"

type CommsTypeWithPopup = {
  popupPort: chrome.runtime.Port
  scriptPort: {
    portMap: Map<number, chrome.runtime.Port>
    activeTabID: number
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
        sendToTabs(scriptPort, craftMessageForScript(rawMsg))
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
): BaseConfigSetting {
  return !rawMsg
    ? null
    : {
        preferredCopyShortCut: rawMsg.preferredCopyShortCut,
        preferredPasteShortCut: rawMsg.preferredPasteShortCut,
        ListenTo: rawMsg.ListenTo
      }
}

function sendToTabs(
  scriptPort: {
    portMap: Map<number, chrome.runtime.Port>
    activeTabID: number
  },
  craftedMsg: BaseConfigSetting
) {
  console.log("Sending to Tabs")
  if (scriptPort.portMap.size > 0 && scriptPort.activeTabID) {
    if (craftedMsg.ListenTo === "CLIPBOARD") {
      console.log("HeadTab:", scriptPort.activeTabID)
      console.log("All tabsid: ", [...scriptPort.portMap.values()])
      for (const port of scriptPort.portMap.values()) {
        if (scriptPort.activeTabID === port.sender.tab.id) {
          port.postMessage(craftedMsg)
        } else {
          port.postMessage({
            ...craftedMsg,
            ListenTo: "STOP"
          } as BaseConfigSetting)
        }
      }
    } else {
      for (const port of scriptPort.portMap.values()) {
        console.log("Normally Sending to", port.sender.tab.id)
        port.postMessage(craftedMsg)
      }
    }
  }
}

//When sending PasteRespones: Send it to the certain Port, orrrr send it to one Tab
//The one Tab, will add it to clipboard and the pasting can happen itself
//One tab should be the head tab in the map.

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

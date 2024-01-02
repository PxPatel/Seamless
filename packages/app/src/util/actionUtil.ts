import type { Session } from "inspector"

import type { Storage } from "@plasmohq/storage"

import type {
  BaseConfigSetting,
  FullConfigSetting,
  SessionData
} from "~types/user.types"
import { findDifference } from "~util/dataProcessing"

export function sendMessageBasedOnSender(
  comms: {
    popupPort: chrome.runtime.Port
    scriptPort: chrome.runtime.Port
  },
  rawMsg: SessionData,
  direction?: {}
) {
  const sender = comms.popupPort ? comms.popupPort.sender : null
  let craftedMsg: FullConfigSetting | BaseConfigSetting
  console.log("Sending MSG: " + JSON.stringify(rawMsg))

  if (!rawMsg) {
    craftedMsg = null
  } else if (
    sender &&
    sender.url.includes("://hnpdhegmlbdddgidflplnehohipegaah/") &&
    sender.url.includes("popup.html")
  ) {
    craftedMsg = {
      preferredCopyShortCut: rawMsg.preferredCopyShortCut,
      preferredPasteShortCut: rawMsg.preferredPasteShortCut,
      ListenTo: rawMsg.ListenTo,
      maxConnections: rawMsg.maxConnections,
      connectionLongevity: rawMsg.connectionLongevity
    }
  }
  //For Content Script, a new port will be open
  // else if (sender && isValidURL(sender.url)) {
  //   craftedMsg = {
  //     config: {
  //       preferredCopyShortCut: rawMsg.preferredCopyShortCut,
  //       preferredPasteShortCut: rawMsg.preferredPasteShortCut,
  //       ListenTo: rawMsg.ListenTo
  //     }
  //   }
  // }
  comms.popupPort?.postMessage(craftedMsg)
}

export function sendMessageInDirection<
  T extends {
    popupPort: chrome.runtime.Port
    scriptPort: chrome.runtime.Port
  } & Record<string, chrome.runtime.Port>
>(comms: T, rawMsg: SessionData, direction: keyof T) {
  let craftedMsg: any
  let validDirection: boolean

  switch (direction) {
    case "popupPort":
      craftedMsg = !rawMsg
        ? null
        : {
            preferredCopyShortCut: rawMsg.preferredCopyShortCut,
            preferredPasteShortCut: rawMsg.preferredPasteShortCut,
            ListenTo: rawMsg.ListenTo,
            maxConnections: rawMsg.maxConnections,
            connectionLongevity: rawMsg.connectionLongevity
          }

      validDirection = comms.popupPort?.sender
        ? comms.popupPort.sender.url.includes(
            "://hnpdhegmlbdddgidflplnehohipegaah/"
          ) && comms.popupPort.sender.url.includes("popup.html")
        : false
      validDirection && comms.popupPort?.postMessage(craftedMsg)
      break

    case "scriptPort":
      craftedMsg = !rawMsg
        ? null
        : {
            preferredCopyShortCut: rawMsg.preferredCopyShortCut,
            preferredPasteShortCut: rawMsg.preferredPasteShortCut,
            ListenTo: rawMsg.ListenTo
          }

      validDirection = comms.scriptPort?.sender.tab ? true : false

      console.log(validDirection, "sending 2")
      validDirection && comms.scriptPort?.postMessage(craftedMsg)
      break

    default:
      break
  }
}

type actionParamType =
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

export async function onChangeLocalStorageUpdate(params: actionParamType) {
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
      // case "UPDATE":
      //   let [hasDifference, updatedMsg] = findDifference(operation, params.msg)
      //   if (hasDifference) {
      //     res = updatedMsg
      //     await storage.setItem("operationData", JSON.stringify(updatedMsg))
      //   }
      //   break
      default:
        break
    }
  } catch (error) {
    console.log(error)
  }
}
//CopyEvent msg from Content
/**
 * Save data to LocalStorage
 * Send data to FB Firestore
 *  --> Handle error with a revert to previous state
 */

//ConfigChange msg from Popup
/**
 * Send data to LocalStorage
 * Send data to FB Firestore
 *  --> Handle error with a revert to previous state
 */

import { Storage as LStorage } from "@plasmohq/storage"

import {
  handleSignInWithEmailAndPassword,
  handleSignOut
} from "~lib/AuthContainer/AuthContainer"
import { Logic } from "~logic"
import type { PopupMessage, SessionData, TabMessage } from "~types/user.types"

import {
  onChangeLocalStorageUpdate,
  sendMessageInDirection
} from "./util/actionUtil"

export type PortName = "popupPort" | "scriptPort" | null

export class Seamless {
  private storage: LStorage = new LStorage({
    area: "sync"
  })

  private operation: { data: SessionData }

  private comms: {
    popupPort: chrome.runtime.Port
    scriptPort: {
      portMap: Map<number, chrome.runtime.Port>
      activeTabID: number
    }
  } = {
    popupPort: null,
    scriptPort: {
      portMap: new Map<number, chrome.runtime.Port>(),
      activeTabID: null
    }
  }

  logicInstance: Logic

  public async initiatePort() {
    await this.initializeOperationsStore()

    this.logicInstance = new Logic({
      storage: this.storage,
      operation: this.operation,
      comms: this.comms
    })

    chrome.runtime.onConnect.addListener((port) => {
      console.log("trigger happy, before main send")
      this.assignPortToComms(port).then((portName) => {
        if (!portName) {
          return
        }

        console.log("main Send")

        sendMessageInDirection(this.comms, this.operation.data, portName)
        port.onMessage.addListener(this.onPortMessage(portName))
        port.onDisconnect.addListener(this.onPortDisconnect(portName))
        this.initalizeTabPositionCalibration()
      })
    })
  }

  private async initalizeTabPositionCalibration() {
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      const tabId = activeInfo.tabId
      const windowId = activeInfo.windowId

      // The tab with tabId was moved
      console.log(
        `Active tab changed. Tab ID: ${tabId}, Window ID: ${windowId}`
      )
      await this.assignHeadTabsMap({ recall: true, tabId })
    })
  }

  private async initializeOperationsStore() {
    this.operation = {
      data: await this.storage.get<SessionData>("operationData")
    }
  }

  private async assignPortToComms(
    port: chrome.runtime.Port
  ): Promise<PortName> {
    const portName: PortName = port.sender.tab ? "scriptPort" : "popupPort"
    if (portName === "popupPort") {
      this.comms.popupPort = port
      await this.expiredUserCheck()
    }
    if (portName === "scriptPort") {
      if (portName !== port.name) {
        return null
      }

      this.comms.scriptPort.portMap.set(port.sender.tab.id, port)
      console.log("Checking map from main:", [
        ...this.comms.scriptPort.portMap.values()
      ])
      await this.assignHeadTabsMap()
    }
    return portName
  }

  private onPortDisconnect(portName: PortName) {
    const popupDisconnect = (port: chrome.runtime.Port) => {
      this.comms.popupPort = null
    }

    const tabDisconnect = async (port: chrome.runtime.Port) => {
      this.comms.scriptPort.portMap.delete(port.sender.tab.id)
    }

    return portName === "popupPort" ? popupDisconnect : tabDisconnect
  }

  private async assignHeadTabsMap(options?: {
    recall?: boolean
    tabId?: number
  }) {
    const activeTabs = await chrome.tabs.query({
      active: true,
      currentWindow: true
    })
    console.log(activeTabs)

    this.comms.scriptPort.activeTabID =
      activeTabs.length > 0 ? activeTabs.at(0).id : null

    if (options?.recall) {
      sendMessageInDirection(this.comms, this.operation.data, "scriptPort")
    }
  }

  private onPortMessage(portName: PortName) {
    const popupMessageSwitchboard = (
      msg: PopupMessage,
      port: chrome.runtime.Port
    ) => {
      const { type } = msg
      const { configChangeEvent } = this.logicInstance.popupMessageAction()

      switch (type) {
        case "ConfigChange":
          console.log("Config got Modified")
          break
        default:
          break
      }
    }

    const tabMessageSwitchboard = (
      msg: TabMessage,
      port: chrome.runtime.Port
    ) => {
      const { type } = msg
      const { copyEventAction, pasteRequestAction } =
        this.logicInstance.tabMessageActions()

      switch (type) {
        case "CopyEvent":
          console.log("SL", msg.data.content)
          copyEventAction(msg)
          break

        case "PasteRequest":
          pasteRequestAction({ type: msg.type, port: port })
        default:
          break
      }
    }

    return portName === "popupPort"
      ? popupMessageSwitchboard
      : tabMessageSwitchboard
  }

  private async expiredUserCheck() {
    console.log(
      "EXP: " + this.operation.data?.exp + "\n" + "NOW: " + Date.now()
    )
    const exp: number = this.operation.data?.exp ?? null
    if (exp !== null && exp <= Date.now()) {
      console.log("EXP < Now => Delete")
      await onChangeLocalStorageUpdate({
        operation: this.operation,
        storage: this.storage,
        mode: "DELETE"
      })
    }
  }
}

export async function initialAuthFlow(
  message: { type: string; data?: any },
  _: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
): Promise<boolean> {
  if (message.type === "AuthSignin") {
    const { email, password } = message.data
    ;(async () => {
      await handleSignInWithEmailAndPassword(email, password)
    })()

    return true
  } else if (message.type === "Signout") {
    ;(async () => {
      await handleSignOut()
    })()
    sendResponse("")
    return true
  }
}

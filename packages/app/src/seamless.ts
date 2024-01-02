import { log } from "console"

import { Storage as LStorage } from "@plasmohq/storage"

import {
  handleSignInWithEmailAndPassword,
  handleSignOut
} from "~lib/AuthContainer/AuthContainer"
import type { SessionData } from "~types/user.types"

import {
  onChangeLocalStorageUpdate,
  sendMessageInDirection
} from "./util/actionUtil"

export class Seamless {
  storage: LStorage = new LStorage({
    area: "sync"
  })

  operation: { data: SessionData }
  comms: {
    popupPort: chrome.runtime.Port
    scriptPort: chrome.runtime.Port
  } = { popupPort: null, scriptPort: null }

  private unsubToPortMessageReceiver: () => void

  private async initializeOperations() {
    this.operation = {
      data: await this.storage.get<SessionData>("operationData")
    }
  }

  public async initiatePort() {
    await this.initializeOperations()

    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === "popupPort") {
        this.comms.popupPort = port
        this.expiredUserCheck()
        sendMessageInDirection(this.comms, this.operation.data, "popupPort")
      }
      if (port.name === "scriptPort") {
        log("Connected to Script", port.sender.tab.id, port.sender.id)
        this.comms.scriptPort = port
        sendMessageInDirection(this.comms, this.operation.data, "scriptPort")

        port.onMessage.addListener((msg) => {
          if (msg.type === "message") {
            console.log(msg.message)
          }
        })

        //Create a map for the ports opened by tabs
      }

      port.onDisconnect.addListener(onPortDisconnect)

      if (this.comms.popupPort || this.comms.scriptPort) {
        this.unsubToPortMessageReceiver = this.onMessagePortReceiver()
      }
    })
    

    const onPortDisconnect = (port: chrome.runtime.Port): void => {
      this.comms[port.name] = null
      if (
        !(this.comms.popupPort || this.comms.scriptPort) &&
        this.unsubToPortMessageReceiver !== undefined
      ) {
        this.unsubToPortMessageReceiver()
      }
    }
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

  //WORK ON THIS
  private onMessagePortReceiver() {
    return () => {}
    const action = (msg: { task: string; content: string }) => {
      switch (msg.task) {
        case "CopyEvent":
          console.log("Something got Copied")
          break
        case "ConfigChange":
          console.log("Config got Modified")
          break
        default:
          break
      }
    }

    this.comms.scriptPort.onMessage.addListener(action)
    return () => this.comms.scriptPort.onMessage.removeListener(action)
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

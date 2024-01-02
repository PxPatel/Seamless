import { log } from "console"
import { type User } from "firebase/auth"

import type { Storage as LStorage } from "@plasmohq/storage"

import { listenAuthState } from "~lib/AuthContainer/AuthContainer"
import { initialAuthFlow } from "~seamless"
import { type SessionData } from "~types/user.types"
import {
  onChangeLocalStorageUpdate,
  sendMessageInDirection
} from "~util/actionUtil"
import { getUserDataFromDB, setUserDataInDB } from "~util/cloudFunctionCalls"
import { GoogleMSG } from "~util/googleMsg"

import type { Seamless } from "./seamless"

export class Logic {
  private storage: LStorage
  private operation: { data: SessionData }
  private user: User
  private storeMSG: GoogleMSG
  private comms: {
    popupPort: chrome.runtime.Port
    scriptPort: chrome.runtime.Port
  }

  // private injectContentScript: (cb: () => void) => Promise<void>

  constructor(app: Seamless) {
    this.storage = app.storage
    this.operation = app.operation
    this.user = null
    this.storeMSG = null
    this.comms = app.comms
  }

  public async handleAuthAndRunProgram() {
    this.initiateStatusListeners()
    chrome.runtime.onMessage.addListener(initialAuthFlow)

  }


  private initiateStatusListeners() {
    listenAuthState(async (user: User) => {
      if (user) {
        this.user = user

        //Initial retrieval/set
        const [userDataFromDB, requiredFieldsMissing] =
          await getUserDataFromDB(user)
        if (requiredFieldsMissing) {
          await setUserDataInDB(user, userDataFromDB)
        }

        //Initiate Google Messages
        //Integrate message events response
        this.storeMSG = new GoogleMSG(user)
        log(await this.storeMSG.initiateToken())
        const isMsgActive = this.storeMSG.activate((incomingMessage: any) => {
          console.log("message", incomingMessage)
          console.log("typeof:", typeof incomingMessage)
        })

        const modifiedData: SessionData = {
          uid: user.uid,
          exp: Date.parse((await user.getIdTokenResult()).expirationTime),
          preferredCopyShortCut: userDataFromDB.preferredCopyShortCut,
          preferredPasteShortCut: userDataFromDB.preferredPasteShortCut,
          ListenTo: userDataFromDB.ListenTo,
          maxConnections: userDataFromDB.maxConnections,
          connectionLongevity: userDataFromDB.connectionLongevity
        }

        onChangeLocalStorageUpdate({
          operation: this.operation,
          storage: this.storage,
          mode: "ADD",
          msg: modifiedData
        })
      } else {
        this.user = null

        if (this.storeMSG !== null) {
          this.storeMSG.deactivate()
        }

        //Delete the cached data
        console.log("Triggered Signout")
        onChangeLocalStorageUpdate({
          operation: this.operation,
          storage: this.storage,
          mode: "DELETE"
        })
      }
      sendMessageInDirection(this.comms, this.operation?.data, "popupPort")
      sendMessageInDirection(this.comms, this.operation?.data, "scriptPort")
    })
  }
}

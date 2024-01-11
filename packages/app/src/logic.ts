import { type User } from "firebase/auth"

import type { Storage as LStorage } from "@plasmohq/storage"

import { listenAuthState } from "~lib/AuthContainer/AuthContainer"
import { initialAuthFlow } from "~seamless"
import {
  type ContentType,
  type DatabaseMessageQuery,
  type ExtraDatabaseMessageQuery,
  type GoogleMessageData,
  type PasteResponse,
  type PopupMessage,
  type RawGoogleMessageData,
  type SessionData,
  type TabMessage
} from "~types/user.types"
import {
  onChangeLocalStorageUpdate,
  sendMessageInDirection
} from "~util/actionUtil"
import {
  getUserDataFromDB,
  setUserDataInDB,
  updateUserDataInDB
} from "~util/cloudFunctionCalls"
import { fillEmptyFieldsInUserDataToDefault } from "~util/dataProcessing"
import { GoogleMSG } from "~util/googleMsg"

export class Logic {
  private storage: LStorage
  private operation: { data: SessionData }
  private user: User
  private gcmInstance: GoogleMSG
  private comms: {
    popupPort: chrome.runtime.Port
    scriptPort: {
      portMap: Map<number, chrome.runtime.Port>
      headTabsOfEachWindow: Map<number, number>
    }
  }

  private contentHolder: ContentType

  // private injectContentScript: (cb: () => void) => Promise<void>

  constructor({ storage, operation, comms }) {
    this.storage = storage
    this.operation = operation
    this.comms = comms
    this.user = null
    this.gcmInstance = null
    this.contentHolder = { content: null, timeCopied: null }
  }

  public async handleAuthAndRunProgram() {
    this.initiateStatusListeners()
    chrome.runtime.onMessage.addListener(initialAuthFlow)
  }

  private initiateStatusListeners() {
    const loadDataFromDB = async (user: User) => {
      const [userDataFromDB, requiredFieldsMissing] =
        await getUserDataFromDB(user)
      if (requiredFieldsMissing) {
        await setUserDataInDB(user, userDataFromDB)
      }

      return userDataFromDB
    }

    const compileOperationsData = async (
      user: User,
      userDataFromDB: ExtraDatabaseMessageQuery
    ): Promise<SessionData> => {
      return {
        uid: user.uid,
        exp: Date.parse((await user.getIdTokenResult()).expirationTime),
        preferredCopyShortCut: userDataFromDB.preferredCopyShortCut,
        preferredPasteShortCut: userDataFromDB.preferredPasteShortCut,
        ListenTo: userDataFromDB.ListenTo,
        maxConnections: userDataFromDB.maxConnections,
        connectionLongevity: userDataFromDB.connectionLongevity
      }
    }

    const initateGoogleMessages = async (
      user: User,
      actionOnMessage?: {
        (incomingMessage: chrome.gcm.IncomingMessage): void
      }
    ) => {
      const gcmInstance = new GoogleMSG(user)
      await gcmInstance.initiateToken()
      gcmInstance.activate(actionOnMessage)
      return gcmInstance
    }

    const googleMessageSwitchboard = async (
      incomingMessage: chrome.gcm.IncomingMessage
    ) => {
      const revertStringifyObject = (
        messageData: RawGoogleMessageData
      ): GoogleMessageData => {
        const unstringifiedObj = {}
        for (const key in messageData) {
          if (Object.prototype.hasOwnProperty.call(messageData, key)) {
            unstringifiedObj[key] = JSON.parse(messageData[key])
          }
        }
        return unstringifiedObj as GoogleMessageData
      }

      const handleContentUpdate = (
        revertedMessage: GoogleMessageData
      ): void => {
        const updatedFields = revertedMessage.updatedFields

        if (
          updatedFields.includes("content") &&
          revertedMessage.afterUpdate.content
        ) {
          this.contentHolder = {
            content: revertedMessage.afterUpdate.content,
            timeCopied: revertedMessage.afterUpdate.timeCopied
          }
        }
      }

      const handleOperationsUpdate = async (
        revertedMessage: GoogleMessageData
      ): Promise<void> => {
        const updatedFields = revertedMessage.updatedFields

        if (
          updatedFields.some((field) =>
            [
              "ListenTo",
              "preferredCopyShortCut",
              "preferredPasteShortCut",
              "connectionLongevity"
            ].includes(field)
          )
        ) {
          const [afterUpdate] = fillEmptyFieldsInUserDataToDefault(
            revertedMessage.afterUpdate,
            true
          )
          const newOperationsData: SessionData = await compileOperationsData(
            this.user,
            afterUpdate
          )

          const savedSuccessful = onChangeLocalStorageUpdate({
            operation: this.operation,
            storage: this.storage,
            mode: "ADD",
            msg: newOperationsData
          })

          if (savedSuccessful) {
            sendMessageInDirection(
              this.comms,
              afterUpdate as DatabaseMessageQuery,
              "scriptPort"
            )
            sendMessageInDirection(
              this.comms,
              afterUpdate as DatabaseMessageQuery,
              "popupPort"
            )
          }
        }

        return
      }

      const messageData = incomingMessage.data as RawGoogleMessageData
      const revertedMessage = revertStringifyObject(messageData)

      handleContentUpdate(revertedMessage)
      await handleOperationsUpdate(revertedMessage)

      console.log("Message", revertedMessage)
    }

    listenAuthState(async (user: User) => {
      if (user) {
        this.user = user
        const userDataFromDB = await loadDataFromDB(user)

        this.gcmInstance = await initateGoogleMessages(
          user,
          googleMessageSwitchboard
        )

        const newOperationsData: SessionData = await compileOperationsData(
          user,
          userDataFromDB
        )

        onChangeLocalStorageUpdate({
          operation: this.operation,
          storage: this.storage,
          mode: "ADD",
          msg: newOperationsData
        })
      } else {
        this.user = null

        if (this.gcmInstance !== null) {
          this.gcmInstance.deactivate()
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

      console.log("Logic Sending")

      sendMessageInDirection(this.comms, this.operation?.data, "scriptPort")
    })
  }

  public tabMessageActions() {
    const copyEventAction = async <
      T extends TabMessage & { type: "CopyEvent" }
    >(
      message: T
    ) => {
      console.log("LG", message)

      let delivery = await updateUserDataInDB(this.user, {
        updateField: "MESSAGE",
        data: message.data
      })

      if (delivery.status === "SUCCESS") {
      } else {
        console.log(delivery.error)
      }
    }

    const pasteRequestAction = async <
      T extends TabMessage & { type: "PasteRequest" }
    >(
      message: T
    ) => {
      console.log("Paste Request Recieved From", message.port.sender.tab.id)

      const pasteResponse: PasteResponse = {
        type: "PasteResponse",
        content: this.contentHolder.content
      }

      sendMessageInDirection(this.comms, pasteResponse, message.port)
    }

    return { copyEventAction, pasteRequestAction }
  }

  public popupMessageAction() {
    const configChangeEvent = (message: PopupMessage) => {}

    return { configChangeEvent }
  }
}

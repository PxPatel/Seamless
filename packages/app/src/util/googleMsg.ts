import type { User } from "firebase/auth"

import { updateUserDataInDB } from "~util/cloudFunctionCalls"

export class GoogleMSG {
  private token: string
  private user: User
  private actionOnMessage: (message: chrome.gcm.IncomingMessage) => void

  //Constructor
  constructor(user: User) {
    this.user = user
  }

  public getToken = () => {
    return this.token
  }

  public initiateToken = async () => {
    return new Promise<string>((resolve, reject) => {
      chrome.gcm.register(
        [`${process.env.PLASMO_PUBLIC_FIREBASE_GCM_SENDER_ID}`],
        (token) => {
          if (chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError)
            reject(chrome.runtime.lastError)
          } else {
            this.token = token
            console.log("In class", this.token)

            resolve(this.token)
          }
        }
      )
    })
  }

  private async addTokenToUserDocument() {
    let result = await updateUserDataInDB(this.user, {
      updateField: "TOKEN",
      action: "UNION",
      data: {
        tokens: this.token
      }
    })
    return result
  }

  private async removeTokenFromUserDocument() {
    let result = await updateUserDataInDB(this.user, {
      updateField: "TOKEN",
      action: "REMOVE",
      data: {
        tokens: this.token
      }
    })
    return result
  }

  public async activate(cb: (message: chrome.gcm.IncomingMessage) => void) {
    if (!this.token) {
      return false
    }

    //When activated, add token to doc
    const { status: status } = await this.addTokenToUserDocument()

    //Turn on listener
    if (status) {
      this.actionOnMessage = cb
      chrome.gcm.onMessage.addListener(this.actionOnMessage)
    } else {
      return false
    }
    return true
  }

  public async deactivate() {
    if (!this.token) {
      return false
    }

    //When deactivated, remove token from doc
    const { status: status } = await this.removeTokenFromUserDocument()

    //Turn off listener
    if (status) {
      chrome.gcm.onMessage.removeListener(this.actionOnMessage)
    } else {
      return false
    }
    return true
  }
}

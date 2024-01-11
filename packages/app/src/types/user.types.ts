export type BaseConfigSetting = {
  preferredCopyShortCut: string[]
  preferredPasteShortCut: string[]
  ListenTo: "CLIPBOARD" | "SHORTCUT" | "STOP"
}

export type AdvancedConfigSetting = {
  maxConnections: number
  connectionLongevity: number
}

export type FullConfigSetting = BaseConfigSetting & AdvancedConfigSetting

export type UserMetadata = {
  readonly uid: string | null
  exp: number | null
}

export type SessionData = (UserMetadata & FullConfigSetting) | null

export type ContentType = {
  content: string
  timeCopied: number
}

export type DatabaseMessageQuery = FullConfigSetting & ContentType

export type ExtraDatabaseMessageQuery = DatabaseMessageQuery &
  Record<string, any>

//----------------------------------------------------------------------------

//Session data doesn't have content
//DBMQ doesnt have userMetadata

export type TabMessage =
  | {
      type: "CopyEvent"
      data: ContentType
    }
  | {
      type: "PasteRequest"
      port: chrome.runtime.Port
    }

export type PopupMessage = {
  type: string
  data: {}
}

export type RawGoogleMessageData = {
  afterUpdate: string
  updatedFields: string
}

export type GoogleMessageData = {
  afterUpdate: DatabaseMessageQuery
  updatedFields: (keyof DatabaseMessageQuery)[]
}

export type PasteResponse = {
  type: "PasteResponse"
  content: string
  callback?: () => {}
}

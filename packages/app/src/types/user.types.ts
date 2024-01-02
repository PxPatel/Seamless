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
  timeCopied: string
}

export type DatabaseMessageQuery = FullConfigSetting & ContentType

export type ExtraDatabaseMessageQuery = DatabaseMessageQuery &
  Record<string, unknown>

//----------------------------------------------------------------------------

//Session data doesn't have content
//DBMQ doesnt have userMetadata

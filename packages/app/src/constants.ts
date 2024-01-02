import type { DatabaseMessageQuery, FullConfigSetting } from "~types/user.types"

export const SET_USER_DATA_API_URL =
  "http://127.0.0.1:5001/seamless-dev-142c7/us-central1/setUserData"

export const GET_USER_DATA_API_URL =
  "http://127.0.0.1:5001/seamless-dev-142c7/us-central1/getUserData"

export const UPDATE_USER_DATA_API_URL =
  "http://127.0.0.1:5001/seamless-dev-142c7/us-central1/updateUserData"

export const INITIAL_CONFIG: FullConfigSetting = {
  preferredCopyShortCut: ["Control", "c"],
  preferredPasteShortCut: ["Control", "v"],
  ListenTo: "SHORTCUT",
  maxConnections: 5,
  connectionLongevity: 1000 * 60 * 30
}

export const INITIAL_USER_DOCUMENT: DatabaseMessageQuery = {
  ...INITIAL_CONFIG,
  content: "",
  timeCopied: ""
}

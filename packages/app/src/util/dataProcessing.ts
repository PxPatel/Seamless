import { INITIAL_USER_DOCUMENT } from "~constants"
import {
  type DatabaseMessageQuery,
  type ExtraDatabaseMessageQuery,
  type FullConfigSetting,
  type SessionData
} from "~types/user.types"

export function findDifference(
  savedValue: SessionData,
  newDataPayload: DatabaseMessageQuery
): [boolean, SessionData] | null {
  if (!savedValue || !newDataPayload) {
    return null
  }

  const keysToCompare: Array<keyof DatabaseMessageQuery> = [
    "preferredCopyShortCut",
    "preferredPasteShortCut",
    "ListenTo",
    "maxConnections",
    "connectionLongevity"
    // Add any other keys you want to compare here
  ]

  let hasDifference = false
  const msg: Partial<FullConfigSetting> = {}

  // Compare keys from newDataPayload against keysToCompare
  Object.keys(newDataPayload).forEach((key: keyof DatabaseMessageQuery) => {
    if (keysToCompare.includes(key)) {
      if (savedValue[key] !== newDataPayload[key]) {
        hasDifference = true
        msg[key] = newDataPayload[key]
      } else {
        msg[key] = savedValue[key]
      }
    }
  })

  return [hasDifference, { ...savedValue, ...msg } as SessionData]
}

export const fillEmptyFieldsInUserDataToDefault = (
  providedData: Partial<DatabaseMessageQuery>
): [ExtraDatabaseMessageQuery, boolean] => {
  if (!providedData) {
    providedData = {}
  }
  const res: ExtraDatabaseMessageQuery = {
    ...INITIAL_USER_DOCUMENT,
    ...providedData
  }

  const expectedKeys = Object.keys(INITIAL_USER_DOCUMENT || {})
  const dataKeys = Object.keys(providedData || {})
  const requiredFieldsMissing = expectedKeys.some(
    (key) => !dataKeys.includes(key)
  )

  //   dataKeys.forEach((key) => {
  //     if (
  //       providedData[key] !== null &&
  //       providedData[key] !== undefined &&
  //       typeof providedData[key] === typeof INITIAL_USER_DOCUMENT[key]
  //     ) {
  //       res[key] = providedData[key] // Assign the provided value to the result
  //     }
  //     // For non-null/undefined fields with wrong type, you might want to handle accordingly (e.g., log, ignore, or set default)
  //     else {
  //       console.log(typeof providedData[key])
  //       console.log(typeof INITIAL_USER_DOCUMENT[key])

  //       console.error(
  //         `Field ${key} has incorrect type or value: ${providedData[key]}`
  //       )
  //     }
  //   })

  return [res, requiredFieldsMissing]
}

export const testfillEmptyFieldsInUserDataToDefault = <T>(
  providedData: Partial<T>
): [ExtraDatabaseMessageQuery, boolean] => {
  if (!providedData) {
    providedData = {}
  }
  const res: ExtraDatabaseMessageQuery = {
    ...INITIAL_USER_DOCUMENT,
    ...providedData
  }

  const expectedKeys = Object.keys(INITIAL_USER_DOCUMENT || {})
  const dataKeys = Object.keys(providedData || {})
  const requiredFieldsMissing = expectedKeys.some(
    (key) => !dataKeys.includes(key)
  )

  return [res, requiredFieldsMissing]
}

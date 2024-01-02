import type { User } from "firebase/auth"

import {
  GET_USER_DATA_API_URL,
  SET_USER_DATA_API_URL,
  UPDATE_USER_DATA_API_URL
} from "~constants"
import type {
  ContentType,
  DatabaseMessageQuery,
  ExtraDatabaseMessageQuery,
  FullConfigSetting
} from "~types/user.types"
import {
  fillEmptyFieldsInUserDataToDefault,
  testfillEmptyFieldsInUserDataToDefault
} from "~util/dataProcessing"

// type cloudServerCalls = {
//   getUserDataFromDB: (user: User) => Promise<[ExtraDatabaseMessageQuery, boolean]>
//   setUserDataInDB: (user: User, compiledData: ExtraDatabaseMessageQuery) => Promise<void>
//   updateUserDataInDB: (user: User, payload: UpdateDBType) => Promise<void>
// }

export async function setUserDataInDB(
  user: User,
  payload: ExtraDatabaseMessageQuery
): Promise<
  { status: boolean } & ({ data: ExtraDatabaseMessageQuery } | { error: Error })
> {
  const url = new URL(SET_USER_DATA_API_URL)

  const idtoken = await user.getIdToken()
  url.searchParams.append("idtoken", idtoken)
  url.searchParams.append("payload", JSON.stringify(payload))

  try {
    var fetchResult = await fetch(url)
    if (fetchResult.ok) {
      let resultData = await fetchResult.json()
      console.log(resultData)
      return { status: true, data: payload }
    }
  } catch (error) {
    console.log(error)
    return { status: false, error: error }
  }
}

//Use Generics Maybe
export async function getUserDataFromDB(
  user: User
): Promise<[ExtraDatabaseMessageQuery, boolean]> {
  const url = new URL(GET_USER_DATA_API_URL)

  const idtoken = await user.getIdToken()
  url.searchParams.append("idtoken", idtoken)

  let rawdataFromDB: Partial<DatabaseMessageQuery> = {}
  try {
    var fetchResult = await fetch(url)
    if (fetchResult.ok) {
      rawdataFromDB = await fetchResult.json()
    } else {
      let apiError = await fetchResult.text()
      console.log(apiError)
    }
  } catch (error) {
    rawdataFromDB = {}
    console.log(error)
  }
  return fillEmptyFieldsInUserDataToDefault(rawdataFromDB)
}

//const [data, boolean] = get<DatabaseMessaegeQuery>()
export async function testgetUserDataFromDB<T>(
  user: User
): Promise<[ExtraDatabaseMessageQuery, boolean]> {
  const url = new URL(GET_USER_DATA_API_URL)

  const idtoken = await user.getIdToken()
  url.searchParams.append("idtoken", idtoken)

  let rawdataFromDB: Partial<T>

  try {
    var fetchResult = await fetch(url)
    if (fetchResult.ok) {
      rawdataFromDB = await fetchResult.json()
    } else {
      let apiError = await fetchResult.text()
      console.log(apiError)
    }
  } catch (error) {
    rawdataFromDB = {}
    console.log(error)
  }

  return testfillEmptyFieldsInUserDataToDefault<T>(rawdataFromDB)
}

type UpdateDBType =
  | {
      updateField: "MESSAGE"
      data: ContentType
    }
  | {
      updateField: "TOKEN"
      action: "UNION" | "REMOVE"
      data: {
        tokens: string
      }
    }
  | {
      updateField: "CONFIG"
      data: FullConfigSetting
    }

export async function updateUserDataInDB(
  user: User,
  payload: UpdateDBType
): Promise<{ status: boolean } & ({ data: UpdateDBType } | { error: Error })> {
  const url = new URL(UPDATE_USER_DATA_API_URL)

  const idtoken = await user.getIdToken()
  url.searchParams.append("idtoken", idtoken)
  url.searchParams.append("payload", JSON.stringify(payload))

  try {
    var fetchResult = await fetch(url)
    if (fetchResult.ok) {
      let resultData = await fetchResult.json()
      console.log(resultData)
      return { status: true, data: payload }
    }
  } catch (error) {
    console.log(error)
    return { status: false, error: error }
  }
}

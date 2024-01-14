import type { PasteResponse } from "./user.types"

export function isPasteResponse(obj: any): obj is PasteResponse {
  return (
    obj !== null &&
    Object.keys(obj).length === 2 &&
    typeof obj === "object" &&
    obj.type === "PasteResponse" &&
    typeof obj.content === "string"
  )
}

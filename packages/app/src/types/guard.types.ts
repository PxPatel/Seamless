import type { PasteResponse } from "./user.types";

export function isPasteResponse(obj: any): obj is PasteResponse {
    return (
      Object.keys(obj).length === 2 &&
      typeof obj === "object" &&
      obj !== null &&
      obj.type === "PasteResponse" &&
      typeof obj.content === "string"
    )
  }
  
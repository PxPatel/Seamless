import { Seamless } from "./seamless"

const app = new Seamless()
app.initiatePort().then(() => {
  app.logicInstance.handleAuthAndRunProgram()
})

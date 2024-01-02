import { Logic } from "./logic"
import { Seamless } from "./seamless"

const app = new Seamless()
app.initiatePort().then(() => {
  const logic = new Logic(app)
  logic.handleAuthAndRunProgram()
})
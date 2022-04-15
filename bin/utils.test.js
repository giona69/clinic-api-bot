require("dotenv").config()
const Utils = require("./utils")

describe("Test Utils methods", () => {
  test("toFixed for round up", async () => {
    expect.assertions(1)

    expect(Utils.toFixed(0.365, 2)).toBe("0.37")
  }, 5000)

  test("toFixed for round down", async () => {
    expect.assertions(1)

    expect(Utils.toFixed(0.364, 2)).toBe("0.36")
  }, 5000)

  test("toFixed for round upper", async () => {
    expect.assertions(1)

    expect(Utils.toFixed(0.366, 2)).toBe("0.37")
  }, 5000)
})

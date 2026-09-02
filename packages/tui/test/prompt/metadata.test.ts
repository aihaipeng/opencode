import { describe, expect, test } from "bun:test"
import { promptMetadataPolicy } from "../../src/prompt/metadata"
import { stringWidth } from "../../src/util/string-width"

const input = {
  agent: "Build",
  auto: true,
  model: "GPT-5.6 Sol (50% Off)",
  provider: "Anomaly / OpenCode",
  variant: "medium",
}

describe("prompt metadata width", () => {
  test("adds details progressively without overflowing", () => {
    let previous = ""
    for (let width = 0; width <= 120; width++) {
      const result = promptMetadataPolicy({ ...input, width })
      if (stringWidth(result.text) > width) expect(result.text).toBe(input.agent)
      if (previous.includes("OpenCode")) expect(result.text).toContain("OpenCode")
      if (previous.includes("Anomaly / OpenCode")) expect(result.text).toContain("Anomaly / OpenCode")
      previous = result.text
    }
  })

  test("uses the provider name before adding its organization", () => {
    const full = promptMetadataPolicy({ ...input, width: 80 })
    const withoutAuto = promptMetadataPolicy({ ...input, width: stringWidth(full.text) - 1 })
    const withoutOrganization = promptMetadataPolicy({ ...input, width: stringWidth(withoutAuto.text) - 1 })
    expect(full).toMatchObject({ auto: true, provider: "Anomaly / OpenCode", model: input.model })
    expect(withoutAuto).toMatchObject({ auto: undefined, provider: "Anomaly / OpenCode", model: input.model })
    expect(withoutOrganization).toMatchObject({ provider: "OpenCode", model: input.model })
  })

  test("keeps the variant attached to the model", () => {
    expect(promptMetadataPolicy({ ...input, width: 24 })).toMatchObject({ model: undefined, variant: undefined })
    expect(promptMetadataPolicy({ ...input, width: 25 })).toMatchObject({ model: "GPT-5.6…", variant: "medium" })
  })
})

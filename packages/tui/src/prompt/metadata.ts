import { Locale } from "../util/locale"
import { stringWidth } from "../util/string-width"

export type PromptMetadata = {
  agent: string
  auto?: boolean
  model?: string
  provider?: string
  variant?: string
  text: string
}

export function promptMetadataPolicy(input: {
  width: number
  agent: string
  auto?: boolean
  model: string
  provider: string
  variant?: string
}) {
  const result: PromptMetadata = { agent: input.agent, text: input.agent }
  const place = () => {
    result.text = [
      result.agent,
      ...(result.auto ? ["auto"] : []),
      ...(result.model ? ["·", result.model] : []),
      ...(result.provider ? [result.provider] : []),
      ...(result.variant ? ["·", result.variant] : []),
    ].join(" ")
    return stringWidth(result.text) <= input.width
  }
  const identity = (cells: number) => {
    const ellipsis = "…"
    const model =
      stringWidth(input.model) > cells + stringWidth(ellipsis)
        ? Locale.takeWidth(input.model, cells).trimEnd() + ellipsis
        : input.model
    return () => {
      result.model = model
      result.variant = input.variant
    }
  }
  const compactProvider = input.provider.split(" / ").at(-1) ?? input.provider
  const stages = [
    identity(8),
    () => (result.provider = compactProvider),
    identity(24),
    identity(Infinity),
    () => (result.provider = input.provider),
    ...(input.auto ? [() => (result.auto = true)] : []),
  ]

  place()
  for (const stage of stages) {
    const previous = { ...result }
    stage()
    if (!place()) {
      result.auto = previous.auto
      result.model = previous.model
      result.provider = previous.provider
      result.variant = previous.variant
      place()
      break
    }
  }
  return result
}

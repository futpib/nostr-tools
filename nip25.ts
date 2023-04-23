import { Event, finishEvent, Kind } from './event'
import { EventPointer } from './nip19'

export type ReactionEventTemplate = {
  /**
   * Pass only non-nip25 tags if you have to. Nip25 tags ('e' and 'p' tags from reacted event) will be added automatically.
   */
  tags?: string[][]

  /**
   * @default '+'
   */
  content?: string

  created_at: number
}

export function finishReactionEvent(
  t: ReactionEventTemplate,
  reacted: Event,
  privateKey: string,
): Event {
  const inheritedTags = reacted.tags.filter(
    (tag) => tag.length >= 2 && (tag[0] === 'e' || tag[0] === 'p'),
  )

  return finishEvent({
    ...t,
    kind: Kind.Reaction,
    tags: [
      ...(t.tags ?? []),
      ...inheritedTags,
      ['e', reacted.id],
      ['p', reacted.pubkey],
    ],
    content: t.content ?? '+',
  }, privateKey)
}

export function getReactedEventPointer(event: Event): undefined | EventPointer {
  if (event.kind !== Kind.Reaction) {
    return undefined
  }

  let lastETag: undefined | string[]
  let lastPTag: undefined | string[]

  for (const tag of event.tags) {
    if (tag.length >= 2) {
      if (tag[0] === 'e') {
        lastETag = tag
      } else if (tag[0] === 'p') {
        lastPTag = tag
      }
    }
  }

  if (lastETag === undefined || lastPTag === undefined) {
    return undefined
  }

  return {
    id: lastETag[1],
    relays: [ lastETag[2], lastPTag[2] ].filter((x) => x !== undefined),
    author: lastPTag[1],
  }
}

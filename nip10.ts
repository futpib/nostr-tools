import type { Event } from "./event";
import { EventPointer } from "./nip19";

export type NIP10Result = {
  /**
   * Pointer to the root of the thread.
   */
  root: EventPointer | undefined;

  /**
   * Pointer to a "parent" event that parsed event replies to (responded to).
   */
  reply: EventPointer | undefined;

  /**
   * Pointers to events which may or may not be in the reply chain.
   */
  mentions: EventPointer[];

  /**
   * List of pubkeys that are involved in the thread in no particular order.
   */
  pubkeys: string[];
};

export function parse(event: Pick<Event, 'tags'>): NIP10Result {
  const result: NIP10Result = {
    reply: undefined,
    root: undefined,
    mentions: [],
    pubkeys: [],
  };

  const eTags: string[][] = [];

  for (const tag of event.tags) {
    if (tag[0] === "e" && tag[1]) {
      eTags.push(tag);
    }

    if (tag[0] === "p" && tag[1]) {
      result.pubkeys.push(tag[1]);
    }
  }

  for (let eTagIndex = 0; eTagIndex < eTags.length; eTagIndex++) {
    const eTag = eTags[eTagIndex];

    const [ _, eTagEventId, eTagRelayUrl, eTagMarker ] = eTag as [string, string, undefined | string, undefined | string];

    const eventPointer: EventPointer = {
      id: eTagEventId,
      relays: eTagRelayUrl ? [eTagRelayUrl] : [],
    };

    const isFirstETag = eTagIndex === 0;
    const isLastETag = eTagIndex === eTags.length - 1;

    if (eTagMarker === 'root' || isFirstETag) {
      result.root = eventPointer;
      continue;
    }

    if (eTagMarker === 'reply' || isLastETag) {
      result.reply = eventPointer;
      continue;
    }

    result.mentions.push(eventPointer);
  }

  return result;
}

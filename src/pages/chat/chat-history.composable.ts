import { usePocketbase } from 'src/services/pocketbase.service'
import { useMessageStore } from 'src/stores/message.store'
import { computed, onBeforeMount, onBeforeUnmount, Ref } from 'vue'
import { Message } from 'src/models/message.interface'
import { useMessageObservable } from 'src/services/message-observable.service'
import { Subscription } from 'rxjs'
import { toFilterDate } from 'src/utils/pocketbase.util'
import { PbCollection } from 'src/models/pb-collection.enum'

function extractCreateDt(message?: Message) {
  return message?.created ? new Date(message.created) : new Date()
}

function useHistoryLoader(chatRoomId: Ref<string>) {
  const pb = usePocketbase()
  const store = useMessageStore()

  async function loadOlderMessages(
    chatRoomId: string,
    message?: Message,
    limit = 30
  ) {
    const anchorDt = extractCreateDt(message)

    const { items } = await pb
      .collection(PbCollection.CHAT_MESSAGE)
      .getList<Message>(1, limit, {
        sort: '-created,-id', // sorting by id to keep sorting consistent for same-timestamp messages
        filter: `created <= "${toFilterDate(
          anchorDt
        )}" && chatRoomId = "${chatRoomId}"`,
      })

    if (!message) {
      return items
    }

    /*
     * We're not using find because the results will include the cursor (usually as the first item) and potentially
     * same-timestamp items which are lexicographically earlier than the id of the cursor.
     */
    const idx = items.findIndex(({ id }) => message.id === id)
    return items.slice(idx + 1)
  }

  /**
   *
   * @returns `true` if there are no more items left in the history, false if otherwise
   */
  async function load(): Promise<boolean> {
    const oldest = store.chatRooms[chatRoomId.value]?.[0]
    const loaded = await loadOlderMessages(chatRoomId.value, oldest)

    if (!loaded.length) {
      return true
    }

    store.storeMessages('start', ...loaded)
    return false
  }

  return {
    load,
  }
}

function useNewMessagesListener(chatRoomId: Ref<string>) {
  const { observable } = useMessageObservable()
  const store = useMessageStore()

  let subscription: Subscription
  onBeforeMount(() => {
    subscription = observable.subscribe(({ record, action }) => {
      if (action !== 'create' || record.chatRoomId !== chatRoomId.value) {
        return
      }

      store.storeMessage(record, 'end')
    })
  })

  onBeforeUnmount(() => {
    if (subscription) {
      subscription.unsubscribe()
    }
  })
}

export function useChatHistory(chatRoomId: Ref<string>) {
  useNewMessagesListener(chatRoomId)
  const { load } = useHistoryLoader(chatRoomId)

  const store = useMessageStore()

  /*
   * A list where the messages are arranged from older to newer
   */
  const history = computed(() => store.chatRooms[chatRoomId.value] ?? [])

  return {
    history,
    load,

    /**
     * @deprecated
     */
    handleVirtualScroll: () => {
      // empty method
    },
  }
}

import { useMessageObservable } from 'src/services/message-observable.service'
import { usePocketbase } from 'src/services/pocketbase.service'
import { useChatStore } from 'src/stores/chat-room.store'
import { toFilterDate } from 'src/utils/pocketbase.util'
import { computed, Ref } from 'vue'
import { PbCollection } from 'src/models/pb-collection.enum'
import { ChatMessage } from 'src/models/chat.interface'

export function usePreviewMessage(chatId: Ref<string>) {
  const pb = usePocketbase()
  const store = useChatStore()
  const { observable } = useMessageObservable()

  const previewMessage = computed(() => store.previewMessages[chatId.value])

  async function fetchLatestMessage() {
    const { items } = await pb
      .collection(PbCollection.CHAT_MESSAGE)
      .getList<ChatMessage>(1, 1, {
        sort: '-created', // sorting by id to keep sorting consistent for same-timestamp messages
        filter: `created <= "${toFilterDate(new Date())}" && chat = "${
          chatId.value
        }"`,
      })

    const item = items[0]

    if (!item) {
      return
    }

    if (previewMessage.value && previewMessage.value.created > item.created) {
      return
    }

    store.storePreviewMessage(item)
  }

  function listenForLatestMessage(): () => void {
    const subscription = observable.subscribe(({ action, record }) => {
      if (action !== 'create' || record.chat !== chatId.value) {
        return
      }

      store.storePreviewMessage(record)
    })

    return () => subscription.unsubscribe()
  }

  return {
    fetchLatestMessage,
    listenForLatestMessage,
    previewMessage,
  }
}

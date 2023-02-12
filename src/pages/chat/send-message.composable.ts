import { usePocketbase } from 'src/services/pocketbase.service'
import { ref, Ref } from 'vue'
import { PbCollection } from 'src/models/pb-collection.enum'
import { ChatMessage } from 'src/models/chat.interface'

export function useSendMessage(chatRoomId: Ref<string>) {
  const pb = usePocketbase()

  const contentModel = ref('')

  async function sendMessage() {
    const copy = contentModel.value
    contentModel.value = ''

    const message = await pb
      .collection(PbCollection.CHAT_MESSAGE)
      .create<ChatMessage>({
        content: copy,
        senderId: [pb.authStore.model?.id],
        chatRoomId: chatRoomId.value,
      })

    console.log(`Sent message ${message.id} to chatroom ${chatRoomId.value}`)
  }

  return {
    sendMessage,
    contentModel,
  }
}

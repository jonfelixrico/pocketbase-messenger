import { useQuasar } from 'quasar'
import { useChatApi } from 'src/composables/chat-api.composable'
import { useRouter } from 'vue-router'

export function useJoinChat() {
  const { dialog } = useQuasar()
  const router = useRouter()
  const { joinChat } = useChatApi()

  async function processChatJoin(chatId: string) {
    try {
      await joinChat({ chatId })
      await router.push({
        name: 'chat',
        params: {
          chatId,
        },
      })
    } catch (e) {
      // TODO show a dialog or something
      console.error(e)
    }
  }

  function openJoinChatDialog() {
    // TODO use custom component to make this comprehensive
    dialog({
      title: 'Join chat',
      prompt: {
        model: '',
        type: 'text',
      },
      cancel: true,
    }).onOk((chatId: string) => {
      processChatJoin(chatId)
    })
  }

  return openJoinChatDialog
}

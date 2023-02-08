import { useQuasar } from 'quasar'
import { usePocketbase } from 'src/services/pocketbase.service'
import { useRouter } from 'vue-router'

export function useCreateChatRoom() {
  const $q = useQuasar()
  const pb = usePocketbase()
  const router = useRouter()

  async function processChatCreation(name: string) {
    try {
      const { id } = await pb.collection('chatrooms').create({
        name,
        members: [pb.authStore.model?.id],
      })
      console.log('Created chatroom "%s" with id %s', name, id)

      await router.push({
        name: 'chat',
        params: {
          chatRoomId: id,
        },
      })
    } catch (e) {
      // TODO show a dialog or something
      console.error(e)
    }
  }

  function openCreateChatDialog() {
    // TODO use custom component to make this comprehensive
    $q.dialog({
      title: 'Create chat',
      prompt: {
        model: '',
        type: 'text',
      },
      cancel: true,
    }).onOk((name: string) => {
      processChatCreation(name)
    })
  }

  return {
    createChat: openCreateChatDialog,
  }
}
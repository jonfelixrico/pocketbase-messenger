import { sortBy } from 'lodash'
import { APIChat, APIChatMember } from 'src/models/api-chat.interface'
import { PBChat } from 'src/models/pb-chat.interface'
import { PbCollection } from 'src/models/pb-collection.enum'
import { BasePBRecord } from 'src/models/pb-record.interface'
import { usePocketbase } from 'src/services/pocketbase.service'
import { wrapString } from 'src/utils/pocketbase.util'
import { useSessionApi } from './session-api.composable'

interface APICreateChatBody {
  name: string
}

interface RawAPIChatMember extends BasePBRecord {
  user: string
  chat: string
  expand: {
    user: {
      id: string
      username: string
    }
  }
}

function processRawAPIChatMember({
  expand,
  user,
  created,
}: RawAPIChatMember): APIChatMember {
  return {
    id: user,
    username: expand.user.username,
    joined: created,
  }
}

interface PBChatExpanded extends PBChat {
  expand: {
    owner: {
      username: string
    }
  }
}

export function useChatApi() {
  const pb = usePocketbase()
  const { getSessionUser } = useSessionApi()

  async function createChat({ name }: APICreateChatBody) {
    const userId = getSessionUser().id

    await pb.collection(PbCollection.CHAT).create<APIChat>({
      name,
      owner: userId,
    })
  }

  async function hydrateChatMembers(chatId: string): Promise<APIChatMember[]> {
    const members = await pb
      .collection(PbCollection.CHAT_USER_MEMBERSHIP)
      .getFullList<RawAPIChatMember>(200, {
        filter: `chat.id = ${wrapString(chatId)}`,
        expand: 'user.username',
      })

    return members.map(processRawAPIChatMember)
  }

  async function hydrateChat({
    id,
    owner,
    expand,
    name,
    created,
    updated,
  }: PBChatExpanded): Promise<APIChat> {
    const apiMembers = await hydrateChatMembers(id)
    const members: APIChat['members'] = [
      {
        id: owner,
        username: expand.owner.username,
        isOwner: true,
        /*
         * Data-wise, the owner does not have its own join date. We're using the chat's creation date here because
         * the owner data gets bound during chat creation.
         */
        joined: created,
      },
      ...apiMembers,
    ]

    return {
      id,
      name,
      created,
      updated,
      members: sortBy(members, (member) => member.username),
    }
  }

  async function getChat(chatId: string) {
    const rawChat = await pb
      .collection(PbCollection.CHAT)
      .getOne<PBChatExpanded>(chatId, {
        expand: 'owner.username',
      })

    return await hydrateChat(rawChat)
  }

  async function listChats() {
    const rawChats = await pb
      .collection(PbCollection.CHAT)
      .getFullList<PBChatExpanded>(200, {
        expand: 'owner.username',
      })

    return await Promise.all(rawChats.map(hydrateChat))
  }

  return {
    createChat,
    getChat,
    listChats,
  }
}

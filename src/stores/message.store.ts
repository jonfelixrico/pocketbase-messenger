import { defineStore } from 'pinia'

// TODO move this out into its own file
export interface Message {
  content: string
  chatRoomId: string
  senderId: string
  id: string
  created: Date
  updated: Date
}

interface MessageStore {
  [chatRoomId: string]: {
    [messageId: string]: Message
  }
}

export const useMessageStore = defineStore('message', {
  state: (): MessageStore => ({}),

  actions: {
    storeMessage(message: Message) {
      const { chatRoomId } = message

      if (!this.$state[chatRoomId]) {
        this.$state[chatRoomId] = {}
      }

      this.$state[chatRoomId][message.id] = message
    },

    storeMessages(...messages: Message[]) {
      for (const message of messages) {
        this.storeMessage(message)
      }
    },
  },
})

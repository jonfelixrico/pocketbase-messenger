<!--
  Behavior:
  If on desktop mode, show both the layout and the chat at all times. If there is no chat selected, show the index page.
  If on mobile mode:
    - If a chat is selected, show only the chat and hide the drawer
    - If a chat is not selected (on chat index), show only the drawer
-->

<template>
  <q-page class="row">
    <div
      v-show="$q.screen.gt.sm || !$route.params.chatId?.length"
      class="col-lg-2 col-md-3 col-12 column drawer"
    >
      <q-toolbar class="border-bottom">
        <q-btn @click="setShowDrawer(true)" icon="menu" flat round dense />
      </q-toolbar>
      <q-scroll-area class="col bg-grey-2">
        <ChatList />
      </q-scroll-area>
    </div>

    <router-view
      v-show="$route.params.chatId?.length || $q.screen.gt.sm"
      class="col bg-grey-2"
      :key="String($route.params.chatId)"
    />
  </q-page>
</template>

<script lang="ts">
import ChatList from 'src/components/chat-list/ChatList.vue'
import { useMainLayoutStore } from 'src/stores/main-layout.store'
import { defineComponent } from 'vue'

export default defineComponent({
  components: { ChatList },

  setup() {
    const { setShowDrawer } = useMainLayoutStore()

    return {
      setShowDrawer,
    }
  },
})
</script>

<style scoped lang="scss">
.drawer {
  border-right: 1px $separator-color solid;
}
</style>

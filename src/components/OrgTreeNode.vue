<template>
  <div>
    <div
      class="wp-tree-node"
      :class="{ active: node.id === selectedId }"
      :style="{ paddingLeft: (depth * 16 + 12) + 'px' }"
      @click.stop="$emit('select', node)"
    >
      <i
        v-if="children.length"
        class="fas fa-chevron-right text-xs text-gray-400 transition-transform"
        :class="{ 'rotate-90': expanded }"
        @click.stop="expanded = !expanded"
      ></i>
      <i v-else class="fas fa-circle text-xs text-gray-300 w-3"></i>
      <i class="fas fa-building text-gray-400 text-sm"></i>
      <span class="text-sm">{{ node.level1 || node.level2 || node.level3 || node.name }}</span>
    </div>
    <div v-if="expanded && children.length">
      <OrgTreeNode
        v-for="child in children"
        :key="child.id"
        :node="child"
        :all-nodes="allNodes"
        :selected-id="selectedId"
        :depth="depth + 1"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  node: Object,
  allNodes: Array,
  selectedId: [String, Number],
  depth: { type: Number, default: 0 },
})

defineEmits(['select'])

const expanded = ref(false)

const children = computed(() =>
  props.allNodes.filter(n => n.parent_id === props.node.id)
)
</script>

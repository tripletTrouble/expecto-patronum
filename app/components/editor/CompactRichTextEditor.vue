<template>
  <div
    class="rich-text-editor rich-text-editor--compact"
    :class="{ 'rich-text-editor--disabled': disabled }"
  >
    <div
      v-if="!editor"
      class="rich-text-editor__loading"
      role="status"
      aria-live="polite"
    >
      Memuat editor...
    </div>
    <template v-else>
      <div
        class="rich-text-editor__toolbar"
        role="toolbar"
        aria-label="Alat pemformatan opsi"
        @mousedown.prevent
      >
        <button
          v-for="tool in tools"
          :key="tool.name"
          type="button"
          class="rich-text-editor__button"
          :class="{ 'is-active': tool.isActive() }"
          :title="tool.label"
          :aria-label="tool.label"
          :aria-pressed="tool.isActive()"
          :disabled="disabled"
          @click="tool.run()"
        >
          <span aria-hidden="true">{{ tool.symbol }}</span>
        </button>
      </div>
      <EditorContent
        :editor="editor"
        class="rich-text-editor__content"
        :data-placeholder="placeholder"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { EditorContent, useEditor } from '@tiptap/vue-3'
import Underline from '@tiptap/extension-underline'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import Document from '@tiptap/extension-document'
import Text from '@tiptap/extension-text'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import { computed, watch } from 'vue'

import { sanitizeEditorContent, sanitizePastedContent } from './rich-text-editor-utils'

const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
  disabled?: boolean
}>(), {
  modelValue: '',
  placeholder: 'Tulis opsi jawaban...',
  disabled: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const editor = useEditor({

  content: sanitizeEditorContent(props.modelValue, 'option'),
  editable: !props.disabled,
  extensions: [Document, Text, Bold, Italic, Underline, Subscript, Superscript],
  editorProps: {
    attributes: {
      'class': 'rich-text-editor__prose rich-text-editor__prose--compact',
      'role': 'textbox',
      'aria-multiline': 'false',
      'aria-label': 'Teks opsi jawaban',
      'data-placeholder': props.placeholder,
    },
    transformPastedHTML: html => sanitizePastedContent(html, 'option'),
  },
  onUpdate: ({ editor: currentEditor }) => {
    emit('update:modelValue', sanitizeEditorContent(currentEditor.getHTML(), 'option'))
  },
})

watch(() => props.modelValue, (value) => {
  const currentEditor = editor.value
  if (!currentEditor) return

  const content = sanitizeEditorContent(value, 'option')
  if (content !== currentEditor.getHTML()) currentEditor.commands.setContent(content, { emitUpdate: false })
})

const tools = computed(() => editor.value
  ? [
      { name: 'bold', label: 'Tebal', symbol: 'B', isActive: () => editor.value?.isActive('bold') ?? false, run: () => editor.value?.chain().focus().toggleBold().run() },
      { name: 'italic', label: 'Miring', symbol: 'I', isActive: () => editor.value?.isActive('italic') ?? false, run: () => editor.value?.chain().focus().toggleItalic().run() },
      { name: 'underline', label: 'Garis bawah', symbol: 'U', isActive: () => editor.value?.isActive('underline') ?? false, run: () => editor.value?.chain().focus().toggleUnderline().run() },
      { name: 'subscript', label: 'Subskrip', symbol: 'X₂', isActive: () => editor.value?.isActive('subscript') ?? false, run: () => editor.value?.chain().focus().toggleSubscript().run() },
      { name: 'superscript', label: 'Superskrip', symbol: 'X²', isActive: () => editor.value?.isActive('superscript') ?? false, run: () => editor.value?.chain().focus().toggleSuperscript().run() },
    ]
  : [])
</script>

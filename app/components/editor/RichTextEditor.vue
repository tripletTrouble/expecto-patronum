<template>
  <div
    class="rich-text-editor"
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
        aria-label="Alat pemformatan teks"
        @mousedown.prevent
      >
        <button
          v-for="tool in inlineTools"
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
        <span
          class="rich-text-editor__separator"
          aria-hidden="true"
        />
        <button
          type="button"
          class="rich-text-editor__button"
          :class="{ 'is-active': editor.isActive('bulletList') }"
          title="Daftar berpoin"
          aria-label="Daftar berpoin"
          :aria-pressed="editor.isActive('bulletList')"
          :disabled="disabled"
          @click="editor.chain().focus().toggleBulletList().run()"
        >
          •
        </button>
        <button
          type="button"
          class="rich-text-editor__button"
          :class="{ 'is-active': editor.isActive('orderedList') }"
          title="Daftar bernomor"
          aria-label="Daftar bernomor"
          :aria-pressed="editor.isActive('orderedList')"
          :disabled="disabled"
          @click="editor.chain().focus().toggleOrderedList().run()"
        >
          1.
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
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import Underline from '@tiptap/extension-underline'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import { computed, watch } from 'vue'

import { sanitizeEditorContent, sanitizePastedContent } from './rich-text-editor-utils'

const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
  disabled?: boolean
}>(), {
  modelValue: '',
  placeholder: 'Tulis pertanyaan...',
  disabled: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const editor = useEditor({

  content: sanitizeEditorContent(props.modelValue, 'body'),
  editable: !props.disabled,
  extensions: [
    StarterKit.configure({
      blockquote: false,
      code: false,
      codeBlock: false,
      dropcursor: false,
      gapcursor: false,
      heading: false,
      horizontalRule: false,
      strike: false,
    }),
    Underline,
    Subscript,
    Superscript,
  ],
  editorProps: {
    attributes: {
      'class': 'rich-text-editor__prose',
      'role': 'textbox',
      'aria-multiline': 'true',
      'aria-label': 'Isi pertanyaan',
      'data-placeholder': props.placeholder,
    },
    transformPastedHTML: html => sanitizePastedContent(html, 'body'),
  },
  onUpdate: ({ editor: currentEditor }) => {
    emit('update:modelValue', sanitizeEditorContent(currentEditor.getHTML(), 'body'))
  },
})

watch(() => props.modelValue, (value) => {
  const currentEditor = editor.value
  if (!currentEditor) return

  const content = sanitizeEditorContent(value, 'body')
  if (content !== currentEditor.getHTML()) currentEditor.commands.setContent(content, { emitUpdate: false })
})

const inlineTools = computed(() => editor.value
  ? [
      { name: 'bold', label: 'Tebal', symbol: 'B', isActive: () => editor.value?.isActive('bold') ?? false, run: () => editor.value?.chain().focus().toggleBold().run() },
      { name: 'italic', label: 'Miring', symbol: 'I', isActive: () => editor.value?.isActive('italic') ?? false, run: () => editor.value?.chain().focus().toggleItalic().run() },
      { name: 'underline', label: 'Garis bawah', symbol: 'U', isActive: () => editor.value?.isActive('underline') ?? false, run: () => editor.value?.chain().focus().toggleUnderline().run() },
      { name: 'subscript', label: 'Subskrip', symbol: 'X₂', isActive: () => editor.value?.isActive('subscript') ?? false, run: () => editor.value?.chain().focus().toggleSubscript().run() },
      { name: 'superscript', label: 'Superskrip', symbol: 'X²', isActive: () => editor.value?.isActive('superscript') ?? false, run: () => editor.value?.chain().focus().toggleSuperscript().run() },
    ]
  : [])
</script>

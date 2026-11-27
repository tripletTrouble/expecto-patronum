import { describe, expect, it } from 'vitest'
import { Editor } from '@tiptap/core'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Underline from '@tiptap/extension-underline'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'

import { sanitizeEditorContent } from '../../app/components/editor/rich-text-editor-utils'

describe('compact rich text editor schema', () => {
  it('initializes with a block-compatible schema and emits inline-safe HTML', () => {
    const editor = new Editor({
      extensions: [Document, Paragraph, Text, Bold, Italic, Underline, Subscript, Superscript],
      content: {
        type: 'doc',
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Opsi' }],
        }],
      },
    })

    expect(editor.schema.topNodeType.contentMatch.defaultType?.name).toBe('paragraph')
    expect(sanitizeEditorContent('<p><strong>Opsi</strong></p>', 'option')).toBe('<strong>Opsi</strong>')
    editor.destroy()
  })
})

'use client';

import { useEffect } from 'react';
import Color from '@tiptap/extension-color';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { EditorContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor } from '@tiptap/react';
import { uploadAdminFile } from '@/lib/admin-api-client';
import { absoluteTelUploadUrl } from '@/lib/tel-media-url';

const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] };

function activeClass(v) {
  return v ? ' admin-rich-editor__toolbar-btn--active' : '';
}

function ToolbarButton({ onClick, active, disabled, children }) {
  return (
    <button
      type="button"
      className={`admin-rich-editor__toolbar-btn${activeClass(active)}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function ImageNodeView({ node, updateAttributes }) {
  const src = node?.attrs?.src || '';
  const alt = node?.attrs?.alt || '';
  const viewSrc = absoluteTelUploadUrl(src);
  return (
    <NodeViewWrapper className="admin-rich-editor__imgwrap">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={viewSrc} alt={alt} />
      <button
        type="button"
        className="admin-rich-editor__imgaltbtn"
        onClick={() => {
          const next = window.prompt('Alt text (for SEO)', alt || '');
          if (next == null) return;
          updateAttributes({ alt: String(next).trim() });
        }}
        title="Edit alt text"
      >
        Alt
      </button>
      {alt ? <span className="admin-rich-editor__imgaltpill">alt</span> : null}
    </NodeViewWrapper>
  );
}

const ImageWithAlt = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      alt: {
        default: '',
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

export function RichTextEditor({ label, value, onChange, placeholder = 'Write here…', disabled = false }) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4, 5, 6] },
        link: { openOnClick: false },
      }),
      TextStyle,
      Color,
      ImageWithAlt.configure({
        inline: false,
        allowBase64: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value && typeof value === 'object' ? value : EMPTY_DOC,
    editorProps: {
      handlePaste: (_view, event) => {
        if (disabled) return false;
        const items = event?.clipboardData?.items;
        if (!items || items.length === 0) return false;
        const fileItem = Array.from(items).find((it) => it.kind === 'file' && /^image\//i.test(it.type));
        const file = fileItem?.getAsFile?.();
        if (!file) return false;

        event.preventDefault();
        (async () => {
          try {
            const data = await uploadAdminFile(file);
            const url = data?.url ?? data?.path;
            if (!url) return;
            // Store /uploads/... (portable), display resolves to full origin via absoluteTelUploadUrl.
            editor?.chain().focus().setImage({ src: String(url), alt: '' }).run();
          } catch {
            // keep silent; user can retry
          }
        })();
        return true;
      },
      handleDrop: (_view, event) => {
        if (disabled) return false;
        const files = event?.dataTransfer?.files;
        if (!files || files.length === 0) return false;
        const file = Array.from(files).find((f) => /^image\//i.test(f.type));
        if (!file) return false;

        event.preventDefault();
        (async () => {
          try {
            const data = await uploadAdminFile(file);
            const url = data?.url ?? data?.path;
            if (!url) return;
            // Store /uploads/... (portable), display resolves to full origin via absoluteTelUploadUrl.
            editor?.chain().focus().setImage({ src: String(url), alt: '' }).run();
          } catch {
            // keep silent; user can retry
          }
        })();
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getJSON());
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) return;
    const next = value && typeof value === 'object' ? value : EMPTY_DOC;
    const current = editor.getJSON();
    if (JSON.stringify(current) !== JSON.stringify(next)) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  function setHeading(level) {
    if (!editor) return;
    if (!level) {
      editor.chain().focus().setParagraph().run();
      return;
    }
    editor.chain().focus().toggleHeading({ level }).run();
  }

  function setLink() {
    if (!editor) return;
    const existing = editor.getAttributes('link').href || '';
    const href = window.prompt('Enter URL', existing);
    if (href == null) return;
    const cleaned = href.trim();
    if (!cleaned) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: cleaned }).run();
  }

  function setImage() {
    if (!editor) return;
    const src = window.prompt('Image URL (/uploads/... or full URL)');
    if (!src) return;
    const cleaned = src.trim();
    if (!cleaned) return;
    // Store the raw value (usually /uploads/...), but render via absoluteTelUploadUrl in the node view.
    editor.chain().focus().setImage({ src: cleaned, alt: '' }).run();
  }

  const headingValue = editor?.isActive('heading', { level: 2 })
    ? 'h2'
    : editor?.isActive('heading', { level: 3 })
      ? 'h3'
      : editor?.isActive('heading', { level: 4 })
        ? 'h4'
        : editor?.isActive('heading', { level: 5 })
          ? 'h5'
          : editor?.isActive('heading', { level: 6 })
            ? 'h6'
            : 'p';

  return (
    <div className="admin-field">
      {label ? <label>{label}</label> : null}
      <div className="admin-rich-editor">
        <div className="admin-rich-editor__toolbar">
          <ToolbarButton onClick={() => editor?.chain().focus().undo().run()} disabled={disabled || !editor?.can().chain().focus().undo().run()}>
            ↶
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().redo().run()} disabled={disabled || !editor?.can().chain().focus().redo().run()}>
            ↷
          </ToolbarButton>

          <select
            className="admin-rich-editor__select"
            value={headingValue}
            disabled={disabled}
            onChange={(ev) => {
              const next = ev.target.value;
              if (next === 'p') setHeading(null);
              else setHeading(Number(next.replace('h', '')));
            }}
          >
            <option value="p">Paragraph</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
            <option value="h5">Heading 5</option>
            <option value="h6">Heading 6</option>
          </select>

          <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} disabled={disabled}>
            B
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} disabled={disabled}>
            I
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive('underline')} disabled={disabled}>
            U
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().toggleStrike().run()} active={editor?.isActive('strike')} disabled={disabled}>
            S
          </ToolbarButton>
          <input
            type="color"
            className="admin-rich-editor__color"
            value={editor?.getAttributes('textStyle').color || '#1e293b'}
            disabled={disabled}
            onChange={(ev) => editor?.chain().focus().setColor(ev.target.value).run()}
            title="Text color"
          />
          <ToolbarButton onClick={setLink} active={editor?.isActive('link')} disabled={disabled}>
            🔗
          </ToolbarButton>
          <ToolbarButton onClick={setImage} disabled={disabled}>
            🖼
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')} disabled={disabled}>
            ❝
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().setHorizontalRule().run()} disabled={disabled}>
            —
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} disabled={disabled}>
            • List
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} disabled={disabled}>
            1. List
          </ToolbarButton>

          <select
            className="admin-rich-editor__select admin-rich-editor__select--sm"
            value={
              editor?.isActive({ textAlign: 'center' })
                ? 'center'
                : editor?.isActive({ textAlign: 'right' })
                  ? 'right'
                  : 'left'
            }
            disabled={disabled}
            onChange={(ev) => editor?.chain().focus().setTextAlign(ev.target.value).run()}
            title="Alignment"
          >
            <option value="left">Align left</option>
            <option value="center">Align center</option>
            <option value="right">Align right</option>
          </select>
        </div>
        <EditorContent editor={editor} className="admin-rich-editor__content" />
      </div>
    </div>
  );
}


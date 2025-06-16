'use client'
// InitializedMDXEditor.tsx
import type { ForwardedRef } from 'react'
import type {
  CodeBlockEditorDescriptor,
  MDXEditorMethods,
  SandpackConfig,
} from '@mdxeditor/editor'
import {
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  MDXEditor,
  type MDXEditorProps,
  toolbarPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  diffSourcePlugin,
  frontmatterPlugin,
  BlockTypeSelect,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  UndoRedo,
  BoldItalicUnderlineToggles,
  CodeToggle,
  InsertCodeBlock,
  InsertFrontmatter,
  ConditionalContents,
  ChangeCodeMirrorLanguage,
  ShowSandpackInfo,
  InsertSandpack,
  codeMirrorPlugin,
  sandpackPlugin,
  useCodeBlockEditorContext,
  CodeMirrorEditor,
} from '@mdxeditor/editor'
import '@/styles/editor.css'

// Only import this to the next file
export default function InitializedMDXEditor({
  editorRef,
  ...props
}: { editorRef: ForwardedRef<MDXEditorMethods> | null } & MDXEditorProps) {
  const defaultSnippetContent = `
export default function App() {
  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
    </div>
  );
}
`.trim()

  const simpleSandpackConfig: SandpackConfig = {
    defaultPreset: 'react',
    presets: [
      {
        label: 'React',
        name: 'react',
        meta: 'live react',
        sandpackTemplate: 'react',
        sandpackTheme: 'dark',
        snippetFileName: '/App.js',
        snippetLanguage: 'jsx',
        initialSnippetContent: defaultSnippetContent,
      },
    ],
  }

  const PlainTextCodeEditorDescriptor: CodeBlockEditorDescriptor = {
    // always use the editor, no matter the language or the meta of the code block
    match: (language, meta) => true,
    // You can have multiple editors with different priorities, so that there's a "catch-all" editor (with the lowest priority)
    priority: 0,
    // The Editor is a React component
    Editor: (props) => {
      const cb = useCodeBlockEditorContext()
      // stops the propagation so that the parent lexical editor does not handle certain events.
      return (
        <div onKeyDown={(e) => e.nativeEvent.stopImmediatePropagation()}>
          <textarea
            rows={3}
            cols={20}
            defaultValue={props.code}
            onChange={(e) => cb.setCode(e.target.value)}
          />
        </div>
      )
    },
  }

  return (
    <MDXEditor
      plugins={[
        // Basic formatting plugins
        headingsPlugin({
          allowedHeadingLevels: [1, 2, 3, 4, 5, 6],
        }),
        listsPlugin({
          defaultListType: 'bullet',
        }),
        quotePlugin(),
        thematicBreakPlugin(),
        markdownShortcutPlugin(),

        // Link handling
        linkPlugin(),
        linkDialogPlugin({
          linkAutocompleteSuggestions: [
            'https://',
            'http://',
            'mailto:',
            'tel:',
          ],
        }),

        // Media handling
        imagePlugin(),

        // Table support
        tablePlugin(),

        // Code block support
        // codeBlockPlugin({
        //   codeBlockEditorDescriptors: [PlainTextCodeEditorDescriptor],
        // }),

        codeBlockPlugin({
          codeBlockEditorDescriptors: [
            { priority: -10, match: (_) => true, Editor: CodeMirrorEditor },
          ],
          defaultCodeBlockLanguage: 'js',
        }),

        // View modes
        diffSourcePlugin(),

        // Advanced features
        frontmatterPlugin(),
        codeMirrorPlugin({
          codeBlockLanguages: {
            js: 'JavaScript',
            css: 'CSS',
            html: 'HTML',
            json: 'JSON',
            yaml: 'YAML',
            ts: 'TypeScript',
          },
        }),
        // codeBlockPlugin({
        //   defaultCodeBlockLanguage: 'JavaScript',
        // }),
        sandpackPlugin({ sandpackConfig: simpleSandpackConfig }),

        // Toolbar configuration
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <UndoRedo />
              <BoldItalicUnderlineToggles />
              <BlockTypeSelect />
              <CreateLink />
              <InsertImage />
              <InsertTable />
              <InsertThematicBreak />
              <ListsToggle />
              <CodeToggle />
              <InsertCodeBlock />
              <InsertFrontmatter />

              <ConditionalContents
                options={[
                  {
                    when: (editor) => editor?.editorType === 'codeblock',
                    contents: () => <ChangeCodeMirrorLanguage />,
                  },
                  {
                    when: (editor) => editor?.editorType === 'sandpack',
                    contents: () => <ShowSandpackInfo />,
                  },
                  {
                    fallback: () => (
                      <>
                        <InsertCodeBlock />
                        <InsertSandpack />
                      </>
                    ),
                  },
                ]}
              />
            </>
          ),
        }),
      ]}
      contentEditableClassName="prose prose-sm dark:prose-invert max-w-none mdxeditor"
      {...props}
      ref={editorRef}
    />
  )
}

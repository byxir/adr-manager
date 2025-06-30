'use client'
import type { ForwardedRef } from 'react'
import { useEffect, useRef } from 'react'
import type { MDXEditorMethods, SandpackConfig } from '@mdxeditor/editor'
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  ChangeCodeMirrorLanguage,
  codeBlockPlugin,
  CodeMirrorEditor,
  codeMirrorPlugin,
  CodeToggle,
  ConditionalContents,
  CreateLink,
  diffSourcePlugin,
  DiffSourceToggleWrapper,
  frontmatterPlugin,
  headingsPlugin,
  imagePlugin,
  InsertCodeBlock,
  InsertFrontmatter,
  InsertImage,
  InsertSandpack,
  InsertTable,
  InsertThematicBreak,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  type MDXEditorProps,
  quotePlugin,
  sandpackPlugin,
  ShowSandpackInfo,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from '@mdxeditor/editor'
import '@/styles/editor.css'
import { useAtom } from 'jotai'
import { templateMarkdownAtom } from '@/app/[repo]/layout'

// Only import this to the next file
export default function InitializedMDXEditor({
  editorRef,
  onEditorReady,
  ...props
}: {
  editorRef: ForwardedRef<MDXEditorMethods> | null
  onEditorReady?: (element: HTMLElement) => void
} & MDXEditorProps) {
  const defaultSnippetContent = `
export default function App() {
  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
    </div>
  );
}
`

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

  const editorElementRef = useRef<HTMLDivElement>(null)
  const internalEditorRef = useRef<MDXEditorMethods>(null)

  const [templateMarkdown, setTemplateMarkdown] = useAtom(templateMarkdownAtom)

  // Call onEditorReady when the editor element is available
  useEffect(() => {
    if (onEditorReady && editorElementRef.current) {
      onEditorReady(editorElementRef.current)
    }
  }, [onEditorReady])

  useEffect(() => {
    if (internalEditorRef.current && templateMarkdown !== undefined) {
      // Don't compare content to avoid trimming issues, just set it directly
      internalEditorRef.current.setMarkdown(templateMarkdown)
    }
  }, [templateMarkdown])

  // Callback ref to handle both external and internal refs
  const handleEditorRef = (instance: MDXEditorMethods | null) => {
    internalEditorRef.current = instance
    if (typeof editorRef === 'function') {
      editorRef(instance)
    } else if (editorRef) {
      editorRef.current = instance
    }
  }

  console.log('templateMarkdown', templateMarkdown)

  return (
    <div ref={editorElementRef}>
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

          codeBlockPlugin({
            codeBlockEditorDescriptors: [
              { priority: -10, match: (_) => true, Editor: CodeMirrorEditor },
            ],
            defaultCodeBlockLanguage: 'js',
          }),

          // View modes - configured to start in source mode by default
          diffSourcePlugin({ viewMode: 'rich-text' }),

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

          sandpackPlugin({ sandpackConfig: simpleSandpackConfig }),

          toolbarPlugin({
            toolbarContents: () => (
              <DiffSourceToggleWrapper>
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
              </DiffSourceToggleWrapper>
            ),
          }),
        ]}
        className={`mdxeditor ${props.className}`}
        contentEditableClassName="prose prose-sm dark:prose-invert max-w-none mdxeditor"
        {...props}
        ref={handleEditorRef}
        trim={false}
        suppressHtmlProcessing={true}
      />
    </div>
  )
}

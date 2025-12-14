import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2 } from 'lucide-react';

interface ReportEditorProps {
    content?: string;
    onChange?: (content: string) => void;
    readOnly?: boolean;
}

export function ReportEditor({ content = '', onChange, readOnly = false }: ReportEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Write your report here...',
            }),
        ],
        content,
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML());
        },
    });

    if (!editor) {
        return null;
    }

    return (
        <div className="border rounded-md">
            {!readOnly && (
                <div className="border-b p-2 flex gap-1 bg-muted/20">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={editor.isActive('bold') ? 'bg-muted' : ''}
                    >
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={editor.isActive('italic') ? 'bg-muted' : ''}
                    >
                        <Italic className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-border mx-1" />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
                    >
                        <Heading1 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
                    >
                        <Heading2 className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-border mx-1" />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={editor.isActive('bulletList') ? 'bg-muted' : ''}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={editor.isActive('orderedList') ? 'bg-muted' : ''}
                    >
                        <ListOrdered className="h-4 w-4" />
                    </Button>
                </div>
            )}
            <div className="p-4 min-h-[300px] prose dark:prose-invert max-w-none">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}

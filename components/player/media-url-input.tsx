'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { parseMediaUrl } from '@/lib/player/url-parser';
import { SourceBadge } from '@/components/player/source-badge';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

// ── Validation schema ─────────────────────────────────────────────────────────

const mediaInputSchema = z.object({
  url: z
    .string()
    .min(4, 'Please enter a video URL.')
    .max(2000, 'URL is too long.')
    .trim(),
  title: z.string().max(150, 'Title is too long.').optional(),
});

type MediaInputForm = z.infer<typeof mediaInputSchema>;

// ── MediaUrlInput Modal ───────────────────────────────────────────────────────

interface MediaUrlInputProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string, title?: string) => Promise<void>;
  canControl: boolean;
}

type InputTab = 'url' | 'local';

export function MediaUrlInput({ isOpen, onClose, onSubmit, canControl }: MediaUrlInputProps) {
  const [activeTab, setActiveTab] = useState<InputTab>('url');
  const [detectedSource, setDetectedSource] = useState<ReturnType<typeof parseMediaUrl>>(null);
  
  // Local File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MediaInputForm>({
    resolver: zodResolver(mediaInputSchema),
    defaultValues: { url: '', title: '' },
  });

  // Live URL detection as user types
  const urlValue = watch('url');
  React.useEffect(() => {
    const parsed = urlValue && urlValue.length > 4 ? parseMediaUrl(urlValue) : null;
    setDetectedSource(parsed);
  }, [urlValue]);

  const handleClose = () => {
    reset();
    setSelectedFile(null);
    setFileTitle('');
    setDetectedSource(null);
    onClose();
  };

  const onFormSubmit = async (data: MediaInputForm) => {
    await onSubmit(data.url, data.title || undefined);
    handleClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast.error('Please select a valid video file (.mp4, .webm, .mkv, .mov).');
        return;
      }
      setSelectedFile(file);
      setFileTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleLocalFileSubmit = async () => {
    if (!selectedFile) return;

    const blobUrl = URL.createObjectURL(selectedFile);
    await onSubmit(blobUrl, fileTitle || selectedFile.name);
    toast.success(`Loaded local file: ${selectedFile.name}`);
    handleClose();
  };

  // Preset URLs for quick testing
  const PRESETS = [
    { label: 'Big Buck Bunny (MP4)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
    { label: 'YouTube — Sample', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    { label: 'HLS Stream', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add a Video"
      description="Paste a web video link or select a video file directly from your computer."
    >
      {!canControl ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <span className="text-3xl">👁</span>
          <p className="text-center text-sm text-muted-foreground">
            Only the host or co-host can change the video.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Tab Selector */}
          <div
            role="tablist"
            aria-label="Video input source type"
            className="flex border-b border-border gap-2"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'url'}
              onClick={() => setActiveTab('url')}
              className={cn(
                'border-b-2 px-3 py-2 text-xs font-semibold transition-all focus-visible:outline-none',
                activeTab === 'url'
                  ? 'border-emerald-500 text-emerald-400 font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              🔗 Web Video URL
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'local'}
              onClick={() => setActiveTab('local')}
              className={cn(
                'border-b-2 px-3 py-2 text-xs font-semibold transition-all focus-visible:outline-none',
                activeTab === 'local'
                  ? 'border-emerald-500 text-emerald-400 font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              📁 Local Storage File
            </button>
          </div>

          {/* Tab 1: Web URL */}
          {activeTab === 'url' && (
            <form onSubmit={handleSubmit(onFormSubmit)} noValidate className="flex flex-col gap-4">
              <FormField
                id="media-url"
                label="Video URL"
                error={errors.url?.message}
                required
                hint="YouTube, MP4, WebM, HLS (.m3u8)"
              >
                <Input
                  id="media-url"
                  type="url"
                  autoComplete="off"
                  placeholder="https://youtube.com/watch?v=… or https://…/video.mp4"
                  hasError={!!errors.url}
                  autoFocus
                  spellCheck={false}
                  {...register('url')}
                />
              </FormField>

              {detectedSource && (
                <div className="flex items-center gap-2 rounded-md bg-muted/30 px-3 py-2">
                  <SourceBadge sourceType={detectedSource.sourceType} />
                  <span className="truncate text-xs text-muted-foreground">
                    {detectedSource.titleGuess}
                  </span>
                </div>
              )}

              <FormField
                id="media-title"
                label="Title (optional)"
                error={errors.title?.message}
                hint="Shown in the room header and member sync banner"
              >
                <Input
                  id="media-title"
                  type="text"
                  autoComplete="off"
                  placeholder={detectedSource?.titleGuess ?? 'Enter a title…'}
                  {...register('title')}
                />
              </FormField>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Quick test
                </p>
                <div className="flex flex-col gap-1.5">
                  {PRESETS.map((p) => (
                    <button
                      key={p.url}
                      type="button"
                      onClick={() => {
                        reset({ url: p.url, title: p.label });
                      }}
                      className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-left text-xs text-muted-foreground transition hover:border-emerald-500/40 hover:text-foreground"
                    >
                      <span className="flex-1 truncate">{p.label}</span>
                      <svg className="h-3 w-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M7 17L17 7M7 7h10v10" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="ghost" size="md" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  loadingText="Loading…"
                  className="flex-1"
                  disabled={!detectedSource}
                >
                  Load Video
                </Button>
              </div>
            </form>
          )}

          {/* Tab 2: Local File */}
          {activeTab === 'local' && (
            <div className="flex flex-col gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-matroska,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Drag & Drop or Click File Selector Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 p-6 text-center cursor-pointer transition hover:border-emerald-500/50 hover:bg-muted/30',
                  selectedFile && 'border-emerald-500/60 bg-emerald-500/5'
                )}
              >
                <span className="text-3xl" aria-hidden="true">🎬</span>
                {selectedFile ? (
                  <div>
                    <p className="text-xs font-bold text-foreground truncate max-w-xs">{selectedFile.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • {selectedFile.type || 'Video file'}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-semibold mt-1">Click to choose a different video</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-foreground">Click to browse or drop a video file</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Supports MP4, WebM, MKV, MOV files from your hard drive
                    </p>
                  </div>
                )}
              </div>

              {selectedFile && (
                <FormField
                  id="local-file-title"
                  label="Display Title"
                  hint="Custom title shown to party members"
                >
                  <Input
                    id="local-file-title"
                    type="text"
                    value={fileTitle}
                    onChange={(e) => setFileTitle(e.target.value)}
                    placeholder="Video title..."
                  />
                </FormField>
              )}

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="ghost" size="md" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleLocalFileSubmit}
                  disabled={!selectedFile}
                  className="flex-1"
                >
                  Load Local Video
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

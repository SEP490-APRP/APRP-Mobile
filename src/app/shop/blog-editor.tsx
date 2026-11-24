import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { Eye, ImagePlus, PenLine, RefreshCw, Save, Send, Trash2 } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Button, ChoiceChips, ErrorState, Skeleton, TextField } from '@/components/ui'
import { BackButton } from '@/features/auth/components'
import { StoryBody } from '@/features/blog/components/StoryBody'
import {
  parseStoryContent,
  readingMinutes,
  storyId,
  storyImage,
  storyPlainText,
} from '@/features/blog/utils/storyContent'
import {
  blogToDraft,
  draftBodyToHtml,
  emptyBlogDraft,
  ImageSourceSheet,
  SHOP_BLOG_CATEGORIES,
  useMyShopBlogs,
  usePickProductImage,
  useSaveShopBlog,
  validateBlogDraft,
  type BlogDraft,
} from '@/features/shop'
import { uploadService } from '@/services'
import type { BlogStatus } from '@/services/blog.types'
import { useUiStore } from '@/stores'
import { colors } from '@/theme/colors'
import { fontFamily } from '@/theme/fonts'
import type { UploadFile } from '@/types/upload.types'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/utils/helpers'

/** Nút chèn nhanh định dạng, tương đồng thanh công cụ CKEditor bản web. */
const SNIPPETS = [
  { label: 'Tiêu đề', text: '\n\n## ' },
  { label: 'In đậm', text: '**chữ đậm**' },
  { label: 'In nghiêng', text: '*chữ nghiêng*' },
  { label: 'Gạch đầu dòng', text: '\n- ' },
  { label: 'Đánh số', text: '\n1. ' },
  { label: 'Trích dẫn', text: '\n\n> ' },
] as const

type ImagePickTarget = 'cover' | 'inline'

/** Viết / sửa bài của Nhà vườn, đồng bộ với BlogEditorModal (CKEditor 5) bản web. */
export default function ShopBlogEditor() {
  const { id: raw } = useLocalSearchParams<{ id?: string }>()
  const id = Number(raw) || 0
  const blogs = useMyShopBlogs()
  const existing = useMemo(() => blogs.data?.find((b) => storyId(b) === id), [blogs.data, id])
  const save = useSaveShopBlog()
  const pick = usePickProductImage()
  const showToast = useUiStore((s) => s.showToast)

  const [draft, setDraft] = useState<BlogDraft>(emptyBlogDraft)
  const [errors, setErrors] = useState<Partial<Record<keyof BlogDraft, string>>>({})
  const [cover, setCover] = useState<UploadFile>()
  const [coverUrl, setCoverUrl] = useState<string>()
  const [pickTarget, setPickTarget] = useState<ImagePickTarget | null>(null)
  const [uploadingInline, setUploadingInline] = useState(false)
  const [preview, setPreview] = useState(false)
  const [loaded, setLoaded] = useState(id === 0)

  useEffect(() => {
    if (loaded || !existing) return
    setDraft(blogToDraft(existing))
    setCoverUrl(storyImage(existing))
    setLoaded(true)
  }, [loaded, existing])

  const wordStats = useMemo(() => {
    const html = draftBodyToHtml(draft.body)
    const words = storyPlainText(html).split(/\s+/).filter(Boolean).length
    return {
      words,
      minutes: readingMinutes(html),
    }
  }, [draft.body])

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/shop/blogs'))
  const change = (patch: Partial<BlogDraft>) => {
    setDraft((d) => ({ ...d, ...patch }))
    setErrors((e) => {
      const next = { ...e }
      for (const k of Object.keys(patch) as (keyof BlogDraft)[]) delete next[k]
      return next
    })
  }

  const handlePickedImage = async (source: 'library' | 'camera') => {
    const target = pickTarget ?? 'cover'
    const f = await pick(source, target === 'cover' ? [16, 9] : undefined)
    if (!f) return

    if (target === 'cover') {
      setCover(f)
      return
    }

    setUploadingInline(true)
    try {
      const uploadedUrl = (await uploadService.uploadImage(f, 'blogs')).result?.url
      if (!uploadedUrl) throw new Error('Không nhận được đường dẫn ảnh từ máy chủ')
      setDraft((d) => {
        const prefix = d.body.trimEnd() ? `${d.body.trimEnd()}\n\n` : ''
        return { ...d, body: `${prefix}![](${uploadedUrl})\n\n` }
      })
      setErrors((e) => {
        if (!e.body) return e
        const next = { ...e }
        delete next.body
        return next
      })
      showToast('Đã chèn ảnh vào bài viết.')
    } catch (err) {
      showToast(getErrorMessage(err, 'Chưa tải được ảnh lên, thử lại nhé.'))
    } finally {
      setUploadingInline(false)
    }
  }

  const submit = (status: BlogStatus) => {
    if (uploadingInline) {
      return showToast('Vui lòng chờ tải ảnh chèn vào bài hoàn tất.')
    }
    const next = validateBlogDraft(draft)
    setErrors(next)
    if (Object.keys(next).length > 0) return showToast('Bài viết cần tiêu đề và nội dung đầy đủ hơn.')
    save.mutate(
      { id: id || undefined, draft, status, cover, pictureUrl: coverUrl },
      {
        onSuccess: () => {
          showToast(
            status === 'DRAFT'
              ? 'Đã lưu bản nháp.'
              : id
                ? 'Đã cập nhật bài viết.'
                : 'Đã đăng bài. Khách sẽ thấy ở Chuyện nhà nông.',
          )
          goBack()
        },
        onError: (err) => showToast(getErrorMessage(err, 'Chưa lưu được bài viết, thử lại nhé.')),
      },
    )
  }

  const header = (
    <View className="flex-row items-center gap-2 border-b border-line bg-paper px-3 pb-2">
      <BackButton onPress={goBack} />
      <View className="flex-1">
        <AppText accessibilityRole="header" weight="extrabold" className="text-base">
          {id ? 'Sửa bài viết' : 'Viết bài mới'}
        </AppText>
        <AppText className="text-xs text-ink-muted">Chuyện nhà vườn</AppText>
      </View>
      <Pressable
        onPress={() => setPreview((p) => !p)}
        accessibilityRole="button"
        accessibilityState={{ selected: preview }}
        className={cn('h-9 flex-row items-center gap-1.5 rounded-full px-3', preview ? 'bg-leaf-700' : 'bg-leaf-50')}
      >
        {preview ? <PenLine size={15} color={colors.white} /> : <Eye size={15} color={colors.leaf700} />}
        <AppText weight="bold" className={cn('text-sm', preview ? 'text-white' : 'text-leaf-700')}>
          {preview ? 'Soạn tiếp' : 'Xem trước'}
        </AppText>
      </Pressable>
    </View>
  )

  if (!loaded) {
    return (
      <SafeAreaView className="flex-1 bg-paper" edges={['top']}>
        {header}
        {blogs.isPending ? (
          <View className="gap-4 p-4">
            <Skeleton className="h-44 rounded-panel" />
            <Skeleton className="h-64 rounded-panel" />
          </View>
        ) : (
          <ErrorState
            title={blogs.isError ? 'Không tải được bài viết' : 'Không tìm thấy bài viết'}
            onRetry={() => void blogs.refetch()}
          />
        )}
      </SafeAreaView>
    )
  }

  const coverSrc = cover?.uri ?? coverUrl
  const published = existing?.status === 'PUBLISHED'

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={['top', 'bottom']}>
      {header}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        {preview ? (
          <ScrollView contentContainerClassName="gap-4 p-4 pb-8">
            {!!coverSrc && (
              <View className="aspect-[16/9] w-full overflow-hidden rounded-panel">
                <Image source={{ uri: coverSrc }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
              </View>
            )}
            <AppText weight="extrabold" className="text-2xl leading-tight">
              {draft.title || 'Tiêu đề bài viết'}
            </AppText>
            <StoryBody blocks={parseStoryContent(draftBodyToHtml(draft.body))} />
          </ScrollView>
        ) : (
          <ScrollView contentContainerClassName="gap-5 p-4 pb-8" keyboardShouldPersistTaps="handled">
            <View className="gap-1.5">
              <View className="flex-row items-center justify-between">
                <AppText weight="semibold" className="text-sm text-ink">
                  Ảnh bìa bài viết
                </AppText>
                <AppText className="text-xs text-ink-muted">Khuyến nghị tỉ lệ 16:9</AppText>
              </View>
              {coverSrc ? (
                <View className="aspect-[16/9] w-full overflow-hidden rounded-panel">
                  <Image source={{ uri: coverSrc }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
                  <View className="absolute bottom-3 right-3 flex-row items-center gap-2">
                    <Pressable
                      onPress={() => {
                        setCover(undefined)
                        setCoverUrl(undefined)
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Bỏ ảnh bìa"
                      className="flex-row items-center gap-1 rounded-full bg-black/60 px-3 py-1.5"
                    >
                      <Trash2 size={13} color={colors.white} />
                      <AppText weight="bold" className="text-xs text-white">
                        Bỏ ảnh
                      </AppText>
                    </Pressable>
                    <Pressable
                      onPress={() => setPickTarget('cover')}
                      accessibilityRole="button"
                      accessibilityLabel="Đổi ảnh bìa"
                      className="flex-row items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5"
                    >
                      <RefreshCw size={14} color={colors.white} />
                      <AppText weight="bold" className="text-xs text-white">
                        Đổi ảnh
                      </AppText>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={() => setPickTarget('cover')}
                  accessibilityRole="button"
                  accessibilityLabel="Thêm ảnh bìa"
                  className="aspect-[16/9] w-full items-center justify-center gap-1.5 overflow-hidden rounded-panel border-2 border-dashed border-leaf-200 bg-white px-6"
                >
                  <ImagePlus size={26} color={colors.leaf700} />
                  <AppText weight="bold" className="text-base text-leaf-800">
                    Thêm ảnh bìa
                  </AppText>
                  <AppText className="text-center text-sm text-ink-muted">
                    Ảnh vườn, mùa vụ hoặc nông sản của bạn
                  </AppText>
                </Pressable>
              )}
            </View>

            <TextField
              label="Tiêu đề *"
              value={draft.title}
              onChangeText={(title) => change({ title })}
              placeholder="VD: Mùa cà rốt cong queo đã về"
              maxLength={200}
              error={errors.title}
            />

            <ChoiceChips
              label="Chủ đề"
              options={SHOP_BLOG_CATEGORIES}
              value={draft.category}
              onChange={(category) => change({ category })}
            />

            <View className="gap-1.5">
              <View className="flex-row items-center justify-between">
                <AppText weight="semibold" className="text-sm text-ink">
                  Nội dung *
                </AppText>
                <AppText className="text-xs text-ink-muted">
                  {wordStats.words} từ{wordStats.words > 0 ? ` · ~${wordStats.minutes} phút đọc` : ''}
                </AppText>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
                <Pressable
                  onPress={() => setPickTarget('inline')}
                  disabled={uploadingInline}
                  accessibilityRole="button"
                  accessibilityLabel="Chèn ảnh vào giữa bài viết"
                  className={cn(
                    'h-9 flex-row items-center gap-1.5 rounded-full border border-leaf-500 bg-leaf-50 px-3',
                    uploadingInline && 'opacity-60',
                  )}
                >
                  {uploadingInline ? (
                    <ActivityIndicator size="small" color={colors.leaf700} />
                  ) : (
                    <ImagePlus size={14} color={colors.leaf700} />
                  )}
                  <AppText weight="bold" className="text-sm text-leaf-800">
                    {uploadingInline ? 'Đang tải ảnh…' : '+ Chèn ảnh'}
                  </AppText>
                </Pressable>
                {SNIPPETS.map((s) => (
                  <Pressable
                    key={s.label}
                    onPress={() => change({ body: draft.body + (draft.body ? s.text : s.text.trimStart()) })}
                    accessibilityRole="button"
                    accessibilityLabel={`Chèn ${s.label}`}
                    className="h-9 justify-center rounded-full border border-line-strong bg-white px-3"
                  >
                    <AppText weight="semibold" className="text-sm text-ink-muted">
                      + {s.label}
                    </AppText>
                  </Pressable>
                ))}
              </ScrollView>
              <TextInput
                value={draft.body}
                onChangeText={(body) => change({ body })}
                placeholder={'Sáng nay cả nhà ra vườn nhổ cà rốt…\n\nĐể trống một dòng để sang đoạn mới, hoặc bấm "+ Chèn ảnh" để thêm hình giữa bài.'}
                placeholderTextColor={colors.inkSubtle}
                accessibilityLabel="Nội dung"
                multiline
                textAlignVertical="top"
                className={cn(
                  'min-h-[260px] rounded-card border bg-white px-3.5 py-3 text-base leading-relaxed text-ink',
                  errors.body ? 'border-sale' : 'border-line-strong',
                )}
                style={{ fontFamily: fontFamily.regular }}
              />
              {errors.body ? (
                <AppText className="text-caption text-sale">{errors.body}</AppText>
              ) : (
                <AppText className="text-xs text-ink-muted">
                  Hỗ trợ tiêu đề, chữ đậm/nghiêng, danh sách, trích dẫn và chèn ảnh giữa bài. Bấm Xem trước để xem đúng giao diện khách đọc.
                </AppText>
              )}
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      <View className="flex-row gap-2 border-t border-line bg-white px-4 pb-2 pt-3">
        {!published && (
          <Button
            title="Lưu nháp"
            variant="outline"
            icon={Save}
            loading={save.isPending && save.variables?.status === 'DRAFT'}
            disabled={save.isPending || uploadingInline}
            onPress={() => submit('DRAFT')}
            className="min-h-[48px] flex-1"
          />
        )}
        <Button
          title={published ? 'Lưu thay đổi' : 'Đăng bài'}
          icon={published ? Save : Send}
          loading={save.isPending && save.variables?.status === 'PUBLISHED'}
          disabled={save.isPending || uploadingInline}
          onPress={() => submit('PUBLISHED')}
          className="min-h-[48px] flex-[1.4]"
        />
      </View>

      <ImageSourceSheet
        visible={pickTarget !== null}
        onClose={() => setPickTarget(null)}
        title={pickTarget === 'inline' ? 'Chèn ảnh vào bài viết' : 'Ảnh bìa bài viết'}
        subtitle={
          pickTarget === 'inline'
            ? 'Ảnh sẽ được tải lên và hiển thị ngay trong nội dung bài'
            : 'Ảnh ngang 16:9 hiển thị đẹp nhất'
        }
        onPick={(s) => void handlePickedImage(s)}
      />
    </SafeAreaView>
  )
}

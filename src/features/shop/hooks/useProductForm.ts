import { useState } from 'react'
import { useCategories } from '@/features/product/hooks/useProductQueries'
import { useUiStore } from '@/stores'
import { getErrorMessage } from '@/utils/errors'
import { validateProductForm, type ProductFormErrors, type ProductFormValues } from '../utils/productForm'
import { useSuggestDescription } from './useShopQueries'

/** Trạng thái form nông sản dùng chung cho màn Đăng bán và Sửa. */
export function useProductForm(initial: ProductFormValues) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<ProductFormErrors>({})
  const [aiNote, setAiNote] = useState(false)
  const categories = useCategories().data ?? []
  const suggest = useSuggestDescription()
  const showToast = useUiStore((s) => s.showToast)

  const onChange = (patch: Partial<ProductFormValues>) => {
    setValues((v) => ({ ...v, ...patch }))
    // Xoá lỗi của ô vừa sửa để người dùng thấy ngay là đã ổn.
    setErrors((e) => {
      const next = { ...e }
      for (const k of Object.keys(patch) as (keyof ProductFormValues)[]) delete next[k]
      return next
    })
    if ('description' in patch) setAiNote(false)
  }

  const validate = (extra: ProductFormErrors = {}) => {
    const next = { ...validateProductForm(values), ...extra }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const suggestDescription = () => {
    const name = values.name.trim()
    if (!name) {
      setErrors((e) => ({ ...e, name: 'Nhập tên nông sản trước để AI viết mô tả' }))
      return
    }
    const category = categories.find((c) => c.categoryId === values.categoryId)
    suggest.mutate(
      { productName: name, categoryId: values.categoryId, categoryName: category?.name ?? 'Nông sản' },
      {
        onSuccess: (res) => {
          if (!res?.suggestedDescription) return showToast('AI chưa nghĩ ra mô tả, thử lại sau nhé.')
          setValues((v) => ({ ...v, description: res.suggestedDescription }))
          setAiNote(true)
        },
        onError: (err) => showToast(getErrorMessage(err, 'Chưa gợi ý được mô tả lúc này.')),
      },
    )
  }

  return {
    values,
    setValues,
    errors,
    setErrors,
    onChange,
    validate,
    categories,
    aiNote,
    suggestDescription,
    suggesting: suggest.isPending,
  }
}

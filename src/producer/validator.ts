import type { EmailPayload } from '@/shared/types.ts'

const MAX_SUBJECT_LENGTH = 100
const MAX_BODY_LENGTH = 5000
const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/

export function validateProducerPayload(body: string | null): {
  errors: string[]
  payload?: EmailPayload
} {
  const errors: string[] = []

  if (!body) {
    errors.push('O corpo da requisição não pode ser vazio.')
    return { errors }
  }

  let data: any
  try {
    data = JSON.parse(body)
  } catch (error) {
    errors.push('O corpo da requisição não é um JSON válido.')
    return { errors }
  }

  const { email, subject, text } = data

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push("O campo 'to_email' é obrigatório e não pode ser vazio.")
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push(`O e-mail fornecido '${email}' não possui um formato válido.`)
  }

  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    errors.push("O campo 'subject' é obrigatório e não pode ser vazio.")
  } else if (subject.length > MAX_SUBJECT_LENGTH) {
    errors.push(`O assunto não pode exceder ${MAX_SUBJECT_LENGTH} caracteres.`)
  }

  if (!text || typeof text !== 'string' || !text.trim()) {
    errors.push("O campo 'body_text' é obrigatório e não pode ser vazio.")
  } else if (text.length > MAX_BODY_LENGTH) {
    errors.push(
      `O corpo do e-mail não pode exceder ${MAX_BODY_LENGTH} caracteres.`,
    )
  }

  if (errors.length > 0) {
    return { errors }
  }

  return { errors: [], payload: { email, subject, text } }
}

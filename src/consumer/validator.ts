import type { EmailPayload } from '@/shared/types.ts'

export function validateConsumerMessage(body: string | undefined): {
  errors: string[]
  payload?: EmailPayload
} {
  const errors: string[] = []

  if (!body) {
    errors.push('O corpo da mensagem da SQS está vazio.')
    return { errors }
  }

  let data: any
  try {
    data = JSON.parse(body)
  } catch (error) {
    errors.push('O corpo da mensagem não é um JSON válido.')
    return { errors }
  }

  const { email, subject, text } = data

  if (!email || typeof email !== 'string') {
    errors.push("O campo 'to_email' está ausente ou não é uma string.")
  }

  if (!subject || typeof subject !== 'string') {
    errors.push("O campo 'subject' está ausente ou não é uma string.")
  }

  if (!text || typeof text !== 'string') {
    errors.push("O campo 'body_text' está ausente ou não é uma string.")
  }

  if (errors.length > 0) {
    return { errors }
  }

  return { errors: [], payload: { email, subject, text } }
}

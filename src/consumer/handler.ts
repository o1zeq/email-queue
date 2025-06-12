import type { SQSEvent, SQSRecord } from 'aws-lambda'
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses'
import { validateConsumerMessage } from '@/consumer/validator.ts'

const AWS_REGION = process.env.AWS_REGION
if (!AWS_REGION) {
  console.error('ERRO CRÍTICO: Variável de ambiente AWS_REGION não definida.')
  throw new Error('Configuração do AWS_REGION ausente.')
}

const SENDER_EMAIL = process.env.SENDER_EMAIL
if (!SENDER_EMAIL) {
  console.error('ERRO CRÍTICO: Variável de ambiente SENDER_EMAIL não definida.')
  throw new Error('Configuração do remetente ausente.')
}

const sesClient = new SESClient({ region: AWS_REGION })

const processMessage = async (record: SQSRecord): Promise<void> => {
  console.log(`Processando mensagem ID: ${record.messageId}`)

  const { errors, payload } = validateConsumerMessage(record.body)

  if (errors.length > 0) {
    console.error(`Mensagem inválida [ID: ${record.messageId}]:`, { errors })
    return
  }

  const senderEmail = SENDER_EMAIL
  if (!senderEmail) {
    console.error(
      'ERRO CRÍTICO: Variável de ambiente SENDER_EMAIL não definida.',
    )

    throw new Error('Configuração do remetente ausente.')
  }

  const command = new SendEmailCommand({
    Source: senderEmail,
    Destination: {
      ToAddresses: [payload!.email],
    },
    Message: {
      Subject: {
        Charset: 'UTF-8',
        Data: payload!.subject,
      },
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: payload!.text,
        },
      },
    },
  })

  try {
    console.log(`Enviando e-mail para ${payload!.email}...`)
    await sesClient.send(command)
    console.log(`E-mail enviado com sucesso para ${payload!.email}.`)
  } catch (error) {
    console.error(
      `Falha ao enviar e-mail via SES para ${payload!.email}:`,
      error,
    )
    throw error
  }
}

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log(`Evento SQS recebido com ${event.Records.length} registro(s).`)

  const processingPromises = event.Records.map(processMessage)
  await Promise.allSettled(processingPromises)
}

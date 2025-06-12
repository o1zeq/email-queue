import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs'
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { validateProducerPayload } from '@/producer/validator.ts'

const AWS_REGION = process.env.AWS_REGION
if (!AWS_REGION) {
  console.error('ERRO CRÍTICO: Variável de ambiente AWS_REGION não definida.')
  throw new Error('Configuração do AWS_REGION ausente.')
}

const QUEUE_URL = process.env.QUEUE_URL
if (!QUEUE_URL) {
  console.error('ERRO CRÍTICO: Variável de ambiente QUEUE_URL não definida.')
  throw new Error('Configuração do QUEUE_URL ausente.')
}

const sqsClient = new SQSClient({ region: AWS_REGION })

const createResponse = (
  statusCode: number,
  body: object,
): APIGatewayProxyResult => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.log('Evento recebido do API Gateway')

  const queueUrl = QUEUE_URL
  if (!queueUrl) {
    console.error('ERRO CRÍTICO: Variável de ambiente QUEUE_URL não definida.')
    return createResponse(500, {
      message: 'Erro de configuração interna do servidor.',
    })
  }

  try {
    const { errors, payload } = validateProducerPayload(event.body)

    if (errors.length > 0) {
      console.warn('Requisição inválida:', { errors })
      return createResponse(400, {
        message: 'Dados da requisição são inválidos.',
        errors,
      })
    }

    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(payload),
    })

    console.log('Enviando mensagem para a SQS...')
    await sqsClient.send(command)
    console.log('Mensagem enfileirada com sucesso!')

    return createResponse(202, {
      message: 'Pedido de envio de e-mail recebido com sucesso!',
    })
  } catch (error) {
    console.error('Ocorreu um erro inesperado:', error)
    return createResponse(500, {
      message: 'Ocorreu um erro interno inesperado.',
    })
  }
}

import OpenAI from 'openai'
import { Injectable } from '@nestjs/common'
import { ICreateTaskIntent } from '../domain/interfaces/IUserIntent'
@Injectable()
export class OpenAiMessageRepository {
  private readonly client: OpenAI

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }

  async extractTaskFromMessage(data: string): Promise<ICreateTaskIntent> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a specialized assistant that extracts structured information from messages.
                      Your only task is to read the message and extract all relevant fields accurately.
                      Extract name, description, due date, priority and customer id as follow:
                      {
                        task_name: string which is the name of the task. If you can't find the name, return the same string as the description field,
                        description: string which is the description of the task,
                        due_date: string which is the due date of the task,
                        priority: string which is the priority of the task. Possible values are: ALTA, MEDIA, BAJA,
                        customer_id: string which is the id of the customer,
                      }
                      Be precise with numbers, amounts, and dates. Format currency values consistently.
                      DO NOT include any explanations or additional text. Respond ONLY with the JSON structure.

                      ---------------------------
                      ${data}
                      ---------------------------`,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0].message.content

    if (!content) {
      throw new Error('No content found')
    }

    try {
      return JSON.parse(content) as ICreateTaskIntent
    } catch (error) {
      console.error('Error parsing JSON', error)
      return content as unknown as ICreateTaskIntent
    }
  }
}

import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from '../services/ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('parse-transaction')
  async parseTransaction(@Body('text') text: string) {
    return this.aiService.parseTransaction(text);
  }
}

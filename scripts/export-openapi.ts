import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { DocsModule } from '../src/docs.module';
import { API_VERSION } from '../src/common/api-version';

async function main() {
  const app = await NestFactory.create(DocsModule, { logger: false });
  const config = new DocumentBuilder()
    .setTitle('AI-Agentic Smart Logistics Operating System API')
    .setDescription('Industrial modular monolith API contract.')
    .setVersion(API_VERSION)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const outputDir = join(process.cwd(), 'docs', 'openapi');
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, 'openapi.json'), JSON.stringify(document, null, 2));
  await app.close();
  console.log('OpenAPI exported to docs/openapi/openapi.json');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

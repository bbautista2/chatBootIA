import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  const superadmin = await prisma.user.upsert({
    where: { email: 'admin@chatbot.com' },
    update: {},
    create: {
      email: 'admin@chatbot.com',
      passwordHash,
      role: 'superadmin',
    },
  });

  console.log(`Superadmin user: ${superadmin.email}`);

  const account = await prisma.account.upsert({
    where: { igUserId: 'demo_ig_123' },
    update: {},
    create: {
      name: 'Demo Instagram',
      igUserId: 'demo_ig_123',
      pageId: 'demo_page_123',
      accessToken: 'demo_fake_access_token_12345',
      status: 'active',
    },
  });

  console.log(`Account: ${account.name}`);

  const botConfig = await prisma.botConfig.upsert({
    where: { accountId: account.id },
    update: {},
    create: {
      accountId: account.id,
      aiEnabled: false,
      welcomeMessage: '¡Hola! Bienvenido al soporte.',
      fallbackMessage: 'Lo siento, no entendí tu mensaje. Un agente te atenderá pronto.',
    },
  });

  console.log(`BotConfig created for account: ${account.name}`);

  const flow = await prisma.flow.create({
    data: {
      accountId: account.id,
      name: 'Saludo',
      isActive: true,
      priority: 10,
      triggers: {
        create: {
          type: 'keyword',
          value: 'hola',
        },
      },
      steps: {
        create: [
          {
            order: 1,
            type: 'text',
            content: { text: '¡Hola! ¿En qué puedo ayudarte?' },
          },
          {
            order: 2,
            type: 'buttons',
            content: {
              text: 'Elige una opción:',
              buttons: [
                { title: 'Ver catálogo', payload: 'VER_CATALOGO' },
                { title: 'Hablar con un humano', payload: 'HABLAR_HUMANO' },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`Flow: ${flow.name}`);

  const contact = await prisma.contact.create({
    data: {
      accountId: account.id,
      igScopedId: 'ig_user_001',
      name: 'Juan Perez',
      tags: ['new', 'demo'],
    },
  });

  console.log(`Contact: ${contact.name}`);

  const conversation = await prisma.conversation.create({
    data: {
      accountId: account.id,
      contactId: contact.id,
      status: 'bot',
    },
  });

  console.log(`Conversation created for contact: ${contact.name}`);

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: 'in',
      type: 'text',
      content: { text: 'hola' },
    },
  });

  await prisma.log.create({
    data: {
      accountId: account.id,
      level: 'info',
      message: 'Seed data created successfully',
      meta: { createdBy: 'seed' },
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

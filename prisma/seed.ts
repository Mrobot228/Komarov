import { PrismaClient, Genre } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Очищаємо таблиці (спочатку Session, бо є зовнішній ключ)
    await prisma.session.deleteMany();
    await prisma.site.deleteMany();
    await prisma.user.deleteMany();

    // Додаємо користувачів
    await prisma.user.createMany({
        data: [
            { username: 'admin', password: 'admin123', isAdmin: true },
            { username: 'user', password: 'user123', isAdmin: false }
        ],
        skipDuplicates: true
    });

    // Додаємо сайти з різними жанрами
    const site1 = await prisma.site.create({
        data: {
            domain: 'example.com',
            genre: Genre.NEWS,
            visitors: 1200,
        }
    });

    const site2 = await prisma.site.create({
        data: {
            domain: 'shop.com',
            genre: Genre.ECOMMERCE,
            visitors: 800,
        }
    });

    const site3 = await prisma.site.create({
        data: {
            domain: 'funnyhub.com',
            genre: Genre.ENTERTAINMENT,
            visitors: 1500,
        }
    });

    // Додаємо сесії для кожного сайту за 5 днів
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);

        await prisma.session.createMany({
            data: [
                { siteId: site1.id, date, views: 200 + i * 30, uniqueUsers: 120 + i * 10 },
                { siteId: site2.id, date, views: 100 + i * 20, uniqueUsers: 60 + i * 8 },
                { siteId: site3.id, date, views: 300 + i * 40, uniqueUsers: 180 + i * 15 },
            ]
        });
    }

    console.log('Дані успішно додано!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
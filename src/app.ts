import express, { Request, Response, NextFunction } from 'express';
import { json, urlencoded } from 'body-parser';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import methodOverride from 'method-override';
import session from 'express-session';

declare module 'express-session' {
    interface SessionData {
        userId?: number;
        isAdmin?: boolean;
        message?: string;
    }
}

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

app.use(json());
app.use(urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));

// Додаємо папку public для favicon та інших статичних файлів
app.use(express.static(path.join(__dirname, '../public')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware для доступу до isAdmin у шаблонах
app.use((req: Request, res: Response, next: NextFunction) => {
    res.locals.isAdmin = req.session.isAdmin;
    next();
});

// Middleware для flash-повідомлень
app.use((req: Request, res: Response, next: NextFunction) => {
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
});

// Головна сторінка — редірект на список сайтів
app.get('/', (req: Request, res: Response) => {
    res.redirect('/sites');
});

// Middleware для захисту адмін-операцій
function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.redirect('/login');
}

// --- АВТОРИЗАЦІЯ ---
app.get('/login', (req: Request, res: Response) => {
    res.render('login', { error: null });
});

app.post('/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (user && user.password === password && user.isAdmin) {
        req.session.userId = user.id;
        req.session.isAdmin = true;
        return res.redirect('/sites');
    }
    res.render('login', { error: 'Невірний логін або пароль' });
});

app.get('/logout', (req: Request, res: Response) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// --- CRUD для сайтів (тільки зміни для захисту) ---

// Додати сайт (форма)
app.get('/sites/new', requireAdmin, (req: Request, res: Response) => {
    res.render('siteForm', { site: null, action: '/sites', method: 'POST' });
});

// Додати сайт (обробка)
app.post('/sites', requireAdmin, async (req: Request, res: Response) => {
    const { domain, genre, visitors, sessionDate, sessionViews, sessionUniqueUsers } = req.body;
    const site = await prisma.site.create({
        data: {
            domain,
            genre,
            visitors: Number(visitors)
        }
    });
    // Додаємо першу сесію, якщо дані передані
    if (sessionDate && sessionViews && sessionUniqueUsers) {
        await prisma.session.create({
            data: {
                siteId: site.id,
                date: new Date(sessionDate),
                views: Number(sessionViews),
                uniqueUsers: Number(sessionUniqueUsers)
            }
        });
    }
    req.session.message = 'Сайт успішно додано!';
    res.redirect('/sites');
});

// Оновлення сесії (доступно лише адміну)
app.put('/sessions/:id', requireAdmin, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { date, views, uniqueUsers } = req.body;
    const sessionObj = await prisma.session.update({
        where: { id },
        data: {
            date: new Date(date),
            views: Number(views),
            uniqueUsers: Number(uniqueUsers)
        }
    });
    req.session.message = 'Сесію оновлено!';
    res.redirect(`/sites/${sessionObj.siteId}/edit`);
});

// Для форми редагування сайту — підтягуємо сесії
app.get('/sites/:id/edit', requireAdmin, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const site = await prisma.site.findUnique({
        where: { id },
        include: { sessions: true }
    });
    res.render('siteForm', { site, action: `/sites/${id}?_method=PUT`, method: 'POST' });
});

app.put('/sites/:id', requireAdmin, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { domain, genre, visitors } = req.body;
    await prisma.site.update({
        where: { id },
        data: {
            domain,
            genre,
            visitors: Number(visitors)
        }
    });
    req.session.message = 'Сайт оновлено!';
    res.redirect('/sites');
});

app.post('/sites/:id/delete', requireAdmin, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await prisma.session.deleteMany({ where: { siteId: id } });
    await prisma.site.delete({ where: { id } });
    req.session.message = 'Сайт видалено!';
    res.redirect('/sites');
});

app.post('/sessions', requireAdmin, async (req, res) => {
    const { siteId, date, views, uniqueUsers } = req.body;
    await prisma.session.create({
        data: {
            siteId: Number(siteId),
            date: new Date(date),
            views: Number(views),
            uniqueUsers: Number(uniqueUsers)
        }
    });
    req.session.message = 'Сесію додано!';
    res.redirect(`/sites/${siteId}/edit`);
});

app.post('/sessions/:id/delete', requireAdmin, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const session = await prisma.session.findUnique({ where: { id } });
    if (session) {
        await prisma.session.delete({ where: { id } });
        req.session.message = 'Сесію видалено!';
        res.redirect(`/sites/${session.siteId}/edit`);
    } else {
        req.session.message = 'Сесію не знайдено!';
        res.redirect('/sites');
    }
});

// --- Пошук сайтів (цей маршрут має бути вище за /sites/:id!) ---
app.get('/sites/search', async (req: Request, res: Response) => {
    const domain = req.query.domain as string || '';
    const genre = req.query.genre as string || '';
    let sites: any[] = [];
    const where: any = {};
    if (domain) {
        where.domain = { contains: domain, mode: 'insensitive' };
    }
    if (genre) {
        where.genre = genre;
    }
    if (domain || genre) {
        sites = await prisma.site.findMany({ where });
    }
    res.render('sitesSearch', { sites, domain, genre, isAdmin: req.session.isAdmin });
});

// Деталі сайту (цей маршрут має бути після /sites/search!)
app.get('/sites/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id) || id < 1) {
        return res.status(404).send('Сайт не знайдено');
    }
    const site = await prisma.site.findUnique({
        where: { id },
        include: { sessions: true }
    });
    if (!site) {
        return res.status(404).send('Сайт не знайдено');
    }
    res.render('siteDetail', { site, isAdmin: req.session.isAdmin });
});

// Список сайтів
app.get('/sites', async (req: Request, res: Response) => {
    const { sort } = req.query;
    let orderBy: any = { visitors: 'desc' };
    if (sort === 'domain') orderBy = { domain: 'asc' };
    if (sort === 'visitors') orderBy = { visitors: 'desc' };

    const sites = await prisma.site.findMany({ orderBy });
    res.render('sites', { sites, sort, isAdmin: req.session.isAdmin });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
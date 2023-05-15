const express = require('express');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const path = require('path');
const { database } = require('./keys');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const optionsSQL = {
	host: 'localhost',
	port: 3306,
	user: 'root',
	password: 'Leica.667',
	database: 'cma87459_cabanas'
};
const sessionStore = new MySQLStore(optionsSQL);

//inicializar
const app = express();

//settings
app.set('port', 4001);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs.engine({
    defaultLayout: 'main',
    layoutDir: path.join(app.set('views'), 'layouts'),
    partialsDir: path.join(app.set('views'), 'partials'),
    extname: '.hbs',
    helpers: require('./lib/handlebars')
}));
app.set('view engine', '.hbs');

//middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(
    session({
        key: 'cookie_user2023',
        secret: 'secret_12344565789',
        store: sessionStore,
        resave: false,
        saveUninitialized: false
    })
);
app.use(function (req, res, next) {
    res.locals.session = req.session;
    next();
});

//routes
app.use(require('./routes'));
//public
app.use(express.static(path.join(__dirname, 'public')));
//inicio app | ejecutar en consola   npm run dev
app.listen(app.get('port'), () => {
    console.log('Servidor ON en puerto', app.get('port'))
});
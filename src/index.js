import '@babel/polyfill';
import express from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import cors from 'cors';
import errorhandler from 'errorhandler';
import morgan from 'morgan';
import methodOverride from 'method-override';
import env from './config/env-config';
import routes from './routes';


const isProduction = env.NODE_ENV === 'production';

// Create global app object
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// Normal express config defaults
app.use(morgan('dev'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(methodOverride());


app.use(
  session({
    secret: 'barefoot',
    cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: false
  })
);
app.all('*', (req, res) => res.send({ message: 'route not found' }));

if (!isProduction) {
  app.use(errorhandler());
}

// connect app to routes
routes(app);

// / catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// / error handlers

// development error handler
// will print stacktrace
if (!isProduction) {
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    // eslint-disable-next-line no-console
    console.log(err.stack);

    res.status(err.status || 500);

    res.json({
      errors: {
        message: err.message,
        error: err
      }
    });
  });
}

// production error handler
// no stacktraces leaked to user
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    errors: {
      message: err.message,
      error: {}
    }
  });
});

// finally, let's start our server...
const server = app.listen(process.env.PORT || 3000, () => {
  // eslint-disable-next-line no-console
  console.log(`Listening on port ${server.address().port}`);
});

export default app;

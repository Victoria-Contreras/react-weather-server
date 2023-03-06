const express = require('express');
const app = express();
app.use(express.json());
const Sequelize = require('sequelize');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const { User, Favorite } = require('./models');
const favorite = require('./models/favorite');
const port = 3001;

app.use(
    session({
        secret: 'secret',
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: false,
            maxAge: 2592000000,
        }
    })
);

app.post('/user/login', async (req, res) => {
    const user = await User.findAll({
        where: {
            username: {
                [Op.eq]: req.body.username
            }
        }
    });
    console.log(user)

    if (user[0]) {
        bcrypt.compare(req.body.password, user[0].password, function (err, result) {
            if ((result) && (req.body.username === user[0].username)) {
                req.session.user = req.body.username;
                console.log(req.session.user)
                res.send(result)
            } else {
                res.send(err)
            }
        });
    } else {
        res.status(403)
        res.json('username does not exist')
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
});

app.post('/user/sign-up', async (req, res) => {
    const user = await User.findAll({
        where: {
            username: req.body.username
        }
    })

    if (!user[0]) {
        bcrypt.hash(req.body.password, 10, function (err, hash) {
            console.log('creating account')
            User.create({
                username: req.body.username,
                password: hash,
                createdAt: new Date(),
                updatedAt: new Date()
            }).then((result) => res.send(result))
        });
    } else {
        console.log('username already exists')
        res.status(403)
        res.json('username already exists')

    }
})

app.post('/add-favorite', async (req, res) => {
    console.log(req.session)

    const user = await User.findAll({
        where: {
            username: {
                [Op.eq]: req.session.user
            }
        }
    }).then(data => {
        console.log(data)
        Favorite.create({
            city: req.body.city,
            isFavorite: true,
            userId: data[0].id,
            createdAt: new Date(),
            updatedAt: new Date()
        }).catch(
            res.status(403)
        )

        
    });     
});

app.get('/view-favorites', async (req, res) => {
    console.log(req.session.user)
    const favorites = await User.findAll({
        where: {
            username: {
                [Op.eq]: req.session.user
            }
        },
        include: [{
            model: Favorite
        }]
    })
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
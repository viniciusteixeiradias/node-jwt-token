import express from "express";
import jwt from "jsonwebtoken";
import { config } from "dotenv";

config();

const app = express();
app.use(express.json());

/* Just an easy example, but you should store in a better place */
let refreshTokens = []

const posts = [
  {
    username: 'Vinicius',
    title: 'Post 1'
  },
  {
    username: 'Fernanda',
    title: 'Post 2'
  }
]

app.get('/posts', authToken, (req, res) => {
  res.json(posts.filter(post => post.username === req.user.name))
})

app.post('/token', (req, res) => {
  const refreshToken = req.body.token;

  if (!refreshToken) {
    return res.sendStatus(401)
  }

  if (!refreshTokens.includes(refreshToken)) {
    return res.sendStatus(403)
  }

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403)
    }

    const accessToken = generateAccessToken({ name: user.name })
    res.json({ accessToken })
  })
})

app.delete('/logout', (req, res) => {
  refreshTokens = refreshTokens.filter(token => token !== req.body.token)
  res.sendStatus(204)
})

app.post('/login', (req, res) => {
  const username = req.body.username;
  const user = {
    name: username
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)

  /* Just an easy example, but you should store in a better place */
  refreshTokens.push(refreshToken)

  res.json({ accessToken, refreshToken })
})

function authToken (req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token === null) {
    return res.sendStatus(401)
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403)
    }

    req.user = user
    next()
  })
}

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15s' })
}

app.listen(3000);
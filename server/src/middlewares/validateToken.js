import jwt from 'jsonwebtoken'

export const authRequired = (req,res,next) => {//Necesita esos 3 parametros para considerarse middleware, el next significa q en vez de responderle al cliente le dice que continue porq hay una siguiente funcion, ya que al ser un middleware esta antes de la ruta a la cual accederemos
    const {token} = req.cookies
    if (!token) return res.status(401).json({message: "No token, authorization denied"})
    console.log(token)
    jwt.verify(token,process.env.TOKEN_SECRET,(err, user) => {
        if (err) return res.status(401).json({message: "Invalid token"})
        req.user = user
    })
    next()
}
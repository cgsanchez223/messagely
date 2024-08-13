const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth");
const Message = require("../models/message");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", ensureLoggedIn, async(req, res, next) => {
    try {
        const {username} = req.user;
        const msg = await Message.get(req.params.id);
        if (msg.from_user.username !== username && msg.to_user.username !== username) {
            throw new ExpressError("Unauthorized", 401)
        } else {
            return res.json({message: msg});
        }
    } catch (err) {
        return next(err)
    };
})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureLoggedIn, async(req, res, next) => {
    try {
        const {to_username, body} = req.body;
        const {username} = req.user.username;
        const msg = await Message.create ({username, to_username, body});
        return res.json({message: msg});
    } catch (err) {
        return next(err)
    }
})

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", ensureLoggedIn, async (req, res, next) => {
    try {
        const msg = await Message.get(req.params.id);
        if (msg.to_user.username !== req.user.username) {
            throw new ExpressError("Not authorized", 401)
        } else {
            const readMsg = await Message.markRead(req.params.id);
            return res.json({readMsg})
        }
    } catch (err) {
        return next(err)
    }
})

module.exports = router